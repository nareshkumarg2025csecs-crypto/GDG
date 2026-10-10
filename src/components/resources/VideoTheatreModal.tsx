import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, User, Calendar, Clock, Bookmark } from 'lucide-react';
import { VideoItem } from '@/data/knowledgeHubData';
import { getYouTubeEmbedUrl } from './VideoResourceCard';

interface VideoTheatreModalProps {
  video: VideoItem | null;
  isOpen: boolean;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}

export const VideoTheatreModal: React.FC<VideoTheatreModalProps> = ({
  video,
  isOpen,
  onClose,
  isBookmarked,
  onToggleBookmark,
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !video) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/85 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-theatre-title"
      >
        {/* Backdrop click */}
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={onClose}
          aria-hidden="true"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl bg-card border border-border/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Top modal header bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/70 bg-muted/40">
            <div className="flex items-center gap-2 min-w-0 pr-4">
              <span className="w-2 h-2 rounded-full bg-google-red" />
              <span className="text-xs font-semibold uppercase tracking-wider text-google-red truncate">
                {video.event}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-background hover:bg-muted border border-border text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Close (Esc)"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Video Player */}
          <div className="relative aspect-video w-full bg-black">
            <iframe
              src={getYouTubeEmbedUrl(video)}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>

          {/* Video Metadata & Description */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2
                  id="video-theatre-title"
                  className="text-lg sm:text-xl font-bold text-foreground leading-snug"
                >
                  {video.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <User className="w-3.5 h-3.5 text-google-red" />
                    {video.speaker}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {video.duration}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {video.event}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleBookmark(video.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${isBookmarked
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-primary' : ''}`} />
                  <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                </button>

                <a
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-google-red hover:bg-google-red/90 text-white text-xs font-semibold shadow-xs transition-all"
                >
                  <span>Open in YouTube</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {video.description}
            </p>

            {video.tags && video.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
                {video.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VideoTheatreModal;
