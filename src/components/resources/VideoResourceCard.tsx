import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  X,
  ExternalLink,
  Clock,
  User,
  Bookmark,
  Maximize2,
  Video as VideoIcon,
} from 'lucide-react';
import { VideoItem } from '@/data/knowledgeHubData';
import { ViewMode } from './types';

interface VideoResourceCardProps {
  video: VideoItem;
  viewMode?: ViewMode;
  isPlayingInline: boolean;
  onPlayInline: (id: string | null) => void;
  onOpenTheatre: (video: VideoItem) => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}

export const getYouTubeEmbedUrl = (video: VideoItem): string => {
  let id = video.youtubeId;
  if (!id && video.youtubeUrl) {
    try {
      const url = new URL(video.youtubeUrl);
      id = url.searchParams.get('v') || url.pathname.split('/').pop() || '';
    } catch {
      id = '';
    }
  }
  return id
    ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
    : video.youtubeUrl;
};

export const VideoResourceCard: React.FC<VideoResourceCardProps> = ({
  video,
  viewMode = 'grid',
  isPlayingInline,
  onPlayInline,
  onOpenTheatre,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [imgError, setImgError] = useState(false);

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:border-google-red/50 hover:shadow-md transition-all duration-200"
      >
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Small thumbnail preview */}
          <div
            onClick={() => onOpenTheatre(video)}
            className="relative w-28 h-20 sm:w-36 sm:h-24 rounded-xl overflow-hidden bg-black shrink-0 cursor-pointer group/thumb"
          >
            {video.thumbnailUrl && !imgError ? (
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <VideoIcon className="w-6 h-6 text-google-red/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 group-hover/thumb:bg-black/10 transition-colors flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-google-red/90 text-white flex items-center justify-center shadow-md">
                <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
              </div>
            </div>
            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
              {video.duration}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-semibold text-google-red bg-google-red/10 px-2 py-0.5 rounded-md border border-google-red/20">
                {video.event}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                <User className="w-3 h-3 text-google-red" />
                {video.speaker}
              </span>
            </div>

            <h3
              onClick={() => onOpenTheatre(video)}
              className="text-base font-bold text-foreground group-hover:text-google-red transition-colors cursor-pointer"
            >
              {video.title}
            </h3>

            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {video.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
          <button
            type="button"
            onClick={() => onToggleBookmark(video.id)}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark video'}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${isBookmarked
                ? 'bg-primary/10 border-primary text-primary'
                : 'border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-primary' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => onOpenTheatre(video)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-google-red hover:bg-google-red/90 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play</span>
          </button>

          <a
            href={video.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open on YouTube"
            className="p-2 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative flex flex-col rounded-2xl border border-border/80 bg-card overflow-hidden hover:border-google-red/40 hover:shadow-xl transition-all duration-200"
    >
      {/* 16:9 Media Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {isPlayingInline ? (
          <div className="relative w-full h-full">
            <iframe
              src={getYouTubeEmbedUrl(video)}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
            <button
              type="button"
              onClick={() => onPlayInline(null)}
              className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/80 hover:bg-black text-white text-xs flex items-center gap-1 shadow-lg border border-white/20 transition-all z-20 cursor-pointer"
              title="Close inline video player"
            >
              <X className="w-3.5 h-3.5" />
              <span className="text-[10px]">Close</span>
            </button>
          </div>
        ) : (
          <>
            {video.thumbnailUrl && !imgError ? (
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-google-red/20 to-card flex items-center justify-center">
                <VideoIcon className="w-12 h-12 text-google-red/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

            {/* Play Trigger */}
            <button
              type="button"
              onClick={() => onOpenTheatre(video)}
              aria-label={`Play video: ${video.title}`}
              className="absolute inset-0 flex items-center justify-center cursor-pointer group-hover:scale-105 transition-transform"
            >
              <div className="w-13 h-13 rounded-full bg-google-red text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
              </div>
            </button>

            {/* Event pill tag top-left */}
            <div className="absolute top-3 left-3 pointer-events-none">
              <span className="text-[11px] font-semibold bg-black/75 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/10">
                {video.event}
              </span>
            </div>

            {/* Runtime duration bottom-right */}
            <div className="absolute bottom-3 right-3 pointer-events-none">
              <span className="text-xs font-mono font-medium bg-black/80 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {video.duration}
              </span>
            </div>

            {/* Inline play toggle top-right */}
            <button
              type="button"
              onClick={() => onPlayInline(video.id)}
              className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/60 hover:bg-black/90 text-white text-[11px] font-medium border border-white/15 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-1"
              title="Play right here in card"
            >
              <span>Play Inline</span>
            </button>
          </>
        )}
      </div>

      {/* Content Meta */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-2">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-google-red" />
              {video.speaker}
            </span>
          </div>

          <h3
            onClick={() => onOpenTheatre(video)}
            className="text-base font-bold text-foreground mb-2 group-hover:text-google-red transition-colors leading-snug cursor-pointer"
          >
            {video.title}
          </h3>

          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
            {video.description}
          </p>
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-border/60 mt-auto space-y-3">
          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {video.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenTheatre(video)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-google-red hover:bg-google-red/90 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Watch in Theatre Mode</span>
            </button>

            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Watch on official YouTube channel"
              className="p-2 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={() => onToggleBookmark(video.id)}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark video'}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${isBookmarked
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-primary' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoResourceCard;
