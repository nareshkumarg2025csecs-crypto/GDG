import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  ExternalLink,
  Code,
  Video,
  Terminal,
  BookOpen,
  Sparkles,
  Layers,
  Star,
  GitFork,
  Clock,
  Play,
  Calendar,
  User,
  ArrowRight,
  X,
  Compass,
  GraduationCap,
  FolderGit2,
  Camera,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTheme } from '@/contexts/ThemeContext';
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
import { TOOLS_CONFIG } from '@/config/toolsConfig';
import { useGitHubStats } from '@/hooks/useGitHubStats';
import { formatStarForkCount, getCloneCommand, copyTextToClipboard } from '@/services/githubService';
import { toast } from '@/hooks/use-toast';

const RepoCloneBar = ({ repoUrl, cloneUrl }: { repoUrl: string; cloneUrl?: string }) => {
  const [copied, setCopied] = useState(false);
  const command = cloneUrl ? `git clone ${cloneUrl}` : getCloneCommand(repoUrl);

  const performCopy = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }

    // 1. Cross-device robust copy (iOS Safari, Android, desktop)
    const success = copyTextToClipboard(command);

    // 2. Clear immediate visual feedback & toast confirmation
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
      title="Tap anywhere to copy clone command"
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
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background hover:bg-muted border border-border text-xs font-sans font-medium text-foreground transition-all cursor-pointer shadow-xs active:scale-95 z-10"
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

type ActiveTab = 'all' | 'codelabs' | 'videos' | 'repos' | 'guides';

