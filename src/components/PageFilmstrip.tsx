import React from 'react';
import { Plus, Copy, Trash2, ChevronLeft, ChevronRight, LayoutGrid, Layers, Type, Sparkles } from 'lucide-react';
import { AlbumPage, TemplateId } from '../types';
import { TEMPLATES } from '../data/constants';
import { TemplateThumbnail } from './EditorSidebar';

interface PageFilmstripProps {
  pages: AlbumPage[];
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPage: (templateId?: TemplateId) => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onMovePage: (fromIndex: number, toIndex: number) => void;
  onOpenTemplatePicker: () => void;
  onOpenAddTextModal?: () => void;
  onAutoFill?: () => void;
}

export const PageFilmstrip: React.FC<PageFilmstripProps> = ({
  pages,
  activePageIndex,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onMovePage,
  onOpenTemplatePicker,
  onOpenAddTextModal,
  onAutoFill,
}) => {
  const activeThumbRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (activeThumbRef.current) {
      activeThumbRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [activePageIndex]);

  return (
    <div className="w-full shrink-0 flex-none bg-white border-t border-stone-200 shadow-sm py-2 sm:py-2.5 px-3 sm:px-6 flex flex-col gap-1.5 sm:gap-2 select-none">
      {/* Top Bar of Filmstrip: Current Page summary & navigation controls */}
      <div className="flex items-center justify-between text-xs text-stone-600 gap-2 overflow-x-auto scrollbar-none py-0.5">
        <div className="flex items-center gap-2 font-medium">
          <span className="flex items-center gap-1.5 bg-stone-100 text-stone-800 font-bold px-2.5 py-1 rounded-lg border border-stone-200">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            Trang {activePageIndex * 2 + 1}-{activePageIndex * 2 + 2} / {pages.length * 2}
          </span>

          <button
            onClick={onOpenTemplatePicker}
            className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-md border border-sky-200 transition cursor-pointer"
          >
            <LayoutGrid className="w-3 h-3" />
            <span>Đổi Layout</span>
          </button>

          {onOpenAddTextModal && (
            <button
              onClick={onOpenAddTextModal}
              className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-md border border-rose-200 transition cursor-pointer shadow-2xs"
            >
              <Type className="w-3.5 h-3.5" />
              <span>Thêm Chữ</span>
            </button>
          )}

          {onAutoFill && (
            <button
              onClick={onAutoFill}
              className="flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-md border border-violet-200 transition cursor-pointer shadow-2xs ml-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Rải hình tự động</span>
            </button>
          )}
        </div>

        {/* Page Navigators & Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectPage(Math.max(0, activePageIndex - 1))}
            disabled={activePageIndex === 0}
            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="Trang trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-semibold text-stone-700 px-1">
            {activePageIndex * 2 + 1}-{activePageIndex * 2 + 2}
          </span>
          <button
            onClick={() => onSelectPage(Math.min(pages.length - 1, activePageIndex + 1))}
            disabled={activePageIndex === pages.length - 1}
            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="Trang sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-stone-200 mx-1" />

          {/* Duplicate Current Page */}
          <button
            onClick={() => onDuplicatePage(activePageIndex)}
            className="flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-sky-700 hover:bg-sky-50 px-2 py-1 rounded-lg border border-transparent hover:border-sky-200 transition cursor-pointer"
            title="Nhân bản trang này"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Nhân bản</span>
          </button>

          {/* Delete Page */}
          <button
            onClick={() => onDeletePage(activePageIndex)}
            disabled={pages.length <= 1}
            className="flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg border border-transparent hover:border-rose-200 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            title="Xóa trang này"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Xóa</span>
          </button>
        </div>
      </div>

      {/* Pages Thumbnails Carousel */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
        {pages.map((page, index) => {
          const isActive = index === activePageIndex;
          const template = TEMPLATES.find((t) => t.id === page.templateId);

          return (
            <div
              key={page.id}
              ref={isActive ? activeThumbRef : undefined}
              onClick={() => onSelectPage(index)}
              className={`group relative flex-shrink-0 flex flex-col items-center cursor-pointer transition-all duration-200 rounded-xl p-1.5 border-2 ${
                isActive
                  ? 'border-sky-500 bg-sky-50/40 shadow-sm ring-2 ring-sky-400/20'
                  : 'border-stone-200 bg-stone-50/50 hover:border-stone-300 hover:bg-white'
              }`}
            >
              {/* Mini Spread Canvas Preview (Dynamic Ratio) */}
              <div 
                className="relative w-28 sm:w-32 bg-white rounded-md overflow-hidden shadow-xs border border-stone-200/80 flex items-center justify-center"
                style={{
                  aspectRatio: (page.posterSettings?.aspectRatio || template?.aspectRatio || '50:20').replace(':', '/')
                }}
              >
                {/* Visual Thumbnail based on template */}
                <TemplateThumbnail id={page.templateId} slots={page.slots} className="w-full h-full" />

                {/* Page Number Overlay Tag */}
                <div className="absolute top-1 left-1 bg-stone-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                  P.{index * 2 + 1}-{index * 2 + 2}
                </div>

                {/* Photo Count Tag */}
                <div className="absolute bottom-1 right-1 bg-white/90 text-stone-700 text-[8px] font-semibold px-1 py-0.2 rounded border border-stone-200">
                  {template?.slotCount || 3} ảnh
                </div>
              </div>

              {/* Page Footer Label & Quick Reorder */}
              <div className="w-full flex items-center justify-between mt-1 px-1 text-[10px]">
                <span
                  className={`font-semibold truncate max-w-[60px] ${
                    isActive ? 'text-sky-700' : 'text-stone-600'
                  }`}
                >
                  Trang {index * 2 + 1}-{index * 2 + 2}
                </span>

                {/* Mini Reorder controls on hover */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {index > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMovePage(index, index - 1);
                      }}
                      title="Chuyển sang trái"
                      className="p-0.5 text-stone-500 hover:text-stone-900 rounded hover:bg-stone-200"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  )}
                  {index < pages.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMovePage(index, index + 1);
                      }}
                      title="Chuyển sang phải"
                      className="p-0.5 text-stone-500 hover:text-stone-900 rounded hover:bg-stone-200"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add New Page Button / Dropdown */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => onAddPage()}
            className="flex flex-col items-center justify-center w-24 sm:w-28 aspect-[50/35] rounded-xl border-2 border-dashed border-stone-300 hover:border-sky-500 bg-stone-50 hover:bg-sky-50/50 text-stone-500 hover:text-sky-600 transition duration-150 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-full bg-stone-200 group-hover:bg-sky-100 flex items-center justify-center mb-1 transition">
              <Plus className="w-4 h-4 text-stone-600 group-hover:text-sky-600" />
            </div>
            <span className="text-[10px] font-bold">Thêm Trang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
