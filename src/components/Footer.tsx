import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

const Footer = () => {
  const navLinks = ['Home', 'On Track', 'Off Track', 'Hall of Fame', 'Store'];
  const socialLinks = ['TikTok', 'Instagram', 'YouTube', 'Twitch'];

  return (
    <footer className="relative py-24 overflow-hidden noise">
      <div className="absolute inset-0 bg-gradient-to-t from-carbon via-background to-background" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-4 gap-12 mb-20">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="font-display text-4xl leading-none mb-6"><span>LANDO</span><br /><span className="text-lime glow-text">NORRIS</span></div>
            <p className="text-muted-foreground">McLaren F1 Driver<br />World Champion Contender</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <h4 className="font-display text-sm uppercase tracking-widest mb-6 text-lime">Navigate</h4>
            <ul className="space-y-3">{navLinks.map((link) => (<li key={link}><a href={`#${link.toLowerCase().replace(' ', '-')}`} className="text-muted-foreground hover:text-lime transition-colors">{link}</a></li>))}</ul>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <h4 className="font-display text-sm uppercase tracking-widest mb-6 text-lime">Follow</h4>
            <ul className="space-y-3">{socialLinks.map((link) => (<li key={link}><a href="#" className="text-muted-foreground hover:text-lime transition-colors">{link}</a></li>))}</ul>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            <h4 className="font-display text-sm uppercase tracking-widest mb-6 text-lime">Business</h4>
            <a href="mailto:business@landonorris.com" className="text-lime hover:underline">business@landonorris.com</a>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
          <svg viewBox="0 0 400 100" className="w-72 h-24 mx-auto text-lime" fill="none" stroke="currentColor" strokeWidth="3">
            <motion.path d="M20 70 Q60 20 100 50 T180 40 Q200 60 240 45 T320 55 Q360 35 380 60" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2 }} />
          </svg>
        </motion.div>
        <div className="flex flex-col md:flex-row items-center justify-between pt-10 border-t border-border">
          <p className="text-sm text-muted-foreground">© 2025 Lando Norris. All rights reserved.</p>
          <motion.button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} whileHover={{ scale: 1.1, y: -5 }} className="mt-6 md:mt-0 w-12 h-12 glass rounded-xl flex items-center justify-center hover:bg-lime/10 transition-colors">
            <ArrowUp className="w-5 h-5 text-lime" />
          </motion.button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
