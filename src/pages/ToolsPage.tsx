import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ExternalLink,
  BookOpen,
  Sparkles,
  Layers,
  CheckCircle2,
  Filter,
  X,
  Code2,
  Terminal,
  Cpu,
  Globe,
  Smartphone,
  Cloud,
  Palette,
  MapPin,
  GraduationCap,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTheme } from '@/contexts/ThemeContext';
import { TOOLS_CONFIG } from '@/config/toolsConfig';
import { GOOGLE_TOOLS, TOOL_CATEGORIES, GoogleTool } from '@/data/googleTools';
import { Navigate } from 'react-router-dom';

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

export const ToolsPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  useEffect(() => {
    document.title = `${TOOLS_CONFIG.PAGE_TITLE} | GDG on Campus`;
  }, []);

  // If Master Toggle is disabled, redirect safely to home
  if (!TOOLS_CONFIG.ENABLED) {
    return <Navigate to="/" replace />;
  }

  // Filter tools based on search, category, and level
  const filteredTools = useMemo(() => {
    return GOOGLE_TOOLS.filter((tool) => {
      const matchesCategory =
        selectedCategory === 'all' || tool.category === selectedCategory;

      const matchesLevel =
        selectedLevel === 'all' ||
        tool.level.toLowerCase() === selectedLevel.toLowerCase() ||
        tool.level === 'All Levels';

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.tagline.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesLevel && matchesSearch;
    });
  }, [searchQuery, selectedCategory, selectedLevel]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: GOOGLE_TOOLS.length };
    GOOGLE_TOOLS.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, []);

  // Featured spotlight tools
  const spotlightTools = useMemo(() => {
    return GOOGLE_TOOLS.filter((t) => t.badge === 'Featured' || t.badge === 'Trending').slice(0, 4);
  }, []);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLevel('all');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-google-blue/30">
      <Header />

      <main id="main-content" className="flex-1 pt-28 sm:pt-32 pb-24 relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none -z-10 opacity-30 blur-3xl">
          <div className="w-full h-full bg-gradient-to-r from-google-blue/20 via-google-red/15 via-google-yellow/20 to-google-green/20 rounded-full" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
          {/* Header Banner */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border/80 bg-muted/40 backdrop-blur-sm text-xs font-semibold text-foreground/80 mb-4 shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-google-red animate-pulse" />
              <span>Official GDG Resource Hub</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground"
            >
              Google Developer <span className="text-google-blue">Tools</span>{' '}
              <span className="text-google-red">Hub</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed"
            >
              {TOOLS_CONFIG.PAGE_SUBTITLE}
            </motion.p>

            {/* Quick Stats Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-medium text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-google-blue" />
                <span>{GOOGLE_TOOLS.length} Developer Tools</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-google-green" />
                <span>8 Major Disciplines</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-google-yellow" />
                <span>100% Free Documentation</span>
              </div>
            </motion.div>
          </div>

          {/* SPOTLIGHT SECTION: Top Picks */}
          {!searchQuery && selectedCategory === 'all' && (
            <section aria-label="Featured Tools Spotlight" className="mb-14">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-google-yellow" />
                  Featured & Trending Picks
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {spotlightTools.map((tool) => (
                  <motion.div
                    key={tool.id}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 sm:p-5 rounded-2xl border border-border/80 bg-card hover:border-google-blue/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase"
                          style={{
                            backgroundColor: `${tool.color}15`,
                            color: tool.color,
                          }}
                        >
                          {tool.badge || tool.categoryLabel}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">{tool.level}</span>
                      </div>
                      <h3 className="text-base font-bold text-foreground">{tool.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {tool.tagline}
                      </p>
                    </div>

                    <div className="pt-4 mt-3 border-t border-border/50 flex items-center gap-2">
                      <a
                        href={tool.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                        aria-label={`Open ${tool.name} in new tab`}
                      >
                        <span>Open Tool</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={tool.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center p-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-foreground transition-colors"
                        title="Documentation"
                        aria-label={`${tool.name} Documentation`}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* SEARCH & FILTERS BAR */}
          <div className="space-y-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tools, APIs, keywords (e.g. Gemini, Flutter, SQL)..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-google-blue/50 transition-all shadow-sm"
                  aria-label="Search tools"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Level Filter */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
                <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Level:</span>
                <div className="inline-flex rounded-xl border border-border bg-card p-1 shadow-sm">
                  {['all', 'beginner', 'intermediate', 'advanced'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedLevel(lvl)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium capitalize transition-colors ${
                        selectedLevel === lvl
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {lvl === 'all' ? 'All' : lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Category Filter Pills (Horizontal Scrollable on Mobile) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {TOOL_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const IconComponent = CATEGORY_ICONS[cat.id] || Layers;
                const count = categoryCounts[cat.id] || 0;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 border ${
                      isSelected
                        ? 'border-transparent text-white shadow-sm'
                        : 'border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                    style={{
                      backgroundColor: isSelected ? cat.color : undefined,
                    }}
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
          </div>

          {/* ACTIVE FILTER STATUS BANNER */}
          {(searchQuery || selectedCategory !== 'all' || selectedLevel !== 'all') && (
            <div className="mb-6 flex items-center justify-between text-xs text-muted-foreground bg-muted/30 px-3.5 py-2 rounded-xl border border-border/60">
              <div>
                Showing <strong className="text-foreground">{filteredTools.length}</strong> of{' '}
                {GOOGLE_TOOLS.length} tools
                {searchQuery && (
                  <span>
                    {' '}
                    matching &ldquo;<span className="text-foreground">{searchQuery}</span>&rdquo;
                  </span>
                )}
              </div>
              <button
                onClick={handleResetFilters}
                className="text-google-blue hover:underline font-semibold flex items-center gap-1"
              >
                <span>Reset filters</span>
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* MAIN TOOLS GRID */}
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredTools.map((tool) => (
                  <motion.article
                    key={tool.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-card hover:border-border hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Color Accent Indicator Strip */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1 transition-opacity opacity-70 group-hover:opacity-100"
                      style={{ backgroundColor: tool.color }}
                    />

                    <div>
                      {/* Card Header: Category & Level */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: `${tool.color}15`,
                            color: tool.color,
                          }}
                        >
                          {tool.categoryLabel}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {tool.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border">
                              {tool.badge}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-muted-foreground">{tool.level}</span>
                        </div>
                      </div>

                      {/* Title & Tagline */}
                      <h3 className="text-lg font-bold text-foreground group-hover:text-google-blue transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-xs font-medium text-foreground/80 mt-1 line-clamp-1">
                        {tool.tagline}
                      </p>

                      {/* Detailed Description */}
                      <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed line-clamp-3">
                        {tool.description}
                      </p>

                      {/* Tag Chips */}
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {tool.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-muted/60 text-muted-foreground border border-border/40"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-4 mt-5 border-t border-border/60 flex items-center justify-between gap-3">
                      <a
                        href={tool.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-google-blue" />
                        <span>Documentation</span>
                      </a>

                      <a
                        href={tool.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm hover:opacity-90"
                        style={{
                          backgroundColor: tool.color,
                        }}
                      >
                        <span>Open Tool</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-border bg-card/50 max-w-lg mx-auto">
              <Code2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-60" />
              <h3 className="text-lg font-bold text-foreground">No Google tools match your criteria</h3>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto">
                Try searching for a different keyword or reset the category and experience level filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-5 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ToolsPage;
