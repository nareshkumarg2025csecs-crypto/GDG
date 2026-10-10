import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { GoogleTool } from '@/data/googleTools';
import ToolEmblem from './ToolEmblem';
import {
  ExternalLink,
  BookOpen,
  Copy,
  Check,
  Tag,
  Share2,
  Sparkles,
  Layers,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';
import { copyTextToClipboard } from '@/services/githubService';

interface ToolDetailModalProps {
  tool: GoogleTool | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTag?: (tag: string) => void;
  onSelectRelatedTool?: (tool: GoogleTool) => void;
  relatedTools?: GoogleTool[];
  isBookmarked?: boolean;
  onToggleBookmark?: (toolId: string) => void;
}

export const ToolDetailModal: React.FC<ToolDetailModalProps> = ({
  tool,
  isOpen,
  onClose,
  onSelectTag,
  onSelectRelatedTool,
  relatedTools = [],
  isBookmarked = false,
  onToggleBookmark,
}) => {
  const modalContentRef = React.useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);
  const [showShareOptions, setShowShareOptions] = React.useState(false);

  // Reset states when modal tool changes
  React.useEffect(() => {
    setCopied(false);
    setShowShareOptions(false);
  }, [tool?.id]);

  if (!tool) return null;

  const handleCopyLink = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Attach inside modal DOM to bypass Radix UI focus trap
    const success = copyTextToClipboard(tool.officialUrl, modalContentRef.current);
    if (success) {
      setCopied(true);
      toast.success(`Copied official URL for ${tool.name}`);
      setTimeout(() => setCopied(false), 2000);
    } else {
      // Fallback for strict mobile webviews
      try {
        window.prompt('Copy official URL:', tool.officialUrl);
      } catch {
        toast.error('Could not copy link');
      }
    }
  };

  const handleShare = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // 1. Try Native Web Share API if supported by the browser
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: tool.name,
          url: tool.officialUrl,
        });
        toast.success(`Shared ${tool.name}`);
        return;
      } catch (err: unknown) {
        const error = err as { name?: string };
        if (error?.name === 'AbortError') {
          // User intentionally closed the native share sheet
          return;
        }
        console.warn('Native share failed or restricted:', err);
      }
    }

    // 2. If Native Share is not supported on this device/network, toggle share options & copy
    copyTextToClipboard(tool.officialUrl, modalContentRef.current);
    setShowShareOptions((prev) => !prev);
    toast.info('Choose a platform to share or copy link');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        ref={modalContentRef}
        className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border border-border bg-card shadow-2xl rounded-2xl"
        aria-describedby="tool-detail-description"
      >
        {/* Top Accent Bar */}
        <div
          className="h-2 w-full transition-all"
          style={{ backgroundColor: tool.color }}
        />

        <div className="p-6 sm:p-8 space-y-6">
          <DialogHeader className="space-y-3 text-left">
            {/* Top metadata tags */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${tool.color}15`,
                    color: tool.color,
                    border: `1px solid ${tool.color}30`,
                  }}
                >
                  {tool.categoryLabel}
                </span>

                {tool.badge && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted text-foreground border border-border">
                    <Sparkles className="w-3 h-3 text-google-yellow" />
                    <span>{tool.badge}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-muted/70 text-muted-foreground border border-border/50">
                  <Award className="w-3 h-3 text-google-blue" />
                  <span>{tool.level}</span>
                </span>
              </div>
            </div>

            {/* Title with Emblem */}
            <div className="flex items-start gap-4 pt-1">
              <ToolEmblem category={tool.category} color={tool.color} name={tool.name} size="lg" />
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {tool.name}
                </DialogTitle>
                <p className="text-sm sm:text-base font-medium text-foreground/80 mt-1 leading-snug">
                  {tool.tagline}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Description Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              About This Tool
            </h4>
            <div
              id="tool-detail-description"
              className="text-sm sm:text-base text-foreground/90 leading-relaxed p-4 rounded-xl bg-muted/30 border border-border/60"
            >
              {tool.description}
            </div>
          </div>

          {/* Tags */}
          {tool.tags && tool.tags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Tag className="w-3.5 h-3.5" />
                <span>Associated Topics & Technologies</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tool.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      if (onSelectTag) {
                        onSelectTag(tag);
                        onClose();
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono bg-muted/60 hover:bg-google-blue/15 hover:text-google-blue text-muted-foreground border border-border/50 transition-colors"
                    title={`Filter by #${tag}`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a
              href={tool.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-bold text-white shadow-md hover:opacity-95 transition-all focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ backgroundColor: tool.color }}
            >
              <span>Launch Official Tool</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <a
              href={tool.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors focus-visible:ring-2"
            >
              <BookOpen className="w-4 h-4 text-google-blue" />
              <span>Read Documentation</span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </a>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={handleCopyLink}
                className={`p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-border transition-all active:scale-95 cursor-pointer ${
                  copied
                    ? 'bg-google-green/15 border-google-green text-google-green'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
                title="Copy Official Link"
                aria-label={`Copy official link for ${tool.name}`}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-google-green" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className={`p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-border transition-all active:scale-95 cursor-pointer ${
                  showShareOptions
                    ? 'bg-google-blue/15 border-google-blue text-google-blue'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
                title="Share Tool"
                aria-label={`Share ${tool.name}`}
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Social Share Options Drawer (when native share is unavailable or clicked) */}
          {showShareOptions && (
            <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Share &ldquo;{tool.name}&rdquo;</span>
                <span className="text-[11px] font-normal text-muted-foreground">Select destination</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Check out ${tool.name} on GDG Tools Hub: ${tool.officialUrl}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-google-green/10 text-google-green border border-google-green/20 hover:bg-google-green/20 font-medium transition-colors"
                >
                  WhatsApp
                </a>

                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(
                    tool.officialUrl
                  )}&text=${encodeURIComponent(tool.name + ' - ' + tool.tagline)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-google-blue/10 text-google-blue border border-google-blue/20 hover:bg-google-blue/20 font-medium transition-colors"
                >
                  Telegram
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `${tool.name}: ${tool.tagline}`
                  )}&url=${encodeURIComponent(tool.officialUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-muted text-foreground border border-border hover:bg-muted/80 font-medium transition-colors"
                >
                  X (Twitter)
                </a>

                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    tool.officialUrl
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-google-blue/10 text-google-blue border border-google-blue/20 hover:bg-google-blue/20 font-medium transition-colors"
                >
                  LinkedIn
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity ml-auto"
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          )}

          {/* Related Tools In Same Category */}
          {relatedTools.length > 0 && (
            <div className="pt-4 border-t border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Related {tool.categoryLabel} Tools</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {relatedTools.slice(0, 4).map((rel) => (
                  <button
                    key={rel.id}
                    onClick={() => {
                      if (onSelectRelatedTool) {
                        onSelectRelatedTool(rel);
                      }
                    }}
                    className="p-3 rounded-xl border border-border/70 hover:border-google-blue/50 bg-card hover:bg-muted/40 transition-all text-left flex items-start gap-3 group"
                  >
                    <ToolEmblem category={rel.category} color={rel.color} name={rel.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-foreground group-hover:text-google-blue transition-colors truncate">
                        {rel.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {rel.tagline}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ToolDetailModal;
