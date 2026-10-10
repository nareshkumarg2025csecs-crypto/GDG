import React, { useRef, useEffect } from 'react';
import {
  Search,
  X,
  Filter,
  LayoutGrid,
  List,
  Bookmark,
  ArrowUpDown,
  Sparkles,
  Globe,
  Smartphone,
  Cloud,
  Palette,
  MapPin,
  Terminal,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { TOOL_CATEGORIES } from '@/data/googleTools';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  all: Layers,
  'ai-ml': Sparkles,
  web: Globe,
  mobile: Smartphone,
  cloud: Cloud,
  design: Palette,
  apis: MapPin,
  languages: Terminal,
  learning: GraduationCap,
};

export type SortOption = 'default' | 'name-asc' | 'name-desc' | 'level';

interface ToolsFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (catId: string) => void;
  selectedLevel: string;
  onLevelChange: (level: string) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  showSavedOnly: boolean;
  onToggleSavedOnly: () => void;
  savedCount: number;
  totalToolsCount: number;
  filteredCount: number;
  categoryCounts: Record<string, number>;
  onResetFilters: () => void;
}

export const ToolsFilterBar: React.FC<ToolsFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedLevel,
  onLevelChange,
  sortOption,
  onSortChange,
  viewMode,
  onViewModeChange,
  showSavedOnly,
  onToggleSavedOnly,
  savedCount,
  totalToolsCount,
  filteredCount,
  categoryCounts,
  onResetFilters,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut '/' to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        const tagName = document.activeElement?.tagName;
        if (tagName !== 'INPUT' && tagName !== 'TEXTAREA') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedLevel !== 'all' ||
    showSavedOnly ||
    sortOption !== 'default';

  return (
    <div className="space-y-4 mb-8">
      {/* Top Search & Primary Controls */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search 150+ Google tools, APIs, keywords (e.g. Gemini, Flutter, Cloud, SQL)..."
            className="w-full pl-10 pr-24 py-2.5 rounded-2xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/50 transition-all shadow-xs"
            aria-label="Search tools"
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="p-1 text-muted-foreground hover:text-foreground rounded-full transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <span className="hidden sm:inline-block text-[11px] font-mono px-1.5 py-0.5 rounded border border-border text-muted-foreground bg-muted/60">
                /
              </span>
            )}
          </div>
        </div>

        {/* View mode, Saved tools, and Sort Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Level Filter Selector */}
          <div className="inline-flex items-center rounded-xl border border-border bg-card p-1 shadow-xs">
            <span className="text-[11px] font-semibold text-muted-foreground px-2 hidden sm:inline">
              Level:
            </span>
            {['all', 'beginner', 'intermediate', 'advanced'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => onLevelChange(lvl)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium capitalize transition-colors ${
                  selectedLevel === lvl
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {lvl === 'all' ? 'All' : lvl}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="relative inline-flex items-center rounded-xl border border-border bg-card px-2.5 py-1.5 shadow-xs text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground mr-1.5" />
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent text-foreground font-medium text-xs focus:outline-none cursor-pointer pr-1"
              aria-label="Sort tools"
            >
              <option value="default">Sort: Recommended</option>
              <option value="name-asc">Sort: Name (A-Z)</option>
              <option value="name-desc">Sort: Name (Z-A)</option>
              <option value="level">Sort: Experience Level</option>
            </select>
          </div>

          {/* Saved Tools Toggle */}
          <button
            onClick={onToggleSavedOnly}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              showSavedOnly
                ? 'border-google-yellow bg-google-yellow/15 text-google-yellow shadow-xs'
                : 'border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
            title="Show saved tools"
            aria-pressed={showSavedOnly}
          >
            <Bookmark className="w-3.5 h-3.5" fill={showSavedOnly ? 'currentColor' : 'none'} />
            <span>Saved</span>
            {savedCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/10 dark:bg-white/10">
                {savedCount}
              </span>
            )}
          </button>

          {/* View Mode Switcher: Grid vs List */}
          <div className="inline-flex rounded-xl border border-border bg-card p-1 shadow-xs">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Grid View"
              aria-label="Switch to grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="List View"
              aria-label="Switch to list view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills (Scrollable with modern pills) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {TOOL_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const IconComponent = CATEGORY_ICONS[cat.id] || Layers;
          const count = categoryCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 border ${
                isSelected
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
              style={{
                backgroundColor: isSelected ? cat.color : undefined,
              }}
              aria-pressed={isSelected}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-black/20 text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Filter Status & Reset Banner */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground bg-muted/40 px-4 py-2.5 rounded-xl border border-border/70">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Showing <strong className="text-foreground">{filteredCount}</strong> of{' '}
              {totalToolsCount} tools
            </span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border text-foreground font-medium">
                Search: &ldquo;{searchQuery}&rdquo;
              </span>
            )}

            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border text-foreground font-medium">
                Category: {TOOL_CATEGORIES.find((c) => c.id === selectedCategory)?.name}
              </span>
            )}

            {selectedLevel !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border text-foreground font-medium capitalize">
                Level: {selectedLevel}
              </span>
            )}

            {showSavedOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border text-foreground font-medium">
                Saved Only
              </span>
            )}
          </div>

          <button
            onClick={onResetFilters}
            className="text-google-blue hover:underline font-semibold inline-flex items-center gap-1 shrink-0"
          >
            <span>Reset filters</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ToolsFilterBar;
