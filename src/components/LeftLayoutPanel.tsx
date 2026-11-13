import React, { useState } from 'react';
import { TemplateId, PosterSettings, FrameSlot } from '../types';
import {
  BASIC_TEMPLATES,
  WITH_TEXT_TEMPLATES,
  VIP_TEMPLATES,
  COVER_TEMPLATES,
} from '../data/constants';
import {
  LayoutGrid,
  Check,
  CopyCheck,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
} from 'lucide-react';
import { TemplateThumbnail } from './EditorSidebar';

interface LeftLayoutPanelProps {
  templateId: TemplateId;
  onChangeTemplate: (id: TemplateId) => void;
  onApplyTemplateToAll?: (id: TemplateId) => void;
  onApplyThemeSet?: (themeId: string) => void;
  posterSettings: PosterSettings;
  currentPageSlots?: FrameSlot[];
}

export const LeftLayoutPanel: React.FC<LeftLayoutPanelProps> = ({
  templateId,
  onChangeTemplate,
  onApplyTemplateToAll,
  onApplyThemeSet,
  posterSettings,
  currentPageSlots,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [layoutCategory, setLayoutCategory] = useState<'cover' | 'basic' | 'with-text' | 'vip'>('basic');
  const [appliedAllNotice, setAppliedAllNotice] = useState<boolean>(false);

  const handleApplyToAllPages = () => {
    if (onApplyTemplateToAll) {
      onApplyTemplateToAll(templateId);
      setAppliedAllNotice(true);
      setTimeout(() => setAppliedAllNotice(false), 2200);
    }
  };

  return (
    <div className="hidden lg:flex h-full shrink-0 relative z-30 select-none">
      {/* Trạng thái thu gọn: Biểu tượng thu gọn có hình Layout ở cạnh trái */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Mở bảng chọn Layout"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 z-40 group flex flex-col items-center justify-center gap-1.5 py-3.5 px-2.5 bg-white hover:bg-sky-50 text-stone-700 hover:text-sky-600 border border-stone-200/90 hover:border-sky-300 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-sky-50 group-hover:bg-sky-100 text-sky-600 flex items-center justify-center transition-colors shadow-2xs">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold tracking-tight">Layout</span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* Trạng thái mở rộng: Section chọn Layout đầy đủ */}
      {isOpen && (
        <div className="w-80 xl:w-96 bg-white border-r border-stone-200 flex flex-col h-full shadow-lg relative animate-in slide-in-from-left-2 duration-200">
          {/* Nút thu gọn nhanh bên mép phải của panel */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            title="Thu gọn bảng Layout"
            className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-40 w-7 h-14 bg-white hover:bg-sky-50 text-stone-500 hover:text-sky-600 border border-stone-200 rounded-r-xl shadow-md flex items-center justify-center transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Header của Section Chọn Layout */}
          <div className="px-4 py-3 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-stone-800">Chọn Layout</span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              title="Thu gọn / Ẩn bảng chọn Layout"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-100 border border-stone-200/80 shadow-2xs transition cursor-pointer"
            >
              <PanelLeftClose className="w-3.5 h-3.5 text-stone-500" />
              <span>Thu gọn</span>
            </button>
          </div>

          {/* Nội dung chọn Layout */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden min-h-0">
            {/* Sub-tabs: Bìa, Tiêu chuẩn, Chuyên nghiệp, Họa tiết */}
            <div className="flex bg-stone-100 p-1 rounded-xl mb-3 shrink-0 gap-1 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setLayoutCategory('cover')}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition text-center whitespace-nowrap cursor-pointer flex items-center gap-1 shrink-0 ${
                  layoutCategory === 'cover'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-800'
                }`}
              >
                <span>Bìa</span>
              </button>

              <button
                type="button"
                onClick={() => setLayoutCategory('basic')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition text-center whitespace-nowrap cursor-pointer ${
                  layoutCategory === 'basic'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Tiêu chuẩn
              </button>

              <button
                type="button"
                onClick={() => setLayoutCategory('with-text')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition text-center whitespace-nowrap cursor-pointer ${
                  layoutCategory === 'with-text'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Chuyên nghiệp
              </button>

              <button
                type="button"
                onClick={() => setLayoutCategory('vip')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition text-center whitespace-nowrap cursor-pointer ${
                  layoutCategory === 'vip'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Họa tiết
              </button>
            </div>

            {/* Danh sách các mẫu Layout */}
            <div className="flex-1 overflow-y-auto pr-1 -mr-1 pb-2">
              {layoutCategory === 'vip' && (
                <div className="bg-gradient-to-br from-amber-50 via-rose-50/60 to-emerald-50/70 p-3 rounded-2xl border-2 border-amber-300/80 shadow-xs mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                      <Sparkles className="w-2.5 h-2.5" />
                      Bộ chủ đề
                    </span>
                    <span className="text-[10px] font-semibold text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded-md">
                      10 layout đôi • 50x20 cm
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-16 aspect-[5/2] bg-white rounded-md border border-amber-200 overflow-hidden shadow-2xs shrink-0">
                      <img
                        src="https://www.photobookvietnam.net/images/layout/lay01/01-02.png"
                        alt="Hoa cỏ mùa xuân"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-stone-900 text-xs truncate">Hoa cỏ mùa xuân</h4>
                      <p className="text-[10px] text-stone-500 leading-tight">
                        Trọn bộ 10 layout hoa cỏ vintage
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onApplyThemeSet?.('theme-hoa-co-mua-xuan')}
                    className="w-full py-1.5 px-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Áp dụng toàn bộ layout và kích thước 50x20 cm cho toàn album"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Áp dụng trọn bộ cho album</span>
                  </button>
                </div>
              )}

              {layoutCategory === 'vip' && (
                <div className="text-[11px] font-semibold text-stone-600 mb-2 px-0.5">
                  Các layout trong bộ "Hoa cỏ mùa xuân" (10 mẫu):
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                {(layoutCategory === 'cover'
                  ? COVER_TEMPLATES
                  : layoutCategory === 'vip'
                  ? VIP_TEMPLATES
                  : layoutCategory === 'basic'
                  ? BASIC_TEMPLATES
                  : WITH_TEXT_TEMPLATES
                ).map((tmpl) => {
                  const previewRatio =
                    tmpl.isOverlay || tmpl.category === 'vip'
                      ? '50/20'
                      : posterSettings?.aspectRatio
                      ? posterSettings.aspectRatio.replace(':', '/')
                      : '50/20';

                  return (
                    <div key={tmpl.id} className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => onChangeTemplate(tmpl.id)}
                        title={`${tmpl.name} (${tmpl.slotCount} ảnh)`}
                        style={{ aspectRatio: previewRatio }}
                        className={`w-full rounded-xl border-2 transition overflow-hidden relative group cursor-pointer flex items-center justify-center ${
                          templateId === tmpl.id
                            ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <TemplateThumbnail id={tmpl.id} slots={currentPageSlots} />
                        {templateId === tmpl.id && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center shadow-sm z-10">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                      <div className="flex items-center justify-between px-0.5 text-[11px] leading-tight">
                        <span className="font-medium text-stone-700 truncate" title={tmpl.name}>
                          {tmpl.name.replace('Layout Đôi ', 'Trang ')}
                        </span>
                        <span className="text-stone-400 text-[10px] shrink-0 font-normal">
                          {tmpl.slotCount} ảnh
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nút Áp dụng cho tất cả trang */}
            {layoutCategory === 'basic' && (
              <div className="pt-3 border-t border-stone-200/80 mt-1 shrink-0 bg-white">
                <button
                  type="button"
                  onClick={handleApplyToAllPages}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                    appliedAllNotice
                      ? 'bg-emerald-600 text-white shadow-emerald-600/20 ring-2 ring-emerald-500/30'
                      : 'bg-stone-900 hover:bg-black text-white active:scale-[0.98]'
                  }`}
                >
                  {appliedAllNotice ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-100 animate-in zoom-in-75 duration-150" />
                      <span>Đã áp dụng cho tất cả các trang!</span>
                    </>
                  ) : (
                    <>
                      <CopyCheck className="w-4 h-4 text-stone-300" />
                      <span>Áp dụng cho tất cả trang</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
