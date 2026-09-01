import React, { useState } from 'react';
import { SERVICES, SERVICE_CATEGORIES } from '../data/barbershopData';
import { Scissors, Sparkles, Layers, ShieldCheck, Smile, Clock, Check, Search, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { ServiceItem } from '../types';

interface PriceListSectionProps {
  onSelectServiceForBooking: (serviceId: string) => void;
}

export const PriceListSection: React.FC<PriceListSectionProps> = ({ onSelectServiceForBooking }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedTierServiceId, setExpandedTierServiceId] = useState<string | null>(null);

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'haircuts':
        return <Scissors className="w-4 h-4" />;
      case 'beard':
        return <Sparkles className="w-4 h-4" />;
      case 'combo':
        return <Layers className="w-4 h-4" />;
      case 'spa_care':
        return <ShieldCheck className="w-4 h-4" />;
      case 'kids':
        return <Smile className="w-4 h-4" />;
      default:
        return <Scissors className="w-4 h-4" />;
    }
  };

  const filteredServices = SERVICES.filter((service) => {
    const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
    const matchesSearch =
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleTierBreakdown = (serviceId: string) => {
    setExpandedTierServiceId(expandedTierServiceId === serviceId ? null : serviceId);
  };

  return (
    <section id="prices" className="py-20 lg:py-28 bg-[#0F0F0F] relative border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37] mb-3">
            <Scissors className="w-4 h-4" />
            <span>Service & Transparency</span>
          </div>
          <h2 className="font-heading-hero text-4xl sm:text-6xl text-white tracking-tighter uppercase mb-4">
            PRICE <span className="text-[#D4AF37]">LIST</span>
          </h2>
          <p className="text-white/60 text-base leading-relaxed">
            У вартість кожної послуги входить миття голови преміум косметикою, укладка та будь-які напої з бару без обмежень.
          </p>
        </div>

        {/* Search and Category Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
          {/* Categories Tab Bar */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button
              id="category-tab-all"
              onClick={() => setActiveCategory('all')}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-[#D4AF37] text-black font-black shadow-lg shadow-[#D4AF37]/20'
                  : 'bg-white/5 text-white/70 hover:text-white border border-white/10 hover:border-white/20'
              }`}
            >
              Всі послуги ({SERVICES.length})
            </button>
            {SERVICE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                id={`category-tab-${cat.id}`}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#D4AF37] text-black font-black shadow-lg shadow-[#D4AF37]/20'
                    : 'bg-white/5 text-white/70 hover:text-white border border-white/10 hover:border-white/20'
                }`}
              >
                {getCategoryIcon(cat.id)}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              id="search-services-input"
              type="text"
              placeholder="Пошук послуги..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/15 rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>
        </div>

        {/* Services List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              id={`service-item-${service.id}`}
              className="bg-white/5 border border-white/10 hover:border-white/25 transition-all p-6 sm:p-7 flex flex-col justify-between group relative overflow-hidden"
            >
              {service.popular && (
                <div className="absolute top-0 right-0">
                  <span className="inline-block bg-[#D4AF37] text-black text-[9px] font-black uppercase px-3.5 py-1 tracking-widest">
                    POPULAR
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-[#D4AF37] transition-colors">
                    {service.title}
                  </h3>
                  <div className="text-right">
                    <span className="font-mono font-black text-2xl text-[#D4AF37] tracking-tight">
                      ₴{service.price}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold text-white/50 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                    ~{service.durationMinutes} хв
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-white/60 leading-relaxed mb-5">
                  {service.description}
                </p>

                {/* Tier pricing accordion if available */}
                {service.masterTierPricing && (
                  <div className="mb-5">
                    <button
                      onClick={() => toggleTierBreakdown(service.id)}
                      className="text-xs font-bold uppercase tracking-wider text-white/60 hover:text-[#D4AF37] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Ціни за рангами майстрів</span>
                      {expandedTierServiceId === service.id ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {expandedTierServiceId === service.id && (
                      <div className="mt-3 p-3.5 bg-black/40 border border-white/10 grid grid-cols-3 gap-2 text-center text-xs animate-in fade-in">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-white/50 block">Barber</span>
                          <strong className="font-mono text-sm text-white">₴{service.masterTierPricing.barber}</strong>
                        </div>
                        <div className="border-x border-white/10">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4AF37] block">Top Barber</span>
                          <strong className="font-mono text-sm text-[#D4AF37]">₴{service.masterTierPricing.topBarber}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 block">Brand Master</span>
                          <strong className="font-mono text-sm text-amber-200">₴{service.masterTierPricing.brandMaster}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Booking Button */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-medium text-white/40 hidden sm:inline">
                  Вільні місця на сьогодні
                </span>
                <button
                  id={`book-service-btn-${service.id}`}
                  onClick={() => onSelectServiceForBooking(service.id)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-white/10 hover:bg-[#D4AF37] text-white hover:text-black font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer group-hover:bg-[#D4AF37] group-hover:text-black"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Записатися</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-16 bg-white/5 border border-white/10">
            <p className="text-white/60 text-sm">За вашим запитом послуг не знайдено.</p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="mt-3 text-xs font-bold uppercase tracking-wider text-[#D4AF37] hover:underline"
            >
              Скинути фільтри
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
