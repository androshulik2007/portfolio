import React, { useState } from 'react';
import { Barber } from '../types';
import { BARBERS } from '../data/barbershopData';
import { Star, Award, Calendar, ChevronRight, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface MastersSectionProps {
  onSelectMasterForBooking: (masterId: string) => void;
}

export const MastersSection: React.FC<MastersSectionProps> = ({ onSelectMasterForBooking }) => {
  const [selectedMasterForModal, setSelectedMasterForModal] = useState<Barber | null>(null);
  const [filterRank, setFilterRank] = useState<string>('all');

  const ranks = [
    { id: 'all', label: 'Всі майстри' },
    { id: 'Brand Master', label: 'Brand Master' },
    { id: 'Top Barber', label: 'Top Barber' },
    { id: 'Senior Barber', label: 'Senior Barber' },
  ];

  const filteredBarbers = filterRank === 'all'
    ? BARBERS
    : BARBERS.filter((b) => b.rank === filterRank);

  const getRankBadgeColor = (rank: string) => {
    switch (rank) {
      case 'Brand Master':
        return 'bg-[#D4AF37] text-black font-black';
      case 'Top Barber':
        return 'bg-white/10 text-[#D4AF37] border border-[#D4AF37]/50 font-black';
      case 'Senior Barber':
        return 'bg-white/10 text-white border border-white/20 font-bold';
      default:
        return 'bg-white/10 text-white/70 border border-white/20 font-bold';
    }
  };

  return (
    <section id="masters" className="py-20 lg:py-28 bg-[#0F0F0F] relative border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37] mb-3">
              <Award className="w-4 h-4" />
              <span>Elite Artisans</span>
            </div>
            <h2 className="font-heading-hero text-4xl sm:text-6xl text-white tracking-tighter uppercase">
              MASTERS <span className="text-[#D4AF37]">&</span> BARBERS
            </h2>
            <p className="text-white/60 mt-3 text-base max-w-xl">
              Кожен із наших барберів — дипломований фахівець із власним унікальним почерком, високою швидкістю та увагою до дрібниць.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {ranks.map((r) => (
              <button
                key={r.id}
                id={`filter-rank-${r.id}`}
                onClick={() => setFilterRank(r.id)}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  filterRank === r.id
                    ? 'bg-[#D4AF37] text-black font-black shadow-lg shadow-[#D4AF37]/20'
                    : 'bg-white/5 text-white/70 hover:text-white border border-white/10 hover:border-white/20'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Barbers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredBarbers.map((barber) => (
            <div
              key={barber.id}
              id={`master-card-${barber.id}`}
              className="group bg-white/5 border border-white/10 hover:border-white/25 overflow-hidden flex flex-col transition-all duration-300"
            >
              {/* Photo & Badge */}
              <div className="relative h-72 overflow-hidden bg-black">
                <img
                  src={barber.avatarUrl}
                  alt={barber.name}
                  className="w-full h-full object-cover object-center filter grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-transparent"></div>
                
                {/* Rank Badge */}
                <div className="absolute top-3 left-3">
                  <span
                    className={`inline-block px-3 py-1 text-[9px] uppercase tracking-widest ${getRankBadgeColor(
                      barber.rank
                    )}`}
                  >
                    {barber.rank}
                  </span>
                </div>

                {/* Rating Badge */}
                <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 border border-white/15 flex items-center gap-1.5 text-xs text-white font-mono">
                  <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
                  <span className="font-bold">{barber.rating}</span>
                  <span className="text-white/50 text-[10px]">({barber.reviewsCount})</span>
                </div>

                {/* Experience counter overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                  <span className="text-white font-mono font-medium bg-black/80 px-2.5 py-1 border border-white/10">
                    Досвід: <strong className="text-[#D4AF37]">{barber.experienceYears}+ років</strong>
                  </span>
                </div>
              </div>

              {/* Info Container */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-[#D4AF37] transition-colors">
                    {barber.name}
                  </h3>
                  <p className="text-xs text-white/60 line-clamp-2 mt-2 leading-relaxed">
                    {barber.bio}
                  </p>

                  {/* Specialties Pills */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {barber.specialties.slice(0, 2).map((spec, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/70 px-2 py-0.5 border border-white/10"
                      >
                        {spec}
                      </span>
                    ))}
                    {barber.specialties.length > 2 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 text-[#D4AF37] px-2 py-0.5 border border-white/10">
                        +{barber.specialties.length - 2}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-2">
                  <button
                    id={`btn-book-master-${barber.id}`}
                    onClick={() => onSelectMasterForBooking(barber.id)}
                    className="w-full py-2.5 px-4 rounded-full bg-[#D4AF37] hover:bg-white text-black font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Записатися до майстра</span>
                  </button>

                  <button
                    id={`btn-view-portfolio-${barber.id}`}
                    onClick={() => setSelectedMasterForModal(barber)}
                    className="w-full py-2 px-3 text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Портфоліо та деталі</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Master Portfolio / Bio Modal */}
      {selectedMasterForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#121212] border border-white/20 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative">
            <button
              id="close-master-modal-btn"
              onClick={() => setSelectedMasterForModal(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <img
                src={selectedMasterForModal.avatarUrl}
                alt={selectedMasterForModal.name}
                className="w-28 h-28 sm:w-36 sm:h-36 object-cover border border-[#D4AF37] shadow-lg"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="font-heading-hero text-2xl sm:text-3xl text-white uppercase tracking-tight">
                    {selectedMasterForModal.name}
                  </h3>
                  <span
                    className={`px-3 py-1 text-xs uppercase tracking-widest ${getRankBadgeColor(
                      selectedMasterForModal.rank
                    )}`}
                  >
                    {selectedMasterForModal.rank}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-white/60 mb-4">
                  <span className="flex items-center gap-1 text-[#D4AF37] font-bold">
                    <Star className="w-4 h-4 fill-[#D4AF37]" />
                    {selectedMasterForModal.rating} ({selectedMasterForModal.reviewsCount} відгуків)
                  </span>
                  <span>•</span>
                  <span>Досвід: {selectedMasterForModal.experienceYears} років</span>
                  <span>•</span>
                  <span>{selectedMasterForModal.scheduleText}</span>
                </div>

                <p className="text-white/70 text-sm leading-relaxed mb-4">
                  {selectedMasterForModal.bio}
                </p>

                <div className="space-y-2 mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-white/50 block">
                    Спеціалізація та навички:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedMasterForModal.specialties.map((spec, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-xs bg-white/5 text-white px-3 py-1 border border-white/15 font-medium"
                      >
                        <CheckCircle2 className="w-3 h-3 text-[#D4AF37]" />
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Master's Portfolio Works Gallery */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <h4 className="text-xs font-black uppercase tracking-widest text-white">
                  Приклади робіт майстра ({selectedMasterForModal.portfolioImages.length})
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {selectedMasterForModal.portfolioImages.map((work, idx) => (
                  <div key={idx} className="group relative overflow-hidden bg-black h-48 border border-white/10">
                    <img
                      src={work.url}
                      alt={work.title}
                      className="w-full h-full object-cover filter grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-3">
                      <span className="text-xs text-white font-bold uppercase tracking-wider">{work.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA in Modal */}
            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setSelectedMasterForModal(null)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Закрити
              </button>
              <button
                id="modal-direct-book-master-btn"
                onClick={() => {
                  const masterId = selectedMasterForModal.id;
                  setSelectedMasterForModal(null);
                  onSelectMasterForBooking(masterId);
                }}
                className="px-6 py-2.5 rounded-full bg-[#D4AF37] hover:bg-white text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Calendar className="w-4 h-4" />
                <span>Записатись до {selectedMasterForModal.name}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
