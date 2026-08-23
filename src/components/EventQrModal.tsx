import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Download, QrCode, Link as LinkIcon, Check } from 'lucide-react';
import QRCode from 'qrcode';

interface EventQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  eventUrl: string;
}

export const EventQrModal: React.FC<EventQrModalProps> = ({
  isOpen,
  onClose,
  eventTitle,
  eventUrl,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !eventUrl) return;
    let cancelled = false;

    QRCode.toDataURL(eventUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('QR generation error:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, eventUrl]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      /* fallback: select text */
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
          role="dialog"
          aria-modal="true"
          aria-label={`Share ${eventTitle} via QR Code`}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm rounded-3xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-google-blue" aria-hidden="true" />
                <span className="text-sm font-bold">Share as QR Code</span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close QR code dialog"
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Body */}
            <div className="p-6 flex flex-col items-center gap-5">
              {/* QR Image */}
              <div className="p-4 rounded-2xl bg-white shadow-lg">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR code for ${eventTitle}`}
                    className="w-48 h-48 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-google-blue/30 border-t-google-blue rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Event Title below QR */}
              <p className="text-center text-sm font-semibold text-foreground line-clamp-2 px-2">
                {eventTitle}
              </p>

              {/* URL display */}
              <div className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border text-xs font-mono text-muted-foreground overflow-hidden">
                <LinkIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{eventUrl}</span>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold transition-all"
                  aria-label="Copy event link to clipboard"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-google-green" aria-hidden="true" />
                      <span className="text-google-green">Copied!</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!qrDataUrl}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-google-blue hover:bg-google-blue/90 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-sm"
                  aria-label="Download QR code as PNG image"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Download QR</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EventQrModal;
