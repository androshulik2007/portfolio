import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MastersSection } from './components/MastersSection';
import { PriceListSection } from './components/PriceListSection';
import { PortfolioSection } from './components/PortfolioSection';
import { AboutAtmosphere } from './components/AboutAtmosphere';
import { ReviewsSection } from './components/ReviewsSection';
import { ContactsSection } from './components/ContactsSection';
import { Footer } from './components/Footer';
import { AltegioBookingModal } from './components/AltegioBookingModal';
import { AltegioSettingsModal } from './components/AltegioSettingsModal';
import { AltegioSettings } from './types';
import { ALTEGIO_DEFAULT_CONFIG } from './data/barbershopData';
import { Calendar, Sparkles } from 'lucide-react';

export default function App() {
  const [altegioConfig, setAltegioConfig] = useState<AltegioSettings>(() => {
    const saved = localStorage.getItem('barbershop_altegio_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return ALTEGIO_DEFAULT_CONFIG;
      }
    }
    return ALTEGIO_DEFAULT_CONFIG;
  });

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [preSelectedServiceId, setPreSelectedServiceId] = useState<string | null>(null);
  const [preSelectedMasterId, setPreSelectedMasterId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('barbershop_altegio_config', JSON.stringify(altegioConfig));
  }, [altegioConfig]);

  const handleOpenBooking = () => {
    setPreSelectedServiceId(null);
    setPreSelectedMasterId(null);
    setIsBookingModalOpen(true);
  };

  const handleSelectMasterForBooking = (masterId: string) => {
    setPreSelectedMasterId(masterId);
    setPreSelectedServiceId(null);
    setIsBookingModalOpen(true);
  };

  const handleSelectServiceForBooking = (serviceId: string) => {
    setPreSelectedServiceId(serviceId);
    setPreSelectedMasterId(null);
    setIsBookingModalOpen(true);
  };

  const handleScrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#F5F5F5] flex flex-col relative selection:bg-[#D4AF37] selection:text-black">
      {/* Sticky Top Navigation */}
      <Navbar
        onOpenBooking={handleOpenBooking}
        onOpenAltegioSettings={() => setIsSettingsModalOpen(true)}
        isAltegioLive={altegioConfig.enabledLiveWidget}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        <Hero
          onOpenBooking={handleOpenBooking}
          onOpenPriceList={() => handleScrollToSection('prices')}
        />

        <PriceListSection
          onSelectServiceForBooking={handleSelectServiceForBooking}
        />

        <MastersSection
          onSelectMasterForBooking={handleSelectMasterForBooking}
        />

        <PortfolioSection
          onOpenBooking={handleOpenBooking}
        />

        <AboutAtmosphere />

        <ReviewsSection />

        <ContactsSection />
      </main>

      {/* Footer */}
      <Footer
        onOpenBooking={handleOpenBooking}
        onOpenAltegioSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Floating Fast Booking Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          id="floating-quick-book-btn"
          onClick={handleOpenBooking}
          className="group relative flex items-center gap-2.5 px-6 py-4 rounded-full bg-[#D4AF37] hover:bg-white text-black font-black text-xs uppercase tracking-widest shadow-2xl shadow-[#D4AF37]/30 hover:shadow-white/20 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 cursor-pointer border border-[#D4AF37]"
        >
          <Calendar className="w-4 h-4" />
          <span className="hidden sm:inline">Записатися онлайн</span>
          <span className="sm:hidden">Запис</span>
          <span className="w-2 h-2 rounded-full bg-black animate-ping ml-0.5"></span>
        </button>
      </div>

      {/* Altegio Booking Modal (Simulator & Live Embed) */}
      <AltegioBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        config={altegioConfig}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        preSelectedServiceId={preSelectedServiceId}
        preSelectedMasterId={preSelectedMasterId}
      />

      {/* Altegio Developer / Owner Settings Modal */}
      <AltegioSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={altegioConfig}
        onSaveConfig={(newCfg) => setAltegioConfig(newCfg)}
      />
    </div>
  );
}
