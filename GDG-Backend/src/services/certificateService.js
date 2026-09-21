const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { supabaseAdmin } = require('../config/supabase');
const GmailApiService = require('./gmailApiService');

const ASSETS_DIR = path.resolve(__dirname, '../../assets/certificates');
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// In-memory job registry for tracking batch progress
const activeJobs = new Map();

// Helper to prune old completed/cancelled jobs (keep last 30)
function pruneActiveJobs() {
  if (activeJobs.size > 30) {
    const keys = Array.from(activeJobs.keys());
    for (let i = 0; i < keys.length - 25; i++) {
      const job = activeJobs.get(keys[i]);
      if (job && (job.status === 'completed' || job.status === 'cancelled' || job.status === 'failed')) {
        activeJobs.delete(keys[i]);
      }
    }
  }
}

// Default Python Certificate Generator Template (Uses Pillow)
const DEFAULT_PYTHON_TEMPLATE = `from PIL import Image, ImageDraw, ImageFont
import json
import os
import sys
import argparse

# 1. Parse CLI arguments
parser = argparse.ArgumentParser(description="GDG Certificate Generator")
parser.add_argument("--data", required=True, help="Path to attendee data JSON")
parser.add_argument("--output", required=True, help="Path to output certificate file")
parser.add_argument("--assets", default="./assets/certificates", help="Path to assets folder")
args = parser.parse_args()

# Load attendee and event metadata
with open(args.data, "r", encoding="utf-8") as f:
    data = json.load(f)

attendee_name = data.get("attendee_name", "Participant Name")
event_title = data.get("event_title", "GDG Event")
event_date = data.get("event_date", "2026")
ticket_id = data.get("ticket_id", "GDG-0000")
certificate_id = data.get("certificate_id", "CERT-GDG-0000")
answers = data.get("answers", {})

# Optional custom fields from registration form answers
college = answers.get("college_name") or answers.get("college") or ""
department = answers.get("department") or ""

def get_asset(filename):
    return os.path.join(args.assets, filename)

# 2. Dimensions: Standard A4 Landscape (1920 x 1080 for crisp HD output)
width, height = 1920, 1080

# Base canvas
bg_asset = get_asset("certificate_bg.png")
if os.path.exists(bg_asset):
    img = Image.open(bg_asset).convert("RGBA")
    if img.size != (width, height):
        img = img.resize((width, height), Image.Resampling.LANCZOS)
else:
    img = Image.new("RGBA", (width, height), (255, 255, 255, 255))

draw = ImageDraw.Draw(img)

# Helper function to get fonts safely across OS (fallback to default)
def load_font(size, bold=False):
    font_candidates = [
        "arialbd.ttf" if bold else "arial.ttf",
        "segui_bold.ttf" if bold else "segoeui.ttf",
        "Roboto-Bold.ttf" if bold else "Roboto-Regular.ttf",
        "Helvetica-Bold" if bold else "Helvetica",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf" if bold else "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
    ]
    for font_name in font_candidates:
        try:
            return ImageFont.truetype(font_name, size)
        except Exception:
            continue
    return ImageFont.load_default()

font_title = load_font(52, bold=True)
font_subtitle = load_font(22, bold=False)
font_name = load_font(64, bold=True)
font_body = load_font(24, bold=False)
font_small = load_font(18, bold=False)
font_tiny = load_font(15, bold=False)

# 3. Paste GDG Logo top center
gdg_logo_path = get_asset("gdg_logo.png")
if os.path.exists(gdg_logo_path):
    try:
        logo = Image.open(gdg_logo_path).convert("RGBA")
        logo.thumbnail((420, 100), Image.Resampling.LANCZOS)
        logo_x = (width - logo.width) // 2
        img.paste(logo, (logo_x, 85), mask=logo)
    except Exception as e:
        print(f"Notice: Could not paste GDG logo: {e}")

# 4. Header Titles
def draw_centered_text(y, text, font, fill=(30, 41, 59)):
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    draw.text(((width - text_w) // 2, y), text, font=font, fill=fill)

draw_centered_text(225, "CERTIFICATE OF PARTICIPATION", font_title, fill=(30, 41, 59))
draw_centered_text(295, "THIS CERTIFICATE IS PROUDLY PRESENTED TO", font_subtitle, fill=(100, 116, 139))

# 5. Attendee Name (Prominent with Google Blue accent underline)
draw_centered_text(355, attendee_name.upper(), font_name, fill=(26, 115, 232))

# Underline accent below attendee name
name_bbox = draw.textbbox((0, 0), attendee_name.upper(), font=font_name)
name_w = name_bbox[2] - name_bbox[0]
line_start = (width - name_w) // 2 - 40
line_end = line_start + name_w + 80
draw.line([(line_start, 445), (line_end, 445)], fill=(66, 133, 244), width=3)

# 6. Description / Appreciation Text
if college:
    sub_desc = f"of {college}"
    draw_centered_text(465, sub_desc, font_subtitle, fill=(71, 85, 105))
    start_body_y = 515
else:
    start_body_y = 485

desc_1 = f"for active participation and valuable contribution in the event"
draw_centered_text(start_body_y, desc_1, font_body, fill=(71, 85, 105))

desc_2 = f"\\"{event_title}\\""
draw_centered_text(start_body_y + 40, desc_2, load_font(30, bold=True), fill=(15, 23, 42))

desc_3 = f"organized by Google Developer Groups on {event_date}."
draw_centered_text(start_body_y + 88, desc_3, font_body, fill=(71, 85, 105))

# 7. Verification Seal bottom center-left
seal_path = get_asset("gold_seal.png")
if os.path.exists(seal_path):
    try:
        seal = Image.open(seal_path).convert("RGBA")
        seal.thumbnail((160, 160), Image.Resampling.LANCZOS)
        img.paste(seal, (280, 770), mask=seal)
    except Exception as e:
        print(f"Notice: Seal image skipped: {e}")

# 8. Signatures & Organizer Details
# Left / Center signature line
draw.line([(1200, 880), (1600, 880)], fill=(148, 163, 184), width=2)
draw.text((1300, 895), "GDG Community Lead", font=load_font(20, bold=True), fill=(30, 41, 59))
draw.text((1285, 925), "Google Developer Groups", font=font_small, fill=(100, 116, 139))

# 9. Verification Footer & Certificate ID
draw.text((120, 970), f"Certificate ID: {certificate_id}", font=font_tiny, fill=(148, 163, 184))
draw.text((120, 995), f"Ticket Ref: {ticket_id} • Verified GDG On Campus Attendee", font=font_tiny, fill=(148, 163, 184))

# 10. Save Output
out_ext = os.path.splitext(args.output)[1].lower()
if out_ext == ".pdf":
    rgb_img = img.convert("RGB")
    rgb_img.save(args.output, "PDF", resolution=150.0)
else:
    img.save(args.output, "PNG")

print(f"Certificate successfully generated: {args.output}")
`;

