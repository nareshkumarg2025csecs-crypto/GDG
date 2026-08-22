import { motion, useScroll, useMotionValueEvent, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import { Menu, X, ExternalLink, Calendar, Sun, Moon, LogIn, LogOut, User, Shield, ChevronDown, Check, LayoutDashboard } from 'lucide-react';
import { useState, useRef, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useEasterEggStore } from '@/store/easterEggStore';
import { UserAvatar } from '@/components/common/UserAvatar';

// --- Constants & Data ---

const SECTIONS = [
  { id: 'home', name: 'Home', href: '/', color: '#4285F4' },
  { id: 'events', name: 'Events', href: '/events', color: '#FBBC04' },
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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const logoTapHistoryRef = useRef<number[]>([]);
  const { scrollY } = useScroll();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const { user, isAuthenticated, profile, role, logout } = useAuth();

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    setMenuOpen(false);
    await logout();
    toast({
      title: 'Logged Out',
      description: 'You have been successfully signed out.',
    });
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Update active section based on route
  useMemo(() => {
    if (location.pathname.startsWith('/admin')) {
      setActiveSection('admin');
    } else if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/profile')) {
      setActiveSection('dashboard');
    } else if (location.pathname.startsWith('/events')) {
      setActiveSection('events');
    } else if (location.pathname.startsWith('/team')) {
      setActiveSection('team');
    } else if (location.pathname === '/') {
      setActiveSection('home');
    }
  }, [location.pathname]);

  // Determine active color based on state
  const activeColor = useMemo(() => {
    if (activeSection === 'admin') return '#EA4335';
    if (activeSection === 'dashboard') return '#4285F4';
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
              ? 'rgba(255, 255, 255, 0.92)'
              : isTransparentState ? 'rgba(5, 5, 5, 0.0)' : 'rgba(15, 15, 15, 0.85)',
            backdropFilter: isTransparentState ? 'none' : 'blur(24px) saturate(200%)',
            WebkitBackdropFilter: isTransparentState ? 'none' : 'blur(24px) saturate(200%)',
            borderColor: theme === 'light'
              ? 'rgba(226, 226, 222, 0.8)'
              : isTransparentState ? 'transparent' : 'rgba(255,255,255,0.12)',
            boxShadow: theme === 'light'
              ? '0 4px 24px -4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)'
              : isTransparentState
                ? 'none'
                : `0 0 0 1px rgba(255,255,255,0.05), 0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 80px ${activeColor}15`,
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
            <span className="font-sans text-xl font-bold tracking-tight text-foreground">GDG</span>
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
            <div className="w-px h-6 mr-2 border-r border-border" />
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
            {isAuthenticated && (
              <MagneticNavItem
                href="/dashboard"
                isActive={activeSection === 'dashboard'}
                color="#4285F4"
                onClick={() => setActiveSection('dashboard')}
                scrolled={scrolled}
                transparent={transparent}
              >
                Dashboard
              </MagneticNavItem>
            )}
            {role === 'admin' && (
              <MagneticNavItem
                href="/admin/events"
                isActive={activeSection === 'admin'}
                color="#EA4335"
                onClick={() => setActiveSection('admin')}
                scrolled={scrolled}
                transparent={transparent}
              >
                Admin Events
              </MagneticNavItem>
            )}
            <div className="w-px h-6 mx-2 border-r border-border" />
          </div>

          {/* Spacer for mobile layout */}
          <div className="flex-grow md:hidden" />

          {/* User Profile Button with Dropdown (Desktop & Responsive) */}
          {isAuthenticated && profile ? (
            <div className="relative" ref={profileDropdownRef}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={profileDropdownOpen}
                aria-label="User account profile and settings menu"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground transition-all shadow-sm"
                title="User Profile & Settings"
              >
                <UserAvatar
                  name={profile.full_name}
                  email={profile.email}
                  avatarUrl={profile.details?.avatar_url || profile.details?.picture}
                  userId={user?.id}
                  size="xs"
                  showBorder={false}
                />
                <span className="max-w-[70px] sm:max-w-[110px] truncate text-foreground font-medium">
                  {profile.full_name || profile.email.split('@')[0]}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                    profileDropdownOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </motion.button>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {profileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    role="menu"
                    aria-label="User account options"
                    className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-card text-card-foreground shadow-2xl p-2 z-50 space-y-1"
                  >
                    {/* User Info Header */}
                    <div className="p-3 border-b border-border/80 flex items-center gap-3">
                      <UserAvatar
                        name={profile.full_name}
                        email={profile.email}
                        avatarUrl={profile.details?.avatar_url || profile.details?.picture}
                        userId={user?.id}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {profile.full_name || 'GDG Member'}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{profile.email}</p>
                        <div className="mt-1">
                          <span
                            className="inline-block px-2 py-0.5 text-[9px] rounded-full uppercase font-mono font-bold"
                            style={{
                              backgroundColor:
                                role === 'admin' ? 'rgba(234, 67, 53, 0.15)' : 'rgba(66, 133, 244, 0.15)',
                              color: role === 'admin' ? '#EA4335' : '#4285F4',
                            }}
                          >
                            {role} Account
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Option 1: My Dashboard */}
                    <Link
                      to="/dashboard"
                      role="menuitem"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-google-blue" aria-hidden="true" />
                      <span>My Dashboard</span>
                    </Link>

                    {/* Option 2: Theme Toggle */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        toggleTheme();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        {isDark ? (
                          <Sun className="w-4 h-4 text-google-yellow" aria-hidden="true" />
                        ) : (
                          <Moon className="w-4 h-4 text-google-blue" aria-hidden="true" />
                        )}
                        <span>Theme Mode</span>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground uppercase">
                        {theme}
                      </span>
                    </button>

                    {/* Option 3: Logout Option */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-destructive/10 text-destructive text-xs font-semibold transition-colors"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      <span>Log Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Standalone Theme Toggle when logged out */
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
                className="p-2 rounded-full border border-border bg-card hover:bg-muted text-foreground transition-colors"
                aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-google-yellow" aria-hidden="true" />
                ) : (
                  <Moon className="w-4 h-4 text-google-blue" aria-hidden="true" />
                )}
              </motion.button>
              <Link
                to="/login"
                aria-label="Sign In to your account"
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-google-blue" aria-hidden="true" />
                <span>Sign In</span>
              </Link>
            </div>
          )}

          {/* CTA Button */}
          <Link
            to={role === 'admin' ? '/admin/events' : '/events'}
            aria-label={role === 'admin' ? "Manage GDG events in Admin Portal" : "View GDG Events"}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ml-1"
            style={{
              background: `linear-gradient(135deg, ${activeColor}, ${activeColor}cc)`,
              boxShadow: `0 4px 20px ${activeColor}40, 0 0 40px ${activeColor}20`,
            }}
          >
            <Calendar className="w-4 h-4 text-white" aria-hidden="true" />
            <span className="text-white hidden sm:inline">{role === 'admin' ? 'Manage' : 'Events'}</span>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <motion.button
            onClick={() => setMenuOpen(!menuOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 ml-1 flex items-center justify-center rounded-full transition-all z-50 border border-border bg-card text-foreground"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          </motion.button>
        </motion.nav>
      </motion.header>

      {/* Full Screen Menu Overlay (Responsive) */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl"
          >
            {/* Grid Background */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            />

            <div className="h-full flex flex-col pt-28 pb-12 overflow-y-auto container mx-auto px-6 relative z-10">
              <div className="flex flex-col justify-between h-full space-y-8">

                {/* Navigation Links */}
                <nav className="flex flex-col gap-2">
                  {SECTIONS.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -50, opacity: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        to={item.href}
                        onClick={() => {
                          setActiveSection(item.id);
                          setMenuOpen(false);
                        }}
                        className="group flex items-baseline gap-6 py-2"
                      >
                        <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors">0{i + 1}</span>
                        <span
                          className="text-4xl sm:text-6xl font-sans font-bold transition-all duration-300 group-hover:translate-x-4"
                          style={{
                            color: activeSection === item.id ? item.color : 'rgb(var(--foreground))',
                          }}
                        >
                          {item.name}
                        </span>
                      </Link>
                    </motion.div>
                  ))}

                  {isAuthenticated && (
                    <motion.div
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -50, opacity: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      <Link
                        to="/dashboard"
                        onClick={() => {
                          setActiveSection('dashboard');
                          setMenuOpen(false);
                        }}
                        className="group flex items-baseline gap-6 py-2"
                      >
                        <span className="text-xs font-mono text-google-blue">04</span>
                        <span className="text-4xl sm:text-6xl font-sans font-bold text-google-blue transition-all duration-300 group-hover:translate-x-4">
                          Dashboard
                        </span>
                      </Link>
                    </motion.div>
                  )}

                  {role === 'admin' && (
                    <motion.div
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -50, opacity: 0 }}
                      transition={{ delay: 0.35, duration: 0.5 }}
                    >
                      <Link
                        to="/admin/events"
                        onClick={() => {
                          setActiveSection('admin');
                          setMenuOpen(false);
                        }}
                        className="group flex items-baseline gap-6 py-2"
                      >
                        <span className="text-xs font-mono text-google-red">05</span>
                        <span className="text-4xl sm:text-6xl font-sans font-bold text-google-red transition-all duration-300 group-hover:translate-x-4">
                          Admin Portal
                        </span>
                      </Link>
                    </motion.div>
                  )}
                </nav>

                {/* User Profile, Theme Toggle & Auth Actions in Responsive Drawer */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ delay: 0.35, duration: 0.5 }}
                  className="pt-6 border-t border-border space-y-4"
                >
                  {isAuthenticated && profile ? (
                    <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={profile.full_name}
                          email={profile.email}
                          avatarUrl={profile.details?.avatar_url || profile.details?.picture}
                          userId={user?.id}
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">
                            {profile.full_name || profile.email}
                          </p>
                          <p className="text-xs text-muted-foreground uppercase font-mono">{role} Account</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                        {/* Mobile Dashboard Link */}
                        <Link
                          to="/dashboard"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-google-blue/10 text-google-blue border border-google-blue/20 text-xs font-semibold hover:bg-google-blue/20 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          <span>Dashboard</span>
                        </Link>

                        {/* Mobile Logout Button */}
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold hover:bg-destructive/20 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Theme Toggle when logged out */}
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border bg-card hover:bg-muted text-sm font-semibold text-foreground transition-colors"
                      >
                        {isDark ? (
                          <Sun className="w-4 h-4 text-google-yellow" />
                        ) : (
                          <Moon className="w-4 h-4 text-google-blue" />
                        )}
                        <span>Switch to {isDark ? 'Light' : 'Dark'} Mode</span>
                      </button>

                      <div className="flex gap-3">
                        <Link
                          to="/login"
                          onClick={() => setMenuOpen(false)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-card hover:bg-muted text-foreground text-sm font-semibold border border-border transition-all"
                        >
                          <LogIn className="w-4 h-4 text-google-blue" />
                          <span>Sign In</span>
                        </Link>
                        <Link
                          to="/signup"
                          onClick={() => setMenuOpen(false)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-google-blue hover:bg-google-blue/90 text-white text-sm font-semibold transition-all"
                        >
                          <span>Sign Up</span>
                        </Link>
                      </div>
                    </div>
                  )}
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
