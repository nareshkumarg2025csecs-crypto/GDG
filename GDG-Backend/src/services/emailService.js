const QRCode = require('qrcode');
const GmailApiService = require('./gmailApiService');
const EmailQueueService = require('./emailQueueService');

/**
 * Replaces dynamic variables in custom email drafts.
 */
function interpolateVariables(template, vars) {
  if (!template) return '';
  const lowerVars = {};
  for (const [k, v] of Object.entries(vars || {})) {
    lowerVars[k.toLowerCase()] = v;
    lowerVars[k.toLowerCase().replace(/[^a-z0-9_]/g, '')] = v;
  }
  return template.replace(/\{\{\s*([a-zA-Z0-9_\s\/-]+)\s*\}\}/g, (match, key) => {
    const rawKey = key.trim().toLowerCase();
    const cleanKey = rawKey.replace(/[^a-z0-9_]/g, '');
    if (lowerVars[rawKey] !== undefined && lowerVars[rawKey] !== null) {
      return lowerVars[rawKey];
    }
    if (lowerVars[cleanKey] !== undefined && lowerVars[cleanKey] !== null) {
      return lowerVars[cleanKey];
    }
    return match;
  });
}

/**
 * Builds a clean, responsive HTML wrapper for custom email drafts.
 */
function buildCustomHtmlEmail({
  customBody,
  eventTitle,
  ticketId,
  attendeeName,
  eventDateFormatted,
  eventTimeFormatted,
  eventVenue,
  digitalPassLink,
  includeQr = true,
}) {
  const qrSection = includeQr ? `
    <!-- Digital Pass QR Card -->
    <div style="background: linear-gradient(145deg, #0f172a, #1e293b); border-radius: 16px; padding: 24px 20px; text-align: center; color: #ffffff; margin: 24px 0; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);">
      <div style="font-size: 10px; font-family: monospace; letter-spacing: 2px; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">
        Official Digital Event Pass
      </div>
      <div style="font-size: 20px; font-weight: 800; letter-spacing: 2px; font-family: monospace; color: #38bdf8; margin-bottom: 14px;">
        ${ticketId}
      </div>
      <div style="background-color: #ffffff; padding: 12px; border-radius: 14px; display: inline-block; margin-bottom: 12px;">
        <img
          src="cid:ticket-qr-code"
          alt="Ticket QR - ${ticketId}"
          width="160"
          height="160"
          style="display: block; width: 160px; height: 160px; border: 0; outline: none; border-radius: 8px; margin: 0 auto;"
        />
      </div>
      <div style="font-size: 12px; color: #cbd5e1; line-height: 1.4;">
        📱 Present this QR pass at the venue entrance desk for verification.
      </div>
    </div>
    <!-- /Digital Pass QR Card -->
  ` : '';

  let trimmed = (customBody || '').trim();

  // 1. If explicit {{qr_code}} placeholder is provided, replace it directly in that exact location
  if (/\{\{\s*qr_code\s*\}\}/i.test(trimmed)) {
    trimmed = trimmed.replace(/\{\{\s*qr_code\s*\}\}/gi, qrSection);
  } else if (!includeQr) {
    // 2. If QR is disabled, strip any existing QR card from template
    trimmed = trimmed
      .replace(/<!-- Digital Pass QR Card -->[\s\S]*?<!-- \/Digital Pass QR Card -->/gi, '')
      .replace(/<div[^>]*style="[^"]*linear-gradient\(145deg,\s*#0f172a,\s*#1e293b\)[\s\S]*?<\/div>\s*<\/div>/gi, '');
  } else {
    // 3. QR is enabled: check if the template already has a QR pass card
    const alreadyHasQrCard =
      trimmed.includes('<!-- Digital Pass QR Card -->') ||
      trimmed.includes('Official Digital Event Pass') ||
      trimmed.includes('cid:ticket-qr-code') ||
      trimmed.includes('create-qr-code');

    if (!alreadyHasQrCard) {
      // Insert in the same spot as default email (before notice, CTA, or footer)
      if (trimmed.includes('<!-- Important Notice')) {
        trimmed = trimmed.replace('<!-- Important Notice', `${qrSection}\n\n    <!-- Important Notice`);
      } else if (trimmed.includes('<!-- Call to Action')) {
        trimmed = trimmed.replace('<!-- Call to Action', `${qrSection}\n\n    <!-- Call to Action`);
      } else if (trimmed.includes('<!-- Footer')) {
        trimmed = trimmed.replace('<!-- Footer', `${qrSection}\n\n  <!-- Footer`);
      } else if (trimmed.includes('</div>\n  </div>')) {
        trimmed = trimmed.replace('</div>\n  </div>', `${qrSection}\n  </div>\n  </div>`);
      } else if (trimmed.includes('</body>')) {
        trimmed = trimmed.replace('</body>', `${qrSection}\n</body>`);
      } else {
        trimmed = `${trimmed}\n${qrSection}`;
      }
    } else {
      // Already has QR card: replace external preview QR image URL with cid:ticket-qr-code for reliable inline email delivery
      trimmed = trimmed.replace(
        /https:\/\/api\.qrserver\.com\/v1\/create-qr-code\/[^\s"']+/gi,
        'cid:ticket-qr-code'
      );
    }
  }

  // Check if trimmed is already a full email document or complete styled card (like DEFAULT_EMAIL_HTML_DRAFT)
  const isFullDoc = trimmed.toLowerCase().includes('<html') || trimmed.toLowerCase().startsWith('<!doctype');
  if (isFullDoc) {
    return trimmed;
  }

  const isCardContainer =
    trimmed.includes('max-width: 600px') ||
    trimmed.includes('Registration Confirmed') ||
    trimmed.startsWith('<div style="font-family:');

  if (isCardContainer) {
    // Wrap cleanly in standard email HTML doctype and body without nested double tables or duplicate QR
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${eventTitle}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  ${trimmed}
</body>
</html>`;
  }

  // If custom HTML snippet/elements are provided, preserve all HTML tags
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(trimmed);
  const formattedBody = hasHtmlTags
    ? trimmed
    : trimmed.split('\n\n').map(p => `<p style="margin: 0 0 16px 0; line-height: 1.6;">${p.replace(/\n/g, '<br/>')}</p>`).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${eventTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.07); border: 1px solid #e2e8f0;">
          <!-- Top Accent Bar -->
          <tr>
            <td style="background: linear-gradient(90deg, #4285F4, #EA4335, #FBBC04, #34A853); height: 5px; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>
          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px 16px 32px; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                      <span style="color: #4285F4;">G</span><span style="color: #EA4335;">D</span><span style="color: #FBBC04;">G</span> On Campus
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size: 12px; font-weight: 600; color: #64748b; background: #f1f5f9; padding: 4px 12px; border-radius: 50px;">
                      Registration Update
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content Body -->
          <tr>
            <td style="padding: 32px; font-size: 15px; line-height: 1.6; color: #334155;">
              ${formattedBody}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
              <p style="margin: 0 0 4px 0;">Google Developer Groups (GDG) On Campus</p>
              <p style="margin: 0;">Need help? Reply directly to this email or reach out to your campus leads.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}


/**
 * Formats a date string into readable wall-clock representation.
 */
function formatEmailDate(dateStr) {
  if (!dateStr) return 'TBA';
  try {
    const cleanStr = String(dateStr).replace(/Z$/, '');
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats time range into 12-hour AM/PM format.
 */
function formatEmailTime(startStr, endStr) {
  if (!startStr) return 'TBA';
  try {
    const formatTime = (iso) => {
      const clean = String(iso).replace(/Z$/, '');
      const d = new Date(clean);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };

    const s = formatTime(startStr);
    if (!endStr || endStr === startStr) return s;
    const e = formatTime(endStr);
    return `${s} – ${e}`;
  } catch {
    return startStr;
  }
}

/**
 * Strips basic markdown formatting for email body text.
 */
function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[#*_~`]/g, '')
    .trim();
}

/**
 * Escapes HTML characters to prevent HTML/XSS injection attacks in email templates.
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Service to send automated confirmation emails with embedded QR code pass.
 * Configured with zero attachments to prevent SpamAssassin/Junk filter penalties.
 */
const EmailService = {
  /**
   * Generates a public HTTPS QR code URL.
   * Public HTTPS images avoid email client CID-blocking and prevent attachment-based spam flags.
   */
  getQrImageUrl(text) {
    const encoded = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&margin=4&data=${encoded}`;
  },

  /**
   * Sends the official registration confirmation email with QR code pass.
   *
   * @param {Object} options
   * @param {string} options.to - Attendee email address
   * @param {string} options.attendeeName - Attendee full name
   * @param {Object} options.event - Event object (title, details)
   * @param {Object} options.submission - Submission object (id, answers, submitted_at)
   * @param {Object} [options.form] - Form schema
   */
  async sendRegistrationConfirmation({ to, attendeeName, event, submission, form }) {
    try {
      if (!to || !to.includes('@')) {
        console.warn('[EmailService] Invalid recipient email address:', to);
        return { success: false, reason: 'Invalid recipient email' };
      }

      const senderEmail =
        process.env.EMAIL_ID ||
        process.env.GOOGLE_SENDER_EMAIL ||
        'no-reply@gdg.community';

      const eventDetails = event?.details || {};
      const rawEventTitle = event?.title || 'GDG Event';
      const eventTitle = escapeHtml(rawEventTitle);
      const eventCategory = escapeHtml(eventDetails.category || 'Workshop');
      const eventVenue = escapeHtml(eventDetails.location || eventDetails.venue || 'Campus Venue / TBA');
      const eventDateFormatted = escapeHtml(formatEmailDate(eventDetails.startTime || eventDetails.start_time));
      const eventTimeFormatted = escapeHtml(
        formatEmailTime(
          eventDetails.startTime || eventDetails.start_time,
          eventDetails.endTime || eventDetails.end_time
        )
      );
      const eventDescription = escapeHtml(
        stripMarkdown(eventDetails.description || '')
          .split('\n')
          .filter(Boolean)
          .slice(0, 3)
          .join(' ')
      );

      // Use sequential ticket ID if saved in answers or submission, fallback to short ID
      const rawTicketId =
        submission?.ticket_id ||
        submission?.answers?.ticket_id ||
        (submission?.id ? `TKT-${submission.id.slice(0, 8).toUpperCase()}` : 'CONFIRMED');
      const ticketId = escapeHtml(rawTicketId);
      const safeAttendeeName = escapeHtml(attendeeName || 'Attendee');
      const safeRecipientEmail = escapeHtml(to);

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:8081';
      const eventLink = `${clientUrl}/events/${event?.id || ''}`;
      const digitalPassLink = `${clientUrl}/events/${event?.id || ''}/register?ticket=${encodeURIComponent(rawTicketId)}`;

      // Submission answers and form fields definition
      const answers = submission?.answers || {};
      const fields = form?.schema?.fields || [];

      // Build structured QR text encoding all fields (Default vs Manual Config)
      let fullQrText = '';
      const qrConfig = form?.schema?.qr_config || {};

      if (qrConfig.mode === 'manual' && qrConfig.content && qrConfig.content.trim()) {
        const formattedAnswersLines = fields
          .filter((f) => f.name !== 'email' && f.name !== 'full_name' && f.name !== 'ticket_id' && f.name !== 'email_sent')
          .map((f) => {
            const val = answers[f.name] !== undefined ? answers[f.name] : (answers[f.id] !== undefined ? answers[f.id] : '');
            return (val !== undefined && val !== null && val !== '') ? `${f.label || f.name}: ${val}` : null;
          })
          .filter(Boolean)
          .join('\n');

        const qrVars = {
          name: attendeeName || 'Attendee',
          full_name: attendeeName || 'Attendee',
          email: to,
          event_title: rawEventTitle,
          ticket_id: rawTicketId,
          venue: eventDetails.location || eventDetails.venue || 'Campus Venue / TBA',
          date: formatEmailDate(eventDetails.startTime || eventDetails.start_time),
          time: formatEmailTime(eventDetails.startTime || eventDetails.start_time, eventDetails.endTime || eventDetails.end_time),
          ticket_link: digitalPassLink,
          event_link: eventLink,
          registered_at: new Date(submission?.submitted_at || Date.now()).toLocaleString('en-US'),
          all_form_answers: formattedAnswersLines,
          all_answers: formattedAnswersLines,
          form_answers: formattedAnswersLines,
          form_responses: formattedAnswersLines,
          ...answers,
        };

        // Also add field labels as keys so {{Department / Branch}} or {{department}} both work
        fields.forEach((f) => {
          const val = answers[f.name] !== undefined ? answers[f.name] : (answers[f.id] !== undefined ? answers[f.id] : '');
          if (val !== undefined && val !== null) {
            qrVars[f.name] = val;
            if (f.id) qrVars[f.id] = val;
            if (f.label) qrVars[f.label] = val;
          }
        });

        fullQrText = interpolateVariables(qrConfig.content, qrVars);
      } else {
        const qrLines = [
          'GDG EVENT TICKET',
          '==============================',
          `Event: ${eventTitle}`,
          `Ticket ID: ${ticketId}`,
          `Name: ${attendeeName || 'Attendee'}`,
          `Email: ${to}`,
        ];

        // Append custom form answers
        fields.forEach((field) => {
          if (field.name !== 'email' && field.name !== 'full_name' && field.name !== 'ticket_id' && field.name !== 'email_sent') {
            const val = answers[field.name];
            if (val !== undefined && val !== null && val !== '') {
              qrLines.push(`${field.label || field.name}: ${val}`);
            }
          }
        });

        qrLines.push('------------------------------');
        qrLines.push(`Date: ${eventDateFormatted}`);
        qrLines.push(`Time: ${eventTimeFormatted}`);
        qrLines.push(`Venue: ${eventVenue}`);
        qrLines.push(`Registered: ${new Date(submission?.submitted_at || Date.now()).toLocaleString('en-US')}`);
        qrLines.push('==============================');
        qrLines.push('Google Developer Groups (GDG) On Campus');
        qrLines.push('Present this QR pass at check-in desk.');
        fullQrText = qrLines.join('\n');
      }

      const qrBuffer = await QRCode.toBuffer(fullQrText, {

        width: 320,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });

      // Render custom answers summary table for HTML email
      const customAnswersRows = fields
        .filter((f) => f.name !== 'email' && f.name !== 'full_name' && f.name !== 'ticket_id' && f.name !== 'email_sent' && answers[f.name])
        .map(
          (f) => `
            <tr>
              <td style="padding: 8px 14px; font-size: 12px; color: #5f6368; border-bottom: 1px solid #f1f3f4; font-weight: 500;">
                ${escapeHtml(f.label || f.name)}
              </td>
              <td style="padding: 8px 14px; font-size: 12px; color: #202124; border-bottom: 1px solid #f1f3f4; font-weight: 600; word-break: break-word;">
                ${escapeHtml(String(answers[f.name]))}
              </td>
            </tr>
          `
        )
        .join('');

      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Event Registration Confirmed - ${eventTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          
          <!-- Google 4-Color Brand Bar -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #4285F4 25%, #EA4335 25% 50%, #FBBC04 50% 75%, #34A853 75%);"></td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center;">
              <!-- GDG Branding -->
              <div style="font-size: 21px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a; margin-bottom: 2px;">
                Google Developer Groups
              </div>
              <div style="font-size: 11px; font-weight: 700; color: #4285F4; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 18px;">
                On Campus Community
              </div>

              <!-- Status Badge -->
              <div style="display: inline-block; background-color: #dcfce7; color: #15803d; padding: 6px 18px; border-radius: 50px; font-size: 12px; font-weight: 700; border: 1px solid #bbf7d0;">
                ✓ Registration Confirmed
              </div>

              <!-- Event Title -->
              <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 16px 0 6px 0; line-height: 1.3;">
                ${eventTitle}
              </h1>
              <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
                Hello <strong>${safeAttendeeName}</strong>, your seat has been reserved!
              </p>
            </td>
          </tr>

          <!-- Digital Ticket Pass Card -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background: linear-gradient(145deg, #0f172a, #1e293b); border-radius: 20px; overflow: hidden; text-align: center; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);">
                <tr>
                  <td style="padding: 28px 20px 24px 20px; color: #ffffff;">
                    <!-- Badge -->
                    <div style="display: inline-block; font-size: 10px; font-family: monospace; letter-spacing: 2.5px; color: #94a3b8; text-transform: uppercase; background-color: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 50px; margin-bottom: 12px;">
                      Official Digital Event Pass
                    </div>

                    <!-- Unique Ticket ID -->
                    <div style="font-size: 24px; font-weight: 800; letter-spacing: 3px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; color: #38bdf8; margin-bottom: 20px;">
                      ${ticketId}
                    </div>

                    <!-- Clean Inline Embedded QR Code Pass -->
                    <div style="background-color: #ffffff; padding: 14px; border-radius: 18px; display: inline-block; margin-bottom: 16px; box-shadow: 0 6px 16px rgba(0,0,0,0.3);">
                      <img
                        src="cid:ticket-qr-code"
                        alt="Event Pass QR - ${ticketId}"
                        width="200"
                        height="200"
                        style="display: block; width: 200px; height: 200px; border: 0; outline: none; border-radius: 10px;"
                      />
                    </div>

                    <!-- Check-in Instruction -->
                    <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5; max-width: 380px; margin: 0 auto;">
                      📱 <strong>Entrance Check-in:</strong> Present this QR code on your phone at the registration desk for verification.
                    </div>

                    <!-- Spam / Image Blocking Fallback Notice -->
                    <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; color: #94a3b8; line-height: 1.4; max-width: 420px; margin-left: auto; margin-right: auto;">
                      💡 <em>Image blocked? Click <strong>"Report Not Spam"</strong> or <strong>"Show Images"</strong> in your mail toolbar, or access your live pass below.</em>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Event Schedule & Location Grid -->
          <tr>
            <td style="padding: 0 24px 20px 24px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                    <div style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 1px;">
                      Event Schedule & Venue
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748b; width: 85px; vertical-align: top;">
                          📅 <strong>Date:</strong>
                        </td>
                        <td style="padding: 5px 0; font-size: 13px; color: #0f172a; font-weight: 600;">
                          ${eventDateFormatted}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748b; vertical-align: top;">
                          ⏰ <strong>Time:</strong>
                        </td>
                        <td style="padding: 5px 0; font-size: 13px; color: #0f172a; font-weight: 600;">
                          ${eventTimeFormatted}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748b; vertical-align: top;">
                          📍 <strong>Venue:</strong>
                        </td>
                        <td style="padding: 5px 0; font-size: 13px; color: #0f172a; font-weight: 600;">
                          ${eventVenue}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: 13px; color: #64748b; vertical-align: top;">
                          🏷️ <strong>Category:</strong>
                        </td>
                        <td style="padding: 5px 0; font-size: 13px; color: #0f172a; font-weight: 600;">
                          ${eventCategory}
                        </td>
                      </tr>
                    </table>

                    ${
                      eventDescription
                        ? `
                      <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">About:</div>
                        <p style="font-size: 12px; color: #334155; line-height: 1.5; margin: 0;">
                          ${eventDescription}
                        </p>
                      </div>
                    `
                        : ''
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Attendee Registration Summary -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
                <tr>
                  <td colspan="2" style="padding: 12px 16px; background-color: #f8fafc; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0;">
                    Registration Record
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 14px; font-size: 12px; color: #5f6368; border-bottom: 1px solid #f1f3f4; font-weight: 500; width: 140px;">
                    Ticket ID
                  </td>
                  <td style="padding: 8px 14px; font-size: 12px; color: #0f172a; border-bottom: 1px solid #f1f3f4; font-weight: 700; font-family: monospace;">
                    ${ticketId}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 14px; font-size: 12px; color: #5f6368; border-bottom: 1px solid #f1f3f4; font-weight: 500;">
                    Name
                  </td>
                  <td style="padding: 8px 14px; font-size: 12px; color: #0f172a; border-bottom: 1px solid #f1f3f4; font-weight: 600;">
                    ${safeAttendeeName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 14px; font-size: 12px; color: #5f6368; border-bottom: 1px solid #f1f3f4; font-weight: 500;">
                    Email
                  </td>
                  <td style="padding: 8px 14px; font-size: 12px; color: #0f172a; border-bottom: 1px solid #f1f3f4; font-weight: 600; word-break: break-word;">
                    ${safeRecipientEmail}
                  </td>
                </tr>
                ${customAnswersRows}
              </table>
            </td>
          </tr>

          <!-- Primary CTA Button -->
          <tr>
            <td style="padding: 0 24px 32px 24px; text-align: center;">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="border-radius: 50px; background-color: #4285F4;">
                    <a
                      href="${digitalPassLink}"
                      target="_blank"
                      style="display: inline-block; background-color: #4285F4; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 14px 32px; border-radius: 50px; letter-spacing: 0.2px;"
                    >
                      View & Download Digital Pass Online →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 11px; color: #94a3b8; margin: 12px 0 0 0;">
                You can also view this ticket pass anytime in your GDG account.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 22px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6;">
              <div style="font-weight: 700; color: #334155; margin-bottom: 4px;">
                Google Developer Groups On Campus
              </div>
              <div>
                Building developers, connecting communities, and inspiring tech innovation.
              </div>
              <div style="margin-top: 8px; font-size: 10px; color: #94a3b8;">
                This is an automated confirmation email regarding your registration. No reply is needed.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      // Check for Custom Email Draft Configuration
      const emailConfig = form?.schema?.email_config || {};
      const isCustomMode = emailConfig.mode === 'custom' && (emailConfig.subject || emailConfig.html || emailConfig.body);

      let finalHtml = htmlContent;
      let finalSubject = `Registration Confirmed: ${eventTitle} (Ticket ${ticketId})`;
      let finalText = `Your registration for ${eventTitle} is confirmed!\n\nTicket ID: ${ticketId}\nDate: ${eventDateFormatted}\nTime: ${eventTimeFormatted}\nVenue: ${eventVenue}\n\nAccess your digital pass and QR code online: ${digitalPassLink}\n\nGDG On Campus`;

      if (isCustomMode) {
        const customVars = {
          name: attendeeName || 'Attendee',
          email: to,
          event_title: rawEventTitle,
          ticket_id: rawTicketId,
          venue: eventDetails.location || eventDetails.venue || 'Campus Venue / TBA',
          date: formatEmailDate(eventDetails.startTime || eventDetails.start_time),
          time: formatEmailTime(eventDetails.startTime || eventDetails.start_time, eventDetails.endTime || eventDetails.end_time),
          ticket_link: digitalPassLink,
          event_link: eventLink,
        };

        if (emailConfig.subject) {
          finalSubject = interpolateVariables(emailConfig.subject, customVars);
        }

        const rawBody = emailConfig.html || emailConfig.body || '';
        const populatedBody = interpolateVariables(rawBody, customVars);

        finalHtml = buildCustomHtmlEmail({
          customBody: populatedBody,
          eventTitle,
          ticketId,
          attendeeName: safeAttendeeName,
          eventDateFormatted,
          eventTimeFormatted,
          eventVenue,
          digitalPassLink,
          includeQr: emailConfig.include_qr !== false,
        });

        finalText = `${populatedBody.replace(/<[^>]+>/g, '')}\n\nTicket ID: ${ticketId}\nDate: ${eventDateFormatted}\nVenue: ${eventVenue}\nPass: ${digitalPassLink}`;
      }

      // 1. Primary Dispatch Method: Official Google Gmail REST API (Scope: https://www.googleapis.com/auth/gmail.send)
      const gmailAttachments = [
        {
          filename: `gdg-pass-qr-${ticketId}.png`,
          content: qrBuffer,
          cid: 'ticket-qr-code',
          contentType: 'image/png',
          contentDisposition: 'inline',
        },
      ];

      const gmailApiResult = await GmailApiService.sendMail({
        to,
        subject: finalSubject,
        html: finalHtml,
        text: finalText,
        senderEmail,
        attachments: gmailAttachments,
        headers: {
          'X-Entity-Ref-ID': `${event?.id || 'event'}-${ticketId}`,
        },
      });

      if (gmailApiResult.success) {
        console.log(
          `[EmailService] Confirmation email successfully sent via Gmail API to ${to} (Ticket: ${ticketId}): Message ID ${gmailApiResult.messageId}`
        );
        return {
          success: true,
          messageId: gmailApiResult.messageId,
          provider: 'gmail_api',
          ticketId,
        };
      }

      // Fallback: If token expired, missing, or rate limit hit, enqueue email for reliable asynchronous dispatch
      console.warn(
        `[EmailService] Gmail API dispatch failed for ${to} (${gmailApiResult.error || gmailApiResult.message}). Enqueueing email safely...`
      );

      const queueResult = await EmailQueueService.enqueueEmail({
        to,
        attendeeName,
        subject: finalSubject,
        html: finalHtml,
        text: finalText,
        ticketId: rawTicketId,
        eventId: event?.id,
        formId: form?.id,
        submissionId: submission?.id,
        attachments: gmailAttachments,
        headers: {
          'X-Entity-Ref-ID': `${event?.id || 'event'}-${ticketId}`,
        },
        lastError: gmailApiResult.error || gmailApiResult.message || 'Dispatch failed',
      });

      return {
        success: false,
        queued: true,
        queueId: queueResult.id,
        ticketId: rawTicketId,
        error: gmailApiResult.error || 'QUEUED_FOR_REAUTH',
        message: 'Gmail API token expired or quota hit. Registration email safely queued.',
      };
    } catch (err) {
      console.error('[EmailService] Failed to send registration email via Gmail API:', err.message);

      // Even on exception, attempt to enqueue
      try {
        const queueResult = await EmailQueueService.enqueueEmail({
          to,
          attendeeName,
          subject: `Registration Confirmed: ${event?.title || 'GDG Event'}`,
          html: `<p>Registration confirmed for ${event?.title || 'GDG Event'}.</p>`,
          text: `Registration confirmed.`,
          ticketId: submission?.ticket_id,
          eventId: event?.id,
          formId: form?.id,
          submissionId: submission?.id,
          lastError: err.message,
        });
        return { success: false, queued: true, queueId: queueResult.id, error: err.message };
      } catch {
        return { success: false, error: err.message };
      }
    }
  },
};

module.exports = EmailService;
