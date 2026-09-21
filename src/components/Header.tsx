import { motion, useScroll, useMotionValueEvent, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import { Menu, X, ExternalLink, Calendar, Sun, Moon, LogIn, LogOut, User, Shield, ChevronDown, Check, LayoutDashboard, Award } from 'lucide-react';
import { useState, useRef, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useEasterEggStore } from '@/store/easterEggStore';
import { UserAvatar } from '@/components/common/UserAvatar';
import { HeaderNotifications } from '@/components/HeaderNotifications';

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
          ? 'text-foreground font-semibold'
          : 'text-foreground/70 group-hover:text-foreground'
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
  const lastScrollYRef = useRef(0);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const logoTapHistoryRef = useRef<number[]>([]);
  const { scrollY } = useScroll();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const { user, isAuthenticated, profile, role, logout } = useAuth();
  const isAdmin = role === 'admin';

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

  // Top header nav sections always link to public pages (/events for events)
  const navSections = SECTIONS;

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
    const diff = latest - lastScrollYRef.current;
    lastScrollYRef.current = latest;

    const shouldBeScrolled = latest > 50;
    setScrolled((prev) => (prev !== shouldBeScrolled ? shouldBeScrolled : prev));

    if (latest > 50) {
      if (diff > 5 && latest > 300) {
        setIsHidden((prev) => (!prev ? true : prev));
      } else if (diff < -5) {
        setIsHidden((prev) => (prev ? false : prev));
      }
    } else {
      setIsHidden((prev) => (prev ? false : prev));
    }
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
        className="fixed top-0 left-0 right-0 z-50 flex justify-center py-2.5 sm:py-4 px-2 sm:px-4 pointer-events-none"
      >
        <motion.nav
          className="relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full border transition-all duration-300 pointer-events-auto max-w-[98vw] sm:max-w-[95vw] w-auto shadow-lg"
          style={{
            background: theme === 'light'
              ? 'rgba(255, 255, 255, 0.94)'
              : isTransparentState ? 'rgba(5, 5, 5, 0.0)' : 'rgba(15, 15, 15, 0.88)',
            backdropFilter: isTransparentState ? 'none' : 'blur(24px) saturate(200%)',
            WebkitBackdropFilter: isTransparentState ? 'none' : 'blur(24px) saturate(200%)',
            borderColor: theme === 'light'
              ? 'rgba(226, 226, 222, 0.85)'
              : isTransparentState ? 'transparent' : 'rgba(255,255,255,0.12)',
            boxShadow: theme === 'light'
              ? '0 4px 24px -4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)'
              : isTransparentState
                ? 'none'
                : `0 0 0 1px rgba(255,255,255,0.05), 0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 80px ${activeColor}15`,
          }}
        >
          <motion.a
            href="/"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 mr-0.5 sm:mr-2 shrink-0"
            onPointerDown={handleLogoPointerDown}
            data-easter-trigger="logo"
            data-no-leet
          >
            <span className="font-sans text-lg sm:text-xl font-bold tracking-tight text-foreground">GDG</span>
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
          <div className="hidden md:flex items-center gap-1 shrink-0">
            <div className="w-px h-6 mr-2 border-r border-border" />
            {navSections.map((section) => (
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
                href={isAdmin ? "/admin/events" : "/dashboard"}
                isActive={activeSection === (isAdmin ? 'admin' : 'dashboard')}
                color={isAdmin ? "#EA4335" : "#4285F4"}
                onClick={() => setActiveSection(isAdmin ? 'admin' : 'dashboard')}
                scrolled={scrolled}
                transparent={transparent}
              >
                {isAdmin ? "Admin" : "Dashboard"}
              </MagneticNavItem>
            )}
            {isAuthenticated && isAdmin && (
              <MagneticNavItem
                href="/admin/certificates"
                isActive={location.pathname.startsWith('/admin/certificates')}
                color="#FBBC04"
                onClick={() => setActiveSection('admin')}
                scrolled={scrolled}
                transparent={transparent}
              >
                Certificates
              </MagneticNavItem>
            )}
            <div className="w-px h-6 mx-2 border-r border-border" />
          </div>

          {/* Spacer for mobile layout */}
          <div className="flex-grow md:hidden" />

          {/* User Profile Button with Dropdown (Desktop & Responsive) */}
          {isAuthenticated && profile ? (
            <div className="relative shrink-0" ref={profileDropdownRef}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={profileDropdownOpen}
                aria-label="User account profile and settings menu"
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground transition-all shadow-sm shrink-0"
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
                <span className="hidden xs:inline max-w-[65px] sm:max-w-[110px] truncate text-foreground font-medium">
                  {profile.full_name || profile.email.split('@')[0]}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ${
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
                    className="absolute right-0 mt-2 w-60 sm:w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border bg-card text-card-foreground shadow-2xl p-2 z-50 space-y-1"
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

                    {/* Admin Events Panel & Certificates (for admin) or My Dashboard */}
                    {isAdmin ? (
                      <>
                        <Link
                          to="/admin/events"
                          role="menuitem"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted text-xs font-semibold text-google-red transition-colors"
                        >
                          <Shield className="w-4 h-4 text-google-red" aria-hidden="true" />
                          <span>Admin Events Panel</span>
                        </Link>
                        <Link
                          to="/admin/certificates"
                          role="menuitem"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted text-xs font-semibold text-google-yellow hover:text-amber-500 transition-colors"
                        >
                          <Award className="w-4 h-4 text-google-yellow" aria-hidden="true" />
                          <span>Certificates Studio</span>
                        </Link>
                        <Link
                          to="/dashboard"
                          role="menuitem"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-google-blue" aria-hidden="true" />
                          <span>Student View</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/dashboard"
                          role="menuitem"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-google-blue" aria-hidden="true" />
                          <span>My Dashboard</span>
                        </Link>
                      </>
                    )}

                    {/* Theme Toggle */}
                    <button
                      type="button"
                      role="menuitem"
                      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                      onClick={() => {
                        toggleTheme();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-muted text-xs font-semibold text-foreground transition-colors"
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

                    {/* Logout Option */}
                    <button
                      type="button"
                      role="menuitem"
                      aria-label="Log out of your account"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-destructive/10 text-destructive text-xs font-semibold transition-colors"
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
            <div className="flex items-center gap-1 shrink-0">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
                className="p-1.5 sm:p-2 rounded-full border border-border bg-card hover:bg-muted text-foreground transition-colors shrink-0"
                aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? (
                  <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-google-yellow" aria-hidden="true" />
                ) : (
                  <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-google-blue" aria-hidden="true" />
                )}
              </motion.button>
              <Link
                to="/login"
                aria-label="Sign In to your account"
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold text-foreground/80 hover:text-foreground hover:bg-muted transition-colors shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 text-google-blue" aria-hidden="true" />
                <span className="hidden xs:inline">Sign In</span>
              </Link>
            </div>
          )}

          {/* CTA Button */}
          <Link
            to={isAdmin ? "/admin/events" : "/events"}
            aria-label={isAdmin ? "Manage GDG Events" : "View GDG Events"}
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ml-0.5 sm:ml-1"
            style={{
              background: `linear-gradient(135deg, ${activeColor}, ${activeColor}cc)`,
              boxShadow: `0 4px 20px ${activeColor}40, 0 0 40px ${activeColor}20`,
            }}
          >
            {isAdmin ? (
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" aria-hidden="true" />
            ) : (
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" aria-hidden="true" />
            )}
            <span className="text-white hidden sm:inline">{isAdmin ? "Admin Events" : "Events"}</span>
          </Link>

          {/* New Event Notifications (Desktop & Mobile Responsive for both Guests and Authenticated Users) */}
          <div className="flex items-center shrink-0 ml-0.5 sm:ml-1">
            <HeaderNotifications activeColor={activeColor} />
          </div>

          {/* Mobile Menu Toggle Button */}
          <motion.button
            onClick={() => setMenuOpen(!menuOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-8 h-8 sm:w-10 sm:h-10 ml-0.5 sm:ml-1 flex items-center justify-center rounded-full transition-all z-50 border border-border bg-card text-foreground shrink-0"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />}
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

            <div className="h-full flex flex-col pt-24 pb-10 overflow-y-auto container mx-auto px-4 sm:px-6 relative z-10">
              <div className="flex flex-col justify-between h-full space-y-6">

                {/* Navigation Links */}
                <nav className="flex flex-col gap-1 sm:gap-2">
                  {navSections.map((item, i) => (
                    <motion.div
                      key={item.name}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -50, opacity: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Link
                        to={item.href}
                        onClick={() => {
                          setActiveSection(item.id);
                          setMenuOpen(false);
                        }}
                        className="group flex items-baseline gap-4 sm:gap-6 py-2"
                      >
                        <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors">0{i + 1}</span>
                        <span
                          className="text-3xl sm:text-5xl md:text-6xl font-sans font-bold transition-all duration-300 group-hover:translate-x-4"
                          style={{
                            color: activeSection === item.id ? item.color : 'hsl(var(--foreground))',
                          }}
                        >
                          {item.name}
                        </span>
                      </Link>
                    </motion.div>
                  ))}

                  {/* Authenticated Links in Mobile Drawer */}
                  {isAuthenticated && (
                    <>
                      {isAdmin ? (
                        <>
                          <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -50, opacity: 0 }}
                            transition={{ delay: 0.28, duration: 0.4 }}
                          >
                            <Link
                              to="/admin/events"
                              onClick={() => {
                                setActiveSection('admin');
                                setMenuOpen(false);
                              }}
                              className="group flex items-baseline gap-4 sm:gap-6 py-2"
                            >
                              <span className="text-xs font-mono text-google-red">04</span>
                              <span className="text-3xl sm:text-5xl md:text-6xl font-sans font-bold text-google-red transition-all duration-300 group-hover:translate-x-4">
                                Admin Events
                              </span>
                            </Link>
                          </motion.div>

                          <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -50, opacity: 0 }}
                            transition={{ delay: 0.34, duration: 0.4 }}
                          >
                            <Link
                              to="/admin/certificates"
                              onClick={() => {
                                setActiveSection('admin');
                                setMenuOpen(false);
                              }}
                              className="group flex items-baseline gap-4 sm:gap-6 py-2"
                            >
                              <span className="text-xs font-mono text-google-yellow">05</span>
                              <span className="text-3xl sm:text-5xl md:text-6xl font-sans font-bold text-google-yellow transition-all duration-300 group-hover:translate-x-4">
                                Certificates
                              </span>
                            </Link>
                          </motion.div>

                          <motion.div
                            initial={{ x: -50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -50, opacity: 0 }}
                            transition={{ delay: 0.4, duration: 0.4 }}
                          >
                            <Link
                              to="/dashboard"
                              onClick={() => {
                                setActiveSection('dashboard');
                                setMenuOpen(false);
                              }}
                              className="group flex items-baseline gap-4 sm:gap-6 py-2"
                            >
                              <span className="text-xs font-mono text-google-blue">06</span>
                              <span className="text-3xl sm:text-5xl md:text-6xl font-sans font-bold text-google-blue transition-all duration-300 group-hover:translate-x-4">
                                Student View
                              </span>
                            </Link>
                          </motion.div>
                      </>
                    ) : (
                      <>
                        <motion.div
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -50, opacity: 0 }}
                          transition={{ delay: 0.28, duration: 0.4 }}
                        >
                          <Link
                            to="/dashboard"
                            onClick={() => {
                              setActiveSection('dashboard');
                              setMenuOpen(false);
                            }}
                            className="group flex items-baseline gap-4 sm:gap-6 py-2"
                          >
                            <span className="text-xs font-mono text-google-blue">04</span>
                            <span className="text-3xl sm:text-5xl md:text-6xl font-sans font-bold text-google-blue transition-all duration-300 group-hover:translate-x-4">
                              Dashboard
                            </span>
                          </Link>
                        </motion.div>
                      </>
                      )}
                    </>
                  )}

                </nav>

                {/* User Profile, Theme Toggle & Auth Actions in Responsive Drawer */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ delay: 0.35, duration: 0.5 }}
                  className="pt-4 border-t border-border space-y-3"
                >
                  {isAuthenticated && profile ? (
                    <div className="p-3.5 rounded-2xl bg-card border border-border space-y-3">
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

                      <div className={`grid ${isAdmin ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'} gap-2 pt-2 border-t border-border/60`}>
                        {isAdmin ? (
                          <>
                            <Link
                              to="/admin/events"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-semibold bg-google-red/10 text-google-red border-google-red/20 hover:bg-google-red/20 transition-colors"
                            >
                              <Shield className="w-4 h-4" />
                              <span>Events</span>
                            </Link>
                            <Link
                              to="/admin/certificates"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-semibold bg-google-yellow/10 text-google-yellow border-google-yellow/20 hover:bg-google-yellow/20 transition-colors"
                            >
                              <Award className="w-4 h-4" />
                              <span>Certs</span>
                            </Link>
                            <button
                              type="button"
                              aria-label="Log out of your account"
                              onClick={handleLogout}
                              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold hover:bg-destructive/20 transition-colors"
                            >
                              <LogOut className="w-4 h-4" aria-hidden="true" />
                              <span>Log Out</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              to="/dashboard"
                              onClick={() => setMenuOpen(false)}
                              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-semibold bg-google-blue/10 text-google-blue border-google-blue/20 hover:bg-google-blue/20 transition-colors"
                            >
                              <LayoutDashboard className="w-4 h-4" />
                              <span>Dashboard</span>
                            </Link>
                            <button
                              type="button"
                              aria-label="Log out of your account"
                              onClick={handleLogout}
                              className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold hover:bg-destructive/20 transition-colors"
                            >
                              <LogOut className="w-4 h-4" aria-hidden="true" />
                              <span>Log Out</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Theme Toggle when logged out */}
                      <button
                        type="button"
                        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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
