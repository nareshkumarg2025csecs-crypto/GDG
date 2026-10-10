/**
 * Template 1: Unified Official Registration Pass Template (Default Mode & Advanced HTML Draft)
 * Exactly mirrors the official GDG confirmation pass email structure.
 * Pre-populated with standard variables and styling.
 * Supports both QR and No-QR modes.
 * Contains no organizer footer details.
 */
export const DEFAULT_EMAIL_HTML_DRAFT = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.07); border: 1px solid #e2e8f0;">
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
      Welcome to {{event_title}}!
    </h2>

    <p style="margin: 0 0 16px 0;">
      Hi <strong>{{name}}</strong>,
    </p>

    <p style="margin: 0 0 16px 0;">
      Your registration for <strong>{{event_title}}</strong> has been officially confirmed. We are thrilled to have you join our developer session!
    </p>

    <!-- Key Event Details Card -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 22px; margin: 24px 0;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #475569; margin-bottom: 10px;">
        Key Event Details
      </div>
      <div style="font-size: 14px; margin-bottom: 8px;">
        📅 <strong>Date:</strong> {{date}}
      </div>
      <div style="font-size: 14px; margin-bottom: 8px;">
        ⏰ <strong>Time:</strong> {{time}}
      </div>
      <div style="font-size: 14px; margin-bottom: 8px;">
        📍 <strong>Venue:</strong> {{venue}}
      </div>
      <div style="font-size: 14px; color: #0284c7;">
        🎟️ <strong>Ticket ID:</strong> <code>{{ticket_id}}</code>
      </div>
    </div>

    <!-- Digital Pass QR Card -->
    <div style="background: linear-gradient(145deg, #0f172a, #1e293b); border-radius: 16px; padding: 24px 20px; text-align: center; color: #ffffff; margin: 24px 0; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);">
      <div style="display: inline-block; font-size: 10px; font-family: monospace; letter-spacing: 2px; color: #94a3b8; text-transform: uppercase; background-color: rgba(255,255,255,0.08); padding: 4px 12px; border-radius: 50px; margin-bottom: 10px;">
        Official Digital Event Pass
      </div>
      <div style="font-size: 22px; font-weight: 800; letter-spacing: 2.5px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; color: #38bdf8; margin-bottom: 14px;">
        {{ticket_id}}
      </div>
      <div style="background-color: #ffffff; padding: 14px; border-radius: 14px; display: inline-block; margin-bottom: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.25);">
        <img src="cid:ticket-qr-code" alt="Pass QR - {{ticket_id}}" width="190" height="190" style="display: block; width: 190px; height: 190px; border: 0; outline: none; border-radius: 10px; margin: 0 auto;" />
      </div>
      <div style="font-size: 12px; color: #cbd5e1; line-height: 1.4; max-width: 380px; margin: 0 auto;">
        📱 <strong>Entrance Check-in:</strong> Present this QR pass on your phone at the registration desk for verification.
      </div>
    </div>
    <!-- /Digital Pass QR Card -->

    <!-- Important Notice / Links Section -->
    <p style="margin: 0 0 16px 0;">
      Please keep your digital pass and QR code handy when arriving at the venue. Check-in desks open 15 minutes prior to the start time.
    </p>

    <!-- Call to Action Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ticket_link}}" style="display: inline-block; background-color: #4285F4; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 50px; text-decoration: none; box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);">
        View Digital Pass Online &rarr;
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
    <p style="margin: 0 0 4px 0; font-weight: 600; color: #64748b;">Google Developer Groups On Campus</p>
    <p style="margin: 0;">Automated confirmation email &bull; No reply needed</p>
  </div>
