import { motion, useScroll, useMotionValueEvent, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import { Menu, X, ExternalLink, Calendar, Sun, Moon, LogIn, LogOut, User, Shield } from 'lucide-react';
import { useState, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useEasterEggStore } from '@/store/easterEggStore';

// --- Constants & Data ---

const SECTIONS = [
  { id: 'home', name: 'Home', href: '/', color: '#4285F4' },
  { id: 'events', name: 'Events', href: '#events', color: '#FBBC04' },
  { id: 'team', name: 'Team', href: '/team', color: '#34A853' },
];

const SOCIAL_LINKS = [
  { name: 'LinkedIn', href: '#', text: 'Professional Updates' },
  { name: 'Twitter', href: '#', text: 'Latest News' },
  { name: 'Instagram', href: '#', text: 'Community Photos' },
  { name: 'GitHub', href: '#', text: 'Open Source' },
];

// --- Components ---

interface MagneticNavItemProps {
  children: React.ReactNode;
  href: string;
  isActive: boolean;
  color: string;
  onClick?: () => void;
  scrolled?: boolean;
  transparent?: boolean;
}

const MagneticNavItem = ({ children, href, isActive, color, onClick, scrolled, transparent }: MagneticNavItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150 };
  const xSpring = useSpring(x, springConfig);
  const ySpring = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    x.set(deltaX * 0.3);
    y.set(deltaY * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: xSpring, y: ySpring }}
      className="relative"
    >
      <Link
        to={href}
        onClick={onClick}
        className="relative px-4 py-2 text-sm font-medium transition-colors group block"
      >
        {isActive && (
          <motion.div
            layoutId="activeGlow"
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(ellipse at center, ${color}40 0%, transparent 70%)`,
              boxShadow: `0 0 30px ${color}30, 0 0 60px ${color}20`,
            }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <motion.div className={`absolute inset-0 rounded-full transition-opacity duration-300 ${transparent ? 'opacity-0' : 'opacity-0'}`} />
        <motion.span className={`relative z-10 transition-colors duration-300 ${isActive
          ? 'text-[rgb(var(--foreground))]'
          : 'text-[rgb(var(--foreground))]/70 group-hover:text-[rgb(var(--foreground))]'
          }`}>
          {children}
        </motion.span>
      </Link>
    </motion.div>
  );
};

const Header = ({ transparent = false }: { transparent?: boolean }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const logoTapHistoryRef = useRef<number[]>([]);
  const { scrollY } = useScroll();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const { isAuthenticated, profile, role, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully signed out.',
    });
  };

  // Update active section based on route
  useMemo(() => {
    if (location.pathname === '/') {
      setActiveSection('home');
    }
  }, [location]);

  // Determine active color based on state
  const activeColor = useMemo(() => {
    return SECTIONS.find(s => s.id === activeSection)?.color || '#4285F4';
  }, [activeSection]);

  const handleLogoPointerDown = () => {
    const now = Date.now();
    const recentTaps = logoTapHistoryRef.current.filter((timestamp) => now - timestamp <= 4000);
    recentTaps.push(now);
    logoTapHistoryRef.current = recentTaps;

    if (recentTaps.length < 7) return;

    logoTapHistoryRef.current = [];
    setMenuOpen(false);
    useEasterEggStore.getState().openTerminal();
    toast({
      title: "Terminal Unlocked",
      description: "Hidden channel open. Type 'help'.",
      duration: 2400,
    });
  };

  useMotionValueEvent(scrollY, "change", (latest) => {
    const direction = latest > lastScrollY ? "down" : "up";
    if (latest > 50) {
      setScrolled(true);
      setIsHidden(direction === "down" && latest > 300);
    } else {
      setScrolled(false);
      setIsHidden(false);
    }
    setLastScrollY(latest);
  });

  // Helper to toggle between transparent and solid styles
  const isTransparentState = transparent && !scrolled && !menuOpen;

  return (
    <>
      <motion.header
        variants={{
          visible: { y: 0, opacity: 1 },
          hidden: { y: -100, opacity: 0 }
        }}
        animate={isHidden ? "hidden" : "visible"}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed top-0 left-0 right-0 z-50 flex justify-center py-4 px-4"
      >
        <motion.nav
          className="relative flex items-center gap-1 pl-2 pr-2 py-2 rounded-full border transition-all duration-300"
          style={{
            background: theme === 'light'
              ? 'rgba(255, 255, 255, 0.88)'
              : isTransparentState ? 'rgba(5, 5, 5, 0.0)' : 'rgba(5, 5, 5, 0.75)',
            backdropFilter: isTransparentState ? 'none' : 'blur(24px) saturate(200%)',
            WebkitBackdropFilter: isTransparentState ? 'none' : 'blur(24px) saturate(200%)',
            borderColor: theme === 'light'
              ? 'rgba(226, 226, 222, 0.6)'
              : isTransparentState ? 'transparent' : 'rgba(255,255,255,0.08)',
            boxShadow: theme === 'light'
              ? '0 4px 24px -4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)'
              : isTransparentState
                ? 'none'
                : `0 0 0 1px rgba(255,255,255,0.05), 0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 80px ${activeColor}15`,
            width: 'auto',
            maxWidth: '95vw'
          }}
        >
          <motion.a
            href="/"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-2 mr-2"
            onPointerDown={handleLogoPointerDown}
            data-easter-trigger="logo"
            data-no-leet
          >
            <span className="font-sans text-xl font-bold tracking-tight" style={{ color: theme === 'light' ? '#1F1F1F' : 'white' }}>GDG</span>
            <div className="flex gap-0.5">
              {['#4285F4', '#EA4335', '#FBBC04', '#34A853'].map((color, i) => (
                <motion.div
                  key={color}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </motion.a>

          {/* Desktop Nav Items - Hidden on Mobile */}
          <div className="hidden md:flex items-center gap-1">
            <div className="w-px h-6 mr-2" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
            {SECTIONS.map((section) => (
              <MagneticNavItem
                key={section.id}
                href={section.href}
                isActive={activeSection === section.id}
                color={section.color}
                onClick={() => setActiveSection(section.id)}
                scrolled={scrolled}
                transparent={transparent}
              >
                {section.name}
              </MagneticNavItem>
            ))}
            <div className="w-px h-6 mx-2" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
          </div>

          {/* Spacer for mobile layout to push CTA to right */}
          <div className="flex-grow md:hidden" />

          {/* Auth Action / User Profile Pill */}
          {isAuthenticated && profile ? (
            <div className="flex items-center gap-1 sm:gap-1.5 mr-1">
              <div
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border transition-all"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                }}
              >
                {role === 'admin' ? (
                  <Shield className="w-3.5 h-3.5 text-google-red shrink-0" />
                ) : (
                  <User className="w-3.5 h-3.5 text-google-blue shrink-0" />
                )}
                <span className="max-w-[70px] sm:max-w-[110px] truncate text-foreground">
                  {profile.full_name || profile.email.split('@')[0]}
                </span>
                <span
                  className="hidden xs:inline-block px-1.5 py-0.2 text-[9px] sm:text-[10px] rounded uppercase font-mono font-bold"
                  style={{
                    backgroundColor: role === 'admin' ? 'rgba(234, 67, 53, 0.15)' : 'rgba(66, 133, 244, 0.15)',
                    color: role === 'admin' ? '#EA4335' : '#4285F4',
                  }}
                >
                  {role}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                title="Log Out"
                className="flex items-center justify-center p-1.5 sm:p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label="Log Out"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </motion.button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 mr-1 rounded-full text-xs font-semibold text-foreground/80 hover:text-foreground hover:bg-surface-200 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5 text-google-blue" />
              <span>Sign In</span>
            </Link>
          )}

          {/* CTA Button */}
          <motion.a
            href="#events"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all"
            style={{
              background: `linear-gradient(135deg, ${activeColor}, ${activeColor}cc)`,
              boxShadow: `0 4px 20px ${activeColor}40, 0 0 40px ${activeColor}20`,
            }}
          >
            <Calendar className="w-4 h-4 text-white" />
            <span className="text-white hidden sm:inline">Join</span>
          </motion.a>

          {/* Mobile Menu Toggle Button */}
          <motion.button
            onClick={() => setMenuOpen(!menuOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 ml-2 flex items-center justify-center rounded-full transition-all z-50"
            aria-label="Menu"
            style={{
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(31,31,31,0.06)',
              color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(31,31,31,0.7)',
            }}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </motion.nav>
      </motion.header>

      {/* Full Screen Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl"
          >
            {/* Grid Background */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            />

            {/* Decorative Gradients */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[100px] pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(66, 133, 244, 0.2) 0%, transparent 70%)' }}
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[100px] pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(234, 67, 53, 0.15) 0%, transparent 70%)' }}
            />

            <div className="h-full flex flex-col pt-32 pb-12 overflow-y-auto container mx-auto px-6 relative z-10">
              <div className="flex flex-col lg:flex-row justify-between h-full">

                {/* Navigation Links */}
                <nav className="flex flex-col gap-2">
                  {SECTIONS.map((item, i) => (
                    <motion.a
                      key={item.name}
                      href={item.href}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -50, opacity: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      onClick={() => {
                        setActiveSection(item.id);
                        setMenuOpen(false);
                      }}
                      className="group flex items-baseline gap-6 py-2"
                    >
                      <span className="text-xs font-mono text-white/40 group-hover:text-white/80 transition-colors">0{i + 1}</span>
                      <span
                        className="text-5xl md:text-7xl font-sans font-bold transition-all duration-300 group-hover:translate-x-4"
                        style={{
                          color: activeSection === item.id ? item.color : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {item.name}
                      </span>
                    </motion.a>
                  ))}

                  {/* Auth Link in Mobile Nav */}
                  <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -50, opacity: 0 }}
                    transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="pt-4 mt-2 border-t border-white/10"
                  >
                    {isAuthenticated && profile ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 py-2">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                            {role === 'admin' ? <Shield className="w-5 h-5 text-google-red" /> : <User className="w-5 h-5 text-google-blue" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{profile.full_name || profile.email}</p>
                            <p className="text-xs text-white/50 uppercase font-mono">{role} Account</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            handleLogout();
                            setMenuOpen(false);
                          }}
                          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-destructive/20 text-destructive border border-destructive/30 text-sm font-semibold hover:bg-destructive/30 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <Link
                          to="/login"
                          onClick={() => setMenuOpen(false)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/15 transition-all"
                        >
                          <LogIn className="w-4 h-4 text-google-blue" />
                          <span>Sign In</span>
                        </Link>
                        <Link
                          to="/signup"
                          onClick={() => setMenuOpen(false)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-google-blue hover:bg-google-blue/90 text-white text-sm font-semibold transition-all"
                        >
                          <span>Sign Up</span>
                        </Link>
                      </div>
                    )}
                  </motion.div>
                </nav>

                {/* Social & Contact */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-12 lg:mt-0 lg:self-end w-full lg:max-w-xs"
                >
                  <p className="text-xs uppercase tracking-widest text-white/40 mb-6 font-mono">Connect</p>
                  <div className="grid grid-cols-1 gap-3">
                    {SOCIAL_LINKS.map((social, i) => (
                      <a
                        key={social.name}
                        href={social.href}
                        className="group flex items-center justify-between p-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 transition-all"
                      >
                        <div>
                          <p className="font-medium text-white">{social.name}</p>
                          <p className="text-xs text-white/40 group-hover:text-white/60">{social.text}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
                      </a>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/10">
                    <a
                      href="mailto:contact@gdg.community"
                      className="text-lg font-medium bg-gradient-to-r from-blue-400 via-red-400 to-yellow-400 bg-clip-text text-transparent"
                    >
                      contact@gdg.community
                    </a>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
