import React from 'react';
import { motion } from 'framer-motion';
import {
  Code,
  Video,
  Terminal,
  BookOpen,
  Bookmark,
} from 'lucide-react';
import { ResourceTab } from './types';

interface ResourcesHeroProps {
  counts: {
    codelabs: number;
    videos: number;
    repos: number;
    guides: number;
    total: number;
    bookmarks: number;
  };
  activeTab: ResourceTab;
  onTabChange: (tab: ResourceTab) => void;
}

export const ResourcesHero: React.FC<ResourcesHeroProps> = ({
  counts,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="relative pt-6 pb-10 sm:pb-14 overflow-hidden">
      {/* Subtle developer grid background decoration */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-5xl mx-auto text-center px-4 sm:px-6">
        {/* Status Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/80 bg-background/80 backdrop-blur-md text-xs font-medium text-foreground/80 mb-5 shadow-xs"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-google-blue opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-google-blue" />
          </span>
          <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
            GDG Academic Repository
          </span>
          <span className="text-muted-foreground/40">•</span>
          <span className="font-semibold text-foreground">
            {counts.total} Curated Stacks
          </span>
        </motion.div>

        {/* Main Display Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-foreground leading-[1.15] mb-5"
        >
          Developer Academy &amp;{' '}
          <span className="bg-gradient-to-r from-google-blue via-google-green to-google-yellow bg-clip-text text-transparent">
            Knowledge Hub
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8"
        >
          A single verified index of hands-on Google Codelabs, recorded tech masterclasses, production boilerplates with live GitHub telemetry, and multi-stage certification roadmaps.
        </motion.p>

        {/* Interactive Track Jump Pills */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2"
        >
          <button
            type="button"
            onClick={() => onTabChange('codelabs')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${activeTab === 'codelabs'
                ? 'bg-google-blue/15 border-google-blue/40 text-google-blue shadow-xs'
                : 'bg-card/80 border-border/70 hover:border-google-blue/40 text-muted-foreground hover:text-foreground hover:bg-card'
              }`}
          >
            <Code className="w-3.5 h-3.5 text-google-blue" />
            <span>{counts.codelabs} Codelabs</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('videos')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${activeTab === 'videos'
                ? 'bg-google-red/15 border-google-red/40 text-google-red shadow-xs'
                : 'bg-card/80 border-border/70 hover:border-google-red/40 text-muted-foreground hover:text-foreground hover:bg-card'
              }`}
          >
            <Video className="w-3.5 h-3.5 text-google-red" />
            <span>{counts.videos} Masterclasses</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('repos')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${activeTab === 'repos'
                ? 'bg-google-green/15 border-google-green/40 text-google-green shadow-xs'
                : 'bg-card/80 border-border/70 hover:border-google-green/40 text-muted-foreground hover:text-foreground hover:bg-card'
              }`}
          >
            <Terminal className="w-3.5 h-3.5 text-google-green" />
            <span>{counts.repos} GitHub Repos</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('guides')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${activeTab === 'guides'
                ? 'bg-google-yellow/15 border-google-yellow/40 text-foreground dark:text-google-yellow shadow-xs'
                : 'bg-card/80 border-border/70 hover:border-google-yellow/40 text-muted-foreground hover:text-foreground hover:bg-card'
              }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-google-yellow" />
            <span>{counts.guides} Roadmaps</span>
          </button>

          {counts.bookmarks > 0 && (
            <button
              type="button"
              onClick={() => onTabChange('bookmarks')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${activeTab === 'bookmarks'
                  ? 'bg-primary/15 border-primary/40 text-primary shadow-xs'
                  : 'bg-card/80 border-border/70 hover:border-primary/40 text-muted-foreground hover:text-foreground hover:bg-card'
                }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-primary fill-primary" />
              <span>{counts.bookmarks} Saved</span>
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ResourcesHero;
