import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Clock,
  GraduationCap,
  ExternalLink,
  Bookmark,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { StudyGuideItem } from '@/data/knowledgeHubData';
import { ViewMode } from './types';

interface StudyGuideCardProps {
  guide: StudyGuideItem;
  viewMode?: ViewMode;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}

export const StudyGuideCard: React.FC<StudyGuideCardProps> = ({
  guide,
  viewMode = 'grid',
  isBookmarked,
  onToggleBookmark,
}) => {
  const [showMilestones, setShowMilestones] = useState(false);

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:border-google-yellow/50 hover:shadow-md transition-all duration-200"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/25">
              {guide.role}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" />
              {guide.duration}
            </span>
            {guide.certBadge && (
              <span className="text-[11px] font-medium text-foreground bg-muted px-2 py-0.5 rounded-md flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-google-yellow" />
                {guide.certBadge}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-foreground group-hover:text-google-yellow transition-colors">
            {guide.title}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {guide.summary}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
          <button
            type="button"
            onClick={() => onToggleBookmark(guide.id)}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark roadmap'}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${isBookmarked
                ? 'bg-primary/10 border-primary text-primary'
                : 'border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-primary' : ''}`} />
          </button>

          <a
            href={guide.officialLearnUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-google-yellow hover:bg-google-yellow/90 text-black text-xs font-semibold shadow-xs transition-all"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Open Syllabus</span>
            <ExternalLink className="w-3 h-3" />
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
      className="group relative flex flex-col rounded-2xl border border-border/80 bg-card p-5 sm:p-6 hover:shadow-xl hover:border-google-yellow/40 transition-all duration-200"
    >
      {/* Top Meta */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
          {guide.role}
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono font-medium">
          <Clock className="w-3 h-3" />
          {guide.duration}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 group-hover:text-google-yellow transition-colors leading-snug">
        {guide.title}
      </h3>

      {/* Summary */}
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
        {guide.summary}
      </p>

      {/* Milestones Flow Accordion */}
      {guide.milestones && guide.milestones.length > 0 && (
        <div className="mb-4 bg-muted/40 rounded-xl border border-border/60 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowMilestones(!showMilestones)}
            className="w-full flex items-center justify-between p-3 text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors cursor-pointer select-none"
          >
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Compass className="w-3.5 h-3.5 text-google-yellow" />
              <span>Curriculum Path ({guide.milestones.length} Milestones)</span>
            </span>
            <span className="flex items-center gap-1 text-[11px] text-google-yellow">
              <span>{showMilestones ? 'Hide milestones' : 'View curriculum'}</span>
              {showMilestones ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {showMilestones ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-3 pt-0 space-y-2 border-t border-border/40"
              >
                {guide.milestones.map((m) => (
                  <div
                    key={m.step}
                    className="p-2.5 rounded-lg bg-card border border-border/60 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-google-yellow shrink-0 mt-0.5" />
                        <span>Step {m.step}: {m.title}</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed pl-5 mb-1.5">
                      {m.description}
                    </p>
                    {m.resourceName && m.resourceUrl && (
                      <div className="pl-5">
                        <a
                          href={m.resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-google-yellow hover:underline"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>{m.resourceName}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            ) : (
              /* Compact milestone preview */
              <div className="px-3 pb-3 pt-0 flex flex-wrap gap-1.5">
                {guide.milestones.slice(0, 3).map((m) => (
                  <span
                    key={m.step}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-card border border-border/60 text-muted-foreground font-mono"
                  >
                    Step {m.step}: {m.title}
                  </span>
                ))}
                {guide.milestones.length > 3 && (
                  <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground">
                    +{guide.milestones.length - 3} more
                  </span>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Target Credential & CTA */}
      <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-auto">
        <div className="text-xs">
          <span className="text-muted-foreground">Target Credential: </span>
          <span className="font-semibold text-foreground">
            {guide.certBadge || 'Official Skill Certificate'}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <a
            href={guide.officialLearnUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-google-yellow hover:bg-google-yellow/90 text-black text-xs font-semibold shadow-xs transition-all active:scale-[0.99]"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Open Study Syllabus</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={() => onToggleBookmark(guide.id)}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark roadmap'}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${isBookmarked
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

export default StudyGuideCard;
