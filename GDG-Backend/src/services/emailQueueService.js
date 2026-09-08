const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('../config/supabase');

// Local fallback persistence in case the Supabase table has not yet been migrated
const LOCAL_BACKUP_FILE = path.resolve(__dirname, '../../data/email_queue_backup.json');

function ensureDataDir() {
  const dir = path.dirname(LOCAL_BACKUP_FILE);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // ignore
    }
  }
}

function readLocalBackup() {
  ensureDataDir();
  if (!fs.existsSync(LOCAL_BACKUP_FILE)) return [];
  try {
    const raw = fs.readFileSync(LOCAL_BACKUP_FILE, 'utf8');
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function writeLocalBackup(queue) {
  ensureDataDir();
  try {
    fs.writeFileSync(LOCAL_BACKUP_FILE, JSON.stringify(queue, null, 2), 'utf8');
  } catch (err) {
    console.warn('[EmailQueueService] Failed to write local queue backup:', err.message);
  }
}

class EmailQueueService {
  /**
   * Enqueues an email for asynchronous dispatch.
   */
  static async enqueueEmail({
    to,
    attendeeName = 'Attendee',
    subject,
    html,
    text = '',
    ticketId = null,
    eventId = null,
    formId = null,
    submissionId = null,
    attachments = [],
    headers = {},
    lastError = null,
  }) {
    const queueRecord = {
      to_email: to,
      attendee_name: attendeeName,
      subject,
      html,
      text,
      ticket_id: ticketId,
      event_id: eventId,
      form_id: formId,
      submission_id: submissionId,
      attachments,
      headers,
      status: 'pending',
      attempts: 0,
      last_error: lastError,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabaseAdmin
        .from('email_queue')
        .insert(queueRecord)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`[EmailQueueService] Email to ${to} queued in database (ID: ${data.id})`);
      return { queued: true, id: data.id, source: 'database' };
    } catch (dbErr) {
      console.warn('[EmailQueueService] DB insert failed (using file fallback):', dbErr.message);
      const localQueue = readLocalBackup();
      const localRecord = {
        ...queueRecord,
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      };
      localQueue.push(localRecord);
      writeLocalBackup(localQueue);
      return { queued: true, id: localRecord.id, source: 'local_file' };
    }
  }

  /**
   * Retrieves queue statistics (pending, sent, failed counts).
   */
  static async getQueueStats() {
    let pending = 0;
    let sent = 0;
    let failed = 0;
    let lastQueuedAt = null;

    try {
      const { data, error } = await supabaseAdmin
        .from('email_queue')
        .select('status, created_at');

      if (!error && Array.isArray(data)) {
        data.forEach((row) => {
          if (row.status === 'pending' || row.status === 'processing') pending++;
          else if (row.status === 'sent') sent++;
          else if (row.status === 'failed') failed++;
          if (row.created_at && (!lastQueuedAt || row.created_at > lastQueuedAt)) {
            lastQueuedAt = row.created_at;
          }
        });
      }
    } catch {
      // Ignore DB error, check local file
    }

    // Combine with local fallback if any
    const localQueue = readLocalBackup();
    localQueue.forEach((row) => {
      if (row.status === 'pending' || row.status === 'processing') pending++;
      else if (row.status === 'sent') sent++;
      else if (row.status === 'failed') failed++;
      if (row.created_at && (!lastQueuedAt || row.created_at > lastQueuedAt)) {
        lastQueuedAt = row.created_at;
      }
    });

    return {
      pending,
      sent,
      failed,
      total: pending + sent + failed,
      lastQueuedAt,
    };
  }

  /**
   * Drains the pending email queue and dispatches them via Gmail API.
   * Stops early if token is expired or quota is exhausted.
   */
  static async drainQueue() {
    const GmailApiService = require('./gmailApiService');

    // Quick sanity check: verify Gmail API is configured before starting drain
    const status = await GmailApiService.checkRealStatus();
    if (status.status !== 'alive') {
      console.warn(`[EmailQueueService] Cannot drain queue: Gmail status is '${status.status}'.`);
      const stats = await this.getQueueStats();
      return {
        drained: 0,
        failed: 0,
        remaining: stats.pending,
        reason: `Gmail token is not active (${status.status})`,
      };
    }

    let drainedCount = 0;
    let failedCount = 0;

    // 1. Drain Database Queue
    try {
      const { data: pendingRows, error } = await supabaseAdmin
        .from('email_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(50);

      if (!error && Array.isArray(pendingRows) && pendingRows.length > 0) {
        console.log(`[EmailQueueService] Draining ${pendingRows.length} pending email(s) from database...`);

        for (const item of pendingRows) {
          // Mark as processing
          await supabaseAdmin
            .from('email_queue')
            .update({ status: 'processing', attempts: (item.attempts || 0) + 1 })
            .eq('id', item.id);

          const result = await GmailApiService.sendMail({
            to: item.to_email,
            subject: item.subject,
            html: item.html,
            text: item.text,
            attachments: item.attachments || [],
            headers: item.headers || {},
          });

          if (result.success) {
            drainedCount++;
            await supabaseAdmin
              .from('email_queue')
              .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
                last_error: null,
              })
              .eq('id', item.id);

            // If linked to a submission, update email_sent
            if (item.submission_id) {
              try {
                await supabaseAdmin
                  .from('form_submissions')
                  .update({ email_sent: true })
                  .eq('id', item.submission_id);
              } catch {
                // ignore
              }
            }
          } else {
            failedCount++;
            const isTokenOrQuota =
              result.error === 'NO_GMAIL_TOKEN' ||
              result.error?.includes('invalid_grant') ||
              result.error?.includes('Rate Limit') ||
              result.error?.includes('quota');

            const newAttempts = (item.attempts || 0) + 1;
            const newStatus = isTokenOrQuota || newAttempts < 3 ? 'pending' : 'failed';

            await supabaseAdmin
              .from('email_queue')
              .update({
                status: newStatus,
                attempts: newAttempts,
                last_error: result.error || 'Failed to dispatch email',
              })
              .eq('id', item.id);

            if (isTokenOrQuota) {
              console.warn('[EmailQueueService] Token expired or quota hit during drain. Halting queue.');
              break;
            }
          }
        }
      }
    } catch (err) {
      console.warn('[EmailQueueService] Error querying database queue:', err.message);
    }

    // 2. Drain Local File Fallback Queue
    const localQueue = readLocalBackup();
    let localChanged = false;

    for (let i = 0; i < localQueue.length; i++) {
      const item = localQueue[i];
      if (item.status === 'pending') {
        const result = await GmailApiService.sendMail({
          to: item.to_email,
          subject: item.subject,
          html: item.html,
          text: item.text,
          attachments: item.attachments || [],
          headers: item.headers || {},
        });

        if (result.success) {
          drainedCount++;
          item.status = 'sent';
          item.sent_at = new Date().toISOString();
          localChanged = true;

          if (item.submission_id) {
            try {
              await supabaseAdmin
                .from('form_submissions')
                .update({ email_sent: true })
                .eq('id', item.submission_id);
            } catch {
              // ignore
            }
          }
        } else {
          failedCount++;
          item.attempts = (item.attempts || 0) + 1;
          item.last_error = result.error || 'Dispatch error';
          localChanged = true;

          const isTokenOrQuota =
            result.error === 'NO_GMAIL_TOKEN' ||
            result.error?.includes('invalid_grant') ||
            result.error?.includes('quota');

          if (isTokenOrQuota) {
            break;
          }
          if (item.attempts >= 3) {
            item.status = 'failed';
          }
        }
      }
    }

    if (localChanged) {
      writeLocalBackup(localQueue);
    }

    const currentStats = await this.getQueueStats();
    console.log(
      `[EmailQueueService] Drain complete: ${drainedCount} sent, ${failedCount} errors, ${currentStats.pending} still pending.`
    );

    return {
      drained: drainedCount,
      failed: failedCount,
      remaining: currentStats.pending,
    };
  }
}

module.exports = EmailQueueService;