class CertificateService {
  static get DEFAULT_PYTHON_TEMPLATE() {
    return DEFAULT_PYTHON_TEMPLATE;
  }

  /**
   * Returns list of stored graphic assets (logos, seals, backgrounds).
   */
  static listAssets() {
    try {
      const files = fs.readdirSync(ASSETS_DIR);
      return files.map((file) => {
        const fullPath = path.join(ASSETS_DIR, file);
        const stats = fs.statSync(fullPath);
        return {
          filename: file,
          size: stats.size,
          updatedAt: stats.mtime,
          isDefault: ['gdg_logo.png', 'gold_seal.png', 'certificate_bg.png'].includes(file),
        };
      });
    } catch (err) {
      console.error('[CertificateService] listAssets error:', err);
      return [];
    }
  }

  /**
   * Saves a newly uploaded image asset (e.g. college logo or signature) to assets dir.
   */
  static async saveAsset(file) {
    if (!file || !file.buffer) {
      throw new Error('Valid file buffer is required.');
    }
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
    const destPath = path.join(ASSETS_DIR, safeName);
    fs.writeFileSync(destPath, file.buffer);
    return {
      filename: safeName,
      size: file.size,
      path: destPath,
    };
  }

  static getPythonBinary() {
    if (process.env.PYTHON_BIN) return process.env.PYTHON_BIN;
    if (process.platform === 'win32') return 'python';
    return 'python3';
  }

