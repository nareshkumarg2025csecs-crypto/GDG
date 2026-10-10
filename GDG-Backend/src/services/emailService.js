const QRCode = require('qrcode');
const { generateBrandedQrBuffer } = require('./brandedQrService');
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
 * Formats organizer plain text / custom message into responsive HTML paragraphs
 * and converts Google Meet / URL links into action buttons.
 */
function formatOrganizerMessageToHtml(rawMsg, fallbackEventTitle = 'GDG Event') {
  if (!rawMsg || !rawMsg.trim()) {
    return `<p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">We look forward to welcoming you to <strong>${escapeHtml(fallbackEventTitle)}</strong>! Please find your event pass and schedule details below.</p>`;
  }

  // 1. Auto-link URLs
  let autoLinked = rawMsg.trim().replace(
    /(^|[^">])(https?:\/\/[^\s<"']+)/g,
    '$1<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #4285F4; font-weight: 700; text-decoration: underline; word-break: break-all;">$2</a>'
  );

  // 2. Add action button for Google Meet
  if (/https:\/\/meet\.google\.com\/[a-z0-9-]+/i.test(autoLinked) && !/Join Google Meet/i.test(autoLinked)) {
    const meetMatch = autoLinked.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/i);
    if (meetMatch) {
      const meetUrl = meetMatch[0];
      const buttonHtml = `\n\n<div style="margin: 14px 0 18px 0;"><a href="${meetUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #4285F4; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);">Join Google Meet Session &rarr;</a></div>\n\n`;
      autoLinked = autoLinked.replace(
        new RegExp(`(<a[^>]*>${meetUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/a>)`),
        `$1${buttonHtml}`
      );
    }
  }

  const normalized = autoLinked.replace(/\r\n/g, '\n');
  const blocks = normalized.split(/\n{2,}/);

  return blocks
    .map((block) => {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) return '';
      if (/^<(?:div|table|ul|ol|h[1-6]|blockquote)[\s>]/i.test(trimmedBlock)) {
        return trimmedBlock.replace(/\n/g, '<br/>');
      }
      if (/^<p[\s>]/i.test(trimmedBlock)) {
        return trimmedBlock.replace(/\n/g, '<br/>');
      }
      const withBr = trimmedBlock.replace(/\n/g, '<br/>');
      return `<p style="margin: 0 0 14px 0; line-height: 1.6; color: #334155; font-size: 14px;">${withBr}</p>`;
    })
    .filter(Boolean)
    .join('');
}

/**
 * Template 1: Unified Official Registration Pass Template
 * Used by Default QR Pass mode and Advanced HTML Draft.
 * Supports both QR and No-QR modes.
 * Contains no organizer footer details.
 */
