import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTheme } from '@/contexts/ThemeContext';

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

  // Derived colour tokens that respect the site's existing theme palette
  const mutedText = isDark ? 'rgba(255,255,255,0.60)' : 'rgba(31,31,31,0.68)';
  const bodyText = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(31,31,31,0.90)';
  const headingAccent = '#4285F4';
  const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(31,31,31,0.10)';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main>
        {/* ----------------------------------------------------------------
            HERO / INTRO
        ---------------------------------------------------------------- */}
        <section
          aria-labelledby="about-page-heading"
          className="pt-28 pb-16 md:pt-36 md:pb-20 container mx-auto px-6 md:px-12 max-w-4xl"
        >
          {/* Back to Home Button */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="mb-6 md:mb-8"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:bg-muted text-xs sm:text-sm font-semibold text-foreground transition-all shadow-sm group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-google-blue" />
              <span>Back to Home</span>
            </Link>
          </motion.div>

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
