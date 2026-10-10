import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Terminal, Code2, Layers, Cpu } from 'lucide-react';
import { TOOLS_CONFIG } from '@/config/toolsConfig';

interface ToolsHeroProps {
  totalTools: number;
  totalCategories: number;
  onSearchSuggestion: (term: string) => void;
}

const POPULAR_SUGGESTIONS = [
  'Gemini',
  'Flutter',
  'Firebase',
  'Cloud Run',
  'Keras',
  'Android Studio',
  'Material Design',
  'Kubernetes',
];

export const ToolsHero: React.FC<ToolsHeroProps> = ({
  totalTools,
  totalCategories,
  onSearchSuggestion,
}) => {
  return (
    <div className="relative text-center max-w-4xl mx-auto mb-10 sm:mb-14">
      {/* Ambient background glow in Google colors */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 pointer-events-none -z-10 opacity-30 blur-3xl">
        <div className="w-full h-full bg-gradient-to-r from-google-blue/30 via-google-red/20 via-google-yellow/25 to-google-green/30 rounded-full" />
      </div>

      {/* Pill Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/80 bg-card/60 backdrop-blur-md text-xs font-semibold text-foreground/90 mb-5 shadow-sm"
      >
        <span className="flex h-2 w-2 rounded-full bg-google-red animate-pulse" />
        <span>Official GDG Resource Hub</span>
      </motion.div>

      {/* Main Title */}
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.1]"
      >
        Google Developer <span className="text-google-blue">Tools</span>{' '}
        <span className="text-google-red">Hub</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="mt-4 text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
      >
        {TOOLS_CONFIG.PAGE_SUBTITLE}
      </motion.p>

      {/* High-Impact Stat Badges */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium text-foreground"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/70 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-google-blue animate-pulse" />
          <span className="font-bold">{totalTools}</span>
          <span className="text-muted-foreground">Developer Tools</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/70 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-google-green" />
          <span className="font-bold">{totalCategories}</span>
          <span className="text-muted-foreground">Disciplines</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/70 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-google-yellow" />
          <span className="font-bold">100% Free</span>
          <span className="text-muted-foreground">Documentation</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/70 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-google-red" />
          <span className="font-bold">All Skill Levels</span>
        </div>
      </motion.div>

      {/* Suggested Search Keywords */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-5 flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground"
      >
        <span className="font-medium mr-1 text-foreground/80 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-google-yellow" />
          Popular searches:
        </span>
        {POPULAR_SUGGESTIONS.map((term) => (
          <button
            key={term}
            onClick={() => onSearchSuggestion(term)}
            className="px-2.5 py-1 rounded-lg text-xs font-mono bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
          >
            {term}
          </button>
        ))}
      </motion.div>
    </div>
  );
};

export default ToolsHero;
