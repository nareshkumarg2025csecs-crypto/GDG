/**
 * Default HTML Email Draft Template
 * Exactly mirrors the official GDG confirmation pass email structure,
 * pre-populated with standard variables and styling for easy customization.
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

    <!-- Event Quick Details Card -->
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
      <div style="font-size: 10px; font-family: monospace; letter-spacing: 2px; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px;">
        Official Digital Event Pass
      </div>
      <div style="font-size: 20px; font-weight: 800; letter-spacing: 2px; font-family: monospace; color: #38bdf8; margin-bottom: 14px;">
        {{ticket_id}}
      </div>
      <div style="background-color: #ffffff; padding: 12px; border-radius: 14px; display: inline-block; margin-bottom: 12px;">
        <img
          src="cid:ticket-qr-code"
          alt="Ticket QR - {{ticket_id}}"
          width="150"
          height="150"
          style="display: block; border-radius: 8px; margin: 0 auto;"
        />
      </div>
      <div style="font-size: 12px; color: #cbd5e1; line-height: 1.4;">
        📱 Present this QR pass at the venue entrance desk for verification.
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
    <p style="margin: 0;">Have questions? Reply directly to this email or contact your club organizers.</p>
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
