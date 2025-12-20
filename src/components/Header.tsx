import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { ShoppingBag, Menu, X, ExternalLink } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  const menuItems = [
    { name: 'Home', href: '#' },
    { name: 'On Track', href: '#on-track' },
    { name: 'Off Track', href: '#off-track' },
    { name: 'Hall of Fame', href: '#hall-of-fame' },
    { name: 'Store', href: '#store' },
  ];

  const socialLinks = [
    { name: 'TikTok', href: '#', followers: '12.4M' },
    { name: 'Instagram', href: '#', followers: '9.2M' },
    { name: 'YouTube', href: '#', followers: '3.1M' },
    { name: 'Twitch', href: '#', followers: '1.8M' },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'py-3' : 'py-6'
        }`}
      >
        <div className={`mx-6 transition-all duration-500 ${
          scrolled ? 'glass rounded-2xl px-6 py-3' : ''
        }`}>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.a
              href="#"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col font-display text-lg md:text-xl leading-none tracking-wider relative z-10"
            >
              <span className="text-foreground">LANDO</span>
              <span className="text-lime glow-text">NORRIS</span>
            </motion.a>

            {/* Center - Driver Number */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6, type: 'spring' }}
              className="absolute left-1/2 -translate-x-1/2 hidden md:block"
            >
              <div className="relative">
                <span className="font-display text-4xl text-stroke-thin">L4</span>
                <motion.div
                  className="absolute -inset-4 rounded-full border border-lime/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            </motion.div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <motion.a
                href="#store"
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px hsl(75 100% 50% / 0.4)' }}
                whileTap={{ scale: 0.95 }}
                className="hidden sm:flex items-center gap-2 bg-lime px-5 py-2.5 rounded-full font-body font-semibold text-sm text-background"
              >
                <ShoppingBag className="w-4 h-4" />
                STORE
              </motion.a>

              <motion.button
                onClick={() => setMenuOpen(!menuOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 flex items-center justify-center glass rounded-xl relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-lime"
                  initial={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ borderRadius: 'inherit' }}
                />
                <span className="relative z-10 group-hover:text-background transition-colors">
                  {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Full Screen Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-40 bg-background"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 gradient-hero opacity-50" />
            
            {/* Large background number */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.03, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8 }}
              className="absolute right-0 top-1/2 -translate-y-1/2 font-display text-[40rem] text-foreground select-none pointer-events-none"
            >
              4
            </motion.div>

            <div className="h-full flex pt-32 pb-12">
              <div className="container mx-auto px-6 flex flex-col lg:flex-row justify-between">
                {/* Navigation Links */}
                <nav className="flex flex-col gap-2">
                  {menuItems.map((item, i) => (
                    <motion.a
                      key={item.name}
                      href={item.href}
                      initial={{ x: -100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -100, opacity: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                      onClick={() => setMenuOpen(false)}
                      className="group flex items-center gap-4"
                    >
                      <span className="text-sm font-body text-muted-foreground w-8">0{i + 1}</span>
                      <span className="text-5xl md:text-7xl lg:text-8xl font-display uppercase text-foreground group-hover:text-lime transition-colors duration-300 relative">
                        {item.name}
                        <motion.span
                          className="absolute bottom-0 left-0 h-1 bg-lime"
                          initial={{ width: 0 }}
                          whileHover={{ width: '100%' }}
                          transition={{ duration: 0.3 }}
                        />
                      </span>
                    </motion.a>
                  ))}
                </nav>

                {/* Social & Info */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="mt-auto lg:mt-0 lg:self-end"
                >
                  <p className="text-sm uppercase tracking-widest text-muted-foreground mb-6">Follow</p>
                  <div className="grid grid-cols-2 gap-4">
                    {socialLinks.map((social) => (
                      <a
                        key={social.name}
                        href={social.href}
                        className="group flex items-center justify-between p-4 rounded-xl glass hover:bg-lime/10 transition-colors"
                      >
                        <div>
                          <p className="font-body font-medium text-foreground group-hover:text-lime transition-colors">
                            {social.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{social.followers} followers</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-lime transition-colors" />
                      </a>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-border">
                    <a href="mailto:business@landonorris.com" className="text-lime hover:underline font-body">
                      business@landonorris.com
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