function buildOfficialPassEmailHtml({
  attendeeName,
  eventTitle,
  ticketId,
  eventDateFormatted,
  eventTimeFormatted,
  eventVenue,
  digitalPassLink,
  includeQr = true,
}) {
  const safeAttendeeName = escapeHtml(attendeeName || 'Attendee');
  const safeEventTitle = escapeHtml(eventTitle || 'GDG Event');
  const safeTicketId = escapeHtml(ticketId || 'CONFIRMED');
  const safeDate = escapeHtml(eventDateFormatted || 'TBA');
  const safeTime = escapeHtml(eventTimeFormatted || 'TBA');
  const safeVenue = escapeHtml(eventVenue || 'Campus Venue / TBA');
  const safePassLink = escapeHtml(digitalPassLink || '#');

  const passCardHtml = includeQr
    ? `
    <!-- Digital Pass QR Card -->
    <div style="background: linear-gradient(145deg, #0f172a, #1e293b); border-radius: 16px; padding: 24px 20px; text-align: center; color: #ffffff; margin: 24px 0; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);">
      <div style="display: inline-block; font-size: 10px; font-family: monospace; letter-spacing: 2px; color: #94a3b8; text-transform: uppercase; background-color: rgba(255,255,255,0.08); padding: 4px 12px; border-radius: 50px; margin-bottom: 10px;">
        Official Digital Event Pass
      </div>
      <div style="font-size: 22px; font-weight: 800; letter-spacing: 2.5px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; color: #38bdf8; margin-bottom: 14px;">
        ${safeTicketId}
      </div>
      <div style="background-color: #ffffff; padding: 14px; border-radius: 14px; display: inline-block; margin-bottom: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.25);">
        <img src="cid:ticket-qr-code" alt="Pass QR - ${safeTicketId}" width="190" height="190" style="display: block; width: 190px; height: 190px; border: 0; outline: none; border-radius: 10px; margin: 0 auto;" />
      </div>
      <div style="font-size: 12px; color: #cbd5e1; line-height: 1.4; max-width: 380px; margin: 0 auto;">
        📱 <strong>Entrance Check-in:</strong> Present this QR pass on your phone at the registration desk for verification.
      </div>
    </div>
    <!-- /Digital Pass QR Card -->`
    : `
    <!-- Digital Event Confirmation Pass Card (Without QR) -->
    <div style="background: linear-gradient(145deg, #0f172a, #1e293b); border-radius: 16px; padding: 26px 20px; text-align: center; color: #ffffff; margin: 24px 0; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);">
      <div style="display: inline-block; font-size: 10px; font-family: monospace; letter-spacing: 2px; color: #94a3b8; text-transform: uppercase; background-color: rgba(255,255,255,0.08); padding: 4px 12px; border-radius: 50px; margin-bottom: 10px;">
        Official Event Pass
      </div>
      <div style="font-size: 24px; font-weight: 800; letter-spacing: 2.5px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; color: #38bdf8; margin-bottom: 12px;">
        ${safeTicketId}
      </div>
      <div style="display: inline-block; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 50px; padding: 5px 16px; font-size: 11px; color: #38bdf8; font-weight: 600; margin-bottom: 12px;">
        ✓ Seat Confirmed &amp; Reserved
      </div>
      <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5; max-width: 420px; margin: 0 auto;">
        Present this Ticket ID or your registered email at the desk for verification. No QR scan required.
      </div>
    </div>
    <!-- /Digital Event Confirmation Pass Card -->`;

  const attendanceNote = includeQr
    ? 'Please keep your digital pass and QR code handy when arriving at the venue. Check-in desks open 15 minutes prior to the start time.'
    : 'Please save your Ticket ID and confirmation details for verification upon arrival. Check-in desks open 15 minutes prior to the start time.';

  const ctaText = includeQr
    ? 'View Digital Pass Online &rarr;'
    : 'View Event Pass Online &rarr;';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Event Registration Confirmed - ${safeEventTitle}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.07); border: 1px solid #e2e8f0;">
    <!-- Google 4-Color Accent Header -->
    <div style="background: linear-gradient(90deg, #4285F4 25%, #EA4335 25% 50%, #FBBC04 50% 75%, #34A853 75%); height: 6px;"></div>

    <!-- Header Branding -->
    <div style="padding: 28px 32px 18px 32px; text-align: center; border-bottom: 1px solid #f1f5f9;">
      <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
        <span style="color: #4285F4;">G</span><span style="color: #EA4335;">D</span><span style="color: #FBBC04;">G</span> On Campus
      </div>
      <div style="font-size: 11px; font-weight: 700; color: #4285F4; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px;">
        Registration Confirmed
      </div>
    </div>

    <!-- Main Content Body -->
    <div style="padding: 32px; color: #334155; font-size: 15px; line-height: 1.6;">
      <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">
        Welcome to ${safeEventTitle}!
      </h2>

      <p style="margin: 0 0 16px 0;">
        Hi <strong>${safeAttendeeName}</strong>,
      </p>

      <p style="margin: 0 0 16px 0;">
        Your registration for <strong>${safeEventTitle}</strong> has been officially confirmed. We are thrilled to have you join our developer session!
      </p>

      <!-- Key Event Details Card -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 22px; margin: 24px 0;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #475569; margin-bottom: 10px;">
          Key Event Details
        </div>
        <div style="font-size: 14px; margin-bottom: 8px;">
          📅 <strong>Date:</strong> ${safeDate}
        </div>
        <div style="font-size: 14px; margin-bottom: 8px;">
          ⏰ <strong>Time:</strong> ${safeTime}
        </div>
        <div style="font-size: 14px; margin-bottom: 8px;">
          📍 <strong>Venue:</strong> ${safeVenue}
        </div>
        <div style="font-size: 14px; color: #0284c7;">
          🎟️ <strong>Ticket ID:</strong> <code>${safeTicketId}</code>
        </div>
      </div>

      ${passCardHtml}

      <!-- Important Notice / Links Section -->
      <p style="margin: 0 0 16px 0;">
        ${attendanceNote}
      </p>

      <!-- Call to Action Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${safePassLink}" style="display: inline-block; background-color: #4285F4; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 50px; text-decoration: none; box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);">
          ${ctaText}
        </a>
      </div>
    </div>

    <!-- Footer (No organizer details) -->
    <div style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
      <p style="margin: 0 0 4px 0; font-weight: 600; color: #64748b;">Google Developer Groups On Campus</p>
      <p style="margin: 0;">Automated confirmation email &bull; No reply needed</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Template 2: Simple Custom Message Template (with Presets)
 * Used when organizers write a simple custom note or pick a preset.
 * Highlights the organizer note, displays pass card (QR or No-QR), and event details.
 * Contains no organizer footer details.
 */