</div>`;

/**
 * Template 1 variant when QR pass is excluded.
 */
export const DEFAULT_EMAIL_NO_QR_HTML_DRAFT = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.07); border: 1px solid #e2e8f0;">
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
      Welcome to {{event_title}}!
    </h2>

    <p style="margin: 0 0 16px 0;">
      Hi <strong>{{name}}</strong>,
    </p>

    <p style="margin: 0 0 16px 0;">
      Your registration for <strong>{{event_title}}</strong> has been officially confirmed. We are thrilled to have you join our developer session!
    </p>

    <!-- Key Event Details Card -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 22px; margin: 24px 0;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #475569; margin-bottom: 10px;">
        Key Event Details
      </div>
      <div style="font-size: 14px; margin-bottom: 8px;">
        📅 <strong>Date:</strong> {{date}}
      </div>
      <div style="font-size: 14px; margin-bottom: 8px;">
        ⏰ <strong>Time:</strong> {{time}}
      </div>
      <div style="font-size: 14px; margin-bottom: 8px;">
        📍 <strong>Venue:</strong> {{venue}}
      </div>
      <div style="font-size: 14px; color: #0284c7;">
        🎟️ <strong>Ticket ID:</strong> <code>{{ticket_id}}</code>
      </div>
    </div>

    <!-- Digital Event Confirmation Pass Card (Without QR) -->
    <div style="background: linear-gradient(145deg, #0f172a, #1e293b); border-radius: 16px; padding: 26px 20px; text-align: center; color: #ffffff; margin: 24px 0; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);">
      <div style="display: inline-block; font-size: 10px; font-family: monospace; letter-spacing: 2px; color: #94a3b8; text-transform: uppercase; background-color: rgba(255,255,255,0.08); padding: 4px 12px; border-radius: 50px; margin-bottom: 10px;">
        Official Event Pass
      </div>
      <div style="font-size: 24px; font-weight: 800; letter-spacing: 2.5px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; color: #38bdf8; margin-bottom: 12px;">
        {{ticket_id}}
      </div>
      <div style="display: inline-block; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 50px; padding: 5px 16px; font-size: 11px; color: #38bdf8; font-weight: 600; margin-bottom: 12px;">
        ✓ Seat Confirmed &amp; Reserved
      </div>
      <div style="font-size: 12px; color: #cbd5e1; line-height: 1.5; max-width: 420px; margin: 0 auto;">
        Present this Ticket ID or your registered email at the desk for verification. No QR scan required.
      </div>
    </div>
    <!-- /Digital Event Confirmation Pass Card -->

    <!-- Important Notice / Links Section -->
    <p style="margin: 0 0 16px 0;">
      Please save your Ticket ID and confirmation details for verification upon arrival. Check-in desks open 15 minutes prior to the start time.
    </p>

    <!-- Call to Action Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ticket_link}}" style="display: inline-block; background-color: #4285F4; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 50px; text-decoration: none; box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);">
        View Event Pass Online &rarr;
      </a>
    </div>
  </div>

  <!-- Footer -->
  <div style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
    <p style="margin: 0 0 4px 0; font-weight: 600; color: #64748b;">Google Developer Groups On Campus</p>
    <p style="margin: 0;">Automated confirmation email &bull; No reply needed</p>
  </div>
</div>`;

export const DEFAULT_QR_PAYLOAD_PRESET = `GDG EVENT TICKET
==============================
Event: {{event_title}}
Ticket ID: {{ticket_id}}
Name: {{name}}
Email: {{email}}
Date: {{date}}
Venue: {{venue}}
Pass: {{ticket_link}}
==============================
Google Developer Groups On Campus`;

export const QR_PAYLOAD_PRESETS = [
  {
    name: 'Full Ticket Details (Default)',
    content: DEFAULT_QR_PAYLOAD_PRESET,
    description: 'Encodes complete structured attendee, event, and check-in pass information.',
  },
  {
    name: 'Check-in URL Only',
    content: '{{ticket_link}}',
    description: 'Scanning immediately opens the attendee digital ticket check-in page in a browser.',
  },
  {
    name: 'Compact Ticket Code',
    content: 'GDG-PASS|{{ticket_id}}|{{email}}',
    description: 'Ultra-fast scanner parsing format for dedicated event desk scanner apps.',
  },
];

