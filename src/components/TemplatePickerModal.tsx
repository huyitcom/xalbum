import React, { useState } from 'react';
import { X, Check, LayoutGrid, CopyCheck, Sparkles } from 'lucide-react';
import { TemplateId, TemplateDefinition } from '../types';
import { BASIC_TEMPLATES, WITH_TEXT_TEMPLATES, VIP_TEMPLATES, COVER_TEMPLATES, TEMPLATES } from '../data/constants';
import { TemplateThumbnail } from './EditorSidebar';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemplateId: TemplateId;
  onSelectTemplate: (id: TemplateId) => void;
  onApplyTemplateToAll?: (id: TemplateId) => void;
  currentPageSlots?: import('../types').FrameSlot[];
  onApplyThemeSet?: (themeId: string) => void;
}

export const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({
  isOpen,
  onClose,
  currentTemplateId,
  onSelectTemplate,
  onApplyTemplateToAll,
  currentPageSlots,
  onApplyThemeSet,
}) => {
  const [category, setCategory] = useState<'cover' | 'basic' | 'with-text' | 'vip'>('cover');

  if (!isOpen) return null;

  const handleSelect = (tmpl: TemplateDefinition) => {
    onSelectTemplate(tmpl.id);
  };

  const displayedTemplates =
    category === 'cover'
      ? COVER_TEMPLATES
      : category === 'basic'
      ? BASIC_TEMPLATES
      : category === 'with-text'
      ? WITH_TEXT_TEMPLATES
      : VIP_TEMPLATES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-stone-100 bg-stone-50/80">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-xs shrink-0">
              <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                <span>Kho Mẫu Layout Album</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-semibold">
                  {TEMPLATES.length} Mẫu
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                Bộ sưu tập layout bìa album và trang photobook chuẩn in ấn chất lượng cao
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs: Bìa Album / Tiêu chuẩn / Chuyên nghiệp / Họa tiết */}
        <div className="px-4 pt-3 sm:px-6 sm:pt-4 bg-stone-50/50 flex items-center overflow-x-auto scrollbar-none">
          <div className="flex bg-stone-200/70 p-1 rounded-xl gap-1 shrink-0">
            <button
              onClick={() => setCategory('cover')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition text-center cursor-pointer flex items-center gap-1.5 ${
                category === 'cover'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              <span>📖</span>
              <span>Bìa Album ({COVER_TEMPLATES.length})</span>
            </button>
            <button
              onClick={() => setCategory('basic')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
                category === 'basic'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Tiêu chuẩn
            </button>
            <button
              onClick={() => setCategory('with-text')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
                category === 'with-text'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Chuyên nghiệp
            </button>
            <button
              onClick={() => setCategory('vip')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
                category === 'vip'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Họa tiết
            </button>
          </div>
        </div>

        {/* Templates Grid Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50/50">
          {/* VIP Theme Set Header Card */}
          {category === 'vip' && (
            <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-50 via-rose-50/60 to-emerald-50/70 rounded-2xl sm:rounded-3xl border-2 border-amber-300 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-24 sm:w-28 aspect-[5/2] bg-white rounded-xl border border-amber-200 overflow-hidden shadow-xs shrink-0">
                  <img
                    src="https://www.photobookvietnam.net/images/layout/lay01/01-02.png"
                    alt="Hoa cỏ mùa xuân"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                      <Sparkles className="w-3 h-3" />
                      Bộ chủ đề
                    </span>
                    <span className="text-xs font-semibold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md">
                      10 layout đôi • Kích thước chuẩn 50x20 cm
                    </span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-base">Hoa cỏ mùa xuân</h3>
                  <p className="text-xs text-stone-600 max-w-md">
                    Trọn bộ 10 layout đôi họa tiết hoa lá vintage mùa xuân nhẹ nhàng, lãng mạn.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onApplyThemeSet?.('theme-hoa-co-mua-xuan');
                  onClose();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Áp dụng trọn bộ cho album (50x20)</span>
              </button>
            </div>
          )}

          {category === 'vip' && (
            <div className="text-xs font-bold text-stone-700 mb-3 px-1">
              Các layout trong bộ "Hoa cỏ mùa xuân" (Chạm để áp dụng riêng cho trang này):
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {displayedTemplates.map((tmpl) => {
              const isSelected = currentTemplateId === tmpl.id;

              return (
                <div
                  key={tmpl.id}
                  onClick={() => handleSelect(tmpl)}
                  className={`group relative flex flex-col bg-white rounded-2xl border-2 transition-all duration-200 cursor-pointer overflow-hidden p-3.5 ${
                    isSelected
                      ? 'border-sky-500 ring-4 ring-sky-500/15 shadow-md bg-sky-50/20'
                      : 'border-stone-200 hover:border-sky-400 hover:shadow-md'
                  }`}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-3.5 right-3.5 z-20 flex items-center justify-center w-6 h-6 bg-sky-500 text-white rounded-full shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Thumbnail Container */}
                  <div className={`w-full flex items-center justify-center bg-stone-100/80 rounded-xl overflow-hidden p-2.5 transition-colors group-hover:bg-stone-100 ${
                    tmpl.aspectRatio === '50:20' ? 'aspect-[50/20]' : 'aspect-[50/35]'
                  }`}>
                    <div className={`w-full h-full shadow-sm border border-stone-200/90 rounded-md overflow-hidden transition-transform duration-200 group-hover:scale-[1.02] ${
                      tmpl.aspectRatio === '50:20' ? 'aspect-[50/20]' : 'aspect-[50/35]'
                    }`}>
                      <TemplateThumbnail id={tmpl.id} slots={currentPageSlots} />
                    </div>
                  </div>

                  {/* Compact Header Info */}
                  <div className="pt-3 px-0.5 flex flex-col items-center">
                    <h3 className="font-bold text-stone-800 text-sm group-hover:text-sky-600 transition text-center">
                      {tmpl.name}
                    </h3>
                    <p className="text-[11px] text-stone-400 text-center mt-0.5">
                      {tmpl.slotCount} vị trí ảnh • {tmpl.aspectRatio === '50:20' ? '50x20cm (25x20)' : (tmpl.aspectRatio ? `${tmpl.aspectRatio.replace(':', 'x')}cm` : '50x35cm')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-stone-100 bg-white flex items-center justify-between gap-3">
          <span className="text-xs text-stone-500">
            Đang xem: <strong className="text-stone-800">{displayedTemplates.length} mẫu</strong> ({category === 'basic' ? 'Tiêu chuẩn' : category === 'with-text' ? 'Chuyên nghiệp' : 'Họa tiết'})
          </span>
          <div className="flex items-center gap-2">
            {category === 'basic' && onApplyTemplateToAll && (
              <button
                type="button"
                onClick={() => onApplyTemplateToAll(currentTemplateId)}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="Áp dụng layout hiện tại cho tất cả các trang album"
              >
                <CopyCheck className="w-3.5 h-3.5 text-stone-600" />
                <span>Áp dụng cho tất cả trang</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 sm:px-5 sm:py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition shadow-xs cursor-pointer"
            >
              Hoàn tất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
