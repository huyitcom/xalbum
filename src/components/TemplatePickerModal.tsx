import React, { useState } from 'react';
import { X, Check, LayoutGrid, CopyCheck } from 'lucide-react';
import { TemplateId, TemplateDefinition } from '../types';
import { BASIC_TEMPLATES, WITH_TEXT_TEMPLATES, VIP_TEMPLATES, TEMPLATES } from '../data/constants';
import { TemplateThumbnail } from './EditorSidebar';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemplateId: TemplateId;
  onSelectTemplate: (id: TemplateId) => void;
  onApplyTemplateToAll?: (id: TemplateId) => void;
}

export const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({
  isOpen,
  onClose,
  currentTemplateId,
  onSelectTemplate,
  onApplyTemplateToAll,
}) => {
  const [category, setCategory] = useState<'basic' | 'with-text' | 'vip'>('basic');

  if (!isOpen) return null;

  const handleSelect = (tmpl: TemplateDefinition) => {
    onSelectTemplate(tmpl.id);
  };

  const displayedTemplates =
    category === 'basic'
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
                Bộ sưu tập layout album đôi chuẩn in ấn chất lượng cao
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

        {/* Sub-tabs: Tiêu chuẩn / Chuyên nghiệp / Họa tiết */}
        <div className="px-4 pt-3 sm:px-6 sm:pt-4 bg-stone-50/50 flex items-center">
          <div className="flex bg-stone-200/70 p-1 rounded-xl">
            <button
              onClick={() => setCategory('basic')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
                category === 'basic'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Tiêu chuẩn
            </button>
            <button
              onClick={() => setCategory('with-text')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
                category === 'with-text'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Chuyên nghiệp
            </button>
            <button
              onClick={() => setCategory('vip')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
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
                      <TemplateThumbnail id={tmpl.id} />
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
