import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import MessageSection from '@/components/MessageSection';
import EventsHorizontal from '@/components/EventsHorizontal';
import TeamSection from '@/components/TeamSection';
import ResourcesSection from '@/components/ResourcesSection';
import Footer from '@/components/Footer';
import Preloader from '@/components/Preloader';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Gradient transition band placed between sections.
 * Each band uses a pair of Google brand colors that bleed from the
 * section above into the section below, creating a smooth visual seam.
 */
const GradientBand = ({
  from,
  to,
  flip = false,
}: {
  from: string;
  to: string;
  flip?: boolean;
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const opacity = isDark ? 0.12 : 0.18;

  return (
    <div
      aria-hidden
      className="relative w-full h-16 md:h-20 pointer-events-none select-none -my-8 md:-my-10 z-10"
    >
      {/* Primary radial wash */}
      <div
        className="absolute inset-0"
        style={{
          background: flip
            ? `radial-gradient(ellipse 80% 100% at 70% 0%, ${from}${isDark ? '30' : '18'} 0%, transparent 70%),
               radial-gradient(ellipse 60% 80% at 20% 100%, ${to}${isDark ? '20' : '10'} 0%, transparent 60%)`
            : `radial-gradient(ellipse 80% 100% at 30% 100%, ${from}${isDark ? '30' : '18'} 0%, transparent 70%),
               radial-gradient(ellipse 60% 80% at 80% 0%, ${to}${isDark ? '20' : '10'} 0%, transparent 60%)`,
        }}
      />
      {/* Thin center line accent */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 h-px rounded-full"
        style={{
          width: '40%',
          background: `linear-gradient(90deg, transparent, ${from}${isDark ? '50' : '30'}, ${to}${isDark ? '50' : '30'}, transparent)`,
          opacity,
        }}
      />
    </div>
  );
};

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-google-blue/30">
      <Preloader />
      <Header />
      <HeroSection />

      <GradientBand from="#4285F4" to="#EA4335" />
      <MessageSection />

      <GradientBand from="#EA4335" to="#FBBC04" flip />
      <EventsHorizontal />

      <GradientBand from="#FBBC04" to="#34A853" />
      <TeamSection />

      <GradientBand from="#34A853" to="#EA4335" flip />
      <ResourcesSection />

      <GradientBand from="#34A853" to="#FBBC04" flip />
      <Footer />
    </main>
  );
};

export default Index;
