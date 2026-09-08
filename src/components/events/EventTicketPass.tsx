import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import {
  QrCode,
  Download,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  User,
  Mail,
  ShieldCheck,
  Tag,
  X,
} from 'lucide-react';
import {
  type ClubEvent,
  type FormField,
  formatEventDate,
  formatEventTimeRange,
} from '@/lib/formUtils';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from '@/hooks/use-toast';

interface EventTicketPassProps {
  event: ClubEvent;
  submissionId?: string;
  submittedAt?: string | null;
  answers?: Record<string, any>;
  fields?: FormField[];
  attendeeName?: string;
  attendeeEmail?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export const EventTicketPass: React.FC<EventTicketPassProps> = ({
  event,
  submissionId,
  submittedAt,
  answers = {},
  fields = [],
  attendeeName,
  attendeeEmail,
  onClose,
  isModal = false,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isDownloadingPass, setIsDownloadingPass] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const details = event.details || {};
  const eventDate = formatEventDate(details.startTime || details.start_time);
  const eventTime = formatEventTimeRange(
    details.startTime || details.start_time,
    details.endTime || details.end_time
  );
  const eventVenue = details.location || details.venue || 'GDG Community Venue';
  const registeredTime = submittedAt
    ? new Date(submittedAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

  // Resolve best attendee name and email from answers first
  let formEmail = answers.email || answers.attendee_email;
  if (!formEmail && fields && fields.length > 0) {
    const emailField = fields.find(
      (f) => f.type === 'email' || (f.name && f.name.toLowerCase().includes('email'))
    );
    if (emailField && answers[emailField.name]) {
      formEmail = String(answers[emailField.name]);
    }
  }

  let formName = answers.full_name || answers.name || answers.attendee_name;
  if (!formName && fields && fields.length > 0) {
    const nameField = fields.find(
      (f) => f.name && (f.name.toLowerCase().includes('name') || f.label?.toLowerCase().includes('name'))
    );
    if (nameField && answers[nameField.name]) {
      formName = String(answers[nameField.name]);
    }
  }

  const resolvedName =
    formName ||
    attendeeName ||
    'Attendee';

  const resolvedEmail =
    formEmail ||
    attendeeEmail ||
    'attendee@example.com';

  const ticketId =
    answers.ticket_id ||
    submissionId ||
    (answers._id ? String(answers._id) : `GDG-${event.id.substring(0, 8).toUpperCase()}`);

  // Build key-value list of other submitted answers
  const knownKeys = ['full_name', 'name', 'attendee_name', 'email', 'attendee_email', '_id', 'ticket_id', 'email_sent', 'email_sent_at'];
  const extraDetails: { label: string; value: string }[] = [];

  // Check form schema fields first for friendly labels
  if (fields && fields.length > 0) {
    fields.forEach((f) => {
      if (!knownKeys.includes(f.name) && answers[f.name] !== undefined && answers[f.name] !== '') {
        extraDetails.push({
          label: f.label || f.name,
          value: String(answers[f.name]),
        });
      }
    });
  } else {
    // Fallback: iterate directly over answers object
    Object.entries(answers).forEach(([key, val]) => {
      if (!knownKeys.includes(key) && val !== undefined && val !== null && val !== '') {
        const friendlyLabel = key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        extraDetails.push({
          label: friendlyLabel,
          value: String(val),
        });
      }
    });
  }

  // Format readable text for QR Code containing all details with explicit field names
  const qrTextContent = [
    'GDG EVENT TICKET',
    '==============================',
    `Event: ${event.title}`,
    `Ticket ID: ${ticketId}`,
    `Name: ${resolvedName}`,
    `Email: ${resolvedEmail}`,
    ...extraDetails.map((item) => `${item.label}: ${item.value}`),
    `Date: ${eventDate}`,
    `Time: ${eventTime}`,
    `Venue: ${eventVenue}`,
    `Registered At: ${registeredTime}`,
    'Status: Confirmed Registration',
    '==============================',
    'Google Developer Groups',
  ].join('\n');

  // Generate QR Code data URL
  useEffect(() => {
    QRCode.toDataURL(qrTextContent, {
      width: 512,
      margin: 2,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating ticket QR:', err));
  }, [qrTextContent]);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isModal || !onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModal, onClose]);

  // Lock background body scroll when modal is active
  useEffect(() => {
    if (!isModal) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isModal]);

  // Download Standalone QR Code Image
  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    const safeTitle = event.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    link.download = `gdg-qr-${safeTitle}.png`;
    link.href = qrDataUrl;
    link.click();
    toast({
      title: 'QR Code Downloaded',
      description: 'The ticket QR code image has been saved to your downloads.',
    });
  };

  // Download Complete Branded Event Pass as Image (Canvas rendering)
  const handleDownloadTicketPass = async () => {
    setIsDownloadingPass(true);
    try {
      const width = 640;
      const height = 960;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      // 1. Background
      ctx.fillStyle = '#0F172A'; // Deep sleek slate background
      ctx.fillRect(0, 0, width, height);

      // 2. Google stripe banner on top
      const stripeColors = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];
      const stripeWidth = width / stripeColors.length;
      stripeColors.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(i * stripeWidth, 0, stripeWidth, 8);
      });

