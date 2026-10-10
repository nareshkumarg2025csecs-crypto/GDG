import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Clock, Bookmark, ChevronDown, ChevronUp } from 'lucide-react';
import { CodelabItem } from '@/data/knowledgeHubData';
import { ViewMode } from './types';

interface CodelabCardProps {
  item: CodelabItem;
  viewMode?: ViewMode;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}

export const CodelabCard: React.FC<CodelabCardProps> = ({
  item,
  viewMode = 'grid',
  isBookmarked,
  onToggleBookmark,
}) => {
  const [expanded, setExpanded] = useState(false);

  const difficultyConfig = {
    Beginner: {
      color: '#34A853',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-500',
    },
    Intermediate: {
      color: '#FBBC04',
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-500',
    },
    Advanced: {
      color: '#EA4335',
      bg: 'bg-rose-500/10 dark:bg-rose-500/15',
      text: 'text-rose-700 dark:text-rose-400',
      border: 'border-rose-500/30',
      dot: 'bg-rose-500',
    },
  }[item.difficulty] || {
    color: '#4285F4',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/30',
    dot: 'bg-blue-500',
  };

  const isLongDescription = item.description.length > 140;

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:border-google-blue/50 hover:shadow-md transition-all duration-200"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-google-blue bg-google-blue/10 px-2 py-0.5 rounded-md border border-google-blue/20">
              {item.category}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md border ${difficultyConfig.bg} ${difficultyConfig.text} ${difficultyConfig.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${difficultyConfig.dot}`} />
              {item.difficulty}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" />
              {item.duration}
            </span>
          </div>

          <h3 className="text-base font-bold text-foreground group-hover:text-google-blue transition-colors">
            {item.title}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {item.description}
          </p>

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
          <button
            type="button"
            onClick={() => onToggleBookmark(item.id)}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark for later'}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${isBookmarked
                ? 'bg-primary/10 border-primary text-primary'
                : 'border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-primary' : ''}`} />
          </button>

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-google-blue hover:bg-google-blue/90 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <span>Start Codelab</span>
            <ExternalLink className="w-3.5 h-3.5" />
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
      className="group relative flex flex-col rounded-2xl border border-border/80 bg-card p-5 sm:p-6 hover:shadow-xl hover:border-google-blue/40 transition-all duration-200"
    >
      {/* Top Header Meta */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-google-blue bg-google-blue/10 px-2.5 py-0.5 rounded-full border border-google-blue/20">
          {item.category}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${difficultyConfig.bg} ${difficultyConfig.text} ${difficultyConfig.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${difficultyConfig.dot}`} />
            {item.difficulty}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3" />
            {item.duration}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base sm:text-lg font-bold text-foreground mb-2 group-hover:text-google-blue transition-colors leading-snug">
        {item.title}
      </h3>

      {/* Description with read more toggle if long */}
      <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
        <p className={!expanded && isLongDescription ? 'line-clamp-3' : ''}>
          {item.description}
        </p>
        {isLongDescription && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 text-[11px] text-google-blue hover:underline mt-1 font-semibold cursor-pointer"
          >
            {expanded ? (
              <>
                <span>Show less</span>
                <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                <span>Read full guide</span>
                <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Bottom Footer Actions & Tags */}
      <div className="pt-3 border-t border-border/60 space-y-3 mt-auto">
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-google-blue hover:bg-google-blue/90 text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.99]"
          >
            <span>Start Interactive Codelab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={() => onToggleBookmark(item.id)}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark for later'}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${isBookmarked
                ? 'bg-primary/10 border-primary text-primary'
                : 'border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-primary' : ''}`} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CodelabCard;
