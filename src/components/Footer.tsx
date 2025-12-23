import { motion } from 'framer-motion';
import { ArrowUp, Github, Twitter, Linkedin, Instagram } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const Footer = () => {
  const { theme } = useTheme();
  const navLinks = ['Home', 'Events', 'Core', 'About Us', 'Gallery'];
  const socialLinks = [
    { name: 'GitHub', icon: Github, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
  ];

  return (
    <footer className="relative py-24 bg-background overflow-hidden">
      {/* Top border glow */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: theme === 'light'
            ? 'linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)'
            : 'linear-gradient(90deg, transparent, #4285F450, #EA433550, #FBBC0450, #34A85350, transparent)',
          opacity: theme === 'light' ? 1 : 1
        }}
      />

      {/* Rotating decorative circles */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute -top-40 -right-40 w-80 h-80 rounded-full border border-white/5"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-60 -left-60 w-[500px] h-[500px] rounded-full border border-white/5"
      />

      {/* Background orbs */}
      <div
        className="absolute top-20 right-20 w-[300px] h-[300px] rounded-full blur-[150px]"
        style={{ background: 'radial-gradient(circle, #4285F415 0%, transparent 70%)' }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-4 gap-12 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="col-span-1 md:col-span-2"
          >
            <div className="font-display text-5xl md:text-6xl leading-none mb-8">
              <span className={theme === 'light' ? 'text-[rgb(var(--text-primary-raw))]' : 'text-white'}>GOOGLE</span><br />
              <span style={{ color: theme === 'light' ? 'rgb(var(--text-primary-raw))' : '#4285F4', textShadow: theme === 'light' ? 'none' : '0 0 40px #4285F480' }}>DEVELOPER</span><br />
              <span style={{ color: theme === 'light' ? 'rgb(var(--text-primary-raw))' : '#EA4335', textShadow: theme === 'light' ? 'none' : '0 0 40px #EA433580' }}>GROUPS</span>
            </div>
            <p className="max-w-md text-lg leading-relaxed" style={{ color: theme === 'light' ? 'rgb(var(--text-secondary-raw))' : 'rgba(255,255,255,0.4)' }}>
              Empowering developers to learn, create, and grow together. Join our community and build the future with Google technologies.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4
              className="font-display text-sm uppercase tracking-widest mb-8"
              style={{ color: theme === 'light' ? 'rgb(var(--text-secondary-raw))' : '#4285F4', textShadow: theme === 'light' ? 'none' : '0 0 20px #4285F4' }}
            >
              Navigate
            </h4>
            <ul className="space-y-4">
              {navLinks.map((link) => (
                <li key={link}>
                  <motion.a
                    href={`#${link.toLowerCase().replace(' ', '-')}`}
                    whileHover={{ x: 10, color: theme === 'light' ? '#000000' : '#4285F4' }}
                    className={`transition-colors font-medium text-lg inline-block ${theme === 'light' ? 'text-[rgb(var(--text-secondary-raw))] hover:text-[rgb(var(--text-primary-raw))]' : 'text-white/40 hover:text-white'}`}
                  >
                    {link}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4
              className="font-display text-sm uppercase tracking-widest mb-8"
              style={{ color: theme === 'light' ? 'rgb(var(--text-secondary-raw))' : '#34A853', textShadow: theme === 'light' ? 'none' : '0 0 20px #34A853' }}
            >
              Connect
            </h4>
            <div className="flex gap-3 mb-8">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-all border"
                  style={{
                    borderColor: theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                    color: theme === 'light' ? 'rgb(var(--text-secondary-raw))' : 'rgba(255,255,255,0.4)',
                    background: theme === 'light' ? 'transparent' : 'rgba(255,255,255,0.05)'
                  }}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
            {theme === 'dark' ? (
              <img
                src="/email-dark.png"
                alt="contact@gdg.community"
                style={{ height: '40px', objectFit: 'contain' }}
              />
            ) : (
              <a
                href="mailto:contact@gdg.community"
                className="text-lg font-medium"
                style={{
                  color: 'rgb(var(--text-primary-raw))'
                }}
              >
                contact@gdg.community
              </a>
            )}
          </motion.div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-white/5">
          <p className="text-sm text-white/30">© 2025 Google Developer Groups. All rights reserved.</p>
          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className={`mt-6 md:mt-0 w-14 h-14 rounded-2xl flex items-center justify-center border ${theme === 'light' ? 'border-[rgb(var(--yellow-400))] text-[rgb(var(--text-primary-raw))]' : 'text-white border-white/10'}`}
            style={{
              background: theme === 'light'
                ? 'rgb(var(--yellow-200))'
                : 'linear-gradient(135deg, #4285F4, #34A853)',
              boxShadow: theme === 'light'
                ? 'var(--shadow-md)'
                : '0 0 40px #4285F430, 0 10px 30px rgba(0,0,0,0.3)',
            }}
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Animated Bottom Color Strip */}
        <div className="absolute bottom-0 left-0 right-0 h-1 flex">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-1/4 origin-left"
            style={{ backgroundColor: theme === 'light' ? 'rgb(var(--yellow-300))' : '#4285F4', boxShadow: theme === 'light' ? 'none' : '0 0 20px #4285F4' }}
          />
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-1/4 origin-left"
            style={{ backgroundColor: theme === 'light' ? 'rgb(var(--yellow-400))' : '#EA4335', boxShadow: theme === 'light' ? 'none' : '0 0 20px #EA4335' }}
          />
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-1/4 origin-left"
            style={{ backgroundColor: theme === 'light' ? 'rgb(var(--yellow-500))' : '#FBBC04', boxShadow: theme === 'light' ? 'none' : '0 0 20px #FBBC04' }}
          />
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-1/4 origin-left"
            style={{ backgroundColor: theme === 'light' ? 'rgb(var(--yellow-600))' : '#34A853', boxShadow: theme === 'light' ? 'none' : '0 0 20px #34A853' }}
          />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
