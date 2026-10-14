import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/common/SEO';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Sparkles, 
  MessageSquare, 
  Heart, 
  Terminal, 
  RefreshCw 
} from 'lucide-react';

const PIXEL_DIALOGUES = [
  "Meow! Remember: Great developers write code for humans, not just compilers.",
  "Hackathon tip: Ship your MVP first, then layer on delight and animations!",
  "Pixel conducts surprise code reviews across campus. Keep your imports clean!",
  "Feeling stuck on a stubborn bug? Rubber-duck with me or take a 5-minute walk.",
  "Google Cloud, Flutter, AI/ML or Web — whatever you build, GDG has your back!",
  "Psst... Want a secret? Press `~` or tap the GDG header logo 3 times for our hacker terminal!"
];

// ---------------------------------------------------------------------------
// Fade-up reveal helper — matches the existing project's reveal convention
// ---------------------------------------------------------------------------

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.23, 1, 0.32, 1], delay },
  }),
};

// ---------------------------------------------------------------------------
// AboutUsPage
// ---------------------------------------------------------------------------

const AboutUsPage = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [heartCount, setHeartCount] = useState(128);
  const [isPurring, setIsPurring] = useState(false);
  const [activeTab, setActiveTab] = useState<'tips' | 'story'>('tips');

  const handlePet = () => {
    setHeartCount((prev) => prev + 1);
    setIsPurring(true);
    setTimeout(() => setIsPurring(false), 1200);
  };

  const handleNextDialogue = () => {
    setDialogueIndex((prev) => (prev + 1) % PIXEL_DIALOGUES.length);
  };

  // Derived colour tokens that respect the site's existing theme palette
  const mutedText = isDark ? 'rgba(255,255,255,0.60)' : 'rgba(31,31,31,0.68)';
  const bodyText = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(31,31,31,0.90)';
  const headingAccent = '#4285F4';
  const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(31,31,31,0.10)';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="About Us"
        description="Learn about Google Developer Groups (GDG) On Campus at Rajalakshmi Engineering College (REC) - our mission, vision, tech domains, and vibrant student community."
        keywords={['About GDG REC', 'GDG on Campus Rajalakshmi Engineering College', 'Google Developer Groups Chennai', 'student developer community']}
        canonical="https://www.gdgrec.dev/about-us"
      />
      <Header />

      <main>
        {/* ----------------------------------------------------------------
            HERO / INTRO
        ---------------------------------------------------------------- */}
        <section
          aria-labelledby="about-page-heading"
          className="pt-28 pb-16 md:pt-36 md:pb-20 container mx-auto px-6 md:px-12 max-w-4xl"
        >

          {/* Eyebrow label */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.08}
            className="section-eyebrow mb-4"
            style={{ color: isDark ? headingAccent : 'rgba(31,31,31,0.45)' }}
          >
            About
          </motion.p>

          {/* Page title */}
          <motion.h1
            id="about-page-heading"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.14}
            className="font-display leading-tight mb-8"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              color: isDark ? '#ffffff' : '#1F1F1F',
            }}
          >
            Google Developer Groups (GDG) On Campus at Rajalakshmi Engineering
            College
          </motion.h1>

          {/* Introductory paragraph */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.20}
            className="font-body text-base md:text-lg leading-relaxed"
            style={{ color: bodyText }}
          >
            Welcome to the Google Developer Groups (GDG) On Campus at
            Rajalakshmi Engineering College (REC)—the largest technical club in
            our college! We are a vibrant community of tech enthusiasts
            dedicated to fostering innovation, collaboration, and learning in
            the fields of technology and computer science.
          </motion.p>
        </section>

        {/* ----------------------------------------------------------------
            CONTENT SECTIONS
        ---------------------------------------------------------------- */}
        <section
          aria-label="About us content"
          className="container mx-auto px-6 md:px-12 max-w-4xl pb-20 md:pb-28 space-y-14"
        >
          {/* Divider */}
          <motion.hr
            initial={{ scaleX: 0, originX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'circOut' }}
            style={{ borderColor: dividerColor }}
          />

          {/* --- Our Mission --- */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            custom={0}
          >
            <h2
              className="font-body font-bold text-xl md:text-2xl mb-4 underline decoration-1 underline-offset-4"
              style={{ color: bodyText }}
            >
              Our Mission:
            </h2>
            <p
              className="font-body text-base md:text-lg leading-relaxed"
              style={{ color: mutedText }}
            >
              At GDG REC, our mission is to empower students with the skills
              and knowledge necessary to excel in the rapidly evolving tech
              landscape. We aim to bridge the gap between academic learning and
              real-world applications, providing opportunities for hands-on
              experiences, peer-to-peer learning, and networking with industry
              professionals.
            </p>
          </motion.div>

          {/* --- What We Do --- */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            custom={0}
          >
            <h2
              className="font-body font-bold text-xl md:text-2xl mb-4 underline decoration-1 underline-offset-4"
              style={{ color: bodyText }}
            >
              What We Do:
            </h2>
            <p
              className="font-body text-base md:text-lg leading-relaxed"
              style={{ color: mutedText }}
            >
              We organize a variety of engaging events, workshops, and seminars
              that cover the latest technologies, including cloud computing,
              artificial intelligence, web development, mobile app development,
              and more. Our events feature expert speakers, interactive
              sessions, and practical labs that allow participants to gain
              valuable insights and practical skills.
            </p>
          </motion.div>

          {/* --- Community and Collaboration --- */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            custom={0}
          >
            <h2
              className="font-body font-bold text-xl md:text-2xl mb-4 underline decoration-1 underline-offset-4"
              style={{ color: bodyText }}
            >
              Community and Collaboration:
            </h2>
            <p
              className="font-body text-base md:text-lg leading-relaxed"
              style={{ color: mutedText }}
            >
              GDG REC is not just about learning; it's about building a
              community. We foster an inclusive environment where students from
              all disciplines can collaborate, share ideas, and work on projects
              together. Through hackathons, study jams, and collaborative
              coding sessions, we encourage teamwork and creativity, helping
              members grow both personally and professionally.
            </p>
          </motion.div>

          {/* --- Mentorship and Networking --- */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            custom={0}
          >
            <h2
              className="font-body font-bold text-xl md:text-2xl mb-4 underline decoration-1 underline-offset-4"
              style={{ color: bodyText }}
            >
              Mentorship and Networking:
            </h2>
            <p
              className="font-body text-base md:text-lg leading-relaxed"
              style={{ color: mutedText }}
            >
              We believe in the power of mentorship. Our club connects students
              with experienced mentors from various tech fields who provide
              guidance, support, and valuable industry insights. Additionally,
              we host networking events where students can meet professionals,
              explore internship opportunities, and build connections that can
              shape their careers.
            </p>
          </motion.div>

          {/* --- Join Us & Stay Connected --- */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            custom={0}
          >
            <h2
              className="font-body font-bold text-xl md:text-2xl mb-4 underline decoration-1 underline-offset-4"
              style={{ color: bodyText }}
            >
              Join Us &amp; Stay Connected:
            </h2>
            <p
              className="font-body text-base md:text-lg leading-relaxed mb-6"
              style={{ color: mutedText }}
            >
              Whether you're a beginner eager to learn or an experienced coder
              looking to share your knowledge, GDG On Campus Rajalakshmi
              Engineering College welcomes you! Join us to unlock new skills,
              engage with like-minded peers, and be a part of our dynamic tech
              community. Together, let's innovate, inspire, and impact the
              future of technology!
            </p>
            <p
              className="font-body text-base md:text-lg leading-relaxed"
              style={{ color: mutedText }}
            >
              Follow us on our social media platforms to stay updated on
              upcoming events, workshops, and news from the tech world. Join
              the conversation and be part of the largest technical club at REC!
            </p>
          </motion.div>

          {/* --- Native Interactive Mascot Section --- */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            custom={0}
            className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-xl relative overflow-hidden my-10"
          >
            {/* Top Google Colors Accent Stripe */}
            <div className="absolute top-0 left-0 right-0 h-1 flex w-full">
              <div className="flex-1 bg-google-blue" />
              <div className="flex-1 bg-google-red" />
              <div className="flex-1 bg-google-yellow" />
              <div className="flex-1 bg-google-green" />
            </div>

            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              {/* Mascot Portrait & Interaction Center */}
              <div className="flex flex-col items-center shrink-0">
                <div className="relative w-40 h-52 sm:w-48 sm:h-60 bg-muted/40 rounded-2xl overflow-hidden border border-border/70 flex items-center justify-center p-3 group shadow-inner">
                  <div className="absolute inset-0 bg-gradient-to-t from-google-yellow/20 via-transparent to-transparent pointer-events-none" />
                  <motion.img
                    src="/mascot.webp"
                    alt="Pixel - GDG Official Mascot Kitten"
                    animate={isPurring ? { scale: [1, 1.06, 0.98, 1.04, 1] } : { scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="w-full h-full object-contain drop-shadow-md select-none"
                  />
                  {isPurring && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: -20, scale: 1.2 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-4 right-4 bg-google-red text-white p-1.5 rounded-full shadow-lg pointer-events-none"
                    >
                      <Heart className="w-4 h-4 fill-white" />
                    </motion.div>
                  )}
                </div>

                {/* Pet Button */}
                <button
                  type="button"
                  onClick={handlePet}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold border border-border/80 transition-all cursor-pointer active:scale-95 shadow-sm"
                  aria-label="Pet Pixel the mascot"
                >
                  <Heart className={`w-3.5 h-3.5 transition-colors ${isPurring ? 'text-google-red fill-google-red' : 'text-google-red'}`} />
                  <span>{isPurring ? '*purrr*' : 'Pet Pixel'}</span>
                  <span className="text-[10px] font-mono text-muted-foreground ml-1">({heartCount})</span>
                </button>
              </div>

              {/* Main Content Area */}
              <div className="space-y-4 text-center lg:text-left flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-google-blue/10 text-google-blue border border-google-blue/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Honorary Team Member</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-bold text-2xl sm:text-3xl text-foreground">
                    Pixel the GDG Kitten
                  </h3>
                  <p className="text-xs sm:text-sm font-mono text-muted-foreground font-semibold mt-1">
                    Chief Morale Officer &bull; Lead Bug Hunter &bull; GDG REC Ambassador
                  </p>
                </div>

                {/* Tabs (2 Tabs: Dev Advice & Story) */}
                <div className="flex items-center justify-center lg:justify-start gap-1 p-1 rounded-xl bg-muted/60 border border-border/60 max-w-[210px] mx-auto lg:mx-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('tips')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'tips'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Dev Advice
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('story')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === 'story'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Story
                  </button>
                </div>

                {/* Tab 1: Live Interactive Advice */}
                {activeTab === 'tips' && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-muted/40 border border-border/70 relative text-left">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-4 h-4 text-google-blue shrink-0 mt-0.5" />
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={dialogueIndex}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.2 }}
                            className="text-xs sm:text-sm text-foreground/90 font-sans leading-relaxed min-h-[44px]"
                          >
                            &ldquo;{PIXEL_DIALOGUES[dialogueIndex]}&rdquo;
                          </motion.p>
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                      <button
                        type="button"
                        onClick={handleNextDialogue}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-google-blue text-white text-xs font-semibold hover:bg-google-blue/90 transition-all cursor-pointer active:scale-95 shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Ask Another Tip</span>
                      </button>

                      <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/60 text-muted-foreground text-xs font-mono border border-border/60">
                        <Terminal className="w-3.5 h-3.5 text-google-green" />
                        <span>Tip #{dialogueIndex + 1} of {PIXEL_DIALOGUES.length}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Community Story */}
                {activeTab === 'story' && (
                  <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-muted-foreground text-left">
                    <p>
                      Every great tech community has a mascot that binds them together. Dressed in official Google Developer Groups colors and sporting varsity jacket, Pixel watches over all sessions at Rajalakshmi Engineering College.
                    </p>
                    <p>
                      From 24-hour hackathons to beginner coding bootcamps, Pixel reminds us that building software should be playful, collaborative, and full of curiosity.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* --- Closing statement --- */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            custom={0}
            className="font-body font-semibold text-base md:text-lg leading-relaxed"
            style={{ color: bodyText }}
          >
            GDG On Campus Rajalakshmi Engineering College – Where Passion Meets
            Innovation!
          </motion.p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUsPage;
