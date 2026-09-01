import React from 'react';
import { Wine, Gamepad2, ShieldCheck, Sparkles, Coffee, Award } from 'lucide-react';

export const AboutAtmosphere: React.FC = () => {
  return (
    <section id="atmosphere" className="py-20 lg:py-28 bg-[#0F0F0F] relative border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column Text */}
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37] mb-3">
              <Sparkles className="w-4 h-4" />
              <span>The Gentlemen's Sanctuary</span>
            </div>
            <h2 className="font-heading-hero text-4xl sm:text-6xl text-white tracking-tighter uppercase mb-6">
              CLUB <span className="text-[#D4AF37]">&</span> ATMOSPHERE
            </h2>
            <p className="text-white/70 text-base leading-relaxed mb-8">
              Ми створили простір, куди приходять не лише за якісною стрижкою, а й для того, щоб перезавантажитися після робочого дня, провести час у колі однодумців та отримати сервіс преміум-рівня.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <div className="p-5 bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <div className="w-10 h-10 bg-white/10 border border-white/15 flex items-center justify-center text-[#D4AF37] mb-3">
                  <Wine className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-tight text-white mb-1">
                  Безкоштовний бар
                </h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Односолодовий віскі, крафтова кава з свіжообсмажених зерен або холодні напої.
                </p>
              </div>

              <div className="p-5 bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <div className="w-10 h-10 bg-white/10 border border-white/15 flex items-center justify-center text-[#D4AF37] mb-3">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-tight text-white mb-1">
                  PlayStation Lounge
                </h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Зручні шкіряні дивани, останні версії FIFA та Mortal Kombat для вас чи вашого сина.
                </p>
              </div>

              <div className="p-5 bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <div className="w-10 h-10 bg-white/10 border border-white/15 flex items-center justify-center text-[#D4AF37] mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-tight text-white mb-1">
                  Медична стерильність
                </h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Сухожарові шафи, одноразові леза, антисептична обробка після кожного гостя.
                </p>
              </div>

              <div className="p-5 bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <div className="w-10 h-10 bg-white/10 border border-white/15 flex items-center justify-center text-[#D4AF37] mb-3">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-tight text-white mb-1">
                  Світова косметика
                </h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Використовуємо лінійки Reuzel (Нідерланди), American Crew (США) та Proraso (Італія).
                </p>
              </div>
            </div>
          </div>

          {/* Right Column Photos Mosaic */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="overflow-hidden h-64 bg-black border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=700&q=80"
                  alt="Barber grooming beard"
                  className="w-full h-full object-cover filter grayscale contrast-125 hover:grayscale-0 transition-all duration-500"
                />
              </div>
              <div className="overflow-hidden h-44 bg-black border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=700&q=80"
                  alt="Barbershop tools"
                  className="w-full h-full object-cover filter grayscale contrast-125 hover:grayscale-0 transition-all duration-500"
                />
              </div>
            </div>

            <div className="space-y-4 pt-6">
              <div className="overflow-hidden h-44 bg-black border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=700&q=80"
                  alt="Barber tools and brushes"
                  className="w-full h-full object-cover filter grayscale contrast-125 hover:grayscale-0 transition-all duration-500"
                />
              </div>
              <div className="overflow-hidden h-64 bg-black border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=700&q=80"
                  alt="Leather chairs lounge"
                  className="w-full h-full object-cover filter grayscale contrast-125 hover:grayscale-0 transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
