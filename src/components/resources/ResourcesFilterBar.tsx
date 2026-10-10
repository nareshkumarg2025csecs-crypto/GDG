import React, { useRef, useEffect } from 'react';
import {
  Search,
  X,
  Layers,
  Code,
  Video,
  Terminal,
  BookOpen,
  Bookmark,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from 'lucide-react';
import { ResourceTab, DifficultyFilter, ViewMode } from './types';

interface ResourcesFilterBarProps {
  activeTab: ResourceTab;
  onTabChange: (tab: ResourceTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  difficulty: DifficultyFilter;
  onDifficultyChange: (difficulty: DifficultyFilter) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  counts: {
    all: number;
    codelabs: number;
    videos: number;
    repos: number;
    guides: number;
    bookmarks: number;
  };
  totalFiltered: number;
  onResetFilters: () => void;
}

export const ResourcesFilterBar: React.FC<ResourcesFilterBarProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  difficulty,
  onDifficultyChange,
  viewMode,
  onViewModeChange,
  counts,
  totalFiltered,
  onResetFilters,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: pressing '/' focuses search when not in another input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const tabs: Array<{
    id: ResourceTab;
    label: string;
    icon: React.ElementType;
    count: number;
    accentColor: string;
  }> = [
      { id: 'all', label: 'All Resources', icon: Layers, count: counts.all, accentColor: '#4285F4' },
      { id: 'codelabs', label: 'Codelabs', icon: Code, count: counts.codelabs, accentColor: '#4285F4' },
      { id: 'videos', label: 'Videos', icon: Video, count: counts.videos, accentColor: '#EA4335' },
      { id: 'repos', label: 'GitHub Repos', icon: Terminal, count: counts.repos, accentColor: '#34A853' },
      { id: 'guides', label: 'Roadmaps', icon: BookOpen, count: counts.guides, accentColor: '#FBBC04' },
    ];

  if (counts.bookmarks > 0) {
    tabs.push({
      id: 'bookmarks',
      label: 'Bookmarks',
      icon: Bookmark,
      count: counts.bookmarks,
      accentColor: '#8B5CF6',
    });
  }

  const isFiltered = Boolean(searchQuery.trim() || difficulty !== 'all');

  return (
    <div className="sticky top-16 sm:top-20 z-30 mb-8 py-3 bg-background/90 backdrop-blur-md border-y border-border/70 shadow-xs -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Track Selector Tabs */}
        <div
          role="tablist"
          aria-label="Resource tracks"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none shrink-0"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer select-none ${isActive
                    ? 'text-white shadow-sm'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                style={{
                  backgroundColor: isActive ? tab.accentColor : undefined,
                }}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full leading-none ${isActive ? 'bg-black/25 text-white' : 'bg-background text-muted-foreground'
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Difficulty, and View Controls */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-72 md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tutorials, tech stacks..."
              aria-label="Search resources"
              className="w-full pl-9 pr-14 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-google-blue/30 focus:border-google-blue transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md cursor-pointer"
                title="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center justify-center absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70 bg-muted/60 border border-border/60 rounded pointer-events-none">
                /
              </kbd>
            )}
          </div>

          {/* Difficulty Level Dropdown (Relevant when on All or Codelabs) */}
          {(activeTab === 'all' || activeTab === 'codelabs') && (
            <div className="relative shrink-0">
              <select
                value={difficulty}
                onChange={(e) => onDifficultyChange(e.target.value as DifficultyFilter)}
                aria-label="Filter by difficulty"
                className="py-2 pl-3 pr-8 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/30 cursor-pointer appearance-none"
              >
                <option value="all">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              <SlidersHorizontal className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          )}

          {/* View Mode Switcher (Grid vs Compact List) */}
          <div className="flex items-center p-0.5 rounded-xl border border-border bg-muted/30 shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              aria-label="Grid layout"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              aria-label="List layout"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'list'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
              title="Compact list view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Summary Bar if filtered */}
      {isFiltered && (
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/40 text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground">
              {totalFiltered} result{totalFiltered !== 1 ? 's' : ''} found:
            </span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-google-blue/10 text-google-blue font-medium border border-google-blue/20">
                Keyword: &quot;{searchQuery}&quot;
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="cursor-pointer hover:opacity-80"
                >
                  <X className="w-3 h-3 ml-1" />
                </button>
              </span>
            )}
            {difficulty !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-google-green/10 text-google-green font-medium border border-google-green/20">
                Level: {difficulty}
                <button
                  type="button"
                  onClick={() => onDifficultyChange('all')}
                  className="cursor-pointer hover:opacity-80"
                >
                  <X className="w-3 h-3 ml-1" />
                </button>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs text-google-blue hover:underline font-semibold cursor-pointer ml-auto"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
};

export default ResourcesFilterBar;
