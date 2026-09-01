import React, { useState } from 'react';
import { AltegioSettings } from '../types';
import { Settings, Check, Code2, ExternalLink, Sparkles, X, Copy, Info, CheckCircle2 } from 'lucide-react';

interface AltegioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AltegioSettings;
  onSaveConfig: (newConfig: AltegioSettings) => void;
}

export const AltegioSettingsModal: React.FC<AltegioSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'guide' | 'code'>('config');
  const [enabledLive, setEnabledLive] = useState(config.enabledLiveWidget);
  const [companyId, setCompanyId] = useState(config.companyId);
  const [widgetUrl, setWidgetUrl] = useState(config.widgetUrl);
  const [buttonColor, setButtonColor] = useState(config.buttonColor);
  const [copiedCode, setCopiedCode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      enabledLiveWidget: enabledLive,
      companyId: companyId.trim(),
      widgetUrl: widgetUrl.trim(),
      buttonColor: buttonColor.trim() || '#C59B27',
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const copyEmbedSnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const altegioSnippet = `<!-- 1. Altegio Widget Script Integration -->
<script 
  type="text/javascript" 
  src="https://w${companyId || '123456'}.alteg.io/widgetJS" 
  charset="UTF-8">
</script>

<!-- 2. Button with Altegio Hook -->
<button 
  class="altegio-book-button ms_booking" 
  data-url="https://w${companyId || '123456'}.alteg.io/widget/${companyId || '123456'}">
  Записатися онлайн (Altegio)
</button>

<!-- 3. Direct Iframe Embed (Alternative) -->
<iframe 
  src="${widgetUrl || `https://w${companyId || '123456'}.alteg.io/widget/${companyId || '123456'}`}" 
  width="100%" 
  height="700" 
  frameborder="0">
</iframe>`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#121212] border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col relative">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 border border-white/20 flex items-center justify-center text-[#D4AF37]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading-hero text-xl text-white uppercase tracking-tight flex items-center gap-2">
                ALTEGIO INTEGRATION
                <span className="text-[9px] px-2 py-0.5 bg-[#D4AF37] text-black font-black uppercase tracking-widest">
                  CRM / WIDGET
                </span>
              </h3>
              <p className="text-xs text-white/50">
                Керуйте режимом онлайн-запису: інтерактивна заглушка або підключення живого віджета Altegio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/5 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-white/10 px-6 bg-black">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            Налаштування віджета
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            Інструкція
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
              activeTab === 'code'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-white/40 hover:text-white'
            }`}
          >
            Код для вставки
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1">
          {activeTab === 'config' && (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Toggle Live Mode vs Interactive Stub */}
              <div className="p-4 bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-2">
                    Режим роботи форми запису
                  </h4>
                  <p className="text-xs text-white/50 mt-1 max-w-md">
                    {enabledLive
                      ? 'Ввімкнено: відкривається реальний фрейм/віджет Altegio за вашим ID або посиланням'
                      : 'Вимкнено: працює плавна інтерактивна демонстраційна заглушка (підходить для показу клієнту)'}
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabledLive}
                    onChange={(e) => setEnabledLive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]"></div>
                </label>
              </div>

              {/* Company ID Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  ID компанії в Altegio (Company ID / Філія)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Наприклад: 123456 або 789012"
                    value={companyId}
                    onChange={(e) => {
                      setCompanyId(e.target.value);
                      if (e.target.value) {
                        setWidgetUrl(`https://w${e.target.value}.alteg.io/widget/${e.target.value}`);
                      }
                    }}
                    className="w-full bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <span className="text-[11px] text-white/40 mt-1 block">
                  Можна знайти в особистому кабінеті Altegio: <em>Налаштування → Онлайн-запис → Посилання для сайту</em>
                </span>
              </div>

              {/* Direct Widget URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Пряме посилання на форму онлайн-запису Altegio
                </label>
                <input
                  type="url"
                  placeholder="https://w123456.alteg.io/widget/123456"
                  value={widgetUrl}
                  onChange={(e) => setWidgetUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-white/50 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Налаштування зберігаються миттєво
                </span>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-full bg-[#D4AF37] hover:bg-white text-black font-black text-xs uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D4AF37]/20"
                  >
                    {savedSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Збережено!</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Застосувати зміни</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-white/70 leading-relaxed">
              <div className="p-4 bg-white/5 border border-white/10">
                <h4 className="text-sm font-black uppercase tracking-tight text-white mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#D4AF37] text-black flex items-center justify-center font-black text-xs">
                    1
                  </span>
                  Отримання ідентифікатора у кабінеті Altegio
                </h4>
                <p className="text-white/50">
                  Увійдіть у ваш акаунт Altegio (Yclients) → перейдіть у ліве меню <strong>«Онлайн-запис»</strong> → <strong>«Посилання для сайту»</strong>.
                  Скопіюйте або ID філії (наприклад <code>123456</code>), або пряме посилання <code>https://w123456.alteg.io/...</code>.
                </p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10">
                <h4 className="text-sm font-black uppercase tracking-tight text-white mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#D4AF37] text-black flex items-center justify-center font-black text-xs">
                    2
                  </span>
                  Активація на сайті
                </h4>
                <p className="text-white/50">
                  У вкладці <strong>«Налаштування віджета»</strong> вставте ваш ID або URL та увімкніть перемикач «Режим роботи форми». Всі кнопки <strong>«Записатися онлайн»</strong> та вибір майстра автоматично відкриватимуть вашу CRM-форму Altegio.
                </p>
              </div>

              <div className="p-4 bg-white/5 border border-white/10">
                <h4 className="text-sm font-black uppercase tracking-tight text-white mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 bg-[#D4AF37] text-black flex items-center justify-center font-black text-xs">
                    3
                  </span>
                  Автоматична синхронізація майстрів і послуг
                </h4>
                <p className="text-white/50">
                  Коли клієнт обирає конкретного майстра або послугу на сайті, вони можуть передаватися параметром у посилання Altegio (наприклад <code>?staff_id=...&service_id=...</code>) для миттєвого запису без зайвих кліків.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50 font-mono uppercase">
                  HTML/JS Embed Snippet:
                </span>
                <button
                  onClick={() => copyEmbedSnippet(altegioSnippet)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-xs text-[#D4AF37] font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Скопійовано!' : 'Копіювати код'}</span>
                </button>
              </div>

              <pre className="p-4 bg-black border border-white/10 text-xs text-white/70 font-mono overflow-x-auto leading-relaxed">
                {altegioSnippet}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
