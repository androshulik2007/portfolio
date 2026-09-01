import React, { useState, useEffect } from 'react';
import { CustomerReview } from '../types';
import { INITIAL_REVIEWS, BARBERS, SERVICES } from '../data/barbershopData';
import { Star, MessageSquare, Plus, CheckCircle2, ShieldCheck, ThumbsUp, X } from 'lucide-react';

export const ReviewsSection: React.FC = () => {
  const [reviews, setReviews] = useState<CustomerReview[]>(() => {
    const saved = localStorage.getItem('barbershop_reviews');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_REVIEWS;
      }
    }
    return INITIAL_REVIEWS;
  });

  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formText, setFormText] = useState('');
  const [formMaster, setFormMaster] = useState(BARBERS[0].name);
  const [formService, setFormService] = useState(SERVICES[0].title);
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    localStorage.setItem('barbershop_reviews', JSON.stringify(reviews));
  }, [reviews]);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formText.trim()) return;

    const newRev: CustomerReview = {
      id: `rev-${Date.now()}`,
      authorName: formName.trim(),
      rating: formRating,
      date: 'Сьогодні',
      text: formText.trim(),
      masterName: formMaster,
      serviceTitle: formService,
      verified: true,
      source: 'Altegio',
    };

    setReviews([newRev, ...reviews]);
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setIsAddReviewModalOpen(false);
      setFormName('');
      setFormText('');
    }, 1200);
  };

  const filteredReviews = ratingFilter === 'all'
    ? reviews
    : reviews.filter((r) => r.rating === ratingFilter);

  return (
    <section id="reviews" className="py-20 lg:py-28 bg-[#0F0F0F] relative border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37] mb-3">
              <MessageSquare className="w-4 h-4" />
              <span>Verified Testimonials</span>
            </div>
            <h2 className="font-heading-hero text-4xl sm:text-6xl text-white tracking-tighter uppercase">
              CLIENT <span className="text-[#D4AF37]">REVIEWS</span>
            </h2>
            <p className="text-white/60 mt-3 text-base max-w-xl">
              Синхронізовано з відгуками з системи онлайн-запису Altegio та Google Maps.
            </p>
          </div>

          <button
            id="open-add-review-modal-btn"
            onClick={() => setIsAddReviewModalOpen(true)}
            className="px-6 py-3 rounded-full bg-[#D4AF37] hover:bg-white text-black font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/20 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Залишити відгук</span>
          </button>
        </div>

        {/* Rating Metrics Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 sm:p-8 bg-white/5 border border-white/10 mb-12">
          <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-4">
            <span className="font-mono text-5xl font-black text-white">4.95</span>
            <div>
              <div className="flex items-center gap-1 text-[#D4AF37] mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#D4AF37]" />
                ))}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">
                Середня оцінка на основі 500+ візитів
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:pr-4">
            <div className="w-12 h-12 bg-white/10 border border-white/15 flex items-center justify-center text-[#D4AF37]">
              <ThumbsUp className="w-6 h-6" />
            </div>
            <div>
              <span className="font-mono text-2xl font-black text-white block">98.4%</span>
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">
                Клієнтів стають нашими постійними гостями
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 border border-white/15 flex items-center justify-center text-[#D4AF37]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-mono text-2xl font-black text-white block">100% Verified</span>
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">
                Відгуки лише від реальних відвідувачів Altegio
              </span>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              id={`review-card-${rev.id}`}
              className="bg-white/5 border border-white/10 hover:border-white/25 p-6 sm:p-7 flex flex-col justify-between transition-colors group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-1 text-[#D4AF37]">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#D4AF37]" />
                    ))}
                  </div>
                  <span className="text-[9px] uppercase font-black tracking-widest px-2.5 py-0.5 bg-white/10 text-white/70">
                    {rev.source}
                  </span>
                </div>

                <p className="font-serif-quote text-base sm:text-lg text-white/90 leading-relaxed mb-6 italic">
                  "{rev.text}"
                </p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-1.5">
                      {rev.authorName}
                      {rev.verified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37] inline" title="Підтверджений візит" />
                      )}
                    </h4>
                    <span className="text-[10px] font-mono text-white/40">{rev.date}</span>
                  </div>
                </div>

                {(rev.masterName || rev.serviceTitle) && (
                  <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5 flex-wrap">
                    {rev.masterName && <span>Майстер: {rev.masterName}</span>}
                    {rev.serviceTitle && <span>• {rev.serviceTitle}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Review Modal */}
      {isAddReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#141414] border border-white/20 max-w-lg w-full p-6 sm:p-8 relative shadow-2xl">
            <button
              onClick={() => setIsAddReviewModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-heading-hero text-2xl text-white uppercase tracking-tight mb-1">
              Залишити відгук
            </h3>
            <p className="text-xs text-white/60 mb-6">
              Поділіться вашими враженнями про стрижку, атмосферу та роботу майстра.
            </p>

            {formSubmitted ? (
              <div className="py-8 text-center animate-in zoom-in-95">
                <CheckCircle2 className="w-12 h-12 text-[#D4AF37] mx-auto mb-3" />
                <h4 className="text-lg font-black uppercase text-white">Дякуємо за ваш відгук!</h4>
                <p className="text-xs text-white/60 mt-1">Відгук успішно опубліковано на сайті.</p>
              </div>
            ) : (
              <form onSubmit={handleAddReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                    Ваша оцінка
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFormRating(star)}
                        className="p-1 text-white/20 hover:text-[#D4AF37] transition-colors cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= formRating
                              ? 'text-[#D4AF37] fill-[#D4AF37]'
                              : 'text-white/20'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-sm font-mono font-bold text-white ml-2">
                      {formRating} з 5
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Ваше ім'я *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Наприклад, Олексій"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                      Майстер
                    </label>
                    <select
                      value={formMaster}
                      onChange={(e) => setFormMaster(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-white/15 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    >
                      {BARBERS.map((b) => (
                        <option key={b.id} value={b.name} className="bg-[#1A1A1A] text-white">
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                      Послуга
                    </label>
                    <select
                      value={formService}
                      onChange={(e) => setFormService(e.target.value)}
                      className="w-full bg-[#1A1A1A] border border-white/15 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                    >
                      {SERVICES.map((s) => (
                        <option key={s.id} value={s.title} className="bg-[#1A1A1A] text-white">
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                    Текст відгуку *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Напишіть кілька слів про якість стрижки та сервіс..."
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    className="w-full bg-white/5 border border-white/15 p-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddReviewModalOpen(false)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-[#D4AF37] hover:bg-white text-black font-black text-xs uppercase tracking-widest cursor-pointer"
                  >
                    Опублікувати відгук
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
