import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, BookOpen, Code, Terminal, Video, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

interface ResourceCardItem {
  id: number;
  name: string;
  tab: 'codelabs' | 'videos' | 'repos' | 'guides';
  icon: typeof Code;
  color: string;
  num: string;
  description: string;
  href: string;
  badge: string;
}

const resources: ResourceCardItem[] = [
  {
    id: 1,
    name: 'Codelabs',
    tab: 'codelabs',
    icon: Code,
    color: '#4285F4',
    num: '01',
    description: 'Hands-on guided tutorials with live code, time estimates, and step-by-step sandboxes.',
    href: 'https://codelabs.developers.google.com',
    badge: 'Interactive',
  },
  {
    id: 2,
    name: 'Video Library',
    tab: 'videos',
    icon: Video,
    color: '#EA4335',
    num: '02',
    description: 'Tech keynotes, past workshop recordings, and upcoming campus event video archives.',
    href: 'https://www.youtube.com/@GoogleDevelopers',
    badge: 'Watch & Learn',
  },
  {
    id: 3,
    name: 'GitHub Repos',
    tab: 'repos',
    icon: Terminal,
    color: '#34A853',
    num: '03',
    description: 'Production starters, AI boilerplates, and open-source campus project code.',
    href: 'https://github.com/GoogleDeveloperStudentClubs',
    badge: 'Open Source',
  },
  {
    id: 4,
    name: 'Study Guides',
    tab: 'guides',
    icon: BookOpen,
    color: '#FBBC04',
    num: '04',
    description: 'Structured roadmaps with milestones from zero to Google Cloud & AI certifications.',
    href: 'https://developers.google.com/learn',
    badge: 'Roadmaps',
  },
];

