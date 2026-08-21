import { motion } from 'framer-motion';
import { ArrowUp, Github, Twitter, Linkedin, Instagram } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const BRAND_LETTERS = [
  { chars: 'GOOGLE', color: null },
  { chars: 'DEVELOPER', color: '#4285F4' },
  { chars: 'GROUPS', color: '#EA4335' },
];

const GOOGLE_STRIPE = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];

const socialLinks = [
  { name: 'GitHub',    icon: Github,    href: '#', hoverColor: '#ffffff' },
  { name: 'Twitter',   icon: Twitter,   href: '#', hoverColor: '#1DA1F2' },
  { name: 'LinkedIn',  icon: Linkedin,  href: '#', hoverColor: '#0A66C2' },
  { name: 'Instagram', icon: Instagram, href: '#', hoverColor: '#E1306C' },
];

const navLinks = ['Home', 'Events', 'Core', 'About Us'];

const Footer = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <footer className="relative pt-24 pb-0 bg-background overflow-hidden">
      {/* Top divider with Google gradient glow */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: isDark
            ? 'linear-gradient(90deg, transparent, #4285F450, #EA433550, #FBBC0450, #34A85350, transparent)'
            : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.12), transparent)',
        }}
      />

      {/* Rotating decorative rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 70, repeat: Infinity, ease: 'linear' }}
        className="absolute -top-40 -right-40 w-80 h-80 rounded-full pointer-events-none"
        style={{ border: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(31,31,31,0.04)'}` }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
        className="absolute -bottom-60 -left-60 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ border: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(31,31,31,0.03)'}` }}
      />

      {/* Ambient glow */}
      <div
        className="absolute top-20 right-20 w-[300px] h-[300px] rounded-full blur-[150px] pointer-events-none"
        style={{ background: isDark ? 'radial-gradient(circle, #4285F412 0%, transparent 70%)' : 'transparent' }}
      />

      <div className="container mx-auto px-6 md:px-12 relative z-10 max-w-7xl">
        {/* Large editorial brand headline with letter stagger */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
          className="mb-16 md:mb-20"
        >
          {BRAND_LETTERS.map((row, ri) => (
            <div key={ri} className="overflow-hidden">
              <motion.h2
                initial={{ y: '100%' }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + ri * 0.12, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="font-display leading-none"
                style={{
                  fontSize: 'clamp(3.5rem, 10vw, 8rem)',
                  color: row.color
                    ? row.color
                    : isDark ? '#ffffff' : '#1F1F1F',
                  textShadow: row.color && isDark ? `0 0 60px ${row.color}55` : 'none',
                }}
              >
                {row.chars}
              </motion.h2>
            </div>
          ))}
        </motion.div>

        {/* Footer grid */}
        <div className="grid md:grid-cols-4 gap-10 pb-16 border-b"
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(31,31,31,0.08)' }}>

          {/* Brand description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="col-span-1 md:col-span-2"
          >
            <p
              className="max-w-sm text-base leading-relaxed"
              style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(31,31,31,0.55)' }}
            >
              Empowering developers to learn, create, and grow together.
              Join our community and build the future with Google technologies.
            </p>
          </motion.div>

          {/* Navigate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.7 }}
          >
            <h4
              className="section-eyebrow mb-6"
              style={{
                color: isDark ? '#4285F4' : 'rgba(31,31,31,0.45)',
                textShadow: isDark ? '0 0 20px #4285F4' : 'none',
              }}
            >
              Navigate
            </h4>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase().replace(' ', '-')}`}
                    className="link-wipe text-sm font-medium transition-colors"
                    style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(31,31,31,0.55)' }}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Connect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <h4
              className="section-eyebrow mb-6"
              style={{
                color: isDark ? '#34A853' : 'rgba(31,31,31,0.45)',
                textShadow: isDark ? '0 0 20px #34A853' : 'none',
              }}
            >
              Connect
            </h4>
            <div className="flex gap-3 mb-6">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  whileHover={{ scale: 1.12, y: -4 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 border"
                  data-physics
                  style={{
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(31,31,31,0.12)',
                    color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(31,31,31,0.5)',
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = social.hoverColor;
                    (e.currentTarget as HTMLElement).style.borderColor = `${social.hoverColor}40`;
                    (e.currentTarget as HTMLElement).style.background = `${social.hoverColor}12`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(31,31,31,0.5)';
                    (e.currentTarget as HTMLElement).style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(31,31,31,0.12)';
                    (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.04)' : 'transparent';
                  }}
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>

            {/* Email */}
            <a
              href="mailto:contact@gdg.community"
              className="link-wipe text-sm font-medium"
              style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(31,31,31,0.55)' }}
            >
              contact@gdg.community
            </a>
          </motion.div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-center justify-between py-8">
          <p
            className="text-xs uppercase tracking-widest"
            style={{ color: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(31,31,31,0.35)' }}
          >
            © 2025 Google Developer Groups. All rights reserved.
          </p>

          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            whileHover={{ scale: 1.08, y: -4 }}
            whileTap={{ scale: 0.94 }}
            className="btn-shimmer mt-5 md:mt-0 w-12 h-12 rounded-2xl flex items-center justify-center border transition-all"
            data-physics
            style={{
              background: isDark
                ? 'linear-gradient(135deg, #4285F4, #34A853)'
                : '#1F1F1F',
              borderColor: isDark ? 'transparent' : 'rgba(31,31,31,0.15)',
              color: '#ffffff',
              boxShadow: isDark
                ? '0 0 30px #4285F430, 0 8px 25px rgba(0,0,0,0.3)'
                : '0 8px 25px rgba(31,31,31,0.15)',
            }}
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Premium Google-color bottom strip */}
      <div className="h-[3px] flex w-full">
        {GOOGLE_STRIPE.map((color, i) => (
          <motion.div
            key={color}
            className="flex-1 h-full"
            style={{
              backgroundColor: color,
              boxShadow: isDark ? `0 -4px 20px ${color}60` : 'none',
            }}
            initial={{ scaleX: 0, transformOrigin: 'left' }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: 'circOut' }}
          />
        ))}
      </div>
    </footer>
  );
};

export default Footer;
