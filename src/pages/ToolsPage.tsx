import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTheme } from '@/contexts/ThemeContext';
import { TOOLS_CONFIG } from '@/config/toolsConfig';
import { GOOGLE_TOOLS, TOOL_CATEGORIES, GoogleTool } from '@/data/googleTools';
import { Navigate, useSearchParams } from 'react-router-dom';

import ToolsHero from '@/components/tools/ToolsHero';
import ToolsSpotlight from '@/components/tools/ToolsSpotlight';
import ToolsFilterBar, { SortOption } from '@/components/tools/ToolsFilterBar';
import ToolCard from '@/components/tools/ToolCard';
import ToolDetailModal from '@/components/tools/ToolDetailModal';

const ITEMS_PER_PAGE_OPTIONS = [18, 36, 72, 153];
const STORAGE_BOOKMARKS_KEY = 'gdg_saved_tools';

export const ToolsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const directoryGridRef = useRef<HTMLDivElement>(null);

  // Search & Filter State - dynamically sync with URL query params
  const categoryFromUrl = searchParams.get('category') || searchParams.get('cat') || 'all';
  const validCatIds = useMemo(() => TOOL_CATEGORIES.map((c) => c.id as string), []);
  const initialCategory = validCatIds.includes(categoryFromUrl) ? categoryFromUrl : 'all';

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(18);

  // Active Tool Modal
  const [activeModalTool, setActiveModalTool] = useState<GoogleTool | null>(null);

  // Bookmarking / Favorites (Persisted in localStorage)
  const [savedToolIds, setSavedToolIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_BOOKMARKS_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleBookmark = (toolId: string) => {
    setSavedToolIds((prev) => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else {
        next.add(toolId);
      }
      try {
        localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // ignore localStorage errors
      }
      return next;
    });
  };

  useEffect(() => {
    document.title = `${TOOLS_CONFIG.PAGE_TITLE} | GDG on Campus`;
  }, []);

  // Sync category & search query if URL changes externally
  useEffect(() => {
    const currentCat = searchParams.get('category') || searchParams.get('cat') || 'all';
    if (validCatIds.includes(currentCat)) {
      setSelectedCategory(currentCat);
    }
    const q = searchParams.get('q');
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [searchParams, validCatIds]);

  // If a specific category is requested in the URL, smoothly scroll down to the directory view
  useEffect(() => {
    const cat = searchParams.get('category') || searchParams.get('cat');
    if (cat && cat !== 'all') {
      const timer = setTimeout(() => {
        if (directoryGridRef.current) {
          const topOffset = directoryGridRef.current.getBoundingClientRect().top + window.scrollY - 90;
          window.scrollTo({ top: topOffset, behavior: 'smooth' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Handle category change and persist to URL params
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (catId === 'all') {
      newParams.delete('category');
      newParams.delete('cat');
    } else {
      newParams.set('category', catId);
      newParams.delete('cat');
    }
    setSearchParams(newParams, { replace: true });
  };

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedLevel, showSavedOnly, sortOption]);

  // Master Toggle check: If disabled, redirect to home
  if (!TOOLS_CONFIG.ENABLED) {
    return <Navigate to="/" replace />;
  }

  // Filter tools based on search, category, level, and saved
  const filteredTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = GOOGLE_TOOLS.filter((tool) => {
      // Category filter
      const matchesCategory =
        selectedCategory === 'all' || tool.category === selectedCategory;

      // Level filter
      const matchesLevel =
        selectedLevel === 'all' ||
        tool.level.toLowerCase() === selectedLevel.toLowerCase() ||
        tool.level === 'All Levels';

      // Saved only filter
      const matchesSaved = !showSavedOnly || savedToolIds.has(tool.id);

      // Search query across name, tagline, description, tags, category
      const matchesSearch =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.tagline.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.categoryLabel.toLowerCase().includes(q) ||
        tool.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesLevel && matchesSaved && matchesSearch;
    });

    // Sort tools based on sortOption
    return filtered.slice().sort((a, b) => {
      if (sortOption === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortOption === 'name-desc') {
        return b.name.localeCompare(a.name);
      }
      if (sortOption === 'level') {
        const order = { 'Beginner': 1, 'All Levels': 2, 'Intermediate': 3, 'Advanced': 4 };
        return (order[a.level] || 5) - (order[b.level] || 5);
      }
      // 'default': Featured and Trending tools prioritized, then original order
      const aWeight = a.badge === 'Featured' ? 2 : a.badge === 'Trending' ? 1 : 0;
      const bWeight = b.badge === 'Featured' ? 2 : b.badge === 'Trending' ? 1 : 0;
      return bWeight - aWeight;
    });
  }, [searchQuery, selectedCategory, selectedLevel, showSavedOnly, savedToolIds, sortOption]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: GOOGLE_TOOLS.length };
    GOOGLE_TOOLS.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, []);

  // Spotlight tools: Top 4 featured or trending tools
  const spotlightTools = useMemo(() => {
    return GOOGLE_TOOLS.filter(
      (t) => t.badge === 'Featured' || t.badge === 'Trending'
    ).slice(0, 4);
  }, []);

  // Related tools for the active modal
  const activeModalRelatedTools = useMemo(() => {
    if (!activeModalTool) return [];
    return GOOGLE_TOOLS.filter(
      (t) => t.category === activeModalTool.category && t.id !== activeModalTool.id
    ).slice(0, 4);
  }, [activeModalTool]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTools.length / itemsPerPage);
  const paginatedTools = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTools.slice(start, start + itemsPerPage);
  }, [filteredTools, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (directoryGridRef.current) {
      const topOffset = directoryGridRef.current.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLevel('all');
    setShowSavedOnly(false);
    setSortOption('default');
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('category');
    newParams.delete('cat');
    newParams.delete('q');
    setSearchParams(newParams, { replace: true });
  };

  const handleSelectTag = (tag: string) => {
    setSearchQuery(tag);
    setSelectedCategory('all');
    setSelectedLevel('all');
    setShowSavedOnly(false);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('q', tag);
    newParams.delete('category');
    newParams.delete('cat');
    setSearchParams(newParams, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-google-blue/30">
      <Header />

      <main id="main-content" className="flex-1 pt-28 sm:pt-32 pb-24 relative overflow-hidden">
        {/* Subtle background ambient blur */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none -z-10 opacity-25 blur-3xl">
          <div className="w-full h-full bg-gradient-to-r from-google-blue/20 via-google-red/15 via-google-yellow/20 to-google-green/20 rounded-full" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
          {/* Hero Section with Live Stats & Search Suggestions */}
          <ToolsHero
            totalTools={GOOGLE_TOOLS.length}
            totalCategories={TOOL_CATEGORIES.length - 1}
            onSearchSuggestion={(term) => setSearchQuery(term)}
          />

          {/* SPOTLIGHT SECTION: Curated Top Picks (shown only on default view) */}
          {!searchQuery && selectedCategory === 'all' && !showSavedOnly && (
            <ToolsSpotlight
              spotlightTools={spotlightTools}
              onOpenDetails={(t) => setActiveModalTool(t)}
              savedToolIds={savedToolIds}
              onToggleBookmark={toggleBookmark}
            />
          )}

          {/* DIRECTORY CONTROL CENTER: Search, Filters, Sort, View Modes */}
          <div ref={directoryGridRef}>
            <ToolsFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              selectedLevel={selectedLevel}
              onLevelChange={setSelectedLevel}
              sortOption={sortOption}
              onSortChange={setSortOption}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              showSavedOnly={showSavedOnly}
              onToggleSavedOnly={() => setShowSavedOnly(!showSavedOnly)}
              savedCount={savedToolIds.size}
              totalToolsCount={GOOGLE_TOOLS.length}
              filteredCount={filteredTools.length}
              categoryCounts={categoryCounts}
              onResetFilters={handleResetFilters}
            />
          </div>

          {/* MAIN TOOLS DIRECTORY */}
          {filteredTools.length > 0 ? (
            <div className="space-y-8">
              {/* Cards Grid / List */}
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
                    : 'flex flex-col gap-3'
                }
              >
                {paginatedTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    viewMode={viewMode}
                    isBookmarked={savedToolIds.has(tool.id)}
                    onToggleBookmark={toggleBookmark}
                    onOpenDetails={(t) => setActiveModalTool(t)}
                    onSelectTag={handleSelectTag}
                  />
                ))}
              </div>

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                  <div className="text-muted-foreground">
                    Showing{' '}
                    <strong className="text-foreground">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </strong>{' '}
                    to{' '}
                    <strong className="text-foreground">
                      {Math.min(currentPage * itemsPerPage, filteredTools.length)}
                    </strong>{' '}
                    of <strong className="text-foreground">{filteredTools.length}</strong> tools
                  </div>

                  {/* Page Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="First Page"
                      aria-label="First page"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Previous Page"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                      .filter((p) => {
                        return (
                          p === 1 ||
                          p === totalPages ||
                          (p >= currentPage - 2 && p <= currentPage + 2)
                        );
                      })
                      .map((p, index, array) => {
                        const showEllipsisBefore = index > 0 && p - array[index - 1] > 1;
                        return (
                          <div key={p} className="flex items-center gap-1.5">
                            {showEllipsisBefore && (
                              <span className="px-1 text-muted-foreground font-mono">…</span>
                            )}
                            <button
                              onClick={() => handlePageChange(p)}
                              className={`w-8 h-8 rounded-xl font-mono font-medium transition-colors ${
                                currentPage === p
                                  ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                                  : 'border border-border hover:bg-muted text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              {p}
                            </button>
                          </div>
                        );
                      })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Next Page"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Last Page"
                      aria-label="Last page"
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
                      className="bg-card border border-border rounded-xl px-2.5 py-1 text-foreground font-medium text-xs focus:outline-none cursor-pointer"
                      aria-label="Items per page"
                    >
                      {ITEMS_PER_PAGE_OPTIONS.map((num) => (
                        <option key={num} value={num}>
                          {num === 153 ? 'Show All (153)' : `${num}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-20 px-4 rounded-3xl border border-dashed border-border bg-card/40 max-w-lg mx-auto">
              <Code2 className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-foreground">
                No Google tools match your criteria
              </h3>
              <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
                {showSavedOnly
                  ? "You haven't bookmarked any tools yet. Click the bookmark icon on any tool card to save it for quick access."
                  : searchQuery
                  ? `No developer tools found matching "${searchQuery}". Try a different keyword or reset filters.`
                  : 'No developer tools found in this combination of filters.'}
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-6 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* QUICK VIEW / DETAIL MODAL */}
      <ToolDetailModal
        tool={activeModalTool}
        isOpen={!!activeModalTool}
        onClose={() => setActiveModalTool(null)}
        onSelectTag={handleSelectTag}
        onSelectRelatedTool={(tool) => setActiveModalTool(tool)}
        relatedTools={activeModalRelatedTools}
        isBookmarked={activeModalTool ? savedToolIds.has(activeModalTool.id) : false}
        onToggleBookmark={toggleBookmark}
      />

      <Footer />
    </div>
  );
};

export default ToolsPage;
