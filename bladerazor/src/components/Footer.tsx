import React from 'react';
import { BARBERSHOP_INFO } from '../data/barbershopData';
import { Scissors, MapPin, Phone, Clock, Instagram, MessageCircle, Settings, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onOpenBooking: () => void;
  onOpenAltegioSettings: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenBooking, onOpenAltegioSettings }) => {
  return (
    <footer className="bg-black border-t border-white/10 text-white/50 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 border border-white/20 flex items-center justify-center text-[#D4AF37]">
                <Scissors className="w-5 h-5 -rotate-45" />
              </div>
              <span className="font-heading-hero text-2xl tracking-wider text-white">
                BLACK RAZOR
              </span>
            </div>
            <p className="text-white/60 leading-relaxed mb-6">
              Преміум мережа барбершопів у Києві. Безкомпромісна якість кожної лінії, авторська атмосфера, елітні напої та майстри вищої категорії.
            </p>
            <div className="flex items-center gap-3">
              <a
                href={BARBERSHOP_INFO.instagram}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={BARBERSHOP_INFO.telegram}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                aria-label="Telegram"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="font-mono text-xs font-black uppercase tracking-[0.2em] text-white mb-4">
              Навігація
            </h4>
            <ul className="space-y-2.5 font-bold uppercase tracking-wider text-[11px]">
              <li>
                <a href="#prices" className="hover:text-[#D4AF37] transition-colors">Прайс-лист та послуги</a>
              </li>
              <li>
                <a href="#masters" className="hover:text-[#D4AF37] transition-colors">Галерея майстрів</a>
              </li>
              <li>
                <a href="#portfolio" className="hover:text-[#D4AF37] transition-colors">Наші роботи (Портфоліо)</a>
              </li>
              <li>
                <a href="#atmosphere" className="hover:text-[#D4AF37] transition-colors">Атмосфера та Lounge</a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-[#D4AF37] transition-colors">Відгуки клієнтів</a>
              </li>
              <li>
                <a href="#contacts" className="hover:text-[#D4AF37] transition-colors">Контакти та філії</a>
              </li>
            </ul>
          </div>

          {/* Col 3: Contacts */}
          <div>
            <h4 className="font-mono text-xs font-black uppercase tracking-[0.2em] text-white mb-4">
              Контакти
            </h4>
            <div className="space-y-3 font-medium">
              <p className="flex items-start gap-2 text-white/70">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>{BARBERSHOP_INFO.addressKyiv}</span>
              </p>
              <p className="flex items-start gap-2 text-white/70">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>{BARBERSHOP_INFO.addressBranch2}</span>
              </p>
              <p className="flex items-center gap-2 text-white/70">
                <Clock className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="font-mono text-xs">{BARBERSHOP_INFO.workingHours}</span>
              </p>
              <p className="flex items-center gap-2 text-white/70">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <a href={`tel:${BARBERSHOP_INFO.phoneClean}`} className="font-mono text-xs hover:text-[#D4AF37]">{BARBERSHOP_INFO.phone}</a>
              </p>
            </div>
          </div>

          {/* Col 4: Online Booking & Altegio integration */}
          <div>
            <h4 className="font-mono text-xs font-black uppercase tracking-[0.2em] text-white mb-4">
              Онлайн-запис
            </h4>
            <p className="text-white/60 mb-4 leading-relaxed">
              Обирайте зручний час та улюбленого майстра за 30 секунд без очікування дзвінка.
            </p>
            
            <button
              id="footer-book-appointment-btn"
              onClick={onOpenBooking}
              className="w-full py-3.5 rounded-full bg-[#D4AF37] hover:bg-white text-black font-black text-xs uppercase tracking-widest transition-colors mb-3 cursor-pointer shadow-lg shadow-[#D4AF37]/20"
            >
              Записатися онлайн
            </button>

            <button
              id="footer-altegio-settings-btn"
              onClick={onOpenAltegioSettings}
              className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Інтеграція віджета Altegio (CRM)</span>
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-white/40 text-[11px] font-mono">
          <div>
            © {new Date().getFullYear()} BLACK RAZOR BARBERSHOP. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#D4AF37]">POWERED BY ALTEGIO CRM INTEGRATION</span>
            <span>•</span>
            <span>MADE WITH PRECISION</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
