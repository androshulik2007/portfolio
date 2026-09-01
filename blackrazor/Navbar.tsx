import React, { useState } from 'react';
import { BARBERSHOP_INFO } from '../data/barbershopData';
import { Scissors, Phone, MapPin, Clock, Menu, X, Calendar, Settings } from 'lucide-react';

interface NavbarProps {
  onOpenBooking: () => void;
  onOpenAltegioSettings: () => void;
  isAltegioLive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenBooking,
  onOpenAltegioSettings,
  isAltegioLive,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Послуги та ціни', href: '#prices' },
    { label: 'Майстри', href: '#masters' },
    { label: 'Роботи', href: '#portfolio' },
    { label: 'Атмосфера', href: '#atmosphere' },
    { label: 'Відгуки', href: '#reviews' },
    { label: 'Контакти', href: '#contacts' },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-[#0F0F0F]/95 backdrop-blur-md border-b border-white/10">
      {/* Top Bar for contact info & hours */}
      <div className="hidden lg:block bg-black/60 border-b border-white/5 text-[11px] font-bold uppercase tracking-wider text-white/60 py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
              {BARBERSHOP_INFO.addressKyiv}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
              {BARBERSHOP_INFO.workingHours}
            </span>
          </div>
          <div className="flex items-center space-x-5">
            <button
              id="header-altegio-config-btn"
              onClick={onOpenAltegioSettings}
              className="flex items-center gap-1.5 text-white/60 hover:text-[#D4AF37] transition-colors cursor-pointer"
              title="Налаштування Altegio"
            >
              <Settings className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>
                Altegio: <strong className={isAltegioLive ? 'text-emerald-400' : 'text-[#D4AF37]'}>{isAltegioLive ? 'Live віджет' : 'Інтерактивна заглушка'}</strong>
              </span>
            </button>
            <a
              id="topbar-phone-link"
              href={`tel:${BARBERSHOP_INFO.phoneClean}`}
              className="flex items-center gap-1.5 text-white hover:text-[#D4AF37] font-bold tracking-wider transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
              {BARBERSHOP_INFO.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a
            id="brand-logo-link"
            href="#"
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/20 flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-all">
              <Scissors className="w-5 h-5 transform -rotate-45" />
            </div>
            <div>
              <span className="font-black text-2xl tracking-tighter text-white flex items-center gap-1">
                BLACK RAZOR<span className="text-[#D4AF37]">&</span>BLADE
              </span>
              <span className="block text-[9px] tracking-[0.25em] uppercase text-white/50 font-bold">
                Kyiv Premium Barbershop
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-xs font-bold uppercase tracking-widest text-white/70 hover:text-white transition-colors cursor-pointer py-1"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              id="nav-altegio-settings-btn"
              onClick={onOpenAltegioSettings}
              className="p-2.5 rounded-full border border-white/20 hover:border-[#D4AF37] text-white/60 hover:text-white transition-all cursor-pointer"
              title="Налаштування Altegio (Live / Заглушка)"
            >
              <Settings className="w-4 h-4" />
            </button>
            
            <button
              id="nav-book-appointment-btn"
              onClick={onOpenBooking}
              className="px-6 py-2.5 rounded-full bg-[#D4AF37] hover:bg-white text-black font-black text-xs uppercase tracking-widest transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/20 active:scale-95"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Запис онлайн</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              id="mobile-nav-book-btn"
              onClick={onOpenBooking}
              className="px-4 py-2 rounded-full bg-[#D4AF37] text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Запис</span>
            </button>

            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white/5 border border-white/20 text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0A0A0A] border-b border-white/10 px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-left text-xs font-bold uppercase tracking-widest text-white/80 hover:text-[#D4AF37] py-3 px-3 rounded border-b border-white/5 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 flex flex-col gap-2.5">
            <button
              id="drawer-open-altegio-settings-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAltegioSettings();
              }}
              className="w-full py-2.5 px-4 rounded-lg bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4 text-[#D4AF37]" />
              <span>Налаштування віджета Altegio</span>
            </button>

            <a
              href={`tel:${BARBERSHOP_INFO.phoneClean}`}
              className="w-full py-2.5 px-4 rounded-lg bg-white/10 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4 text-[#D4AF37]" />
              <span>{BARBERSHOP_INFO.phone}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
