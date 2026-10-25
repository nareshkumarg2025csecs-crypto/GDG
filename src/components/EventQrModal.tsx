import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Download, QrCode, Link as LinkIcon, Check, Share2, Loader2 } from 'lucide-react';
import {
  generateBrandedQrDataUrl,
  generateEventShareCardDataUrl,
  dataUrlToFile,
  triggerImageDownload,
} from '@/lib/qrCodeUtil';

interface EventQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  eventUrl: string;
  shareText?: string;
  category?: string;
  date?: string;
  venue?: string;
  description?: string;
}

export const EventQrModal: React.FC<EventQrModalProps> = ({
  isOpen,
  onClose,
  eventTitle,
  eventUrl,
  shareText,
  category,
  date,
  venue,
  description,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [shareCardDataUrl, setShareCardDataUrl] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen || !eventUrl) return;
    let cancelled = false;

    // 1. Generate clean, high-resolution branded QR code for immediate modal display
    generateBrandedQrDataUrl(eventUrl, {
      width: 480,
      margin: 2,
      darkColor: '#0f172a',
      lightColor: '#ffffff',
    })
      .then(async (url) => {
        if (cancelled) return;
        setQrDataUrl(url);

        // 2. Pre-generate full VIP Pass Card in background for sharing and downloading
        try {
          const cardUrl = await generateEventShareCardDataUrl({
            qrDataUrl: url,
            title: eventTitle,
            category,
            date,
            venue,
            description,
            url: eventUrl,
          });
          if (!cancelled) {
            setShareCardDataUrl(cardUrl);
          }
        } catch (err) {
          console.warn('Could not generate event pass card in background:', err);
        }
      })
      .catch((err) => {
        console.error('QR generation error:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, eventUrl, eventTitle, category, date, venue, description]);

  // Generates card on demand if not yet cached
  const getPassCardImage = async (): Promise<string> => {
    if (shareCardDataUrl) return shareCardDataUrl;
    if (qrDataUrl) {
      try {
        const cardUrl = await generateEventShareCardDataUrl({
          qrDataUrl,
          title: eventTitle,
          category,
          date,
          venue,
          description,
          url: eventUrl,
        });
        setShareCardDataUrl(cardUrl);
        return cardUrl;
      } catch {
        return qrDataUrl;
      }
    }
    return '';
  };

  const safeFilename = `gdg_${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_pass.png`;

  const handleDownload = async () => {
    setIsProcessing(true);
    try {
      const targetImage = await getPassCardImage();
      if (!targetImage) return;
      triggerImageDownload(targetImage, safeFilename);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText || eventUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareText || eventUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleShareQr = async () => {
    setIsProcessing(true);
    try {
      // 1. Get the VIP Event Pass card graphic (contains all details, venue, date, clean URL)
      const targetImage = await getPassCardImage();
      if (!targetImage) return;

      // 2. Convert base64 data URL to native File object (100% reliable on iOS & Android)
      const file = dataUrlToFile(targetImage, safeFilename);

      // 3. Mobile Browser Web Share API check
      if (
        typeof navigator !== 'undefined' &&
        'canShare' in navigator &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        // Intentionally share ONLY the card file: no external text block is included
        // because all event details are directly embedded in the card image.
        await navigator.share({
          files: [file],
          title: `${eventTitle} - GDG Event Pass`,
        });
        return;
      }

      // 4. Fallback on desktop or browsers without file share support: download pass image
      triggerImageDownload(targetImage, safeFilename);
    } catch (err: any) {
      if (err?.name === 'AbortError') return; // User cancelled share sheet
      console.warn('Native mobile share unsupported or failed; downloading image:', err);
      // Fallback
      if (shareCardDataUrl || qrDataUrl) {
        triggerImageDownload(shareCardDataUrl || qrDataUrl, safeFilename);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
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
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Body */}
            <div className="p-6 flex flex-col items-center gap-4">
              {/* QR Image Box */}
              <div className="p-4 rounded-2xl bg-white shadow-lg border border-border/40">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR code for ${eventTitle}`}
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 sm:w-52 sm:h-52 flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 border-3 border-google-blue/30 border-t-google-blue rounded-full animate-spin" />
                    <span className="text-xs text-muted-foreground">Generating QR...</span>
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
              <div className="w-full grid grid-cols-3 gap-2 pt-1">
                {/* Copy Link Button */}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl border border-border bg-background hover:bg-muted text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                  aria-label="Copy event link to clipboard"
                  title="Copy link"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-google-green" aria-hidden="true" />
                      <span className="text-google-green text-[11px]">Copied</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>

                {/* Share QR Button */}
                <button
                  type="button"
                  onClick={handleShareQr}
                  disabled={!qrDataUrl || isProcessing}
                  className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl border border-google-blue/30 bg-google-blue/10 hover:bg-google-blue/20 text-google-blue hover:text-google-blue text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                  aria-label="Share event card"
                  title="Share event card with all details"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span className="text-[11px] font-bold">Share QR</span>
                </button>

                {/* Download Button */}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!qrDataUrl || isProcessing}
                  className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl bg-google-blue hover:bg-google-blue/90 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer active:scale-95"
                  aria-label="Download event pass as PNG image"
                  title="Download event pass"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="text-[11px] font-bold">Download</span>
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


