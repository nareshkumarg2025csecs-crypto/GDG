import { motion } from 'framer-motion';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useState } from 'react';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex flex-col font-display text-xl leading-none tracking-wider"
          >
            <span>LANDO</span>
            <span className="text-lime">NORRIS</span>
          </motion.div>

          {/* Center Logo */}
          <motion.div
            whileHover={{ rotate: 10 }}
            className="absolute left-1/2 -translate-x-1/2 text-3xl font-display"
          >
            L4
          </motion.div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <motion.a
              href="#store"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-lime px-4 py-2 rounded-full font-body font-semibold text-sm text-foreground"
            >
              <ShoppingBag className="w-4 h-4" />
              STORE
            </motion.a>

            <motion.button
              onClick={() => setMenuOpen(!menuOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 flex items-center justify-center border border-foreground rounded-lg"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Full Screen Menu */}
      <motion.div
        initial={false}
        animate={menuOpen ? { opacity: 1, pointerEvents: 'auto' as const } : { opacity: 0, pointerEvents: 'none' as const }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-40 bg-background"
      >
        <div className="h-full flex flex-col justify-center items-center gap-8 pt-20">
          {['Home', 'On Track', 'Off Track', 'Partnerships', 'Calendar'].map((item, i) => (
            <motion.a
              key={item}
              href={`#${item.toLowerCase().replace(' ', '-')}`}
              initial={{ y: 50, opacity: 0 }}
              animate={menuOpen ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              onClick={() => setMenuOpen(false)}
              className="text-5xl md:text-7xl font-display uppercase hover:text-lime transition-colors"
            >
              {item}
            </motion.a>
          ))}

          <motion.div
            initial={{ opacity: 0 }}
            animate={menuOpen ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-10 flex gap-6"
          >
            {['TikTok', 'Instagram', 'YouTube', 'Twitch'].map((social) => (
              <a
                key={social}
                href="#"
                className="text-sm font-body uppercase tracking-wider hover:text-lime transition-colors"
              >
                {social}
              </a>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default Header;