function buildSimpleCustomEmailHtml({
  attendeeName,
  eventTitle,
  ticketId,
  eventDateFormatted,
  eventTimeFormatted,
  eventVenue,
  digitalPassLink,
  customMessage = '',
  includeQr = true,
}) {
  const safeAttendeeName = escapeHtml(attendeeName || 'Attendee');
  const safeEventTitle = escapeHtml(eventTitle || 'GDG Event');
  const safeTicketId = escapeHtml(ticketId || 'CONFIRMED');
  const safeDate = escapeHtml(eventDateFormatted || 'TBA');
  const safeTime = escapeHtml(eventTimeFormatted || 'TBA');
  const safeVenue = escapeHtml(eventVenue || 'Campus Venue / TBA');
  const safePassLink = escapeHtml(digitalPassLink || '#');

  const formattedMsg = formatOrganizerMessageToHtml(customMessage, safeEventTitle);

  // Check if online session (e.g. Google Meet preset, Zoom, or virtual venue)
  const isOnlineSession =
    /meet\.google\.com|zoom\.us|online workshop|gmeet/i.test(customMessage || '') ||
    /google meet|online|virtual|zoom/i.test(eventVenue || '');

  const passCardHtml = (includeQr && !isOnlineSession)
    ? `
    <!-- Digital Pass QR Card -->
    <div style="background: linear-gradient(145deg, #0f172a, #1e293b); border-radius: 16px; padding: 24px 20px; text-align: center; color: #ffffff; margin: 24px 0; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);">
      <div style="display: inline-block; font-size: 10px; font-family: monospace; letter-spacing: 2px; color: #94a3b8; text-transform: uppercase; background-color: rgba(255,255,255,0.08); padding: 4px 12px; border-radius: 50px; margin-bottom: 10px;">
        Official Digital Event Pass
      </div>
      <div style="font-size: 22px; font-weight: 800; letter-spacing: 2.5px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; color: #38bdf8; margin-bottom: 14px;">
        ${safeTicketId}
      </div>
      <div style="background-color: #ffffff; padding: 14px; border-radius: 14px; display: inline-block; margin-bottom: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.25);">
        <img src="cid:ticket-qr-code" alt="Pass QR - ${safeTicketId}" width="190" height="190" style="display: block; width: 190px; height: 190px; border: 0; outline: none; border-radius: 10px; margin: 0 auto;" />
      </div>
      <div style="font-size: 12px; color: #cbd5e1; line-height: 1.4; max-width: 380px; margin: 0 auto;">
        📱 <strong>Entrance Check-in:</strong> Present this QR pass on your phone at the registration desk for verification.
      </div>
    </div>
    <!-- /Digital Pass QR Card -->`
    : (!isOnlineSession ? `
    <!-- Digital Event Confirmation Pass Card (Without QR) -->
    <div style="background: linear-gradient(145deg, #0f172a, #1e293b); border-radius: 16px; padding: 26px 20px; text-align: center; color: #ffffff; margin: 24px 0; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);">
      <div style="display: inline-block; font-size: 10px; font-family: monospace; letter-spacing: 2px; color: #94a3b8; text-transform: uppercase; background-color: rgba(255,255,255,0.08); padding: 4px 12px; border-radius: 50px; margin-bottom: 10px;">
        Official Event Pass
      </div>
      <div style="font-size: 24px; font-weight: 800; letter-spacing: 2.5px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; color: #38bdf8; margin-bottom: 12px;">
        ${safeTicketId}
      </div>
      <div style="display: inline-block; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 50px; padding: 5px 16px; font-size: 11px; color: #38bdf8; font-weight: 600; margin-bottom: 12px;">
        ✓ Seat Confirmed &amp; Reserved
      </div>
      <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5; max-width: 420px; margin: 0 auto;">
        Present this Ticket ID or your registered email at the desk for verification. No QR scan required.
      </div>
    </div>
    <!-- /Digital Event Confirmation Pass Card -->` : '');

  const keyEventDetailsHtml = isOnlineSession ? '' : `
      <!-- Key Event Details Card -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 22px; margin: 20px 0;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #475569; margin-bottom: 10px;">
          Key Event Details
        </div>
        <div style="font-size: 13px; margin-bottom: 6px;">📅 <strong>Date:</strong> ${safeDate}</div>
        <div style="font-size: 13px; margin-bottom: 6px;">⏰ <strong>Time:</strong> ${safeTime}</div>
        <div style="font-size: 13px; margin-bottom: 6px;">📍 <strong>Venue:</strong> ${safeVenue}</div>
        <div style="font-size: 13px; color: #0284c7;">🎟️ <strong>Ticket ID:</strong> <code>${safeTicketId}</code></div>
      </div>`;

  const ctaButtonHtml = isOnlineSession ? '' : `
      <!-- Call to Action Button -->
      <div style="text-align: center; margin: 26px 0 10px 0;">
        <a href="${safePassLink}" style="display: inline-block; background-color: #4285F4; color: #ffffff; font-weight: 700; font-size: 13px; padding: 12px 28px; border-radius: 50px; text-decoration: none; box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);">
          ${includeQr ? 'View Digital Pass Online &rarr;' : 'View Event Pass Online &rarr;'}
        </a>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Event Registration Confirmed - ${safeEventTitle}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.07); border: 1px solid #e2e8f0;">
    <!-- Google 4-Color Accent Header -->
    <div style="background: linear-gradient(90deg, #4285F4 25%, #EA4335 25% 50%, #FBBC04 50% 75%, #34A853 75%); height: 6px;"></div>

    <!-- Header Branding -->
    <div style="padding: 28px 32px 18px 32px; text-align: center; border-bottom: 1px solid #f1f5f9;">
      <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
        <span style="color: #4285F4;">G</span><span style="color: #EA4335;">D</span><span style="color: #FBBC04;">G</span> On Campus
      </div>
      <div style="font-size: 11px; font-weight: 700; color: #4285F4; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 2px;">
        Registration Confirmed
      </div>
    </div>

    <!-- Main Content Body -->
    <div style="padding: 28px 32px; color: #334155; font-size: 15px; line-height: 1.6;">
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">
        Welcome to ${safeEventTitle}!
      </h2>

      <p style="margin: 0 0 16px 0; font-size: 14px; color: #64748b;">
        Hi <strong>${safeAttendeeName}</strong>, ${isOnlineSession ? 'your registration has been confirmed!' : 'your seat has been reserved!'}
      </p>

      <!-- Organizer Custom Message Callout -->
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 18px 20px; margin: 18px 0;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #166534; margin-bottom: 10px;">
          📢 Organizer Message
        </div>
        ${formattedMsg}
      </div>

      ${passCardHtml}
      ${keyEventDetailsHtml}
      ${ctaButtonHtml}
    </div>

    <!-- Footer (No organizer details) -->
    <div style="padding: 18px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8;">
      <p style="margin: 0 0 4px 0; font-weight: 600; color: #64748b;">Google Developer Groups On Campus</p>
      <p style="margin: 0;">Automated confirmation email &bull; No reply needed</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Builds a clean, responsive HTML wrapper for Advanced HTML custom email drafts.
 * Uses the exact same card structure as Template 1.
 * Supports swapping pass card based on includeQr and strips any organizer footer details.
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
  const safeTicketId = escapeHtml(ticketId || 'CONFIRMED');

  const passCardSection = includeQr ? `
    <!-- Digital Pass QR Card -->
    <div style="background: linear-gradient(145deg, #0f172a, #1e293b); border-radius: 16px; padding: 24px 20px; text-align: center; color: #ffffff; margin: 24px 0; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);">
      <div style="display: inline-block; font-size: 10px; font-family: monospace; letter-spacing: 2px; color: #94a3b8; text-transform: uppercase; background-color: rgba(255,255,255,0.08); padding: 4px 12px; border-radius: 50px; margin-bottom: 10px;">
        Official Digital Event Pass
      </div>
      <div style="font-size: 22px; font-weight: 800; letter-spacing: 2.5px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; color: #38bdf8; margin-bottom: 14px;">
        ${safeTicketId}
      </div>
      <div style="background-color: #ffffff; padding: 14px; border-radius: 14px; display: inline-block; margin-bottom: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.25);">
        <img src="cid:ticket-qr-code" alt="Pass QR - ${safeTicketId}" width="190" height="190" style="display: block; width: 190px; height: 190px; border: 0; outline: none; border-radius: 10px; margin: 0 auto;" />
      </div>
      <div style="font-size: 12px; color: #cbd5e1; line-height: 1.4; max-width: 380px; margin: 0 auto;">
        📱 <strong>Entrance Check-in:</strong> Present this QR pass on your phone at the registration desk for verification.
      </div>
    </div>
    <!-- /Digital Pass QR Card -->
  ` : `
    <!-- Digital Event Confirmation Pass Card (Without QR) -->
    <div style="background: linear-gradient(145deg, #0f172a, #1e293b); border-radius: 16px; padding: 26px 20px; text-align: center; color: #ffffff; margin: 24px 0; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);">
      <div style="display: inline-block; font-size: 10px; font-family: monospace; letter-spacing: 2px; color: #94a3b8; text-transform: uppercase; background-color: rgba(255,255,255,0.08); padding: 4px 12px; border-radius: 50px; margin-bottom: 10px;">
        Official Event Pass
      </div>
      <div style="font-size: 24px; font-weight: 800; letter-spacing: 2.5px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; color: #38bdf8; margin-bottom: 12px;">
        ${safeTicketId}
      </div>
      <div style="display: inline-block; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 50px; padding: 5px 16px; font-size: 11px; color: #38bdf8; font-weight: 600; margin-bottom: 12px;">
        ✓ Seat Confirmed &amp; Reserved
      </div>
      <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5; max-width: 420px; margin: 0 auto;">
        Present this Ticket ID or your registered email at the desk for verification. No QR scan required.
      </div>
    </div>
    <!-- /Digital Event Confirmation Pass Card -->
  `;

  let trimmed = (customBody || '').trim();

  // If empty, return standard Template 1
  if (!trimmed) {
    return buildOfficialPassEmailHtml({
      attendeeName,
      eventTitle,
      ticketId,
      eventDateFormatted,
      eventTimeFormatted,
      eventVenue,
      digitalPassLink,
      includeQr,
    });
  }

  // Check if trimmed is already a full email document or complete styled card
  const isFullDoc = trimmed.toLowerCase().includes('<html') || trimmed.toLowerCase().startsWith('<!doctype');
  const isCardContainer =
    trimmed.includes('max-width: 600px') ||
    trimmed.includes('Registration Confirmed') ||
    trimmed.startsWith('<div style="font-family:');

  if (isFullDoc || isCardContainer) {
    // 1. If explicit {{qr_code}} placeholder is provided, replace it directly
    if (/\{\{\s*qr_code\s*\}\}/i.test(trimmed)) {
      trimmed = trimmed.replace(/\{\{\s*qr_code\s*\}\}/gi, passCardSection);
    } else if (!includeQr) {
      // 2. If QR is disabled, first check if the template already has the No-QR pass card
      if (
        trimmed.includes('<!-- Digital Event Confirmation Pass Card') ||
        trimmed.includes('Official Event Pass') ||
        trimmed.includes('Seat Confirmed & Reserved')
      ) {
        trimmed = trimmed.replace(/View Digital Pass Online/gi, 'View Event Pass Online');
      } else {
        const hadExistingQrCard =
          trimmed.includes('<!-- Digital Pass QR Card -->') ||
          trimmed.includes('Official Digital Event Pass') ||
          trimmed.includes('cid:ticket-qr-code') ||
          trimmed.includes('create-qr-code');

        if (hadExistingQrCard) {
          trimmed = trimmed
            .replace(/<!-- Digital Pass QR Card -->[\s\S]*?<!-- \/Digital Pass QR Card -->/gi, passCardSection)
            .replace(/<div[^>]*style="[^"]*linear-gradient\(145deg,\s*#0f172a,\s*#1e293b\)[\s\S]*?<\/div>\s*<\/div>/gi, passCardSection);
        } else {
          if (trimmed.includes('<!-- Important Notice')) {
            trimmed = trimmed.replace('<!-- Important Notice', `${passCardSection}\n\n    <!-- Important Notice`);
          } else if (trimmed.includes('<!-- Call to Action')) {
            trimmed = trimmed.replace('<!-- Call to Action', `${passCardSection}\n\n    <!-- Call to Action`);
          } else if (trimmed.includes('<!-- Footer')) {
            trimmed = trimmed.replace('<!-- Footer', `${passCardSection}\n\n  <!-- Footer`);
          } else if (trimmed.includes('</div>\n  </div>')) {
            trimmed = trimmed.replace('</div>\n  </div>', `${passCardSection}\n  </div>\n  </div>`);
          } else {
            trimmed = `${trimmed}\n${passCardSection}`;
          }
        }
        trimmed = trimmed.replace(/View Digital Pass Online/gi, 'View Event Pass Online');
      }
    } else {
      // 3. QR is enabled: check if the template already has a QR pass card
      const alreadyHasQrCard =
        trimmed.includes('<!-- Digital Pass QR Card -->') ||
        trimmed.includes('Official Digital Event Pass') ||
        trimmed.includes('cid:ticket-qr-code') ||
        trimmed.includes('create-qr-code');

      if (!alreadyHasQrCard) {
        if (trimmed.includes('<!-- Important Notice')) {
          trimmed = trimmed.replace('<!-- Important Notice', `${passCardSection}\n\n    <!-- Important Notice`);
        } else if (trimmed.includes('<!-- Call to Action')) {
          trimmed = trimmed.replace('<!-- Call to Action', `${passCardSection}\n\n    <!-- Call to Action`);
        } else if (trimmed.includes('<!-- Footer')) {
          trimmed = trimmed.replace('<!-- Footer', `${passCardSection}\n\n  <!-- Footer`);
        } else if (trimmed.includes('</div>\n  </div>')) {
          trimmed = trimmed.replace('</div>\n  </div>', `${passCardSection}\n  </div>\n  </div>`);
        } else if (trimmed.includes('</body>')) {
          trimmed = trimmed.replace('</body>', `${passCardSection}\n</body>`);
        } else {
          trimmed = `${trimmed}\n${passCardSection}`;
        }
      } else {
        trimmed = trimmed.replace(
          /https:\/\/api\.qrserver\.com\/v1\/create-qr-code\/[^\s"']+/gi,
          'cid:ticket-qr-code'
        );
      }
    }

    if (isFullDoc) return trimmed;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(eventTitle)}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  ${trimmed}
</body>
</html>`;
  }

  // Fallback for simple message snippet: route to Template 2
  return buildSimpleCustomEmailHtml({
    attendeeName,
    eventTitle,
    ticketId,
    eventDateFormatted,
    eventTimeFormatted,
    eventVenue,
    digitalPassLink,
    customMessage: trimmed,
    includeQr,
  });
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

      // Check whether QR ticket pass should be included in email
      const emailConfig = form?.schema?.email_config || {};
      const isOnlineSession =
        /meet\.google\.com|zoom\.us|online workshop|gmeet/i.test(emailConfig?.custom_message || '') ||
        /google meet|online|virtual|zoom/i.test(eventDetails?.location || eventDetails?.venue || '');
      const isQrIncluded = !isOnlineSession && Boolean(
        emailConfig.include_qr !== false &&
        eventDetails.include_qr !== false &&
        form?.schema?.include_qr !== false
      );

      let qrBuffer = null;

      if (isQrIncluded) {
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

        qrBuffer = await generateBrandedQrBuffer(fullQrText, {
          width: 440,
          margin: 2,
          dark: '#0f172a',
          light: '#ffffff',
        });
      }

      // Dynamically resolve authentic sender name & photo from Google OAuth
      const senderProfile = await GmailApiService.getSenderProfile().catch(() => ({
        name: 'GDG On Campus REC',
        photoUrl: '',
        email: senderEmail || 'gdg@rajalakshmi.edu.in',
      }));

      // Check for Custom Email Draft Configuration
      const isCustomMode = Boolean(
        emailConfig.mode === 'custom' &&
        (emailConfig.subject || emailConfig.custom_message || emailConfig.html || emailConfig.body)
      );

      let finalHtml = '';
      let finalSubject = `Registration Confirmed: ${eventTitle} (Ticket ${ticketId})`;
      let finalText = isQrIncluded
        ? `Your registration for ${eventTitle} is confirmed!\n\nTicket ID: ${ticketId}\nDate: ${eventDateFormatted}\nTime: ${eventTimeFormatted}\nVenue: ${eventVenue}\n\nAccess your digital pass and QR code online: ${digitalPassLink}\n\nGDG On Campus`
        : `Your registration for ${eventTitle} is confirmed!\n\nTicket ID: ${ticketId}\nDate: ${eventDateFormatted}\nTime: ${eventTimeFormatted}\nVenue: ${eventVenue}\n\nAccess your registration details online: ${digitalPassLink}\n\nGDG On Campus`;

      if (!isCustomMode) {
        // Template 1: Unified Official Registration Pass Template (Default QR Pass section)
        finalHtml = buildOfficialPassEmailHtml({
          attendeeName: safeAttendeeName,
          eventTitle,
          ticketId,
          eventDateFormatted,
          eventTimeFormatted,
          eventVenue,
          digitalPassLink,
          includeQr: isQrIncluded,
        });
      } else {
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
          sender_name: senderProfile.name,
          sender_photo: senderProfile.photoUrl,
          sender_email: senderProfile.email,
        };

        if (emailConfig.subject) {
          finalSubject = interpolateVariables(emailConfig.subject, customVars);
        }

        const isSimpleMode =
          emailConfig.edit_mode === 'simple' ||
          (!emailConfig.edit_mode && emailConfig.custom_message);

        if (isSimpleMode) {
          // Template 2: Dedicated Simple Custom Message Template (with Presets)
          const rawMessage = emailConfig.custom_message || emailConfig.body || '';
          const populatedMsg = interpolateVariables(rawMessage, customVars);

          finalHtml = buildSimpleCustomEmailHtml({
            attendeeName: safeAttendeeName,
            eventTitle,
            ticketId,
            eventDateFormatted,
            eventTimeFormatted,
            eventVenue,
            digitalPassLink,
            customMessage: populatedMsg,
            includeQr: isQrIncluded,
          });

          finalText = `${populatedMsg.replace(/<[^>]+>/g, '')}\n\nTicket ID: ${ticketId}\nDate: ${eventDateFormatted}\nVenue: ${eventVenue}\nPass: ${digitalPassLink}`;
        } else {
          // Template 1: Advanced HTML Draft Mode
          const rawBody = emailConfig.body || emailConfig.html || emailConfig.custom_message || '';
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
            includeQr: isQrIncluded,
          });

          finalText = `${populatedBody.replace(/<[^>]+>/g, '')}\n\nTicket ID: ${ticketId}\nDate: ${eventDateFormatted}\nVenue: ${eventVenue}\nPass: ${digitalPassLink}`;
        }
      }

      // 1. Primary Dispatch Method: Official Google Gmail REST API (Scope: https://www.googleapis.com/auth/gmail.send)
      // QR attachment is ONLY attached when include_qr is enabled, dramatically reducing email egress & attachments
      const gmailAttachments = (isQrIncluded && qrBuffer)
        ? [
            {
              filename: `gdg-pass-qr-${ticketId}.png`,
              content: qrBuffer,
              cid: 'ticket-qr-code',
              contentType: 'image/png',
              contentDisposition: 'inline',
            },
          ]
        : [];

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
  buildCustomHtmlEmail,
};

module.exports = EmailService;
