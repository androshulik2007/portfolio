import React, { useState, useEffect } from 'react';
import { AltegioSettings, ServiceItem, Barber } from '../types';
import { SERVICES, BARBERS, BARBERSHOP_INFO } from '../data/barbershopData';
import { 
  X, Calendar, Clock, MapPin, User, Scissors, CheckCircle2, 
  ArrowLeft, ArrowRight, Sparkles, Phone, MessageSquare, ExternalLink, Settings 
} from 'lucide-react';

interface AltegioBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AltegioSettings;
  onOpenSettings: () => void;
  preSelectedServiceId?: string | null;
  preSelectedMasterId?: string | null;
}

export const AltegioBookingModal: React.FC<AltegioBookingModalProps> = ({
  isOpen,
  onClose,
  config,
  onOpenSettings,
  preSelectedServiceId,
  preSelectedMasterId,
}) => {
  // Step tracker: 1: Branch -> 2: Service -> 3: Master -> 4: Date & Time -> 5: Client Info -> 6: Success Ticket
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Booking state
  const [selectedBranch, setSelectedBranch] = useState<string>(BARBERSHOP_INFO.addressKyiv);
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    preSelectedServiceId || SERVICES[0].id
  );
  const [selectedMasterId, setSelectedMasterId] = useState<string>(
    preSelectedMasterId || 'any'
  );
  const [selectedDate, setSelectedDate] = useState<string>('today');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('12:00');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('+380');
  const [clientComment, setClientComment] = useState<string>('');
  const [bookingTicketCode, setBookingTicketCode] = useState<string>('');

  // Sync props when opening
  useEffect(() => {
    if (preSelectedServiceId) {
      setSelectedServiceId(preSelectedServiceId);
      setCurrentStep(3); // jump forward to master selection
    } else if (preSelectedMasterId) {
      setSelectedMasterId(preSelectedMasterId);
      setCurrentStep(2); // jump forward to service selection
    } else {
      setCurrentStep(1);
    }
  }, [preSelectedServiceId, preSelectedMasterId, isOpen]);

  if (!isOpen) return null;

  const currentService = SERVICES.find((s) => s.id === selectedServiceId) || SERVICES[0];
  const currentMaster = BARBERS.find((b) => b.id === selectedMasterId);

  // Time slots generator
  const timeSlots = [
    '10:00', '11:00', '12:00', '13:30', 
    '15:00', '16:30', '17:30', '19:00', '20:00'
  ];

  // Dates generator (Next 5 days)
  const getDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayName = i === 0 ? 'Сьогодні' : i === 1 ? 'Завтра' : d.toLocaleDateString('uk-UA', { weekday: 'short' });
      const dayNum = d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
      dates.push({
        id: i === 0 ? 'today' : d.toISOString().split('T')[0],
        label: dayName,
        dateFormatted: dayNum,
      });
    }
    return dates;
  };

  const datesList = getDates();

  const handleCompleteBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || clientPhone.length < 8) return;

    const randomTicket = `ALT-${Math.floor(1000 + Math.random() * 9000)}`;
    setBookingTicketCode(randomTicket);
    setCurrentStep(6);
  };

  const resetAndClose = () => {
    setCurrentStep(1);
    setBookingTicketCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#121212] border border-white/20 max-w-2xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col relative">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-black border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 border border-white/20 flex items-center justify-center text-[#D4AF37]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading-hero text-lg text-white uppercase tracking-tight leading-none">
                  ONLINE BOOKING
                </h3>
                <span className="text-[9px] px-2 py-0.5 bg-[#D4AF37] text-black font-black uppercase tracking-widest">
                  Altegio Integration
                </span>
              </div>
              <p className="text-[11px] font-mono text-white/50 mt-0.5">
                BLACK RAZOR BARBERSHOP KYIV
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="altegio-modal-settings-shortcut"
              onClick={onOpenSettings}
              className="p-2 bg-white/5 border border-white/10 text-white/70 hover:text-white hover:border-[#D4AF37] transition-colors cursor-pointer"
              title="Налаштування Altegio"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={resetAndClose}
              className="p-2 bg-white/5 border border-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Integration Status Notice Bar */}
        <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-white/70">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
            <span>
              {config.enabledLiveWidget
                ? 'Direct Altegio Widget (Live CRM Mode)'
                : 'Interactive Booking Flow (Altegio Sync)'}
            </span>
          </div>
          <button
            onClick={onOpenSettings}
            className="text-[11px] text-[#D4AF37] hover:underline font-bold uppercase tracking-wider cursor-pointer"
          >
            {config.enabledLiveWidget ? 'Перемкнути' : 'Налаштувати ID'}
          </button>
        </div>

        {/* LIVE WIDGET MODE (If activated in settings) */}
        {config.enabledLiveWidget ? (
          <div className="flex-1 p-4 bg-black flex flex-col">
            <div className="mb-3 p-3 bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <span className="text-white/70">
                Завантажено форму Altegio: <code className="text-[#D4AF37]">{config.widgetUrl || `https://w${config.companyId}.alteg.io`}</code>
              </span>
              <a
                href={config.widgetUrl || `https://w${config.companyId}.alteg.io`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[#D4AF37] hover:underline font-bold"
              >
                <span>Відкрити окремо</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex-1 min-h-[480px] overflow-hidden border border-white/10 bg-black relative">
              <iframe
                src={config.widgetUrl || `https://w${config.companyId}.alteg.io/widget/${config.companyId}`}
                title="Altegio Online Booking"
                className="w-full h-full min-h-[480px] border-0"
                allow="camera; microphone; geolocation"
              />
            </div>
          </div>
        ) : (
          /* INTERACTIVE STUB / DEMO FLOW */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            
            {/* Step Progress Pills (if not completed) */}
            {currentStep < 6 && (
              <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                {[
                  { step: 1, label: 'Філія' },
                  { step: 2, label: 'Послуга' },
                  { step: 3, label: 'Майстер' },
                  { step: 4, label: 'Час' },
                  { step: 5, label: 'Контакти' },
                ].map((s) => (
                  <button
                    key={s.step}
                    onClick={() => setCurrentStep(s.step)}
                    className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      currentStep === s.step
                        ? 'text-[#D4AF37]'
                        : currentStep > s.step
                        ? 'text-white hover:text-[#D4AF37]'
                        : 'text-white/30'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                        currentStep === s.step
                          ? 'bg-[#D4AF37] text-black font-black'
                          : currentStep > s.step
                          ? 'bg-white/15 text-white'
                          : 'bg-white/5 text-white/40'
                      }`}
                    >
                      {s.step}
                    </span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* STEP 1: Select Branch */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-2">
                  Крок 1. Оберіть локацію
                </h4>

                <div
                  onClick={() => {
                    setSelectedBranch(BARBERSHOP_INFO.addressKyiv);
                    setCurrentStep(2);
                  }}
                  className={`p-4 border transition-all cursor-pointer flex items-start gap-4 ${
                    selectedBranch === BARBERSHOP_INFO.addressKyiv
                      ? 'bg-white/10 border-[#D4AF37]'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="w-10 h-10 bg-white/10 text-[#D4AF37] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-black uppercase tracking-tight text-white text-base">
                        Флагманська студія (Центр)
                      </h5>
                      <span className="text-[9px] bg-[#D4AF37] text-black font-black uppercase tracking-widest px-2 py-0.5">
                        м. Олімпійська
                      </span>
                    </div>
                    <p className="text-xs text-white/70 mt-1">
                      {BARBERSHOP_INFO.addressKyiv}
                    </p>
                    <p className="text-[11px] font-mono text-white/40 mt-2">
                      Пн-Нд: 10:00 — 21:00 • 4 майстри на зміні
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setSelectedBranch(BARBERSHOP_INFO.addressBranch2);
                    setCurrentStep(2);
                  }}
                  className={`p-4 border transition-all cursor-pointer flex items-start gap-4 ${
                    selectedBranch === BARBERSHOP_INFO.addressBranch2
                      ? 'bg-white/10 border-[#D4AF37]'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="w-10 h-10 bg-white/10 text-white/80 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-black uppercase tracking-tight text-white text-base">
                        Філія на Саксаганського
                      </h5>
                      <span className="text-[9px] bg-white/10 text-white/80 font-black uppercase tracking-widest px-2 py-0.5">
                        м. Університет
                      </span>
                    </div>
                    <p className="text-xs text-white/70 mt-1">
                      {BARBERSHOP_INFO.addressBranch2}
                    </p>
                    <p className="text-[11px] font-mono text-white/40 mt-2">
                      Пн-Нд: 10:00 — 21:00 • Вільні місця сьогодні
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-8 py-3 rounded-full bg-[#D4AF37] hover:bg-white text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/20"
                  >
                    <span>Далі: вибір послуги</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Select Service */}
            {currentStep === 2 && (
              <div className="space-y-3 animate-in fade-in">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-2">
                  Крок 2. Оберіть послугу
                </h4>

                <div className="grid grid-cols-1 gap-2.5 max-h-80 overflow-y-auto pr-1">
                  {SERVICES.map((srv) => (
                    <div
                      key={srv.id}
                      onClick={() => {
                        setSelectedServiceId(srv.id);
                      }}
                      className={`p-3.5 border transition-all cursor-pointer flex items-center justify-between ${
                        selectedServiceId === srv.id
                          ? 'bg-white/10 border-[#D4AF37]'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <h5 className="font-black uppercase tracking-tight text-white text-sm">
                            {srv.title}
                          </h5>
                          {srv.popular && (
                            <span className="text-[8px] bg-[#D4AF37] text-black font-black px-1.5 py-0.5 uppercase tracking-widest">
                              ХІТ
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-white/50 flex items-center gap-1 mt-1 font-mono">
                          <Clock className="w-3 h-3 text-[#D4AF37]" />
                          ~{srv.durationMinutes} хв
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-base text-[#D4AF37]">
                          {srv.price} ₴
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Назад</span>
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-8 py-3 rounded-full bg-[#D4AF37] hover:bg-white text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/20"
                  >
                    <span>Далі: вибір майстра</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Select Master */}
            {currentStep === 3 && (
              <div className="space-y-3 animate-in fade-in">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-2">
                  Крок 3. Оберіть майстра
                </h4>

                <div
                  onClick={() => setSelectedMasterId('any')}
                  className={`p-3.5 border transition-all cursor-pointer flex items-center gap-3.5 ${
                    selectedMasterId === 'any'
                      ? 'bg-white/10 border-[#D4AF37]'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="w-12 h-12 bg-white/10 text-[#D4AF37] flex items-center justify-center font-mono font-black text-sm">
                    ANY
                  </div>
                  <div>
                    <h5 className="font-black uppercase tracking-tight text-white text-sm">
                      Будь-який вільний майстер (Найшвидший запис)
                    </h5>
                    <span className="text-xs text-white/50">
                      Система призначить найближчий зручний слот
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {BARBERS.map((barber) => (
                    <div
                      key={barber.id}
                      onClick={() => setSelectedMasterId(barber.id)}
                      className={`p-3 border transition-all cursor-pointer flex items-center gap-3 ${
                        selectedMasterId === barber.id
                          ? 'bg-white/10 border-[#D4AF37]'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <img
                        src={barber.avatarUrl}
                        alt={barber.name}
                        className="w-12 h-12 object-cover filter contrast-125 grayscale"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-black uppercase tracking-tight text-white text-xs truncate">
                          {barber.name}
                        </h5>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] block">
                          {barber.rank}
                        </span>
                        <span className="text-[10px] font-mono text-white/50">
                          ★ {barber.rating} ({barber.reviewsCount})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Назад</span>
                  </button>
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="px-8 py-3 rounded-full bg-[#D4AF37] hover:bg-white text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/20"
                  >
                    <span>Далі: дата та час</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Date & Time Slots */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-in fade-in">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-3">
                    Крок 4. Оберіть дату візиту
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {datesList.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedDate(d.id)}
                        className={`p-2.5 border text-center transition-all cursor-pointer ${
                          selectedDate === d.id
                            ? 'bg-[#D4AF37] text-black font-black border-[#D4AF37]'
                            : 'bg-white/5 text-white/70 border-white/10 hover:border-white/25'
                        }`}
                      >
                        <span className="text-[9px] font-black uppercase tracking-wider block">
                          {d.label}
                        </span>
                        <span className="text-xs font-mono font-bold block mt-0.5">
                          {d.dateFormatted}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-3">
                    Доступні часові слоти
                  </h4>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTimeSlot(time)}
                        className={`py-2.5 px-3 border text-xs font-mono font-bold transition-all cursor-pointer ${
                          selectedTimeSlot === time
                            ? 'bg-[#D4AF37] text-black font-black border-[#D4AF37]'
                            : 'bg-white/5 text-white border-white/10 hover:border-white/25'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Назад</span>
                  </button>
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="px-8 py-3 rounded-full bg-[#D4AF37] hover:bg-white text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/20"
                  >
                    <span>Далі: контакти</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Client Contact Info & Summary */}
            {currentStep === 5 && (
              <form onSubmit={handleCompleteBooking} className="space-y-4 animate-in fade-in">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37] mb-2">
                  Крок 5. Контактні дані для підтвердження
                </h4>

                {/* Booking Order Summary Card */}
                <div className="p-4 bg-white/5 border border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between text-white/50">
                    <span className="uppercase font-bold tracking-wider text-[10px]">Послуга:</span>
                    <strong className="text-white uppercase font-black">{currentService.title} ({currentService.price} ₴)</strong>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span className="uppercase font-bold tracking-wider text-[10px]">Майстер:</span>
                    <strong className="text-[#D4AF37] uppercase font-black">
                      {currentMaster ? currentMaster.name : 'Будь-який вільний майстер'}
                    </strong>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span className="uppercase font-bold tracking-wider text-[10px]">Час візиту:</span>
                    <strong className="text-white font-mono">{selectedDate === 'today' ? 'Сьогодні' : selectedDate} о {selectedTimeSlot}</strong>
                  </div>
                  <div className="flex justify-between text-white/50">
                    <span className="uppercase font-bold tracking-wider text-[10px]">Адреса:</span>
                    <strong className="text-white truncate max-w-[240px]">{selectedBranch}</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Ваше ім'я *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Олександр"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Номер телефону (для SMS/Viber підтвердження) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+380 67 000 00 00"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Коментар або побажання (необов'язково)
                  </label>
                  <input
                    type="text"
                    placeholder="Наприклад: хочу спробувати нову форму бороди"
                    value={clientComment}
                    onChange={(e) => setClientComment(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Назад</span>
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3.5 rounded-full bg-[#D4AF37] hover:bg-white text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Підтвердити запис</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 6: Success Confirmation Ticket */}
            {currentStep === 6 && (
              <div className="py-6 text-center animate-in zoom-in-95 space-y-5">
                <div className="w-16 h-16 bg-white/10 border border-white/20 text-[#D4AF37] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#D4AF37] block">
                    BOOKING CONFIRMED
                  </span>
                  <h4 className="font-heading-hero text-3xl text-white uppercase tracking-tight mt-1">
                    Чекаємо на вас у BLACK RAZOR!
                  </h4>
                  <p className="text-xs text-white/60 mt-1">
                    Талон надіслано через SMS та Telegram на вказаний номер.
                  </p>
                </div>

                {/* Ticket Details Box */}
                <div className="max-w-md mx-auto p-5 bg-white/5 border border-white/15 text-left space-y-3 shadow-xl">
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-xs font-mono uppercase text-white/50">Ticket Code:</span>
                    <span className="font-mono font-black text-black text-xs bg-[#D4AF37] px-3 py-1 uppercase tracking-widest">
                      {bookingTicketCode || '#ALT-8492'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/50">Клієнт:</span>
                      <strong className="text-white uppercase">{clientName || 'Гість'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Послуга:</span>
                      <strong className="text-white uppercase">{currentService.title}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Майстер:</span>
                      <strong className="text-[#D4AF37] uppercase">{currentMaster ? currentMaster.name : 'Будь-який вільний'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Дата та час:</span>
                      <strong className="text-white font-mono">{selectedDate === 'today' ? 'Сьогодні' : selectedDate} о {selectedTimeSlot}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Адреса:</span>
                      <strong className="text-white truncate max-w-[200px]">{selectedBranch}</strong>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/10">
                      <span className="text-white font-bold uppercase tracking-wider text-[11px]">До сплати:</span>
                      <span className="text-[#D4AF37] font-mono font-black text-lg">{currentService.price} ₴</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={resetAndClose}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#D4AF37] hover:bg-white text-black font-black text-xs uppercase tracking-widest cursor-pointer"
                  >
                    Готово
                  </button>
                  <button
                    onClick={() => {
                      const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Стрижка в BLACK RAZOR (${currentService.title})`)}&details=${encodeURIComponent(`Майстер: ${currentMaster ? currentMaster.name : 'Барбершоп'}, Адреса: ${selectedBranch}`)}`;
                      window.open(calendarUrl, '_blank');
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Додати в Google Календар</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
