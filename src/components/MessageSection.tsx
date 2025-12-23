import { motion, useScroll, useTransform } from 'framer-motion';

const MessageSection = () => {
  const { scrollYProgress } = useScroll();

  const y = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 10]);

  return (
    <section id="about" className="relative py-40 overflow-hidden bg-background">
      {/* Large Background Text with Parallax */}
      <motion.div
        style={{ y, rotate }}
        className="absolute right-[-10%] top-1/2 -translate-y-1/2 select-none pointer-events-none"
      >
        <span
          className="font-display text-[25rem] md:text-[40rem] leading-none"
          style={{
            background: 'linear-gradient(135deg, #4285F410 0%, #EA433510 50%, #34A85310 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          GDG
        </span>
      </motion.div>

      {/* Floating Neon Orbs */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          boxShadow: [
            '0 0 40px #4285F480',
            '0 0 80px #4285F4',
            '0 0 40px #4285F480',
          ]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-[15%] w-4 h-4 rounded-full bg-google-blue"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          boxShadow: [
            '0 0 30px #EA433580',
            '0 0 60px #EA4335',
            '0 0 30px #EA433580',
          ]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute top-40 right-[20%] w-3 h-3 rounded-full bg-google-red"
      />
      <motion.div
        animate={{
          y: [0, -20, 0],
          boxShadow: [
            '0 0 35px #FBBC0480',
            '0 0 70px #FBBC04',
            '0 0 35px #FBBC0480',
          ]
        }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-32 left-1/4 w-5 h-5 rounded-full bg-google-yellow"
      />
      <motion.div
        animate={{
          y: [0, 25, 0],
          boxShadow: [
            '0 0 40px #34A85380',
            '0 0 80px #34A853',
            '0 0 40px #34A85380',
          ]
        }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute bottom-20 right-1/3 w-6 h-6 rounded-full bg-google-green"
      />

      <div className="container mx-auto px-6 relative z-10">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-sm uppercase tracking-[0.4em] text-google-blue mb-10 font-bold text-center"
          style={{ textShadow: '0 0 30px #4285F4' }}
        >
          Our Mission
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="text-4xl md:text-6xl lg:text-7xl font-display text-center max-w-5xl mx-auto leading-tight"
        >
          <span style={{ color: 'rgb(var(--foreground))' }}>Empowering developers to </span>
          <motion.span
            className="inline-block"
            whileHover={{ scale: 1.1 }}
            style={{ color: '#4285F4', textShadow: '0 0 40px #4285F480' }}
          >
            connect
          </motion.span>
          <span style={{ color: 'rgb(var(--foreground))' }}>, </span>
          <motion.span
            className="inline-block"
            whileHover={{ scale: 1.1 }}
            style={{ color: '#EA4335', textShadow: '0 0 40px #EA433580' }}
          >
            learn
          </motion.span>
          <span style={{ color: 'rgb(var(--foreground))' }}>, and </span>
          <motion.span
            className="inline-block"
            whileHover={{ scale: 1.1 }}
            style={{ color: '#34A853', textShadow: '0 0 40px #34A85380' }}
          >
            grow
          </motion.span>
          <span style={{ color: 'rgb(var(--foreground))' }}> together through </span>
          <motion.span
            className="inline-block"
            whileHover={{ scale: 1.1 }}
            style={{ color: '#FBBC04', textShadow: '0 0 40px #FBBC0480' }}
          >
            technology
          </motion.span>
          <span style={{ color: 'rgb(var(--foreground))' }}>.</span>
        </motion.h2>

        {/* Animated Neon Line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
          className="mt-16 h-1 max-w-lg mx-auto rounded-full origin-center"
          style={{
            background: 'linear-gradient(90deg, #4285F4, #EA4335, #FBBC04, #34A853)',
            boxShadow: '0 0 30px #4285F480, 0 0 60px #EA433540',
          }}
        />
      </div>
    </section>
  );
};

export default MessageSection;
