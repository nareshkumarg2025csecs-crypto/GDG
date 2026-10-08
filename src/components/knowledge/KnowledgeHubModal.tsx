import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  ExternalLink,
  Code,
  Video,
  Terminal,
  BookOpen,
  Star,
  GitFork,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Play,
  CheckCircle2,
  Calendar,
  User,
  Tag,
  Copy,
  Check,
} from 'lucide-react';
import {
  CODELABS_DATA,
  VIDEOS_DATA,
  REPOS_DATA,
  STUDY_GUIDES_DATA,
  CodelabItem,
  VideoItem,
  RepoItem,
  StudyGuideItem,
} from '@/data/knowledgeHubData';
import { useTheme } from '@/contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { useGitHubStats } from '@/hooks/useGitHubStats';
import { formatStarForkCount, getCloneCommand, copyTextToClipboard } from '@/services/githubService';
import { toast } from '@/hooks/use-toast';

export type KnowledgeTab = 'codelabs' | 'videos' | 'repos' | 'guides';

interface KnowledgeHubModalProps {
  isOpen: boolean;
  activeTab: KnowledgeTab;
  onClose: () => void;
  onSelectTab: (tab: KnowledgeTab) => void;
}

export const KnowledgeHubModal: React.FC<KnowledgeHubModalProps> = ({
  isOpen,
  activeTab,
  onClose,
  onSelectTab,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [copiedCloneId, setCopiedCloneId] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const liveStats = useGitHubStats(REPOS_DATA);

  const handleCopyClone = (repoId: string, command: string, e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    copyTextToClipboard(command);
    setCopiedCloneId(repoId);
    toast({
      title: 'Copied to Clipboard!',
      description: command,
      duration: 2500,
    });
    setTimeout(() => setCopiedCloneId(null), 2000);
  };

  // Focus close button on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeBtnRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setSearchQuery('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered Codelabs
  const filteredCodelabs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return CODELABS_DATA.filter((item) => {
      const matchDiff =
        selectedDifficulty === 'all' ||
        item.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));
      return matchDiff && matchSearch;
    });
  }, [searchQuery, selectedDifficulty]);

  // Filtered Videos
  const filteredVideos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return VIDEOS_DATA.filter((item) => {
      return (
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.speaker.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  // Filtered Repos
  const filteredRepos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return REPOS_DATA.filter((item) => {
      return (
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.language.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  // Filtered Study Guides
  const filteredGuides = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return STUDY_GUIDES_DATA.filter((item) => {
      return (
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q) ||
        item.milestones.some((m) => m.title.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/70 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="knowledge-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl overflow-hidden relative"
          >
            {/* Top Color Accent Ribbon */}
            <div className="h-1.5 w-full bg-gradient-to-r from-google-blue via-google-red via-google-yellow to-google-green" />

            {/* Modal Header */}
            <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/70 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-google-green/30 bg-google-green/10 text-google-green mb-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>Campus Knowledge Hub</span>
                  </div>
                  <h2
                    id="knowledge-modal-title"
                    className="text-xl sm:text-2xl md:text-3xl font-black text-foreground"
                  >
                    GDG Developer <span className="text-google-green">Resources</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Explore curated Codelabs, campus repos, tech talk archives, and career study roadmaps.
                  </p>
                </div>

                <button
                  ref={closeBtnRef}
                  onClick={onClose}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-green"
                  aria-label="Close knowledge hub modal"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Navigation Tabs Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-1">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none no-scrollbar">
                  {[
                    { id: 'codelabs', label: 'Codelabs', icon: Code, count: CODELABS_DATA.length, color: '#4285F4' },
                    { id: 'videos', label: 'Video Library', icon: Video, count: VIDEOS_DATA.length, color: '#EA4335' },
                    { id: 'repos', label: 'GitHub Repos', icon: Terminal, count: REPOS_DATA.length, color: '#34A853' },
                    { id: 'guides', label: 'Study Guides', icon: BookOpen, count: STUDY_GUIDES_DATA.length, color: '#FBBC04' },
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => onSelectTab(tab.id as KnowledgeTab)}
                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${
                          isActive
                            ? 'text-white border-transparent shadow-sm'
                            : 'border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                        style={{
                          backgroundColor: isActive ? tab.color : undefined,
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                            isActive ? 'bg-black/25 text-white' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Instant Search Bar inside Modal */}
                <div className="relative min-w-[200px] sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeTab}...`}
                    className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-border bg-card text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-google-green/40 shadow-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Body: Scrollable Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* TAB 1: CODELABS */}
              {activeTab === 'codelabs' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>Hands-on tutorials built for students:</span>
                    <div className="flex items-center gap-1">
                      {['all', 'beginner', 'intermediate'].map((diff) => (
                        <button
                          key={diff}
                          onClick={() => setSelectedDifficulty(diff)}
                          className={`px-2 py-0.5 rounded-lg font-medium capitalize text-[11px] transition-colors ${
                            selectedDifficulty === diff
                              ? 'bg-google-blue text-white font-bold'
                              : 'hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCodelabs.map((codelab) => (
                      <div
                        key={codelab.id}
                        className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-muted/20 hover:border-google-blue/50 hover:bg-muted/40 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                              style={{ backgroundColor: `${codelab.color}15`, color: codelab.color }}
                            >
                              {codelab.category}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {codelab.duration}
                              </span>
                              <span>•</span>
                              <span>{codelab.difficulty}</span>
                            </div>
                          </div>

                          <h3 className="text-base font-bold text-foreground">{codelab.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                            {codelab.description}
                          </p>

                          <div className="flex flex-wrap gap-1 mt-3">
                            {codelab.tags.map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">Step-by-step guided</span>
                          <a
                            href={codelab.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: codelab.color }}
                          >
                            <span>Launch Tutorial</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: VIDEOS */}
              {activeTab === 'videos' && (
                <div className="space-y-4">
                  {/* Future Announcement / Event Media Notice */}
                  <div className="p-3.5 rounded-2xl border border-google-red/20 bg-google-red/5 flex items-start gap-3 text-xs text-foreground/80">
                    <Calendar className="w-4 h-4 text-google-red shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-foreground">Campus Event Recordings & Gallery:</strong> Recorded
                      videos, live keynote sessions, and photos from upcoming GDG workshops will be archived right
                      here. Check out our foundational tech talks below!
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredVideos.map((video) => (
                      <div
                        key={video.id}
                        className="rounded-2xl border border-border/80 bg-muted/20 hover:border-google-red/50 hover:bg-muted/40 transition-all overflow-hidden flex flex-col justify-between"
                      >
                        {/* Thumbnail Bar or Embedded Video */}
                        <div className="relative aspect-video w-full bg-black overflow-hidden group">
                          {playingVideoId === video.id ? (
                            <div className="relative w-full h-full">
                              <iframe
                                src={video.youtubeId ? `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0` : video.youtubeUrl}
                                title={video.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="w-full h-full border-0"
                              />
                              <button
                                type="button"
                                onClick={() => setPlayingVideoId(null)}
                                className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/80 hover:bg-black text-white text-[11px] flex items-center gap-1 shadow-lg border border-white/20 transition-all z-20 cursor-pointer"
                                title="Close player"
                              >
                                <X className="w-3 h-3" />
                                <span>Close</span>
                              </button>
                            </div>
                          ) : (
                            <>
                              {video.thumbnailUrl && (
                                <img
                                  src={video.thumbnailUrl}
                                  alt={video.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                              )}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => setPlayingVideoId(video.id)}
                                  className="w-11 h-11 rounded-full bg-google-red text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform cursor-pointer"
                                  aria-label={`Play embedded video for ${video.title}`}
                                >
                                  <Play className="w-5 h-5 ml-0.5 fill-current" />
                                </button>
                              </div>
                              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono text-white pointer-events-none">
                                {video.duration}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Video Metadata */}
                        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                              <span className="font-semibold text-google-red">{video.event}</span>
                              <span className="flex items-center gap-1 font-mono">
                                <User className="w-3 h-3" />
                                {video.speaker}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-foreground">{video.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                              {video.description}
                            </p>
                          </div>

                          <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between">
                            <div className="flex gap-1">
                              {video.tags.slice(0, 2).map((t) => (
                                <span
                                  key={t}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                            <a
                              href={video.youtubeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-google-red hover:opacity-90 transition-opacity"
                            >
                              <span>Watch on YouTube</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: GITHUB REPOSITORIES */}
              {activeTab === 'repos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Campus open-source projects & starter boilerplates:</span>
                    <a
                      href="https://github.com/GoogleDeveloperStudentClubs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-google-green hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>GDG GitHub Org</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredRepos.map((repo) => {
                      const stats = liveStats[repo.id] || {
                        stars: repo.stars,
                        forks: repo.forks,
                        isLive: false,
                      };
                      const cloneCmd = repo.cloneUrl ? `git clone ${repo.cloneUrl}` : getCloneCommand(repo.repoUrl);
                      const isCopied = copiedCloneId === repo.id;

                      return (
                        <div
                          key={repo.id}
                          className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-muted/20 hover:border-google-green/50 hover:bg-muted/40 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="font-mono text-xs font-bold text-google-green flex items-center gap-1">
                                <Terminal className="w-3.5 h-3.5" />
                                {repo.title}
                              </span>
                              <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                                <span
                                  className="flex items-center gap-1 text-foreground/80"
                                  title={stats.isLive ? 'Realtime GitHub Stars' : 'GitHub Stars'}
                                >
                                  <Star className="w-3.5 h-3.5 text-google-yellow fill-google-yellow" />
                                  <span className="font-semibold">{formatStarForkCount(stats.stars)}</span>
                                </span>
                                <span
                                  className="flex items-center gap-1"
                                  title={stats.isLive ? 'Realtime GitHub Forks' : 'GitHub Forks'}
                                >
                                  <GitFork className="w-3.5 h-3.5" />
                                  <span>{formatStarForkCount(stats.forks)}</span>
                                </span>
                                {stats.isLive && (
                                  <span
                                    className="w-1.5 h-1.5 rounded-full bg-google-green animate-pulse"
                                    title="Realtime GitHub Synced"
                                  />
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                              {repo.description}
                            </p>

                            <div className="flex items-center gap-2 mt-3">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-foreground font-semibold">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: repo.color }} />
                                {repo.language}
                              </span>
                              {repo.isTemplate && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-google-blue/15 text-google-blue">
                                  Template
                                </span>
                              )}
                              {repo.hasGoodFirstIssues && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-google-green/15 text-google-green">
                                  Good First Issue
                                </span>
                              )}
                            </div>

                            {/* Clone command preview & copy button */}
                            <div
                              onClick={(e) => handleCopyClone(repo.id, cloneCmd, e)}
                              className="mt-3 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-black/40 border border-border/70 font-mono text-[11px] cursor-pointer group hover:border-google-green/50 active:scale-[0.99] transition-all select-none"
                              title="Tap anywhere to copy clone command"
                              role="button"
                              tabIndex={0}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden select-all">
                                <span className="text-google-green font-bold shrink-0 select-none">$</span>
                                <code className="truncate text-foreground/90 select-all font-mono text-[11px]">
                                  {cloneCmd}
                                </code>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => handleCopyClone(repo.id, cloneCmd, e)}
                                title="Copy git clone command"
                                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background hover:bg-muted border border-border text-[11px] font-sans font-medium text-foreground transition-all cursor-pointer shadow-xs active:scale-95 z-10"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-google-green" />
                                    <span className="text-google-green font-semibold">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-google-green transition-colors" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">Open-Source Apache 2.0</span>
                            <a
                              href={repo.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-border bg-card hover:bg-muted text-foreground transition-colors"
                            >
                              <span>Open on GitHub</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: STUDY GUIDES & ROADMAPS */}
              {activeTab === 'guides' && (
                <div className="space-y-4">
                  <div className="text-xs text-muted-foreground">
                    Step-by-step career tracks and skill badge roadmaps curated by GDG leads:
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredGuides.map((guide) => (
                      <div
                        key={guide.id}
                        className="p-5 rounded-2xl border border-border/80 bg-muted/20 hover:border-google-yellow/50 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                              style={{ backgroundColor: `${guide.color}15`, color: guide.color }}
                            >
                              {guide.role}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground">{guide.duration}</span>
                          </div>

                          <h3 className="text-base sm:text-lg font-bold text-foreground">{guide.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{guide.summary}</p>

                          {/* 4 Milestones */}
                          <div className="mt-4 space-y-2.5">
                            {guide.milestones.map((m) => (
                              <div
                                key={m.step}
                                className="p-2.5 rounded-xl bg-card border border-border/60 text-xs flex items-start gap-2.5"
                              >
                                <span
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
                                  style={{ backgroundColor: guide.color }}
                                >
                                  {m.step}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <strong className="text-foreground block truncate">{m.title}</strong>
                                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                    {m.description}
                                  </p>
                                  <a
                                    href={m.resourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-google-blue hover:underline inline-flex items-center gap-1 mt-1 font-semibold"
                                  >
                                    <span>{m.resourceName}</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-google-yellow flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {guide.certBadge || 'Skill Badge Included'}
                          </span>
                          <a
                            href={guide.officialLearnUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-90"
                            style={{ backgroundColor: guide.color }}
                          >
                            <span>Start Pathway</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer / Fast Shortcut */}
            <div className="p-3.5 sm:p-4 border-t border-border/70 bg-muted/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Layers className="w-4 h-4 text-google-blue" />
                <span>
                  Looking for SDKs, APIs, and frameworks? Check the{' '}
                  <strong className="text-foreground">Google Developer Tools Hub</strong>.
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Link
                  to="/tools"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-xl font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  <span>Explore Tools Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default KnowledgeHubModal;
