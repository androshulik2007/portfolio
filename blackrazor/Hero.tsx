import React from 'react';
import { BARBERSHOP_INFO } from '../data/barbershopData';
import { Calendar, ShieldCheck, Sparkles, Star, Trophy, Wine } from 'lucide-react';

interface HeroProps {
  onOpenBooking: () => void;
  onOpenPriceList: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenBooking, onOpenPriceList }) => {
  return (
    <section id="hero-section" className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#0F0F0F] border-b border-white/10">
      {/* Background Image with High-Contrast Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=2000&q=80"
          alt="Barbershop interior atmosphere"
          className="w-full h-full object-cover object-center opacity-20 filter grayscale contrast-150"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/85 to-[#0F0F0F]/60"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F0F] via-transparent to-[#0F0F0F]"></div>
        {/* Subtle Gold Spotlight */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center flex flex-col items-center">
        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37] mb-8">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Kyiv Heritage • Sharp Precision</span>
        </div>

        {/* Massive Bold Headline */}
        <h1 className="font-heading-hero text-5xl sm:text-7xl md:text-8xl lg:text-[108px] text-white max-w-6xl mb-6">
          PRECISION <br />
          <span className="text-[#D4AF37]">CRAFTSMANSHIP</span>
        </h1>

        {/* High-Impact Subtitle */}
        <p className="max-w-2xl text-base sm:text-lg text-white/70 font-normal leading-relaxed mb-10">
          Більше ніж просто стрижка. Ми формуємо ваш стиль гострими лезами, перевіреними техніками та преміальним сервісом у серці столиці.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-16">
          <button
            id="hero-primary-book-btn"
            onClick={onOpenBooking}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#D4AF37] hover:bg-white text-black font-black text-xs uppercase tracking-widest transition-all duration-200 shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5"
          >
            <Calendar className="w-4 h-4" />
            <span>Записатися онлайн</span>
          </button>

          <button
            id="hero-view-prices-btn"
            onClick={onOpenPriceList}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 hover:bg-white hover:text-black border border-white/20 text-white font-bold text-xs uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Прайс-лист послуг</span>
          </button>
        </div>

        {/* Quick Highlights / Trust Pillars Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl pt-10 border-t border-white/10">
          <div className="p-5 bg-white/5 border border-white/10 text-left hover:border-white/20 transition-colors">
            <div className="flex items-center gap-2 text-[#D4AF37] mb-1.5">
              <Star className="w-4 h-4 fill-[#D4AF37]" />
              <span className="font-black text-xl text-white tracking-tight">4.95 / 5.0</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D4AF37] block mb-1">Рейтинг гостей</span>
            <p className="text-xs text-white/50 leading-snug">500+ верифікованих відгуків у системі Altegio</p>
          </div>

          <div className="p-5 bg-white/5 border border-white/10 text-left hover:border-white/20 transition-colors">
            <div className="flex items-center gap-2 text-[#D4AF37] mb-1.5">
              <Trophy className="w-4 h-4" />
              <span className="font-black text-xl text-white tracking-tight">Top Barbers</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D4AF37] block mb-1">Кваліфікація</span>
            <p className="text-xs text-white/50 leading-snug">Майстри зі стажем від 4 до 9+ років практики</p>
          </div>

          <div className="p-5 bg-white/5 border border-white/10 text-left hover:border-white/20 transition-colors">
            <div className="flex items-center gap-2 text-[#D4AF37] mb-1.5">
              <Wine className="w-4 h-4" />
              <span className="font-black text-xl text-white tracking-tight">Lounge & Bar</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D4AF37] block mb-1">Комфорт</span>
            <p className="text-xs text-white/50 leading-snug">Крафтова кава, елітний віскі та PS5 для гостей</p>
          </div>

          <div className="p-5 bg-white/5 border border-white/10 text-left hover:border-white/20 transition-colors">
            <div className="flex items-center gap-2 text-[#D4AF37] mb-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-black text-xl text-white tracking-tight">100% Стерильно</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#D4AF37] block mb-1">Безпека</span>
            <p className="text-xs text-white/50 leading-snug">Медична 3-етапна дезінфекція інструментів</p>
          </div>
        </div>
      </div>
    </section>
  );
};
