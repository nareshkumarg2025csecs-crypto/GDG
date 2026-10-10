import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ExternalLink, BookOpen, Info, Bookmark } from 'lucide-react';
import { GoogleTool } from '@/data/googleTools';
import ToolEmblem from './ToolEmblem';

interface ToolsSpotlightProps {
  spotlightTools: GoogleTool[];
  onOpenDetails: (tool: GoogleTool) => void;
  savedToolIds: Set<string>;
  onToggleBookmark: (toolId: string) => void;
  className?: string;
}

export const ToolsSpotlight: React.FC<ToolsSpotlightProps> = ({
  spotlightTools,
  onOpenDetails,
  savedToolIds,
  onToggleBookmark,
  className = '',
}) => {
  if (!spotlightTools || spotlightTools.length === 0) return null;

  return (
    <section
      aria-label="Featured Tools Spotlight"
      className={`hidden md:block mb-14 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-google-yellow" />
          <span>Curated Developer Spotlight</span>
        </h2>
        <span className="text-xs text-muted-foreground font-mono">
          Featured & Trending Picks
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {spotlightTools.map((tool) => {
          const isBookmarked = savedToolIds.has(tool.id);

          return (
            <motion.div
              key={tool.id}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="group p-5 rounded-2xl border border-border/80 bg-card hover:border-google-blue/40 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div
                className="absolute top-0 left-0 right-0 h-1 transition-opacity opacity-75 group-hover:opacity-100"
                style={{ backgroundColor: tool.color }}
              />

              <div>
                {/* Badge & Level */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase"
                    style={{
                      backgroundColor: `${tool.color}15`,
                      color: tool.color,
                    }}
                  >
                    {tool.badge || tool.categoryLabel}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-muted-foreground">{tool.level}</span>
                    <button
                      onClick={() => onToggleBookmark(tool.id)}
                      className={`p-1 rounded-md transition-colors ${
                        isBookmarked
                          ? 'text-google-yellow bg-google-yellow/15'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Tool'}
                      aria-label={`Bookmark ${tool.name}`}
                    >
                      <Bookmark className="w-3 h-3" fill={isBookmarked ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>

                {/* Title & Emblem */}
                <div className="flex items-start gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => onOpenDetails(tool)}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-google-blue rounded-xl text-left"
                    title={`Open quick view for ${tool.name}`}
                  >
                    <ToolEmblem category={tool.category} color={tool.color} name={tool.name} size="md" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => onOpenDetails(tool)}
                      className="text-left group/title focus:outline-none focus-visible:ring-2 focus-visible:ring-google-blue rounded block w-full"
                      title={`Open quick view for ${tool.name}`}
                    >
                      <h3 className="text-base font-bold text-foreground group-hover/title:text-google-blue group-hover/title:underline transition-colors cursor-pointer">
                        {tool.name}
                      </h3>
                    </button>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {tool.tagline}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3.5 mt-3 border-t border-border/50 flex items-center gap-2">
                <button
                  onClick={() => onOpenDetails(tool)}
                  className="p-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-foreground transition-colors"
                  title="Quick Details"
                  aria-label="View quick details"
                >
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
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
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: tool.color }}
                  aria-label={`Open ${tool.name} in new tab`}
                >
                  <span>Open Tool</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default ToolsSpotlight;
