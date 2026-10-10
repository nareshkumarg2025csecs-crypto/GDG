import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Terminal,
  Star,
  GitFork,
  ExternalLink,
  Copy,
  Check,
  FolderGit2,
  Bookmark,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { RepoItem } from '@/data/knowledgeHubData';
import { formatStarForkCount, getCloneCommand, copyTextToClipboard } from '@/services/githubService';
import { toast } from '@/hooks/use-toast';
import { ViewMode } from './types';

interface RepoResourceCardProps {
  repo: RepoItem;
  stats: {
    stars: number;
    forks: number;
    isLive: boolean;
  };
  viewMode?: ViewMode;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}

const RepoCloneBar: React.FC<{ repoUrl: string; cloneUrl?: string }> = ({
  repoUrl,
  cloneUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const command = cloneUrl ? `git clone ${cloneUrl}` : getCloneCommand(repoUrl);

  const performCopy = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    copyTextToClipboard(command);
    setCopied(true);
    toast({
      title: 'Copied to Clipboard!',
      description: command,
      duration: 2500,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={performCopy}
      className="relative flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-muted/60 dark:bg-black/40 border border-border/70 font-mono text-[11px] sm:text-xs cursor-pointer group/bar hover:border-google-green/50 active:scale-[0.99] transition-all select-none"
      title="Click or tap to copy clone command"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          performCopy();
        }
      }}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1 py-0.5 overflow-hidden">
        <span className="text-google-green font-bold shrink-0 select-none">$</span>
        <code className="text-foreground/90 truncate font-mono text-[11px] sm:text-xs select-all">
          {command}
        </code>
      </div>
      <button
        type="button"
        onClick={performCopy}
        title="Copy git clone command"
        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background hover:bg-muted border border-border text-xs font-sans font-medium text-foreground transition-all cursor-pointer shadow-xs active:scale-95 z-10"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-google-green" />
            <span className="text-google-green font-semibold">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover/bar:text-google-green transition-colors" />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  );
};

export const RepoResourceCard: React.FC<RepoResourceCardProps> = ({
  repo,
  stats,
  viewMode = 'grid',
  isBookmarked,
  onToggleBookmark,
}) => {
  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:border-google-green/50 hover:shadow-md transition-all duration-200"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-semibold text-google-green bg-google-green/10 px-2.5 py-0.5 rounded-md border border-google-green/20">
              {repo.language}
            </span>

            {repo.isTemplate && (
              <span className="text-[10px] font-semibold text-google-blue bg-google-blue/10 px-2 py-0.5 rounded-md border border-google-blue/20 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Template
              </span>
            )}

            {repo.hasGoodFirstIssues && (
              <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                Good First Issues
              </span>
            )}

            <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-mono ml-auto md:ml-2">
              <span className="flex items-center gap-1" title="GitHub Stars">
                <Star className="w-3.5 h-3.5 text-google-yellow fill-google-yellow" />
                <span className="font-semibold text-foreground/90">
                  {formatStarForkCount(stats.stars)}
                </span>
              </span>
              <span className="flex items-center gap-1" title="GitHub Forks">
                <GitFork className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{formatStarForkCount(stats.forks)}</span>
              </span>
              {stats.isLive && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-google-green animate-pulse"
                  title="Realtime GitHub Sync"
                />
              )}
            </div>
          </div>

          <h3 className="text-base font-bold font-mono text-foreground group-hover:text-google-green transition-colors">
            {repo.title}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {repo.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/50">
          <div className="w-full sm:w-64">
            <RepoCloneBar repoUrl={repo.repoUrl} cloneUrl={repo.cloneUrl} />
          </div>

          <div className="flex items-center gap-2">
            <a
              href={repo.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border hover:border-google-green text-foreground text-xs font-semibold hover:bg-google-green/10 transition-all"
            >
              <FolderGit2 className="w-4 h-4 text-google-green" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={() => onToggleBookmark(repo.id)}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark repository'}
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
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative flex flex-col rounded-2xl border border-border/80 bg-card p-5 sm:p-6 hover:shadow-xl hover:border-google-green/40 transition-all duration-200"
    >
      {/* Header Meta */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-google-green bg-google-green/10 px-2.5 py-0.5 rounded-md border border-google-green/20">
            {repo.language}
          </span>
          {repo.isTemplate && (
            <span className="text-[10px] font-semibold text-google-blue bg-google-blue/10 px-2 py-0.5 rounded-md border border-google-blue/20 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Template
            </span>
          )}
          {repo.hasGoodFirstIssues && (
            <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
              Good First Issues
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-mono">
          <span className="flex items-center gap-1" title="GitHub Stars">
            <Star className="w-3.5 h-3.5 text-google-yellow fill-google-yellow" />
            <span className="font-semibold text-foreground/90">
              {formatStarForkCount(stats.stars)}
            </span>
          </span>
          <span className="flex items-center gap-1" title="GitHub Forks">
            <GitFork className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{formatStarForkCount(stats.forks)}</span>
          </span>
          {stats.isLive && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-google-green animate-pulse"
              title="Realtime GitHub Sync"
            />
          )}
        </div>
      </div>

      {/* Repo Title */}
      <h3 className="text-base font-bold font-mono text-foreground mb-2 group-hover:text-google-green transition-colors leading-snug">
        {repo.title}
      </h3>

      {/* Description */}
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
        {repo.description}
      </p>

      {/* Tags and Clone Bar */}
      <div className="pt-3 border-t border-border/60 space-y-3 mt-auto">
        {repo.tags && repo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {repo.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            <span>Clone Repository</span>
            <span className="font-mono lowercase text-[9px] text-muted-foreground/80">https</span>
          </div>
          <RepoCloneBar repoUrl={repo.repoUrl} cloneUrl={repo.cloneUrl} />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <a
            href={repo.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border hover:border-google-green text-foreground text-xs font-semibold hover:bg-google-green/10 transition-all active:scale-[0.99]"
          >
            <FolderGit2 className="w-4 h-4 text-google-green" />
            <span>Open on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 ml-auto" />
          </a>

          <button
            type="button"
            onClick={() => onToggleBookmark(repo.id)}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark repository'}
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

export default RepoResourceCard;
