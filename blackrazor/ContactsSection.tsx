import React, { useState } from 'react';
import { BARBERSHOP_INFO } from '../data/barbershopData';
import { MapPin, Phone, Clock, Send, MessageCircle, Instagram, CheckCircle2 } from 'lucide-react';

export const ContactsSection: React.FC = () => {
  const [callbackName, setCallbackName] = useState('');
  const [callbackPhone, setCallbackPhone] = useState('');
  const [callbackSent, setCallbackSent] = useState(false);

  const handleCallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackName.trim() || !callbackPhone.trim()) return;

    setCallbackSent(true);
    setTimeout(() => {
      setCallbackSent(false);
      setCallbackName('');
      setCallbackPhone('');
    }, 4000);
  };

  return (
    <section id="contacts" className="py-20 lg:py-28 bg-[#0F0F0F] relative border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column: Branch Info & Hours */}
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37] mb-3">
              <MapPin className="w-4 h-4" />
              <span>Locations & Contact</span>
            </div>
            <h2 className="font-heading-hero text-4xl sm:text-6xl text-white tracking-tighter uppercase mb-6">
              FIND <span className="text-[#D4AF37]">US</span>
            </h2>
            <p className="text-white/60 text-base mb-8">
              Чекаємо на вас у двох зручних локаціях у центрі Києва. Біля кожного барбершопу є зручний паркінг.
            </p>

            <div className="space-y-4">
              {/* Branch 1 */}
              <div className="p-6 bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/10 border border-white/15 flex items-center justify-center text-[#D4AF37] shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-black uppercase tracking-tight text-white">
                        Флагманська студія (Центр)
                      </h3>
                      <span className="text-[9px] bg-[#D4AF37] text-black px-2.5 py-0.5 font-black uppercase tracking-widest">
                        м. Олімпійська
                      </span>
                    </div>
                    <p className="text-sm text-white/70">
                      {BARBERSHOP_INFO.addressKyiv}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-white/50">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {BARBERSHOP_INFO.workingHours}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Branch 2 */}
              <div className="p-6 bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/10 border border-white/15 flex items-center justify-center text-[#D4AF37] shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-black uppercase tracking-tight text-white">
                        Філія Саксаганського
                      </h3>
                      <span className="text-[9px] bg-white/10 text-white/80 px-2.5 py-0.5 font-black uppercase tracking-widest">
                        м. Університет
                      </span>
                    </div>
                    <p className="text-sm text-white/70">
                      {BARBERSHOP_INFO.addressBranch2}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-white/50">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Пн-Нд: 10:00 — 21:00
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Messengers & Call */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-3">
              <a
                href={`tel:${BARBERSHOP_INFO.phoneClean}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors border border-white/15"
              >
                <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{BARBERSHOP_INFO.phone}</span>
              </a>

              <a
                href={BARBERSHOP_INFO.telegram}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors border border-white/15"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#2AABEE]" />
                <span>Telegram чат</span>
              </a>

              <a
                href={BARBERSHOP_INFO.instagram}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors border border-white/15"
              >
                <Instagram className="w-3.5 h-3.5 text-[#E1306C]" />
                <span>Instagram</span>
              </a>
            </div>
          </div>

          {/* Right Column: Callback & Map Placeholder */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="p-6 sm:p-8 bg-white/5 border border-white/10">
              <h3 className="font-heading-hero text-2xl text-white uppercase tracking-tight mb-2">
                Замовити швидкий дзвінок
              </h3>
              <p className="text-xs text-white/60 mb-6">
                Залиште номер, і наш адміністратор зателефонує вам протягом 5 хвилин для підбору зручного часу або консультації.
              </p>

              {callbackSent ? (
                <div className="py-6 text-center animate-in zoom-in-95">
                  <CheckCircle2 className="w-10 h-10 text-[#D4AF37] mx-auto mb-2" />
                  <h4 className="text-base font-black uppercase text-white">Запит прийнято!</h4>
                  <p className="text-xs text-white/60 mt-1">Адміністратор зв'яжеться з вами найближчим часом.</p>
                </div>
              ) : (
                <form onSubmit={handleCallbackSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                      Ваше ім'я
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Як до вас звертатися?"
                      value={callbackName}
                      onChange={(e) => setCallbackName(e.target.value)}
                      className="w-full bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                      Номер телефону
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+38 (0__) ___-__-__"
                      value={callbackPhone}
                      onChange={(e) => setCallbackPhone(e.target.value)}
                      className="w-full bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-full bg-[#D4AF37] hover:bg-white text-black font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Передзвоніть мені</span>
                  </button>
                </form>
              )}
            </div>

            {/* Interactive Map Visual Tile */}
            <div className="border border-white/10 bg-white/5 p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-tight text-white block">
                  Зручна парковка для клієнтів
                </span>
                <span className="text-[11px] text-white/50">
                  В'їзд у двір за попереднім дзвінком адміністратору
                </span>
              </div>
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-white/10 hover:bg-[#D4AF37] text-white hover:text-black text-xs font-black uppercase tracking-widest transition-colors shrink-0"
              >
                На карті
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
