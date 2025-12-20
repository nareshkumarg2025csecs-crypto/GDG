import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import MessageSection from '@/components/MessageSection';
import PhotoGallery from '@/components/PhotoGallery';
import TrackSection from '@/components/TrackSection';
import HallOfFame from '@/components/HallOfFame';
import StoreSection from '@/components/StoreSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Header />
      <HeroSection />
      <MessageSection />
      <PhotoGallery />
      <TrackSection />
      <HallOfFame />
      <StoreSection />
      <Footer />
    </main>
  );
};

export default Index;
