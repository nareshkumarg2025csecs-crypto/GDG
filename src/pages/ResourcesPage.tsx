import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
import { useGitHubStats } from '@/hooks/useGitHubStats';
import { ResourceTab, ViewMode, DifficultyFilter } from '@/components/resources/types';
import { ResourcesHero } from '@/components/resources/ResourcesHero';
import { ResourcesFilterBar } from '@/components/resources/ResourcesFilterBar';
import { CodelabCard } from '@/components/resources/CodelabCard';
import { VideoResourceCard } from '@/components/resources/VideoResourceCard';
import { RepoResourceCard } from '@/components/resources/RepoResourceCard';
import { StudyGuideCard } from '@/components/resources/StudyGuideCard';
import { VideoTheatreModal } from '@/components/resources/VideoTheatreModal';
import { useResourceBookmarks } from '@/components/resources/ResourceBookmarks';

type UnifiedResource =
  | { type: 'codelab'; id: string; item: CodelabItem }
  | { type: 'video'; id: string; item: VideoItem }
  | { type: 'repo'; id: string; item: RepoItem }
  | { type: 'guide'; id: string; item: StudyGuideItem };

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 36, 46];

export const ResourcesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const liveStats = useGitHubStats(REPOS_DATA);
  const { bookmarks, toggle: toggleBookmark, isBookmarked, count: bookmarksCount } = useResourceBookmarks();
  const resourcesGridRef = useRef<HTMLDivElement>(null);

  // Tab state synced with URL query parameter
  const tabParam = (searchParams.get('tab') as ResourceTab) || 'all';
  const validTabs: ResourceTab[] = ['all', 'codelabs', 'videos', 'repos', 'guides', 'bookmarks'];
  const [activeTab, setActiveTab] = useState<ResourceTab>(
    validTabs.includes(tabParam) ? tabParam : 'all'
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Video playback states
  const [playingInlineVideoId, setPlayingInlineVideoId] = useState<string | null>(null);
  const [theatreVideo, setTheatreVideo] = useState<VideoItem | null>(null);

  useEffect(() => {
    document.title = 'Knowledge & Resources Hub | GDG on Campus';
  }, []);

  // Update URL search params when tab changes
  const handleTabChange = (tab: ResourceTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    if (tab === 'all') {
      searchParams.delete('tab');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

  // Sync tab if URL changes externally
  useEffect(() => {
    const current = (searchParams.get('tab') as ResourceTab) || 'all';
    if (validTabs.includes(current)) {
      setActiveTab(current);
    }
  }, [searchParams]);

  // Reset pagination to page 1 whenever filters or tabs change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, difficulty]);

  // Filtered Codelabs
  const filteredCodelabs = useMemo(() => {
    return CODELABS_DATA.filter((item: CodelabItem) => {
      if (activeTab === 'bookmarks' && !isBookmarked(item.id)) {
        return false;
      }
      const matchesDifficulty =
        difficulty === 'all' || item.difficulty === difficulty;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)));
      return matchesDifficulty && matchesSearch;
    });
  }, [searchQuery, difficulty, activeTab, isBookmarked]);

  // Filtered Videos
  const filteredVideos = useMemo(() => {
    return VIDEOS_DATA.filter((item: VideoItem) => {
      if (activeTab === 'bookmarks' && !isBookmarked(item.id)) {
        return false;
      }
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
  }, [searchQuery, activeTab, isBookmarked]);

  // Filtered Repos
  const filteredRepos = useMemo(() => {
    return REPOS_DATA.filter((item: RepoItem) => {
      if (activeTab === 'bookmarks' && !isBookmarked(item.id)) {
        return false;
      }
      const q = searchQuery.trim().toLowerCase();
      return (
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.language.toLowerCase().includes(q) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }, [searchQuery, activeTab, isBookmarked]);

  // Filtered Study Guides
  const filteredGuides = useMemo(() => {
    return STUDY_GUIDES_DATA.filter((item: StudyGuideItem) => {
      if (activeTab === 'bookmarks' && !isBookmarked(item.id)) {
        return false;
      }
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
  }, [searchQuery, activeTab, isBookmarked]);

  // Unified list of resources according to active tab
  const activeResources: UnifiedResource[] = useMemo(() => {
    if (activeTab === 'codelabs') {
      return filteredCodelabs.map((item) => ({ type: 'codelab', id: item.id, item }));
    }
    if (activeTab === 'videos') {
      return filteredVideos.map((item) => ({ type: 'video', id: item.id, item }));
    }
    if (activeTab === 'repos') {
      return filteredRepos.map((item) => ({ type: 'repo', id: item.id, item }));
    }
    if (activeTab === 'guides') {
      return filteredGuides.map((item) => ({ type: 'guide', id: item.id, item }));
    }
    // 'all' or 'bookmarks'
    return [
      ...filteredCodelabs.map((item) => ({ type: 'codelab' as const, id: item.id, item })),
      ...filteredVideos.map((item) => ({ type: 'video' as const, id: item.id, item })),
      ...filteredRepos.map((item) => ({ type: 'repo' as const, id: item.id, item })),
      ...filteredGuides.map((item) => ({ type: 'guide' as const, id: item.id, item })),
    ];
  }, [activeTab, filteredCodelabs, filteredVideos, filteredRepos, filteredGuides]);

  // Pagination calculation
  const totalPages = Math.ceil(activeResources.length / itemsPerPage);
  const paginatedResources = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return activeResources.slice(start, start + itemsPerPage);
  }, [activeResources, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (resourcesGridRef.current) {
      const topOffset = resourcesGridRef.current.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setDifficulty('all');
    setCurrentPage(1);
  };

  const getSectionHeader = () => {
    switch (activeTab) {
      case 'codelabs':
        return {
          title: 'Hands-On Codelabs',
          color: 'bg-google-blue',
          textColor: 'text-google-blue',
          borderColor: 'border-google-blue/20',
          bgColor: 'bg-google-blue/10',
          description: 'Guided developer tutorials with live code sandboxes, step counters, and time estimates.',
          externalLink: 'https://codelabs.developers.google.com',
          externalLabel: 'Google Codelabs Directory',
        };
      case 'videos':
        return {
          title: 'Video Library & Keynotes',
          color: 'bg-google-red',
          textColor: 'text-google-red',
          borderColor: 'border-google-red/20',
          bgColor: 'bg-google-red/10',
          description: 'Landmark developer sessions, keynote breakthroughs, and technical workshops.',
          externalLink: 'https://www.youtube.com/@GoogleDevelopers',
          externalLabel: 'Google Developers YouTube',
        };
      case 'repos':
        return {
          title: 'Campus GitHub Repos & Boilerplates',
          color: 'bg-google-green',
          textColor: 'text-google-green',
          borderColor: 'border-google-green/20',
          bgColor: 'bg-google-green/10',
          description: 'Student-tested codebases, hackathon kits, and production-ready starter templates.',
          externalLink: 'https://github.com/GoogleDeveloperStudentClubs',
          externalLabel: 'Google Developer Repos',
        };
      case 'guides':
        return {
          title: 'Study Guides & Milestones',
          color: 'bg-google-yellow',
          textColor: 'text-foreground dark:text-google-yellow',
          borderColor: 'border-google-yellow/30',
          bgColor: 'bg-google-yellow/20',
          description: 'Structured multi-stage roadmaps designed to take you from fundamentals to official Google credentials.',
          externalLink: 'https://developers.google.com/learn',
          externalLabel: 'Google Learn Hub',
        };
      case 'bookmarks':
        return {
          title: 'Saved Bookmarks',
          color: 'bg-primary',
          textColor: 'text-primary',
          borderColor: 'border-primary/20',
          bgColor: 'bg-primary/10',
          description: 'Your saved Codelabs, videos, codebases, and roadmaps stored for quick local access.',
          externalLink: undefined,
          externalLabel: undefined,
        };
      default:
        return {
          title: 'All Learning Resources',
          color: 'bg-google-blue',
          textColor: 'text-google-blue',
          borderColor: 'border-google-blue/20',
          bgColor: 'bg-google-blue/10',
          description: 'Explore the full repository of Codelabs, technical masterclasses, open-source repositories, and certification roadmaps.',
          externalLink: undefined,
          externalLabel: undefined,
        };
    }
  };

  const sectionMeta = getSectionHeader();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-google-blue/30">
      <Header />

      <main id="main-content" className="flex-1 pt-24 sm:pt-28 pb-24 relative overflow-hidden">
        {/* Ambient background glow orbs */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none -z-10 opacity-30 blur-3xl">
          <div className="w-full h-full bg-gradient-to-r from-google-blue/20 via-google-red/15 via-google-yellow/20 to-google-green/20 rounded-full" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
          {/* Header Hero Section */}
          <ResourcesHero
            counts={{
              codelabs: CODELABS_DATA.length,
              videos: VIDEOS_DATA.length,
              repos: REPOS_DATA.length,
              guides: STUDY_GUIDES_DATA.length,
              total:
                CODELABS_DATA.length +
                VIDEOS_DATA.length +
                REPOS_DATA.length +
                STUDY_GUIDES_DATA.length,
              bookmarks: bookmarksCount,
            }}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Sticky Tab Switcher & Search Bar */}
          <ResourcesFilterBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            counts={{
              all:
                CODELABS_DATA.length +
                VIDEOS_DATA.length +
                REPOS_DATA.length +
                STUDY_GUIDES_DATA.length,
              codelabs: CODELABS_DATA.length,
              videos: VIDEOS_DATA.length,
              repos: REPOS_DATA.length,
              guides: STUDY_GUIDES_DATA.length,
              bookmarks: bookmarksCount,
            }}
            totalFiltered={activeResources.length}
            onResetFilters={clearAllFilters}
          />

          {/* Target anchor for smooth scroll upon pagination */}
          <div ref={resourcesGridRef} className="scroll-mt-32" />

          {/* Zero results state */}
          {activeResources.length === 0 ? (
            <div className="text-center py-16 sm:py-20 px-6 rounded-3xl border border-dashed border-border bg-card/40 my-8">
              <Search className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-lg sm:text-xl font-bold font-display mb-2 text-foreground">
                {activeTab === 'bookmarks'
                  ? 'No saved bookmarks found'
                  : 'No matching resources found'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
                {activeTab === 'bookmarks'
                  ? 'Click the bookmark icon on any codelab, video, repo, or roadmap to save it here for fast access.'
                  : `We couldn't find anything matching "${searchQuery}". Try adjusting your keywords or clearing your filters.`}
              </p>
              {activeTab === 'bookmarks' ? (
                <button
                  type="button"
                  onClick={() => handleTabChange('all')}
                  className="inline-flex items-center justify-center h-11 min-h-[44px] px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer active:scale-95 shadow-xs"
                >
                  Browse All Resources
                </button>
              ) : (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center justify-center h-11 min-h-[44px] px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer active:scale-95 shadow-xs"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <section className="mb-16 sm:mb-20">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-border/60">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full ${sectionMeta.color} shrink-0`} />
                    <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">
                      {sectionMeta.title}
                    </h2>
                    <span
                      className={`h-6 px-2.5 text-xs font-mono font-bold rounded-full ${sectionMeta.bgColor} ${sectionMeta.textColor} border ${sectionMeta.borderColor} flex items-center`}
                    >
                      {activeResources.length}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                    {sectionMeta.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {sectionMeta.externalLink && (
                    <a
                      href={sectionMeta.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold ${sectionMeta.textColor} hover:underline`}
                    >
                      <span>{sectionMeta.externalLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {totalPages > 1 && (
                    <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/60">
                      Page {currentPage} of {totalPages}
                    </span>
                  )}
                </div>
              </div>

              {/* Paginated Resource Cards Grid or List */}
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
                    : 'flex flex-col gap-3'
                }
              >
                {paginatedResources.map((res) => {
                  switch (res.type) {
                    case 'codelab':
                      return (
                        <CodelabCard
                          key={res.id}
                          item={res.item}
                          viewMode={viewMode}
                          isBookmarked={isBookmarked(res.id)}
                          onToggleBookmark={toggleBookmark}
                        />
                      );
                    case 'video':
                      return (
                        <VideoResourceCard
                          key={res.id}
                          video={res.item}
                          viewMode={viewMode}
                          isPlayingInline={playingInlineVideoId === res.id}
                          onPlayInline={(id) => setPlayingInlineVideoId(id)}
                          onOpenTheatre={(v) => setTheatreVideo(v)}
                          isBookmarked={isBookmarked(res.id)}
                          onToggleBookmark={toggleBookmark}
                        />
                      );
                    case 'repo': {
                      const stats = liveStats[res.id] || {
                        stars: res.item.stars,
                        forks: res.item.forks,
                        isLive: false,
                      };
                      return (
                        <RepoResourceCard
                          key={res.id}
                          repo={res.item}
                          stats={stats}
                          viewMode={viewMode}
                          isBookmarked={isBookmarked(res.id)}
                          onToggleBookmark={toggleBookmark}
                        />
                      );
                    }
                    case 'guide':
                      return (
                        <StudyGuideCard
                          key={res.id}
                          guide={res.item}
                          viewMode={viewMode}
                          isBookmarked={isBookmarked(res.id)}
                          onToggleBookmark={toggleBookmark}
                        />
                      );
                    default:
                      return null;
                  }
                })}
              </div>

              {/* Pagination Controls Section (Like Tools Page) */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-6 border-t border-border/60 text-xs text-muted-foreground">
                  <div>
                    Showing{' '}
                    <span className="font-semibold text-foreground font-mono">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>
                    –
                    <span className="font-semibold text-foreground font-mono">
                      {Math.min(currentPage * itemsPerPage, activeResources.length)}
                    </span>{' '}
                    of{' '}
                    <span className="font-semibold text-foreground font-mono">
                      {activeResources.length}
                    </span>{' '}
                    resources
                  </div>

                  {/* Pagination Page Jump Buttons */}
                  <div
                    className="flex items-center gap-1.5"
                    role="navigation"
                    aria-label="Pagination navigation"
                  >
                    <button
                      type="button"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="h-9 w-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                      title="First page"
                      aria-label="Go to first page"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-9 w-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                      title="Previous page"
                      aria-label="Go to previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Numeric buttons with ellipsis */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - currentPage) <= 1
                      )
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev && p - prev > 1;
                        return (
                          <div key={p} className="flex items-center gap-1.5">
                            {showEllipsis && (
                              <span className="px-1 text-muted-foreground font-mono select-none">
                                ...
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handlePageChange(p)}
                              className={`h-9 w-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 ${
                                currentPage === p
                                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                                  : 'border border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                              }`}
                              aria-current={currentPage === p ? 'page' : undefined}
                            >
                              {p}
                            </button>
                          </div>
                        );
                      })}

                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-9 w-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                      title="Next page"
                      aria-label="Go to next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="h-9 w-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                      title="Last page"
                      aria-label="Go to last page"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Items per page selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-card border border-border rounded-xl px-2.5 py-1.5 text-foreground font-medium text-xs focus:outline-none cursor-pointer"
                      aria-label="Resources per page"
                    >
                      {ITEMS_PER_PAGE_OPTIONS.map((num) => (
                        <option key={num} value={num}>
                          {num === 46 ? 'Show All (46)' : `${num}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* Theatre Modal Player */}
      <VideoTheatreModal
        video={theatreVideo}
        isOpen={Boolean(theatreVideo)}
        onClose={() => setTheatreVideo(null)}
        isBookmarked={theatreVideo ? isBookmarked(theatreVideo.id) : false}
        onToggleBookmark={toggleBookmark}
      />

      <Footer />
    </div>
  );
};

export default ResourcesPage;
