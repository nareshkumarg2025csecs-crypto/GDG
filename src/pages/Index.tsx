import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import MessageSection from '@/components/MessageSection';
import EventsHorizontal from '@/components/EventsHorizontal';
import MiniGallery from '@/components/gallery/MiniGallery';
import TeamSection from '@/components/TeamSection';
import ResourcesSection from '@/components/ResourcesSection';
import Footer from '@/components/Footer';
import Preloader from '@/components/Preloader';

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-google-blue/30">
      <Preloader />
      <Header />
      <HeroSection />
      <MessageSection />
      <EventsHorizontal />
      <TeamSection />
      <MiniGallery />
      <ResourcesSection />
      <Footer />
    </main>
  );
};

export default Index;
