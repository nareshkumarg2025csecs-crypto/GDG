export type ResourceTab = 'all' | 'codelabs' | 'videos' | 'repos' | 'guides' | 'bookmarks';
export type ViewMode = 'grid' | 'list';
export type DifficultyFilter = 'all' | 'Beginner' | 'Intermediate' | 'Advanced';

export interface ResourceFilterState {
  activeTab: ResourceTab;
  searchQuery: string;
  difficulty: DifficultyFilter;
  viewMode: ViewMode;
  selectedCategory: string;
}
