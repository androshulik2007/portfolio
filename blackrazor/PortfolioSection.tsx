import React, { useState } from 'react';
import { PORTFOLIO_ITEMS } from '../data/barbershopData';
import { Camera, ZoomIn, X, Scissors } from 'lucide-react';
import { PortfolioItem } from '../types';

interface PortfolioSectionProps {
  onOpenBooking: () => void;
}

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({ onOpenBooking }) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activeImageModal, setActiveImageModal] = useState<PortfolioItem | null>(null);

  const filters = [
    { id: 'all', label: 'Всі роботи' },
    { id: 'fade', label: 'Fade & Crop' },
    { id: 'beard', label: 'Борода та вуса' },
    { id: 'classic', label: 'Класичні форми' },
    { id: 'haircut', label: 'Модельні стрижки' },
  ];

  const filteredItems = activeFilter === 'all'
    ? PORTFOLIO_ITEMS
    : PORTFOLIO_ITEMS.filter((item) => item.category === activeFilter);

  return (
    <section id="portfolio" className="py-20 lg:py-28 bg-[#0F0F0F] relative border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37] mb-3">
              <Camera className="w-4 h-4" />
              <span>Visual Showcase</span>
            </div>
            <h2 className="font-heading-hero text-4xl sm:text-6xl text-white tracking-tighter uppercase">
              OUR <span className="text-[#D4AF37]">PORTFOLIO</span>
            </h2>
            <p className="text-white/60 mt-3 text-base max-w-xl">
              Реальні стрижки та укладки наших гостей. Обирайте референс для свого наступного візиту.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.id}
                id={`portfolio-filter-${f.id}`}
                onClick={() => setActiveFilter(f.id)}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-[#D4AF37] text-black font-black shadow-lg shadow-[#D4AF37]/20'
                    : 'bg-white/5 text-white/70 hover:text-white border border-white/10 hover:border-white/20'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              id={`portfolio-item-${item.id}`}
              onClick={() => setActiveImageModal(item)}
              className="group relative h-80 sm:h-96 overflow-hidden bg-black border border-white/10 hover:border-white/30 transition-all cursor-pointer"
            >
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover filter grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-108 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

              <div className="absolute inset-0 p-6 flex flex-col justify-between">
                <div className="self-end opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 backdrop-blur-md p-2.5 rounded-full text-white border border-white/20">
                  <ZoomIn className="w-4 h-4" />
                </div>

                <div>
                  <span className="text-[10px] text-[#D4AF37] font-black uppercase tracking-widest block mb-1">
                    Майстер: {item.masterName}
                  </span>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white leading-tight">
                    {item.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA banner below portfolio */}
        <div className="mt-14 p-8 bg-white/5 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-[#D4AF37] shrink-0">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-lg font-black uppercase tracking-tight text-white">
                Бажаєте таку саму стрижку чи оформлення бороди?
              </h4>
              <p className="text-xs text-white/60 mt-1">
                Покажіть майстру фото при зустрічі або запишіться на безкоштовну консультацію форми.
              </p>
            </div>
          </div>

          <button
            id="portfolio-cta-book-btn"
            onClick={onOpenBooking}
            className="w-full md:w-auto px-8 py-3.5 rounded-full bg-[#D4AF37] hover:bg-white text-black font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#D4AF37]/20 whitespace-nowrap cursor-pointer"
          >
            Записатися на стрижку
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-4xl w-full bg-[#121212] border border-white/20 overflow-hidden shadow-2xl">
            <button
              onClick={() => setActiveImageModal(null)}
              className="absolute top-4 right-4 z-10 p-2.5 bg-black/80 text-white hover:bg-black transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row">
              <div className="md:w-3/5 h-[400px] md:h-[520px] bg-black">
                <img
                  src={activeImageModal.imageUrl}
                  alt={activeImageModal.title}
                  className="w-full h-full object-cover filter contrast-125"
                />
              </div>
              <div className="md:w-2/5 p-6 md:p-8 flex flex-col justify-between bg-[#141414] border-t md:border-t-0 md:border-l border-white/10">
                <div>
                  <span className="text-xs font-black text-[#D4AF37] uppercase tracking-widest block mb-2">
                    Автор роботи: {activeImageModal.masterName}
                  </span>
                  <h3 className="font-heading-hero text-2xl text-white uppercase tracking-tight mb-4">
                    {activeImageModal.title}
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed mb-6">
                    Ідеальний градієнтний перехід, опрацювання текстури та завершальна укладка матовою пастою.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setActiveImageModal(null);
                      onOpenBooking();
                    }}
                    className="w-full py-3.5 rounded-full bg-[#D4AF37] hover:bg-white text-black font-black text-xs uppercase tracking-widest transition-colors cursor-pointer shadow-md"
                  >
                    Записатися на цей стиль
                  </button>
                  <button
                    onClick={() => setActiveImageModal(null)}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Закрити галерею
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