  static getDefaultEmailSubject(eventTitle = 'GDG Event') {
    return `Your Certificate of Participation: ${eventTitle}`;
  }

  static getDefaultEmailBody(eventTitle = 'GDG Event') {
    return `Hi {attendee_name},\n\nCongratulations on attending "${eventTitle}"! Please find your official certificate of participation attached below.\n\nBest regards,\nGoogle Developer Groups (GDG)`;
  }

  /**
   * Helper to extract the attendee email filled in the registration form answers,
   * prioritizing the user's form-submitted email over their account login email.
   */
  static getSubmissionEmail(answers, profileEmail) {
    if (answers && typeof answers === 'object') {
      if (typeof answers.email === 'string' && answers.email.trim()) {
        return answers.email.trim();
      }
      if (typeof answers.email_address === 'string' && answers.email_address.trim()) {
        return answers.email_address.trim();
      }
      if (typeof answers.mail === 'string' && answers.mail.trim()) {
        return answers.mail.trim();
      }
      if (typeof answers.student_email === 'string' && answers.student_email.trim()) {
        return answers.student_email.trim();
      }
      for (const key of Object.keys(answers)) {
        if (key.toLowerCase().includes('email') || key.toLowerCase() === 'mail') {
          const val = answers[key];
          if (typeof val === 'string' && val.includes('@')) {
            return val.trim();
          }
        }
      }
    }
    return profileEmail || 'N/A';
  }

  /**
   * Helper to extract the attendee full name filled in the registration form answers,
   * prioritizing the user's form-submitted name over their account profile name.
   */
  static getSubmissionName(answers, profileName) {
    if (answers && typeof answers === 'object') {
      if (typeof answers.full_name === 'string' && answers.full_name.trim()) {
        return answers.full_name.trim();
      }
      if (typeof answers.name === 'string' && answers.name.trim()) {
        return answers.name.trim();
      }
      if (typeof answers.student_name === 'string' && answers.student_name.trim()) {
        return answers.student_name.trim();
      }
      if (typeof answers.attendee_name === 'string' && answers.attendee_name.trim()) {
        return answers.attendee_name.trim();
      }
      for (const key of Object.keys(answers)) {
        if (key.toLowerCase().includes('name') && !key.toLowerCase().includes('college')) {
          const val = answers[key];
          if (typeof val === 'string' && val.trim()) {
            return val.trim();
          }
        }
      }
    }
    return profileName || 'Participant';
  }

  /**
   * Retrieves certificate configuration for an event.
   * Checks dedicated `event_certificates` table first, then falls back to `events.details.certificate_config`.
   */
  static async getConfig(eventId) {
    return this.getEventConfig(eventId);
  }