      // 3. Card inner container
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.roundRect(24, 32, width - 48, height - 64, 24);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      // 4. Badges & Header
      ctx.fillStyle = '#4285F4';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('GDG OFFICIAL EVENT PASS', 48, 70);

      ctx.fillStyle = '#10B981';
      ctx.textAlign = 'right';
      ctx.fillText('CONFIRMED', width - 48, 70);
      ctx.textAlign = 'left';

      // Event Title (Wrap if needed)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Inter, sans-serif';
      const title = event.title;
      if (title.length > 32) {
        ctx.fillText(title.substring(0, 30) + '...', 48, 104);
      } else {
        ctx.fillText(title, 48, 104);
      }

      // Divider
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(48, 122);
      ctx.lineTo(width - 48, 122);
      ctx.stroke();

      // 5. QR Code Card (centered)
      const qrBoxSize = 220;
      const qrBoxX = (width - qrBoxSize) / 2;
      const qrBoxY = 142;

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 16);
      ctx.fill();

      // Load QR Image onto canvas
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = reject;
        qrImg.src = qrDataUrl;
      });
      ctx.drawImage(qrImg, qrBoxX + 10, qrBoxY + 10, qrBoxSize - 20, qrBoxSize - 20);

      // 6. Ticket ID pill below QR
      ctx.fillStyle = '#FEF08A';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`TICKET ID: ${ticketId}`, width / 2, qrBoxY + qrBoxSize + 32);

      // 7. Security verification hint
      ctx.fillStyle = '#94A3B8';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText('Scan for Official Entry Verification', width / 2, qrBoxY + qrBoxSize + 52);
      ctx.textAlign = 'left';

      // 8. Dashed separator line (Ticket stub look)
      const stubY = qrBoxY + qrBoxSize + 76;
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(32, stubY);
      ctx.lineTo(width - 32, stubY);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Side cut-out notches for ticket effect
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(24, stubY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(width - 24, stubY, 14, 0, Math.PI * 2);
      ctx.fill();

      // 9. Registration details section
      let currentY = stubY + 34;
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText('ATTENDEE DETAILS', 48, currentY);

      currentY += 24;

      const drawDetailRow = (label: string, fieldValue: string) => {
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(label.toUpperCase(), 48, currentY);

        ctx.font = '600 13px Inter, sans-serif';
        ctx.fillStyle = '#F8FAFC';
        const displayVal = fieldValue.length > 38 ? `${fieldValue.substring(0, 36)}...` : fieldValue;
        ctx.fillText(displayVal, 160, currentY);

        currentY += 24;
      };

      drawDetailRow('Name', resolvedName);
      drawDetailRow('Email', resolvedEmail);
      drawDetailRow('Ticket ID', ticketId);

      // Extra fields (up to 3 for height budget)
      extraDetails.slice(0, 3).forEach((item) => {
        drawDetailRow(item.label, item.value);
      });

      // 10. Event Schedule info
      currentY += 10;
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.roundRect(48, currentY, width - 96, 80, 14);
      ctx.fill();

      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillStyle = '#60A5FA';
      ctx.fillText(`DATE:  ${eventDate}`, 64, currentY + 26);
      ctx.fillStyle = '#FBBF24';
      ctx.fillText(`TIME:  ${eventTime}`, 64, currentY + 46);
      ctx.fillStyle = '#F87171';
      ctx.fillText(`VENUE: ${eventVenue.length > 38 ? eventVenue.substring(0, 36) + '...' : eventVenue}`, 64, currentY + 66);

      // 11. Card Footer
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'center';
      ctx.fillText(`Registered on ${registeredTime} • Verified GDG Pass`, width / 2, height - 48);

      // Trigger download
      const safeTitle = event.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const link = document.createElement('a');
      link.download = `gdg-ticket-pass-${safeTitle}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast({
        title: 'Ticket Pass Downloaded',
        description: 'Your branded event pass has been downloaded as an image.',
      });
    } catch (err: any) {
      toast({
        title: 'Download failed',
        description: err.message || 'Could not generate ticket image.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloadingPass(false);
    }
  };

  // Copy Ticket Details to Clipboard
  const handleCopyDetails = () => {
    navigator.clipboard.writeText(qrTextContent);
    setCopied(true);
    toast({
      title: 'Details Copied',
      description: 'Registration pass details copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const passContent = (
    <div className="relative rounded-2xl sm:rounded-3xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden transition-all w-full">
      {/* Top Google Colors Stripe */}
      <div className="h-1.5 sm:h-2 flex w-full shrink-0">
        <div className="flex-1 bg-google-blue" />
        <div className="flex-1 bg-google-red" />
        <div className="flex-1 bg-google-yellow" />
        <div className="flex-1 bg-google-green" />
      </div>

      {/* Prominent High-Contrast Close Button (Always visible on Modal) */}
      {isModal && onClose && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-background/90 hover:bg-muted text-muted-foreground hover:text-foreground border border-border shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          aria-label="Close ticket pass"
        >
          <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>
      )}

      <div className="p-3.5 sm:p-5 space-y-3 sm:space-y-3.5">
        {/* Header: Title & Status Badges */}
        <div className="pr-8 sm:pr-10">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-google-blue/10 text-google-blue border border-google-blue/20">
              <ShieldCheck className="w-3 h-3" />
              Official Pass
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-google-green/10 text-google-green border border-google-green/20">
              <CheckCircle2 className="w-3 h-3" />
              Confirmed
            </span>
          </div>
          <h2 className="text-base sm:text-xl font-bold font-sans tracking-tight text-foreground line-clamp-1">
            {event.title}
          </h2>
        </div>

        {/* Main Content:
            - Desktop: 2-column side-by-side pass (QR left, Details right)
            - Mobile: Sleek compact vertical stack
        */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center">
          {/* Left Column (Desktop: 5 cols) / Top (Mobile): QR & Ticket ID */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-muted/25 border border-border/80 text-center">
            <div className="p-2 rounded-xl bg-white shadow-md border border-border shrink-0 flex items-center justify-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Registration QR Code"
                  className="w-28 h-28 sm:w-36 sm:h-36 object-contain rounded"
                />
              ) : (
                <div className="w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
                  <div className="w-7 h-7 border-2 border-google-blue/30 border-t-google-blue rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="mt-2 flex flex-col items-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-google-yellow/15 text-google-yellow border border-google-yellow/30 text-[11px] font-mono font-bold">
                <span>Ticket ID:</span>
                <span className="text-foreground font-extrabold">{ticketId}</span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Scan for verification at venue
              </span>
            </div>
          </div>

          {/* Right Column (Desktop: 7 cols) / Bottom (Mobile): Attendee Details & Schedule */}
          <div className="sm:col-span-7 space-y-2 sm:space-y-2.5">
            {/* Attendee Details Grid */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <div className="p-2 sm:p-2.5 rounded-xl bg-background/80 border border-border/70 flex flex-col justify-center min-w-0">
                <span className="text-[9px] text-muted-foreground font-semibold uppercase">Attendee</span>
                <span className="font-bold text-foreground text-xs sm:text-sm truncate">{resolvedName}</span>
              </div>

              <div className="p-2 sm:p-2.5 rounded-xl bg-background/80 border border-border/70 flex flex-col justify-center min-w-0">
                <span className="text-[9px] text-muted-foreground font-semibold uppercase">Email</span>
                <span className="font-bold text-foreground text-xs sm:text-sm truncate" title={resolvedEmail}>{resolvedEmail}</span>
              </div>

              {extraDetails.slice(0, 2).map((item, idx) => (
                <div
                  key={idx}
                  className="p-2 sm:p-2.5 rounded-xl bg-background/80 border border-border/70 flex flex-col justify-center min-w-0"
                >
                  <span className="text-[9px] text-muted-foreground font-semibold uppercase truncate">
                    {item.label}
                  </span>
                  <span className="font-medium text-foreground text-xs truncate" title={item.value}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Event Schedule & Venue Information */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-muted/40 border border-border/70 space-y-1 text-[11px]">
              <div className="flex items-center gap-1.5 text-foreground font-semibold truncate">
                <Calendar className="w-3.5 h-3.5 text-google-blue shrink-0" />
                <span className="truncate">{eventDate}</span>
                <span className="text-muted-foreground">•</span>
                <Clock className="w-3.5 h-3.5 text-google-yellow shrink-0" />
                <span className="truncate">{eventTime}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                <MapPin className="w-3.5 h-3.5 text-google-red shrink-0" />
                <span className="truncate">{eventVenue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons & Copy Text */}
        <div className="pt-2 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 w-full sm:flex-1">
            {/* Button 1: Download Full Ticket Pass */}
            <button
              type="button"
              disabled={isDownloadingPass || !qrDataUrl}
              onClick={handleDownloadTicketPass}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs text-white shadow-sm hover:shadow transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #4285F4, #1A73E8)',
                boxShadow: '0 2px 8px rgba(66, 133, 244, 0.25)',
              }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloadingPass ? 'Generating...' : 'Download Pass (PNG)'}</span>
            </button>

            {/* Button 2: Download Standalone QR Code */}
            <button
              type="button"
              disabled={!qrDataUrl}
              onClick={handleDownloadQR}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-border bg-background hover:bg-muted font-semibold text-xs text-foreground transition-all shadow-sm disabled:opacity-50"
              title="Download QR code only"
            >
              <QrCode className="w-3.5 h-3.5 text-google-green" />
              <span className="hidden sm:inline">QR Only</span>
              <span className="sm:hidden">QR</span>
            </button>
          </div>

          {/* Copy Details */}
          <button
            type="button"
            onClick={handleCopyDetails}
            className="self-end sm:self-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted/50 shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-google-green" />
                <span className="text-google-green font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Text</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl sm:max-w-2xl max-h-[94vh] my-auto"
        >
          {passContent}
        </motion.div>
      </div>
    );
  }

  return passContent;
};

export default EventTicketPass;