const ResourcesSection = () => {
  const containerRef = useRef<HTMLElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const dot1x = useTransform(scrollYProgress, [0, 1], [-50, 50]);
  const dot2x = useTransform(scrollYProgress, [0, 1], [50, -50]);

  return (
    <section ref={containerRef} id="resources" className="py-20 md:py-28 relative overflow-hidden bg-background">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(52,168,83,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(52,168,83,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Floating accent dots (Desktop only to prevent mobile scroll-listener overhead) */}
      <div className="hidden md:block pointer-events-none">
        <motion.div
          style={{ x: dot1x, backgroundColor: '#4285F4', boxShadow: isDark ? '0 0 20px #4285F4' : 'none' }}
          className="absolute top-40 left-10 w-2.5 h-2.5 rounded-full"
        />
        <motion.div
          style={{ x: dot2x, backgroundColor: '#EA4335', boxShadow: isDark ? '0 0 20px #EA4335' : 'none' }}
          className="absolute top-60 right-20 w-3.5 h-3.5 rounded-full"
        />
        <motion.div
          style={{ x: dot1x, backgroundColor: '#FBBC04', boxShadow: isDark ? '0 0 15px #FBBC04' : 'none' }}
          className="absolute bottom-40 left-1/4 w-2 h-2 rounded-full"
        />
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10 max-w-7xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="mb-16 md:mb-20"
        >
          <div className="flex items-center gap-2 mb-4">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: isDark ? 'rgba(52, 168, 83, 0.15)' : 'rgba(52, 168, 83, 0.1)',
                color: '#34A853',
                border: '1px solid rgba(52, 168, 83, 0.25)',
              }}
            >
              <Sparkles className="w-3 h-3" />
              Dedicated Hub
            </span>
            <p
              className="section-eyebrow"
              style={{
                color: '#34A853',
                textShadow: isDark ? '0 0 30px #34A853' : 'none',
              }}
            >
              Knowledge Base
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2
              className="font-display leading-none"
              style={{
                fontSize: 'clamp(3rem, 9vw, 8rem)',
                color: 'hsl(var(--foreground))',
              }}
            >
              LEARN &amp;{' '}
              <span
                style={{
                  color: '#34A853',
                  textShadow: isDark ? '0 0 60px #34A85380' : 'none',
                }}
              >
                GROW
              </span>
            </h2>

            {/* CTA */}
            <Link to="/resources">
              <motion.button
                type="button"
                aria-label="Browse full resources library on dedicated page"
                whileHover={{ scale: 1.04, x: 6 }}
                whileTap={{ scale: 0.96 }}
                className="btn-shimmer inline-flex items-center gap-3 text-white px-8 py-4 rounded-full font-body font-semibold text-sm shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-green"
                style={{
                  background: 'linear-gradient(135deg, #34A853, #4285F4)',
                  boxShadow: isDark ? '0 0 40px #34A85340, 0 8px 30px rgba(0,0,0,0.3)' : '0 4px 20px rgba(52,168,83,0.3)',
                }}
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                <span>Browse Resources</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </motion.button>
            </Link>
          </div>

          <p
            className="mt-6 text-base md:text-lg leading-relaxed max-w-2xl"
            style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(31,31,31,0.55)' }}
          >
            Access our student-curated knowledge library. Explore hands-on codelabs, landmark tech talk recordings, ready-to-fork campus code repositories, and milestone-driven study roadmaps.
          </p>
        </motion.div>

        {/* Editorial 4-column card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {resources.map((res, i) => (
            <Link
              key={res.id}
              to={`/resources?tab=${res.tab}`}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-green rounded-2xl"
            >
              <motion.div
                aria-label={`Open ${res.name} resources page`}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.1, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative cursor-pointer rounded-2xl overflow-hidden block text-left select-none h-full"
                data-physics
                data-cursor="hover"
                style={{
                  minHeight: '280px',
                  border: `1px solid ${res.color}${isDark ? '28' : '18'}`,
                  background: isDark
                    ? `linear-gradient(160deg, ${res.color}12 0%, transparent 70%)`
                    : `linear-gradient(160deg, ${res.color}06 0%, #ffffff 70%)`,
                  boxShadow: isDark
                    ? `0 0 40px ${res.color}08`
                    : `0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)`,
                }}
              >
                {/* Hover border glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ boxShadow: `inset 0 0 0 1px ${res.color}50` }}
                />

                {/* Large background numeral */}
                <div
                  className="absolute bottom-[-12px] right-1 font-display leading-none pointer-events-none select-none transition-transform duration-500 group-hover:scale-110"
                  style={{
                    fontSize: 'clamp(6rem, 10vw, 9rem)',
                    color: res.color,
                    opacity: 0.07,
                  }}
                >
                  {res.num}
                </div>

                {/* Expanding top accent bar */}
                <div
                  className="h-[2px] w-0 group-hover:w-full transition-all duration-500 ease-premium"
                  style={{ backgroundColor: res.color }}
                />

                {/* Content */}
                <div className="relative z-10 p-6 md:p-8 h-full flex flex-col justify-between">
                  {/* Top header inside card: Icon + External Link fallback */}
                  <div className="flex items-center justify-between">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:rotate-12"
                      style={{
                        background: `${res.color}20`,
                        border: `1px solid ${res.color}35`,
                        boxShadow: isDark ? `0 0 20px ${res.color}25` : 'none',
                      }}
                    >
                      <res.icon className="w-5 h-5" style={{ color: res.color }} />
                    </div>

                    <button
                      type="button"
                      title={`Open official Google Developer site for ${res.name}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(res.href, '_blank', 'noopener,noreferrer');
                      }}
                      aria-label={`Open official external link for ${res.name}`}
                      className="p-2 rounded-lg opacity-60 hover:opacity-100 transition-opacity text-foreground hover:bg-black/5 dark:hover:bg-white/10 z-20"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom content */}
                  <div className="mt-14">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${res.color}15`,
                          color: res.color,
                          border: `1px solid ${res.color}30`,
                        }}
                      >
                        {res.badge}
                      </span>
                    </div>

                    <h4
                      className="font-display mb-2"
                      style={{
                        fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                        color: res.color,
                      }}
                    >
                      {res.name}
                    </h4>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(31,31,31,0.55)' }}
                    >
                      {res.description}
                    </p>

                    {/* Interactive Open button prompt on hover */}
                    <div className="mt-4 flex items-center gap-1.5 overflow-hidden h-5">
                      <span
                        className="text-xs font-semibold uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-[-8px] group-hover:translate-x-0 transition-all duration-300"
                        style={{ color: res.color }}
                      >
                        Explore Hub
                      </span>
                      <ArrowRight
                        className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
                        style={{ color: res.color }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResourcesSection;
