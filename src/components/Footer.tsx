import { motion } from 'framer-motion';

const Footer = () => {
  const socialLinks = [
    { name: 'TikTok', url: '#' },
    { name: 'Instagram', url: '#' },
    { name: 'YouTube', url: '#' },
    { name: 'Twitch', url: '#' },
  ];

  const navLinks = [
    { name: 'Home', url: '#' },
    { name: 'On Track', url: '#on-track' },
    { name: 'Off Track', url: '#off-track' },
    { name: 'Partnerships', url: '#partnerships' },
    { name: 'Calendar', url: '#calendar' },
  ];

  return (
    <footer className="bg-background py-20 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="font-display text-3xl leading-none mb-4">
              <span>LANDO</span>
              <br />
              <span className="text-lime">NORRIS</span>
            </div>
            <p className="text-sm text-muted-foreground font-body">
              McLaren F1 Driver<br />
              Since 2019
            </p>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="font-display text-sm uppercase tracking-wider mb-4">Navigate</h4>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.url}
                    className="text-muted-foreground hover:text-lime transition-colors font-body text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Social */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-display text-sm uppercase tracking-wider mb-4">Follow</h4>
            <ul className="space-y-2">
              {socialLinks.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.url}
                    className="text-muted-foreground hover:text-lime transition-colors font-body text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="font-display text-sm uppercase tracking-wider mb-4">Business</h4>
            <a 
              href="mailto:business@landonorris.com"
              className="text-lime hover:underline font-body text-sm"
            >
              business@landonorris.com
            </a>
          </motion.div>
        </div>

        {/* Large signature */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <svg
            viewBox="0 0 400 100"
            className="w-64 h-20 mx-auto text-lime"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <motion.path
              d="M20 70 Q60 20 100 50 T180 40 Q200 60 240 45 T320 55 Q360 35 380 60"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            />
          </svg>
        </motion.div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground font-body">
            © 2025 Lando Norris. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground font-body">
              Privacy Policy
            </a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground font-body">
              Terms of Service
            </a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground font-body">
              Cookie Settings
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