export const ResourcesPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchParams, setSearchParams] = useSearchParams();
  const liveStats = useGitHubStats(REPOS_DATA);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const getYouTubeEmbedUrl = (video: VideoItem) => {
    let id = video.youtubeId;
    if (!id && video.youtubeUrl) {
      try {
        const url = new URL(video.youtubeUrl);
        id = url.searchParams.get('v') || url.pathname.split('/').pop() || '';
      } catch {
        id = '';
      }
    }
    return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : video.youtubeUrl;
  };

  // Tab state synced with URL query parameter
  const tabParam = (searchParams.get('tab') as ActiveTab) || 'all';
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    ['all', 'codelabs', 'videos', 'repos', 'guides'].includes(tabParam) ? tabParam : 'all'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  useEffect(() => {
    document.title = 'Knowledge & Resources Hub | GDG on Campus';
  }, []);

  // Update URL search params when tab changes
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'all') {
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

  // Sync tab if URL changes externally
  useEffect(() => {
    const current = (searchParams.get('tab') as ActiveTab) || 'all';
    if (['all', 'codelabs', 'videos', 'repos', 'guides'].includes(current)) {
      setActiveTab(current);
    }
  }, [searchParams]);

  // Filtered Codelabs
  const filteredCodelabs = useMemo(() => {
    return CODELABS_DATA.filter((item: CodelabItem) => {
      const matchesDifficulty =
        selectedDifficulty === 'all' || item.difficulty === selectedDifficulty;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)));
      return matchesDifficulty && matchesSearch;
    });
  }, [searchQuery, selectedDifficulty]);

  // Filtered Videos
  const filteredVideos = useMemo(() => {
    return VIDEOS_DATA.filter((item: VideoItem) => {
      const q = searchQuery.trim().toLowerCase();
      return (
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.speaker.toLowerCase().includes(q) ||
        item.event.toLowerCase().includes(q) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }, [searchQuery]);

  // Filtered Repos
  const filteredRepos = useMemo(() => {
    return REPOS_DATA.filter((item: RepoItem) => {
      const q = searchQuery.trim().toLowerCase();
      return (
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.language.toLowerCase().includes(q) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }, [searchQuery]);

  // Filtered Study Guides
  const filteredGuides = useMemo(() => {
    return STUDY_GUIDES_DATA.filter((item: StudyGuideItem) => {
      const q = searchQuery.trim().toLowerCase();
      return (
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q) ||
        (item.milestones &&
          item.milestones.some(
            (m) =>
              m.title.toLowerCase().includes(q) ||
              m.description.toLowerCase().includes(q) ||
              m.resourceName.toLowerCase().includes(q)
          ))
      );
    });
  }, [searchQuery]);

  const totalResults =
    (activeTab === 'all' || activeTab === 'codelabs' ? filteredCodelabs.length : 0) +
    (activeTab === 'all' || activeTab === 'videos' ? filteredVideos.length : 0) +
    (activeTab === 'all' || activeTab === 'repos' ? filteredRepos.length : 0) +
    (activeTab === 'all' || activeTab === 'guides' ? filteredGuides.length : 0);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedDifficulty('all');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-google-blue/30">
      <Header />

      <main id="main-content" className="flex-1 pt-28 sm:pt-32 pb-24 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none -z-10 opacity-30 blur-3xl">
          <div className="w-full h-full bg-gradient-to-r from-google-blue/20 via-google-red/15 via-google-yellow/20 to-google-green/20 rounded-full" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
          {/* Header Hero Section */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/80 bg-muted/40 backdrop-blur-sm text-xs font-semibold text-foreground/80 mb-4 shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-google-green animate-pulse" />
              <span>Campus Knowledge Base &amp; Curated Stacks</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-display tracking-tight text-foreground mb-4"
            >
              Learn, Build &amp;{' '}
              <span className="bg-gradient-to-r from-google-blue via-google-red via-google-yellow to-google-green bg-clip-text text-transparent">
                Grow
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-lg text-muted-foreground leading-relaxed"
            >
              A single unified repository of hands-on Google Codelabs, tech talk recordings, open-source boilerplate code, and structured certification roadmaps.
            </motion.p>

            {/* Quick Metrics Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-6 pt-6 border-t border-border/50 text-xs sm:text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-1.5 font-medium">
                <Code className="w-4 h-4 text-google-blue" />
                <span>{CODELABS_DATA.length} Codelabs</span>
              </div>
              <span className="opacity-30">•</span>
              <div className="flex items-center gap-1.5 font-medium">
                <Video className="w-4 h-4 text-google-red" />
                <span>{VIDEOS_DATA.length}+ Video Sessions</span>
              </div>
              <span className="opacity-30">•</span>
              <div className="flex items-center gap-1.5 font-medium">
                <Terminal className="w-4 h-4 text-google-green" />
                <span>{REPOS_DATA.length} GitHub Repos</span>
              </div>
              <span className="opacity-30">•</span>
              <div className="flex items-center gap-1.5 font-medium">
                <BookOpen className="w-4 h-4 text-google-yellow" />
                <span>{STUDY_GUIDES_DATA.length} Roadmaps</span>
              </div>
              {TOOLS_CONFIG.ENABLED && (
                <>
                  <span className="opacity-30">•</span>
                  <Link
                    to="/tools"
                    className="flex items-center gap-1 text-primary font-semibold hover:underline"
                  >
                    <Sparkles className="w-4 h-4 text-google-blue" />
                    <span>90+ Google Tools</span>
                  </Link>
                </>
              )}
            </motion.div>
          </div>

          {/* Sticky Tab Switcher & Search Bar */}
          <div className="sticky top-20 z-30 mb-10 py-3 bg-background/85 backdrop-blur-md border-y border-border/60 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
              {/* Live Search & Filter Bar (Moved up to top) */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search codelabs, topics, repos..."
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Difficulty selector (when on all or codelabs) */}
                {(activeTab === 'all' || activeTab === 'codelabs') && (
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="py-2.5 px-3 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 cursor-pointer"
                  >
                    <option value="all">All Levels</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                )}
              </div>

              {/* Category Tabs (Swapped - sits below search on mobile, or next to it on desktop) */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {[
                  { id: 'all', label: 'All Resources', icon: Layers, color: '#4285F4' },
                  { id: 'codelabs', label: 'Codelabs', icon: Code, color: '#4285F4', count: CODELABS_DATA.length },
                  { id: 'videos', label: 'Video Library', icon: Video, color: '#EA4335', count: VIDEOS_DATA.length },
                  { id: 'repos', label: 'GitHub Repos', icon: Terminal, color: '#34A853', count: REPOS_DATA.length },
                  { id: 'guides', label: 'Study Guides', icon: BookOpen, color: '#FBBC04', count: STUDY_GUIDES_DATA.length },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id as ActiveTab)}
                      className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'text-white shadow-md'
                          : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                      style={{
                        backgroundColor: isActive ? tab.color : undefined,
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isActive
                              ? 'bg-black/20 text-white'
                              : 'bg-background text-muted-foreground'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Active Filter Pill feedback if filtered */}
          {(searchQuery || selectedDifficulty !== 'all') && (
            <div className="flex items-center gap-2 mb-8 text-xs text-muted-foreground flex-wrap">
              <span>Showing {totalResults} matches for:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-google-blue/10 text-google-blue font-medium border border-google-blue/20">
                  Keyword: &quot;{searchQuery}&quot;
                  <button onClick={() => setSearchQuery('')} className="cursor-pointer">
                    <X className="w-3 h-3 ml-1" />
                  </button>
                </span>
              )}
              {selectedDifficulty !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-google-green/10 text-google-green font-medium border border-google-green/20">
                  Level: {selectedDifficulty}
                  <button onClick={() => setSelectedDifficulty('all')} className="cursor-pointer">
                    <X className="w-3 h-3 ml-1" />
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-primary hover:underline ml-2 font-medium cursor-pointer"
              >
                Reset all
              </button>
            </div>
          )}

          {/* Zero results state */}
          {totalResults === 0 && (
            <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-border bg-muted/20">
              <Search className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-1">No resources found</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                We couldn&apos;t find anything matching &quot;{searchQuery}&quot;. Try adjusting your search query or clear your filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* SECTION 1: CODELABS */}
          {(activeTab === 'all' || activeTab === 'codelabs') && filteredCodelabs.length > 0 && (
            <section className="mb-20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-google-blue" />
                    <h2 className="text-2xl sm:text-3xl font-display">Hands-On Codelabs</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Guided tutorials with live code sandboxes, step counters, and time estimates.
                  </p>
                </div>
                <a
                  href="https://codelabs.developers.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-google-blue hover:underline"
                >
                  <span>Google Codelabs Directory</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCodelabs.map((lab: CodelabItem) => {
                  const difficultyColor =
                    lab.difficulty === 'Beginner'
                      ? '#34A853'
                      : lab.difficulty === 'Intermediate'
                      ? '#FBBC04'
                      : '#EA4335';

                  return (
                    <motion.div
                      key={lab.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="group relative flex flex-col rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-6 hover:shadow-xl hover:border-google-blue/40 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-google-blue bg-google-blue/10 px-2.5 py-0.5 rounded-full border border-google-blue/20">
                          {lab.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${difficultyColor}15`,
                              color: difficultyColor,
                              border: `1px solid ${difficultyColor}30`,
                            }}
                          >
                            {lab.difficulty}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {lab.duration}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-google-blue transition-colors leading-snug">
                        {lab.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                        {lab.description}
                      </p>

                      <div className="pt-3 border-t border-border/50 space-y-3">
                        {lab.tags && lab.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {lab.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <a
                          href={lab.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-google-blue text-white text-xs font-semibold hover:bg-google-blue/90 shadow-sm transition-all"
                        >
                          <span>Start Interactive Codelab</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* SECTION 2: VIDEO LIBRARY & CAMPUS EVENT ARCHIVES */}
          {(activeTab === 'all' || activeTab === 'videos') && filteredVideos.length > 0 && (
            <section className="mb-20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-google-red" />
                    <h2 className="text-2xl sm:text-3xl font-display">Video Library &amp; Keynotes</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Landmark developer sessions, keynote breakthroughs, and upcoming campus workshop recordings.
                  </p>
                </div>
                <a
                  href="https://www.youtube.com/@GoogleDevelopers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-google-red hover:underline"
                >
                  <span>Google Developers YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Campus Events Notice & Future Upload Banner */}
              <div className="mb-8 p-5 sm:p-6 rounded-2xl border border-google-red/20 bg-gradient-to-r from-google-red/10 via-card to-google-yellow/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-google-red/20 text-google-red flex items-center justify-center shrink-0 mt-0.5">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-foreground">
                      Campus Event Video &amp; Photo Vault
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
                      All campus workshops, hackathons, and demo day sessions are recorded and indexed here.
                      Past global sessions are loaded below while recent campus session reels and photo albums are processed.
                    </p>
                  </div>
                </div>
                <Link
                  to="/events"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-google-red text-white text-xs font-semibold hover:bg-google-red/90 shrink-0 transition-all shadow-sm"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>View Event Calendar</span>
                </Link>
              </div>

              {/* Video Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredVideos.map((video: VideoItem) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="group flex flex-col rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm overflow-hidden hover:border-google-red/40 hover:shadow-xl transition-all duration-300"
                  >
                    {/* Thumbnail banner with Play Button or Embedded Video Player */}
                    <div className="relative aspect-video w-full overflow-hidden bg-black rounded-t-2xl">
                      {playingVideoId === video.id ? (
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
                            onClick={() => setPlayingVideoId(null)}
                            className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/80 hover:bg-black text-white text-xs flex items-center gap-1 shadow-lg border border-white/20 transition-all z-20 cursor-pointer"
                            title="Close embedded video player"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-sans">Close</span>
                          </button>
                        </div>
                      ) : (
                        <>
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-google-red/20 to-card flex items-center justify-center">
                              <Video className="w-12 h-12 text-google-red/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

                          {/* Play Button Overlay to trigger inline player */}
                          <button
                            type="button"
                            onClick={() => setPlayingVideoId(video.id)}
                            aria-label={`Play embedded video for ${video.title}`}
                            className="absolute inset-0 flex items-center justify-center cursor-pointer group-hover:scale-105 transition-transform"
                          >
                            <div className="w-14 h-14 rounded-full bg-google-red text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                              <Play className="w-6 h-6 fill-current translate-x-0.5" />
                            </div>
                          </button>

                          <div className="absolute top-3 left-3 pointer-events-none">
                            <span className="text-[11px] font-semibold bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/10">
                              {video.event}
                            </span>
                          </div>

                          <div className="absolute bottom-3 right-3 pointer-events-none">
                            <span className="text-xs font-mono font-medium bg-black/80 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {video.duration}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-foreground mb-2 group-hover:text-google-red transition-colors">
                          {video.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
                          {video.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <span className="font-semibold text-foreground flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-google-red" />
                            {video.speaker}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2 flex-wrap">
                        {video.tags && video.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {video.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <a
                          href={video.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-google-red hover:underline ml-auto"
                        >
                          <span>Watch Session</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 3: GITHUB REPOSITORIES & BOILERPLATES */}
          {(activeTab === 'all' || activeTab === 'repos') && filteredRepos.length > 0 && (
            <section className="mb-20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-google-green" />
                    <h2 className="text-2xl sm:text-3xl font-display">Campus GitHub Repos &amp; Boilerplates</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Student-tested codebases, hackathon kits, and production-ready starter templates.
                  </p>
                </div>
                <a
                  href="https://github.com/GoogleDeveloperStudentClubs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-google-green hover:underline"
                >
                  <span>Google Developer Repos</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredRepos.map((repo: RepoItem) => {
                  const stats = liveStats[repo.id] || {
                    stars: repo.stars,
                    forks: repo.forks,
                    isLive: false,
                  };

                  return (
                    <motion.div
                      key={repo.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="group flex flex-col rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-6 hover:shadow-xl hover:border-google-green/40 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-google-green" />
                          <span className="text-xs font-semibold text-google-green bg-google-green/10 px-2 py-0.5 rounded-md border border-google-green/20">
                            {repo.language}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-mono">
                          <span
                            className="flex items-center gap-1"
                            title={stats.isLive ? 'Realtime GitHub Stars' : 'GitHub Stars'}
                          >
                            <Star className="w-3.5 h-3.5 text-google-yellow fill-google-yellow" />
                            <span className="font-semibold text-foreground/90">
                              {formatStarForkCount(stats.stars)}
                            </span>
                          </span>
                          <span
                            className="flex items-center gap-1"
                            title={stats.isLive ? 'Realtime GitHub Forks' : 'GitHub Forks'}
                          >
                            <GitFork className="w-3.5 h-3.5 text-muted-foreground" />
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

                      <h3 className="text-base font-bold font-mono text-foreground mb-2 group-hover:text-google-green transition-colors">
                        {repo.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                        {repo.description}
                      </p>

                      <div className="pt-3 border-t border-border/50 space-y-3">
                        {repo.tags && repo.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {repo.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-mono"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Git Clone Command with Quick-Copy */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                            <span>Clone Command</span>
                            <span className="font-mono lowercase text-[9px] text-muted-foreground/80">https</span>
                          </div>
                          <RepoCloneBar repoUrl={repo.repoUrl} cloneUrl={repo.cloneUrl} />
                        </div>

                        <a
                          href={repo.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border hover:border-google-green text-foreground text-xs font-semibold hover:bg-google-green/10 transition-all"
                        >
                          <FolderGit2 className="w-4 h-4 text-google-green" />
                          <span>Open on GitHub</span>
                          <ExternalLink className="w-3.5 h-3.5 ml-auto" />
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* SECTION 4: STUDY GUIDES & ROADMAPS */}
          {(activeTab === 'all' || activeTab === 'guides') && filteredGuides.length > 0 && (
            <section className="mb-20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-google-yellow" />
                    <h2 className="text-2xl sm:text-3xl font-display">Study Guides &amp; Milestones</h2>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Structured multi-stage roadmaps designed to take you from fundamentals to official Google badges.
                  </p>
                </div>
                <a
                  href="https://developers.google.com/learn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-google-yellow hover:underline"
                >
                  <span>Google Learn Hub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredGuides.map((guide: StudyGuideItem) => (
                  <motion.div
                    key={guide.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-col rounded-2xl border border-border/80 bg-card/60 backdrop-blur-sm p-6 hover:shadow-xl hover:border-google-yellow/40 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-google-yellow bg-google-yellow/15 px-2.5 py-0.5 rounded-full border border-google-yellow/30">
                        {guide.role}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {guide.duration}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                      {guide.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                      {guide.summary}
                    </p>

                    {/* Milestones Flow */}
                    {guide.milestones && guide.milestones.length > 0 && (
                      <div className="space-y-3 mb-6 bg-muted/30 p-4 rounded-xl border border-border/50">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-google-yellow" />
                          <span>Curriculum Milestones</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {guide.milestones.map((m) => (
                            <div
                              key={m.step}
                              className="p-2.5 rounded-lg bg-card/80 border border-border/60 text-xs"
                            >
                              <div className="font-semibold text-foreground mb-1">
                                Step {m.step}: {m.title}
                              </div>
                              <div className="text-[11px] text-muted-foreground line-clamp-2">
                                {m.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Certification Target & CTA */}
                    <div className="pt-3 border-t border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-auto">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Target Credential: </span>
                        <span className="font-semibold text-foreground">{guide.certBadge || 'Skill Certificate'}</span>
                      </div>

                      <a
                        href={guide.officialLearnUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-google-yellow text-black text-xs font-semibold hover:bg-google-yellow/90 shadow-sm transition-all"
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Open Study Syllabus</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* BOTTOM BANNER: DISCOVER 80+ GOOGLE TOOLS */}
          {TOOLS_CONFIG.ENABLED && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 p-8 sm:p-10 rounded-3xl border border-border/80 bg-gradient-to-r from-google-blue/10 via-card to-google-green/10 relative overflow-hidden"
            >
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-google-blue/10 text-google-blue border border-google-blue/20 mb-3">
                  <Sparkles className="w-3 h-3" />
                  Explore Entire Google Stack
                </span>
                <h3 className="text-2xl sm:text-3xl font-display text-foreground mb-2">
                  Looking for Developer Tools &amp; SDKs?
                </h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Browse our comprehensive library of 90+ official Google Developer Tools, organized across AI/ML, Web, Mobile, Cloud, APIs, and Design.
                </p>
                <Link
                  to="/tools"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-foreground text-background text-xs sm:text-sm font-semibold hover:opacity-90 shadow-lg transition-all"
                >
                  <span>Explore Developer Tools Hub</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ResourcesPage;