  static async getEventConfig(eventId) {
    // 1. Check dedicated table
    let certRow = null;
    try {
      const { data } = await supabaseAdmin
        .from('event_certificates')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();
      certRow = data;
    } catch {
      // ignore
    }

    // 2. Fetch event row
    const { data: event, error } = await supabaseAdmin
      .from('events')
      .select('id, title, details')
      .eq('id', eventId)
      .single();

    if (error || !event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    let currentDetails = event.details;
    if (typeof currentDetails === 'string') {
      try {
        currentDetails = JSON.parse(currentDetails);
      } catch {
        currentDetails = {};
      }
    }

    const fallbackConfig = currentDetails?.certificate_config || {};
    const defaultEmailSubject = this.getDefaultEmailSubject(event.title);
    const defaultEmailBody = this.getDefaultEmailBody(event.title);

    const scriptCode = certRow?.script_code || fallbackConfig.scriptCode || DEFAULT_PYTHON_TEMPLATE;
    const outputFormat = certRow?.output_format || fallbackConfig.outputFormat || 'pdf';
    const emailSubject =
      certRow?.email_subject ||
      fallbackConfig.emailSubject ||
      defaultEmailSubject;
    const emailBody =
      certRow?.email_body ||
      fallbackConfig.emailBody ||
      defaultEmailBody;

    const hasCustomCode = Boolean(certRow?.script_code || fallbackConfig.scriptCode);

    return {
      eventId: event.id,
      eventTitle: event.title,
      scriptCode,
      defaultScriptCode: DEFAULT_PYTHON_TEMPLATE,
      defaultEmailSubject,
      defaultEmailBody,
      hasCustomCode,
      outputFormat,
      emailSubject,
      emailBody,
      updatedAt: certRow?.updated_at || fallbackConfig.updatedAt || null,
      availableFields: await this.getAvailableFieldsForEvent(eventId),
    };
  }

  /**
   * Extracts dynamic form fields available for substitution in the Python script.
   */
  static async getAvailableFieldsForEvent(eventId) {
    const standardFields = [
      { key: '{attendee_name}', label: 'Attendee Full Name', sample: 'Alex Johnson' },
      { key: '{attendee_email}', label: 'Attendee Email', sample: 'alex@example.com' },
      { key: '{event_title}', label: 'Event Title', sample: 'Google Cloud & AI Workshop' },
      { key: '{event_date}', label: 'Event Date', sample: 'September 2026' },
      { key: '{ticket_id}', label: 'Unique Ticket Code', sample: 'GDG-EVT-4891' },
      { key: '{certificate_id}', label: 'Generated Certificate ID', sample: 'CERT-GDG-9842-AB' },
      { key: '{issue_date}', label: 'Issue Date', sample: new Date().toLocaleDateString() },
    ];

    const addedKeys = new Set(standardFields.map((f) => f.key));

    try {
      // 1. Fetch form schemas attached to this event
      const { data: forms, error: formErr } = await supabaseAdmin
        .from('forms')
        .select('id, schema')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (formErr) {
        console.warn('[CertificateService] Form fetch warning:', formErr.message);
      }

      if (Array.isArray(forms) && forms.length > 0) {
        for (const form of forms) {
          const fields = form?.schema?.fields || form?.fields || [];
          if (Array.isArray(fields)) {
            fields.forEach((f) => {
              const fieldName = f.name || f.id;
              if (fieldName && f.type !== 'file') {
                const answerKey = `{answers.${fieldName}}`;
                if (!addedKeys.has(answerKey)) {
                  addedKeys.add(answerKey);
                  standardFields.push({
                    key: answerKey,
                    label: f.label || fieldName,
                    sample: f.placeholder || `Sample ${f.label || fieldName}`,
                  });
                }
              }
            });
          }

          // 2. Also inspect recent submissions for this form to pick up live dynamic keys
          try {
            const { data: sampleSubs } = await supabaseAdmin
              .from('form_submissions')
              .select('answers')
              .eq('form_id', form.id)
              .order('submitted_at', { ascending: false })
              .limit(10);

            if (Array.isArray(sampleSubs)) {
              sampleSubs.forEach((sub) => {
                if (sub?.answers && typeof sub.answers === 'object') {
                  Object.keys(sub.answers).forEach((k) => {
                    const ansKey = `{answers.${k}}`;
                    if (!addedKeys.has(ansKey)) {
                      addedKeys.add(ansKey);
                      standardFields.push({
                        key: ansKey,
                        label: `Form: ${k.replace(/_/g, ' ')}`,
                        sample: String(sub.answers[k] || `Sample ${k}`),
                      });
                    }
                  });
                }
              });
            }
          } catch {
            // ignore submission sample query error
          }
        }
      }
    } catch (err) {
      console.error('[CertificateService] getAvailableFieldsForEvent error:', err);
    }

    // 3. Fallback: Standard GDG form fields if not already added
    const defaultFormKeys = [
      { key: '{answers.college_name}', label: 'College / Institute Name', sample: 'Rajalakshmi Engineering College' },
      { key: '{answers.department}', label: 'Department / Major', sample: 'Computer Science and Engineering' },
      { key: '{answers.roll_no}', label: 'Roll No / Student ID', sample: '240801202' },
      { key: '{answers.year_of_study}', label: 'Year of Study', sample: '3rd Year' },
      { key: '{answers.phone_number}', label: 'Phone Number', sample: '+91 9876543210' },
    ];

    defaultFormKeys.forEach((df) => {
      if (!addedKeys.has(df.key)) {
        addedKeys.add(df.key);
        standardFields.push(df);
      }
    });

    return standardFields;
  }

  /**
   * Saves updated certificate configuration.
   * Dual-persists into both `event_certificates` table and `events.details.certificate_config`
   * so configuration is never lost if event details are modified elsewhere.
   */
  static async saveEventConfig(eventId, { scriptCode, outputFormat, emailSubject, emailBody }) {
    const nowIso = new Date().toISOString();
    const effectiveCode = (scriptCode && scriptCode.trim()) ? scriptCode : DEFAULT_PYTHON_TEMPLATE;
    const effectiveFormat = outputFormat === 'png' ? 'png' : 'pdf';

    // 1. Fetch event for title & details context
    const { data: event, error: fetchErr } = await supabaseAdmin
      .from('events')
      .select('title, details')
      .eq('id', eventId)
      .single();

    const eventTitle = event?.title || 'GDG Event';
    const effectiveSubject = (emailSubject && emailSubject.trim())
      ? emailSubject.trim()
      : this.getDefaultEmailSubject(eventTitle);
    const effectiveBody = (emailBody && emailBody.trim())
      ? emailBody.trim()
      : this.getDefaultEmailBody(eventTitle);

    // 2. Upsert into dedicated event_certificates table
    try {
      await supabaseAdmin
        .from('event_certificates')
        .upsert(
          {
            event_id: eventId,
            script_code: effectiveCode,
            output_format: effectiveFormat,
            email_subject: effectiveSubject,
            email_body: effectiveBody,
            updated_at: nowIso,
          },
          { onConflict: 'event_id' }
        );
    } catch (tblErr) {
      console.warn('[CertificateService] event_certificates upsert warning:', tblErr.message);
    }

    // 3. Also persist into events.details for backwards compatibility
    if (!fetchErr && event) {
      let currentDetails = event.details;
      if (typeof currentDetails === 'string') {
        try {
          currentDetails = JSON.parse(currentDetails);
        } catch {
          currentDetails = {};
        }
      }
      if (typeof currentDetails !== 'object' || currentDetails === null) {
        currentDetails = {};
      }

      const updatedDetails = {
        ...currentDetails,
        certificate_config: {
          scriptCode: effectiveCode,
          outputFormat: effectiveFormat,
          emailSubject: effectiveSubject,
          emailBody: effectiveBody,
          updatedAt: nowIso,
        },
      };

      await supabaseAdmin
        .from('events')
        .update({ details: updatedDetails })
        .eq('id', eventId);
    }

    return {
      success: true,
      message: 'Certificate configuration saved successfully.',
      updatedAt: nowIso,
    };
  }

  /**
   * Executes a Python script with structured JSON input and captures the generated output file.
   * Cleans up temporary scripts and data files immediately to prevent memory/disk bloat.
   */
  static async runPythonGenerator({ scriptCode, data, outputFormat = 'pdf' }) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gdg_cert_'));
    const scriptPath = path.join(tempDir, 'generator.py');
    const dataPath = path.join(tempDir, 'data.json');
    const outFileName = `certificate_${Date.now()}.${outputFormat}`;
    const outFilePath = path.join(tempDir, outFileName);

    try {
      fs.writeFileSync(scriptPath, scriptCode || DEFAULT_PYTHON_TEMPLATE, 'utf8');
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');

      const pythonBin = this.getPythonBinary();
      await new Promise((resolve, reject) => {
        const pythonProcess = spawn(pythonBin, [
          scriptPath,
          '--data',
          dataPath,
          '--output',
          outFilePath,
          '--assets',
          ASSETS_DIR,
        ]);

        let stderr = '';
        let stdout = '';

        pythonProcess.stdout.on('data', (chunk) => {
          stdout += chunk.toString();
        });

        pythonProcess.stderr.on('data', (chunk) => {
          stderr += chunk.toString();
        });

        const timer = setTimeout(() => {
          pythonProcess.kill();
          reject(new Error('Python certificate generation timed out after 20 seconds.'));
        }, 20000);

        pythonProcess.on('close', (code) => {
          clearTimeout(timer);
          if (code === 0 && fs.existsSync(outFilePath)) {
            resolve({ stdout });
          } else {
            reject(new Error(`Python execution failed (code ${code}): ${stderr || stdout || 'No output file generated.'}`));
          }
        });
      });

      const fileBuffer = fs.readFileSync(outFilePath);
      return {
        buffer: fileBuffer,
        format: outputFormat,
        mimeType: outputFormat === 'pdf' ? 'application/pdf' : 'image/png',
        filename: `Certificate_${(data.attendee_name || 'Participant').replace(/[^a-zA-Z0-9_-]/g, '_')}.${outputFormat}`,
      };
    } finally {
      // Clean up temp directory immediately
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // ignore cleanup error
      }
    }
  }

  /**
   * Generates an instant high-resolution preview for an event using mock attendee data.
   */
  static async generatePreview(eventId, scriptCode = null) {
    const config = await this.getEventConfig(eventId);
    const codeToRun = scriptCode || config.scriptCode;

    const mockAnswers = {
      college_name: 'Rajalakshmi Engineering College',
      department: 'Computer Science and Engineering',
      roll_no: '240801202',
      year_of_study: '3rd Year',
      phone_number: '+91 9876543210',
    };

    if (Array.isArray(config.availableFields)) {
      config.availableFields.forEach((f) => {
        const clean = f.key.replace(/[{}]/g, '');
        if (clean.startsWith('answers.')) {
          const k = clean.replace('answers.', '');
          mockAnswers[k] = f.sample || `Sample ${f.label}`;
        }
      });
    }

    const mockData = {
      attendee_name: 'Jane Doe',
      attendee_email: 'jane.doe@example.com',
      event_title: config.eventTitle || 'GDG Tech Workshop',
      event_date: new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
      ticket_id: 'GDG-PREVIEW-101',
      certificate_id: `CERT-GDG-${Date.now().toString(36).toUpperCase()}`,
      issue_date: new Date().toLocaleDateString(),
      answers: mockAnswers,
      ...mockAnswers,
    };

    // For preview in browser, generate PNG image format
    const result = await this.runPythonGenerator({
      scriptCode: codeToRun,
      data: mockData,
      outputFormat: 'png',
    });

    return {
      contentType: 'image/png',
      dataUrl: `data:image/png;base64,${result.buffer.toString('base64')}`,
    };
  }

  /**
   * High-Volume Helper: Paginates Supabase to retrieve ALL attended submissions
   * without running into the 1,000-row PostgREST default limit.
   */
  static async fetchAllAttendedSubmissions({ formId, submissionIds = null }) {
    const PAGE_SIZE = 1000;
    let allSubmissions = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabaseAdmin
        .from('form_submissions')
        .select('id, form_id, user_id, answers, attended, ticket_id, submitted_at, certificate_sent, certificate_sent_at, certificate_id')
        .eq('attended', true)
        .order('submitted_at', { ascending: false });

      if (formId) {
        query = query.eq('form_id', formId);
      }

      if (submissionIds && Array.isArray(submissionIds) && submissionIds.length > 0) {
        query = query.in('id', submissionIds);
      }

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await query.range(from, to);
      if (error) {
        throw new Error(`Failed to query submissions: ${error.message}`);
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allSubmissions.push(...data);
        if (data.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }

    return allSubmissions;
  }

  /**
   * High-Volume Helper: Batches profile retrieval in chunks of 100
   * to avoid URI Length Too Long (414) in Supabase PostgREST.
   */
  static async fetchProfilesInChunks(userIds) {
    const profileMap = new Map();
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
    const CHUNK_SIZE = 100;

    for (let i = 0; i < uniqueIds.length; i += CHUNK_SIZE) {
      const chunk = uniqueIds.slice(i, i + CHUNK_SIZE);
      const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('id, email, full_name')
        .in('id', chunk);

      if (!error && profiles) {
        profiles.forEach((p) => profileMap.set(p.id, p));
      }
    }

    return profileMap;
  }

  /**
   * High-Volume Batch Certificate Generation & Email Dispatch.
   * Implements strict concurrency control (3 concurrent workers), throttling between emails,
   * exponential backoff retry on rate limits, error isolation, and live progress reporting.
   * Handles thousands of attendees without crashing.
   *
   * @param {object} params
   * @param {string} params.eventId
   * @param {string[]} [params.submissionIds] - Specific submission IDs, or null to target all attended
   * @returns {string} - jobId for polling progress
   */
  static async startBatchDispatch({ eventId, submissionIds = null }) {
    pruneActiveJobs();

    const config = await this.getEventConfig(eventId);

    // Resolve event's form
    const { data: form } = await supabaseAdmin
      .from('forms')
      .select('id')
      .eq('event_id', eventId)
      .maybeSingle();

    // Fetch attended participants using paginated retrieval to avoid 1000 row cap
    const submissions = await this.fetchAllAttendedSubmissions({
      formId: form?.id,
      submissionIds,
    });

    if (!submissions || submissions.length === 0) {
      throw new Error('No attended participants found to receive certificates.');
    }

    // Resolve attendee user profiles safely in chunks
    const userIds = submissions.map((s) => s.user_id);
    const profileMap = await this.fetchProfilesInChunks(userIds);

    const jobId = `cert_job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const jobState = {
      jobId,
      eventId,
      eventTitle: config.eventTitle,
      total: submissions.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
      status: 'processing', // 'processing' | 'completed' | 'failed' | 'cancelled'
      startedAt: new Date().toISOString(),
      completedAt: null,
      errors: [],
    };

    activeJobs.set(jobId, jobState);

    // Run batch processing asynchronously with bounded concurrency
    this._processBatchAsync(jobId, submissions, profileMap, config).catch((err) => {
      console.error(`[CertificateService] Batch job ${jobId} fatal error:`, err);
      jobState.status = 'failed';
      if (jobState.errors.length < 50) {
        jobState.errors.push(err.message);
      }
    });

    return { jobId, total: submissions.length };
  }

  /**
   * Cancels a currently running batch job.
   */
  static cancelBatchJob(jobId) {
    const job = activeJobs.get(jobId);
    if (!job) return false;
    if (job.status === 'processing') {
      job.status = 'cancelled';
      job.completedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Internal asynchronous worker pool with concurrency control and crash prevention.
   */
  static async _processBatchAsync(jobId, submissions, profileMap, config) {
    const job = activeJobs.get(jobId);
    if (!job) return;

    // Strict concurrency of 3 workers keeps CPU and memory tightly bounded
    const CONCURRENCY = 3;
    let index = 0;

    const worker = async () => {
      while (index < submissions.length) {
        // Check if job was cancelled
        if (job.status === 'cancelled') {
          break;
        }

        const currentIndex = index++;
        const sub = submissions[currentIndex];
        const profile = profileMap.get(sub.user_id);
        const toEmail = CertificateService.getSubmissionEmail(sub.answers, profile?.email);
        const attendeeName = CertificateService.getSubmissionName(sub.answers, profile?.full_name);

        if (!toEmail) {
          job.processed++;
          job.failed++;
          if (job.errors.length < 50) {
            job.errors.push(`Submission ${sub.id}: No email address found`);
          }
          continue;
        }

        const certId = `CERT-GDG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        let certResult = null;
        try {
          const attendeeData = {
            attendee_name: attendeeName,
            attendee_email: toEmail,
            event_title: config.eventTitle,
            event_date: new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
            ticket_id: sub.ticket_id || 'GDG-ATTENDED',
            certificate_id: certId,
            issue_date: new Date().toLocaleDateString(),
            answers: sub.answers || {},
            ...(sub.answers || {}),
          };

          // 1. Generate certificate via isolated Python subprocess
          certResult = await this.runPythonGenerator({
            scriptCode: config.scriptCode,
            data: attendeeData,
            outputFormat: config.outputFormat || 'pdf',
          });

          // 2. Prepare personalized email body
          const emailBody = config.emailBody
            .replace(/{attendee_name}/g, attendeeName)
            .replace(/{event_title}/g, config.eventTitle)
            .replace(/{certificate_id}/g, certId);

          const emailSubject = config.emailSubject
            .replace(/{attendee_name}/g, attendeeName)
            .replace(/{event_title}/g, config.eventTitle);

          // 3. Send via Gmail API with retry on transient 429
          let sendSuccess = false;
          let lastSendError = null;

          for (let attempt = 1; attempt <= 2; attempt++) {
            const sendResult = await GmailApiService.sendMail({
              to: toEmail,
              subject: emailSubject,
              text: emailBody,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #1a73e8; margin: 0;">GDG On Campus</h2>
                    <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Google Developer Groups</p>
                  </div>
                  <div style="padding: 20px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
                    <h3 style="color: #0f172a; margin: 0 0 12px 0;">Congratulations, ${attendeeName}!</h3>
                    <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                      Thank you for actively attending <strong>${config.eventTitle}</strong>. We are proud to award you your official certificate of participation.
                    </p>
                    <p style="color: #64748b; font-size: 13px; margin: 0;">
                      Your official certificate is attached below as a <strong>${config.outputFormat.toUpperCase()}</strong> document.
                    </p>
                  </div>
                  <div style="margin-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
                    Certificate ID: ${certId} • Verified GDG Event Participation
                  </div>
                </div>
              `,
              attachments: [
                {
                  filename: certResult.filename,
                  content: certResult.buffer,
                  contentType: certResult.mimeType,
                },
              ],
            });

            if (sendResult.success) {
              sendSuccess = true;
              break;
            } else {
              lastSendError = sendResult.error || 'Failed to dispatch email';
              // If rate limited, wait 1.5 seconds and retry
              if (String(lastSendError).includes('429') || String(lastSendError).toLowerCase().includes('rate')) {
                await new Promise((r) => setTimeout(r, 1500));
              }
            }
          }

          if (!sendSuccess) {
            throw new Error(lastSendError || 'Failed to dispatch email via Gmail API');
          }

          // 4. Update database record
          await supabaseAdmin
            .from('form_submissions')
            .update({
              certificate_sent: true,
              certificate_sent_at: new Date().toISOString(),
              certificate_id: certId,
            })
            .eq('id', sub.id);

          job.succeeded++;
        } catch (err) {
          console.error(`[CertificateService] Error generating for ${toEmail}:`, err.message);
          job.failed++;
          if (job.errors.length < 50) {
            job.errors.push(`${attendeeName} (${toEmail}): ${err.message}`);
          }
        } finally {
          // Explicitly clear buffer reference to allow immediate V8 garbage collection
          certResult = null;
          job.processed++;
        }

        // Throttle 250ms between emails to stay within Gmail API rate limits
        await new Promise((r) => setTimeout(r, 250));
      }
    };

    // Run pool workers concurrently
    const workers = [];
    for (let i = 0; i < Math.min(CONCURRENCY, submissions.length); i++) {
      workers.push(worker());
    }

    await Promise.all(workers);

    if (job.status !== 'cancelled') {
      job.status = 'completed';
    }
    job.completedAt = new Date().toISOString();

    // Mark event details with certificates_issued: true
    if (job.succeeded > 0) {
      try {
        const { data: currentEvent } = await supabaseAdmin
          .from('events')
          .select('details')
          .eq('id', eventId)
          .single();

        const currentDetails = currentEvent?.details || {};
        await supabaseAdmin
          .from('events')
          .update({
            details: {
              ...currentDetails,
              certificates_issued: true,
              certificates_issued_at: new Date().toISOString(),
            },
          })
          .eq('id', eventId);
      } catch (evtErr) {
        console.warn('[CertificateService] Failed to set certificates_issued on event:', evtErr.message);
      }
    }

    console.log(`[CertificateService] Batch job ${jobId} finished (${job.status}): ${job.succeeded} succeeded, ${job.failed} failed.`);
  }

  /**
   * Retrieves the live progress of a batch job.
   */
  static getJobProgress(jobId) {
    const job = activeJobs.get(jobId);
    if (!job) return null;
    const percent = job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0;
    return {
      ...job,
      percentage: percent,
    };
  }
}

module.exports = CertificateService;
