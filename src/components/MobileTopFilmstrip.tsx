import React, { useRef, useEffect } from 'react';
import { Layers, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { AlbumPage } from '../types';
import { TEMPLATES } from '../data/constants';
import { TemplateThumbnail } from './EditorSidebar';

interface MobileTopFilmstripProps {
  pages: AlbumPage[];
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
}

export const MobileTopFilmstrip: React.FC<MobileTopFilmstripProps> = ({
  pages,
  activePageIndex,
  onSelectPage,
  onAddPage,
}) => {
  const activeThumbRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeThumbRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const thumb = activeThumbRef.current;
      const targetScroll = thumb.offsetLeft - container.clientWidth / 2 + thumb.clientWidth / 2;
      container.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
    }
  }, [activePageIndex]);

  const hasCoverAtStart = Boolean(pages[0]?.templateId?.startsWith('cover-'));
  const currentIsCover = Boolean(pages[activePageIndex]?.templateId?.startsWith('cover-'));
  const currentPageNumber = currentIsCover
    ? 'Bìa Album'
    : hasCoverAtStart
    ? `${(activePageIndex - 1) * 2 + 1}-${(activePageIndex - 1) * 2 + 2}`
    : `${activePageIndex * 2 + 1}-${activePageIndex * 2 + 2}`;

  const totalInnerPagesNumber = hasCoverAtStart ? (pages.length - 1) * 2 : pages.length * 2;

  return (
    <div className="w-full shrink-0 flex-none bg-white/95 backdrop-blur-xs border-b border-stone-200 shadow-2xs z-30 select-none py-1 px-2.5">
      {/* Mini Info & Quick Paging Bar */}
      <div className="flex items-center justify-between text-xs text-stone-600 mb-1">
        <div className="flex items-center gap-1.5 font-bold text-stone-800 text-[11px]">
          <Layers className="w-3.5 h-3.5 text-sky-600" />
          <span>{currentIsCover ? 'Bìa Album' : `Trang ${currentPageNumber}`}</span>
          <span className="text-stone-400 font-normal text-[10px]">
            {currentIsCover ? ' (Bìa Bọc)' : `/ ${totalInnerPagesNumber} trang`}
          </span>
        </div>

        {/* Navigation Arrows & Add Page */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSelectPage(Math.max(0, activePageIndex - 1))}
            disabled={activePageIndex === 0}
            className="p-1 text-stone-500 hover:text-stone-900 active:bg-stone-100 rounded disabled:opacity-25 transition cursor-pointer"
            title="Trang trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="text-[10px] font-semibold text-stone-600 px-1 font-mono">
            {activePageIndex + 1}/{pages.length}
          </span>

          <button
            type="button"
            onClick={() => onSelectPage(Math.min(pages.length - 1, activePageIndex + 1))}
            disabled={activePageIndex === pages.length - 1}
            className="p-1 text-stone-500 hover:text-stone-900 active:bg-stone-100 rounded disabled:opacity-25 transition cursor-pointer"
            title="Trang sau"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-stone-200 mx-0.5" />

          <button
            type="button"
            onClick={onAddPage}
            className="flex items-center gap-1 px-1.5 py-0.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-[10px] rounded-md border border-sky-200 transition cursor-pointer"
            title="Thêm trang mới"
          >
            <Plus className="w-3 h-3" />
            <span>Thêm</span>
          </button>
        </div>
      </div>

      {/* Horizontal Carousel of Page Thumbnails */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {pages.map((page, index) => {
          const isActive = index === activePageIndex;
          const template = TEMPLATES.find((t) => t.id === page.templateId);
          const pageDisplay = page.templateId?.startsWith('cover-')
            ? 'Bìa'
            : hasCoverAtStart
            ? `${(index - 1) * 2 + 1}-${(index - 1) * 2 + 2}`
            : `${index * 2 + 1}-${index * 2 + 2}`;

          return (
            <div
              key={page.id || index}
              ref={isActive ? activeThumbRef : undefined}
              onClick={() => onSelectPage(index)}
              className={`relative shrink-0 flex flex-col items-center rounded-xl p-1 border-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-sky-500 bg-sky-50 shadow-xs ring-2 ring-sky-400/20'
                  : 'border-stone-200 bg-stone-50 hover:border-stone-300'
              }`}
            >
              {/* Mini Spread Canvas Preview */}
              <div
                className="relative w-20 bg-white rounded-md overflow-hidden shadow-2xs border border-stone-200/80 flex items-center justify-center"
                style={{
                  aspectRatio: (page.posterSettings?.aspectRatio || template?.aspectRatio || '50:20').replace(':', '/'),
                }}
              >
                <TemplateThumbnail id={page.templateId} slots={page.slots} className="w-full h-full" />

                {/* Page Number Overlay Badge */}
                <div className={`absolute top-0.5 left-0.5 text-white text-[7.5px] font-bold px-1 rounded-xs ${
                  page.templateId?.startsWith('cover-') ? 'bg-amber-600' : 'bg-stone-900/80'
                }`}>
                  {page.templateId?.startsWith('cover-') ? 'Bìa' : `P.${pageDisplay}`}
                </div>

                {/* Photo Count */}
                <div className="absolute bottom-0.5 right-0.5 bg-white/90 text-stone-700 text-[7px] font-semibold px-0.5 rounded-xs border border-stone-200">
                  {page.slots.filter((s) => s.imageUri).length}/{page.slots.length}
                </div>
              </div>

              {/* Bottom text label */}
              <span
                className={`text-[9px] font-semibold mt-0.5 ${
                  isActive ? 'text-sky-700 font-bold' : 'text-stone-500'
                }`}
              >
                {page.templateId?.startsWith('cover-') ? 'Bìa Album' : `P.${pageDisplay}`}
              </span>
            </div>
          );
        })}

        {/* Add Page Card */}
        <button
          type="button"
          onClick={onAddPage}
          className="h-12 w-12 shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 rounded-xl text-sky-700 transition cursor-pointer group"
          title="Thêm trang album mới"
        >
          <Plus className="w-4 h-4 text-sky-600 group-hover:scale-110 transition" />
          <span className="text-[8px] font-bold mt-0.5">Thêm</span>
        </button>
      </div>
    </div>
  );
};
