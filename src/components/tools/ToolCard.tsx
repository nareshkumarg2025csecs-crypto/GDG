import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  BookOpen,
  Bookmark,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import { GoogleTool } from '@/data/googleTools';
import ToolEmblem from './ToolEmblem';
import { toast } from 'sonner';
import { copyTextToClipboard } from '@/services/githubService';

interface ToolCardProps {
  tool: GoogleTool;
  viewMode?: 'grid' | 'list';
  isBookmarked?: boolean;
  onToggleBookmark?: (toolId: string) => void;
  onOpenDetails?: (tool: GoogleTool) => void;
  onSelectTag?: (tag: string) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  viewMode = 'grid',
  isBookmarked = false,
  onToggleBookmark,
  onOpenDetails,
  onSelectTag,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const success = copyTextToClipboard(tool.officialUrl);
    if (success) {
      setCopied(true);
      toast.success(`Copied link for ${tool.name}`);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Could not copy link');
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleBookmark) {
      onToggleBookmark(tool.id);
    }
  };

  // ==========================================
  // LIST VIEW LAYOUT (Compact, Developer Table)
  // ==========================================
  if (viewMode === 'list') {
    return (
      <article
        className="group relative p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:border-google-blue/40 hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden"
      >
        {/* Left Color Accent Bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 opacity-70 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: tool.color }}
        />

        <div className="flex items-start sm:items-center gap-3.5 pl-2 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => onOpenDetails && onOpenDetails(tool)}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-google-blue rounded-xl text-left"
            title={`Open quick view for ${tool.name}`}
          >
            <ToolEmblem category={tool.category} color={tool.color} name={tool.name} size="md" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${tool.color}15`,
                  color: tool.color,
                }}
              >
                {tool.categoryLabel}
              </span>

              {tool.badge && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border">
                  <Sparkles className="w-2.5 h-2.5 text-google-yellow" />
                  <span>{tool.badge}</span>
                </span>
              )}

              <span className="text-[11px] font-mono text-muted-foreground">{tool.level}</span>
            </div>

            <div className="flex items-baseline gap-2">
              <button
                type="button"
                onClick={() => onOpenDetails && onOpenDetails(tool)}
                className="text-left group/title focus:outline-none focus-visible:ring-2 focus-visible:ring-google-blue rounded"
                title={`Open quick view for ${tool.name}`}
              >
                <h3 className="text-base font-bold text-foreground group-hover/title:text-google-blue group-hover/title:underline transition-colors cursor-pointer">
                  {tool.name}
                </h3>
              </button>
              <span className="hidden sm:inline text-xs text-muted-foreground truncate">
                • {tool.tagline}
              </span>
            </div>

            <p className="text-xs text-muted-foreground mt-1 line-clamp-1 sm:hidden">
              {tool.tagline}
            </p>

            {/* Tag Pills */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {tool.tags.slice(0, 4).map((tag) => (
                <button
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectTag) onSelectTag(tag);
                  }}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted/60 hover:bg-google-blue/15 hover:text-google-blue text-muted-foreground transition-colors"
                >
                  #{tag}
                </button>
              ))}
              {tool.tags.length > 4 && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  +{tool.tags.length - 4} more
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pl-2 md:pl-0 shrink-0 self-end md:self-center">
          <button
            onClick={() => onOpenDetails && onOpenDetails(tool)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-foreground transition-colors"
            title="View Full Details"
          >
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Details</span>
          </button>

          <button
            onClick={handleBookmark}
            className={`p-2 rounded-xl border border-border transition-colors ${
              isBookmarked
                ? 'bg-google-yellow/15 border-google-yellow text-google-yellow'
                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Tool'}
            aria-label={`Bookmark ${tool.name}`}
          >
            <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>

          <a
            href={tool.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center p-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-foreground transition-colors"
            title="Documentation"
            aria-label={`${tool.name} Documentation`}
          >
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
          </a>

          <a
            href={tool.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-sm"
            style={{ backgroundColor: tool.color }}
            aria-label={`Open ${tool.name} in new tab`}
          >
            <span>Open</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </article>
    );
  }

  // ==========================================
  // GRID VIEW LAYOUT (Rich Card)
  // ==========================================
  return (
    <article
      className="group relative p-5 sm:p-6 rounded-2xl border border-border/80 bg-card hover:border-google-blue/40 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden"
    >
      {/* Top Color Accent Strip */}
      <div
        className="absolute top-0 left-0 right-0 h-1 transition-opacity opacity-75 group-hover:opacity-100"
        style={{ backgroundColor: tool.color }}
      />

      <div>
        {/* Card Header: Category, Badge, Level, Bookmark */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <span
            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${tool.color}15`,
              color: tool.color,
            }}
          >
            {tool.categoryLabel}
          </span>

          <div className="flex items-center gap-1.5">
            {tool.badge && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border">
                <Sparkles className="w-2.5 h-2.5 text-google-yellow" />
                <span>{tool.badge}</span>
              </span>
            )}

            <span className="text-[11px] font-mono text-muted-foreground">{tool.level}</span>

            <button
              onClick={handleBookmark}
              className={`p-1 rounded-lg transition-colors ${
                isBookmarked
                  ? 'text-google-yellow bg-google-yellow/15'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Tool'}
              aria-label={`Bookmark ${tool.name}`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Title, Emblem, Tagline */}
        <div className="flex items-start gap-3.5 mb-2">
          <button
            type="button"
            onClick={() => onOpenDetails && onOpenDetails(tool)}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-google-blue rounded-xl text-left"
            title={`Open quick view for ${tool.name}`}
          >
            <ToolEmblem category={tool.category} color={tool.color} name={tool.name} size="md" />
          </button>
          <div className="flex-1 min-w-0">
            <button
              type="button"
              onClick={() => onOpenDetails && onOpenDetails(tool)}
              className="text-left group/title focus:outline-none focus-visible:ring-2 focus-visible:ring-google-blue rounded block w-full"
              title={`Open quick view for ${tool.name}`}
            >
              <h3 className="text-lg font-bold text-foreground group-hover/title:text-google-blue group-hover/title:underline transition-colors cursor-pointer">
                {tool.name}
              </h3>
            </button>
            <p className="text-xs font-medium text-foreground/85 line-clamp-1 mt-0.5">
              {tool.tagline}
            </p>
          </div>
        </div>

        {/* Description: full accessibility with Read More toggle */}
        <div className="mt-2.5">
          <p
            className={`text-xs text-muted-foreground leading-relaxed ${
              isExpanded ? '' : 'line-clamp-3'
            }`}
          >
            {tool.description}
          </p>

          {tool.description.length > 120 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 text-[11px] font-semibold text-google-blue hover:underline inline-flex items-center gap-0.5"
            >
              <span>{isExpanded ? 'Show less' : 'Read more'}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {tool.tags.map((tag) => (
            <button
              key={tag}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectTag) onSelectTag(tag);
              }}
              className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-muted/60 hover:bg-google-blue/15 hover:text-google-blue text-muted-foreground border border-border/40 transition-colors"
              title={`Filter by #${tag}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-4 mt-5 border-t border-border/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <a
            href={tool.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Read Documentation"
          >
            <BookOpen className="w-3.5 h-3.5 text-google-blue" />
            <span className="hidden sm:inline">Docs</span>
          </a>

          <button
            onClick={() => onOpenDetails && onOpenDetails(tool)}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Quick Details"
            aria-label="View quick details"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopyLink}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Copy Official URL"
            aria-label="Copy official URL"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-google-green" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <a
          href={tool.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-sm"
          style={{ backgroundColor: tool.color }}
          aria-label={`Open ${tool.name} in new tab`}
        >
          <span>Open Tool</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </article>
  );
};

export default ToolCard;
