import React, { useRef, useEffect } from 'react';
import {
  Search,
  X,
  Calendar,
  ArrowUpDown,
  RotateCcw,
  Flame,
  Archive,
} from 'lucide-react';

export type TimeframeFilter = 'upcoming' | 'past' | 'all';
export type SortOption = 'date-asc' | 'date-desc' | 'title-asc';

interface EventsDiscoveryBarProps {
  timeframe: TimeframeFilter;
  onTimeframeChange: (tf: TimeframeFilter) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  categoryCounts: Record<string, number>;
  timeframeCounts: {
    upcoming: number;
    past: number;
    all: number;
  };
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  filteredCount: number;
  totalEventsCount: number;
  onResetFilters: () => void;
}

export const EventsDiscoveryBar: React.FC<EventsDiscoveryBarProps> = ({
  timeframe,
  onTimeframeChange,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  categoryCounts,
  timeframeCounts,
  sortOption,
  onSortChange,
  filteredCount,
  totalEventsCount,
  onResetFilters,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'all' || timeframe !== 'upcoming';

  return (
    <div className="space-y-4 mb-8">
      {/* Primary Navigation Row: Timeframe Switcher + Search Bar + Sort */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 bg-card/85 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-border/80 shadow-xs">
        {/* Prominent Segmented Switcher (Upcoming vs Past vs All) — Full width single row on mobile, no horizontal scroll */}
        <div className="grid grid-cols-3 w-full sm:w-auto sm:inline-flex sm:items-center p-1 rounded-xl bg-muted/60 border border-border/60">
          <button
            type="button"
            onClick={() => onTimeframeChange('upcoming')}
            className={`flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center select-none ${
              timeframe === 'upcoming'
                ? 'bg-google-blue text-white shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={timeframe === 'upcoming'}
          >
            <Flame className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Upcoming<span className="hidden sm:inline"> Events</span></span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                timeframe === 'upcoming' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              {timeframeCounts.upcoming}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTimeframeChange('past')}
            className={`flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center select-none ${
              timeframe === 'past'
                ? 'bg-foreground text-background shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={timeframe === 'past'}
          >
            <Archive className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Past<span className="hidden sm:inline"> Events</span></span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono shrink-0 ${
                timeframe === 'past' ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'
              }`}
            >
              {timeframeCounts.past}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTimeframeChange('all')}
            className={`flex items-center justify-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center select-none ${
              timeframe === 'all'
                ? 'bg-foreground text-background shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={timeframe === 'all'}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">All<span className="hidden sm:inline"> Events</span></span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono shrink-0 ${
                timeframe === 'all' ? 'bg-background/20 text-background' : 'bg-muted text-muted-foreground'
              }`}
            >
              {timeframeCounts.all}
            </span>
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events, topics, venues... ('/' to focus)"
            className="w-full h-11 pl-10 pr-9 rounded-xl border border-input bg-background/90 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue transition-all"
            aria-label="Search events"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Clear search"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="relative inline-flex items-center h-11 rounded-xl border border-border bg-background/90 px-3 shadow-xs text-xs self-start md:self-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground mr-2 shrink-0" />
          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="bg-transparent text-foreground font-medium text-xs focus:outline-none cursor-pointer pr-1"
            aria-label="Sort events"
          >
            <option value="date-asc">Date: Closest First</option>
            <option value="date-desc">Date: Furthest First</option>
            <option value="title-asc">Title: Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const count = categoryCounts[cat] ?? 0;
          const label = cat === 'all' ? 'All Categories' : cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategoryChange(cat)}
              className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 border cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-foreground text-background border-foreground shadow-xs font-bold'
                  : 'bg-card/75 hover:bg-muted text-muted-foreground hover:text-foreground border-border/80'
              }`}
              aria-pressed={isSelected}
            >
              <span>{label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-background/20 text-background font-bold' : 'bg-muted text-muted-foreground'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Filter Chips & Clear Action Banner */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs text-muted-foreground bg-muted/40 px-4 py-2.5 rounded-xl border border-border/70">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Showing <strong className="text-foreground font-semibold">{filteredCount}</strong> of{' '}
              {totalEventsCount} events
            </span>

            {timeframe !== 'upcoming' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border text-foreground font-medium">
                Filter: <strong className="capitalize">{timeframe === 'past' ? 'Past Events' : 'All Events'}</strong>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border text-foreground font-medium">
                Search: &ldquo;{searchQuery}&rdquo;
              </span>
            )}

            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border text-foreground font-medium">
                Category: <strong>{selectedCategory}</strong>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 text-xs text-google-blue hover:text-google-blue/80 font-semibold transition-colors cursor-pointer hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}
    </div>
  );
};
