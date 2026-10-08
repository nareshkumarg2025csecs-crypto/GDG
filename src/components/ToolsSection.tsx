import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Sparkles, ExternalLink, BookOpen, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { TOOLS_CONFIG } from '@/config/toolsConfig';
import { GOOGLE_TOOLS } from '@/data/googleTools';

export const ToolsSection = () => {
  const containerRef = useRef<HTMLElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const dot1x = useTransform(scrollYProgress, [0, 1], [-40, 40]);
  const dot2x = useTransform(scrollYProgress, [0, 1], [40, -40]);

  // Master toggle check: If disabled or hidden from home page, render zero markup
  if (!TOOLS_CONFIG.ENABLED || !TOOLS_CONFIG.SHOW_ON_HOME_PAGE) {
    return null;
  }

  // Pick top 6 spotlight tools across diverse categories for home page preview
  const previewTools = GOOGLE_TOOLS.filter((t) =>
    ['google-ai-studio', 'gemini-api', 'flutter', 'firebase', 'chrome-devtools', 'google-codelabs'].includes(t.id)
  );

  return (
    <section
      ref={containerRef}
      id="tools"
      className="py-20 md:py-28 relative overflow-hidden bg-background"
      aria-label="Google Developer Tools Showcase"
    >
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(234,67,53,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(234,67,53,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Floating accent dots (Desktop only) */}
      <div className="hidden md:block pointer-events-none">
        <motion.div
          style={{ x: dot1x, backgroundColor: '#EA4335', boxShadow: isDark ? '0 0 20px #EA4335' : 'none' }}
          className="absolute top-36 left-12 w-2.5 h-2.5 rounded-full"
        />
        <motion.div
          style={{ x: dot2x, backgroundColor: '#4285F4', boxShadow: isDark ? '0 0 20px #4285F4' : 'none' }}
          className="absolute top-52 right-16 w-3 h-3 rounded-full"
        />
        <motion.div
          style={{ x: dot1x, backgroundColor: '#34A853', boxShadow: isDark ? '0 0 15px #34A853' : 'none' }}
          className="absolute bottom-32 left-1/3 w-2 h-2 rounded-full"
        />
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10 max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border border-google-red/30 bg-google-red/10 text-google-red mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{TOOLS_CONFIG.SECTION_TITLE}</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
              Google Developer <span className="text-google-red">Tools</span>
            </h2>
            <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
              {TOOLS_CONFIG.SECTION_SUBTITLE}
            </p>
          </div>

          <Link
            to="/tools"
            className="inline-flex items-center gap-2 text-sm font-bold text-google-red hover:underline shrink-0 group self-start md:self-auto"
          >
            <span>Explore All {GOOGLE_TOOLS.length} Tools</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* 6 Preview Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {previewTools.map((tool, index) => (
            <motion.article
              key={tool.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-card hover:border-border hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Colored top bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1 transition-opacity opacity-75 group-hover:opacity-100"
                style={{ backgroundColor: tool.color }}
              />

              <div>
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
                  {tool.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground border border-border">
                      {tool.badge}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-foreground group-hover:text-google-blue transition-colors">
                  {tool.name}
                </h3>
                <p className="text-xs font-medium text-foreground/80 mt-1 line-clamp-1">
                  {tool.tagline}
                </p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                  {tool.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mt-3.5">
                  {tool.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-muted/60 text-muted-foreground border border-border/40"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-5 border-t border-border/60 flex items-center justify-between gap-2">
                <a
                  href={tool.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-google-blue" />
                  <span>Docs</span>
                </a>

                <a
                  href={tool.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 py-1 px-3 rounded-xl text-xs font-bold text-white transition-all shadow-sm hover:opacity-90"
                  style={{
                    backgroundColor: tool.color,
                  }}
                >
                  <span>Launch</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Link
            to="/tools"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-sm font-bold bg-primary text-primary-foreground hover:opacity-95 shadow-lg transition-all hover:scale-105"
          >
            <Layers className="w-4 h-4" />
            <span>Browse Complete Directory of Google Tools</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default ToolsSection;
