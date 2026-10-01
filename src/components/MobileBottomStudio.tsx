import React, { useState, useEffect, useRef } from 'react';
import {
  TemplateId,
  PosterSettings,
  AspectRatioType,
  AlbumPage,
  FrameSlot,
} from '../types';
import {
  BASIC_TEMPLATES,
  WITH_TEXT_TEMPLATES,
  VIP_TEMPLATES,
  BG_PRESETS,
} from '../data/constants';
import {
  Image as ImageIcon,
  LayoutGrid,
  Palette,
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  ArrowLeft,
  ArrowRight,
  X,
  ShieldCheck,
  Type,
} from 'lucide-react';
import { imageOptimizer, OptimizedImage } from '../utils/imageOptimizer';
import { TemplateThumbnail } from './EditorSidebar';

interface MobileBottomStudioProps {
  pages: AlbumPage[];
  activePageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onMovePage: (from: number, to: number) => void;
  templateId: TemplateId;
  onChangeTemplate: (id: TemplateId) => void;
  onApplyTemplateToAll?: (id: TemplateId) => void;
  posterSettings: PosterSettings;
  onChangePosterSettings: (settings: PosterSettings) => void;
  activeSlotIndex: number | null;
  onSelectSlot: (index: number | null) => void;
  onSlotImageChange: (slotIndex: number, imageUri: string) => void;
  onAutoFill?: (imageIds: string[]) => void;
  totalEmptySlotsCount?: number;
  usedImageIds?: string[];
  missingImagesCount?: number;
  onSmartRelink?: () => void;
  onOpenAddTextModal?: () => void;
  currentPageSlots: FrameSlot[];
}

export const MobileBottomStudio: React.FC<MobileBottomStudioProps> = ({
  pages,
  activePageIndex,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onMovePage,
  templateId,
  onChangeTemplate,
  onApplyTemplateToAll,
  posterSettings,
  onChangePosterSettings,
  activeSlotIndex,
  onSelectSlot,
  onSlotImageChange,
  usedImageIds = [],
  missingImagesCount = 0,
  onSmartRelink,
  onOpenAddTextModal,
  currentPageSlots,
}) => {
  // Mobile bottom tab: null = closed sheet; 'layout' | 'style' | 'pages' = open sheet
  const [activeSheet, setActiveSheet] = useState<'layout' | 'style' | 'pages' | null>(null);
  
  // Collapsible horizontal photo drawer
  const [isPhotoDrawerOpen, setIsPhotoDrawerOpen] = useState(true);
  
  // Library images subscription
  const [libraryImages, setLibraryImages] = useState<OptimizedImage[]>(() => imageOptimizer.getImages());
  const [imageFilter, setImageFilter] = useState<'all' | 'unused' | 'used'>('all');
  const [layoutCategory, setLayoutCategory] = useState<'basic' | 'with-text' | 'vip'>('basic');
  const [appliedAllNotice, setAppliedAllNotice] = useState(false);
  const [justAssignedNotice, setJustAssignedNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollStripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = imageOptimizer.subscribe(() => {
      setLibraryImages([...imageOptimizer.getImages()]);
    });
    return unsub;
  }, []);

  // When active slot changes on canvas, make sure photo drawer is open so user can pick photo
  useEffect(() => {
    if (activeSlotIndex !== null) {
      setIsPhotoDrawerOpen(true);
    }
  }, [activeSlotIndex]);

  const handleUploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      await imageOptimizer.addImages(Array.from(files));
      setIsPhotoDrawerOpen(true);
    } catch (err) {
      console.error('Lỗi khi tải ảnh:', err);
    }
  };

  const handleSelectImageForSlot = (image: OptimizedImage) => {
    let targetIndex = activeSlotIndex;

    // If no slot is explicitly selected, find first empty slot on current page
    if (targetIndex === null || targetIndex < 0 || targetIndex >= currentPageSlots.length) {
      const emptyIdx = currentPageSlots.findIndex((s) => !s.imageUri);
      if (emptyIdx !== -1) {
        targetIndex = emptyIdx;
      } else {
        // Fallback: target the first slot
        targetIndex = 0;
      }
    }

    onSlotImageChange(targetIndex, image.id);
    onSelectSlot(targetIndex);

    // Provide friendly visual feedback
    setJustAssignedNotice(`Đã chèn ảnh vào Khung #${targetIndex + 1}`);
    setTimeout(() => setJustAssignedNotice(null), 2000);
  };

  const filteredImages = libraryImages.filter((img) => {
    const isUsed = usedImageIds.includes(img.id);
    if (imageFilter === 'used') return isUsed;
    if (imageFilter === 'unused') return !isUsed;
    return true;
  });

  const updateSettings = (key: keyof PosterSettings, value: any) => {
    onChangePosterSettings({ ...posterSettings, [key]: value });
  };

  const handleApplyToAllPages = () => {
    if (onApplyTemplateToAll) {
      onApplyTemplateToAll(templateId);
      setAppliedAllNotice(true);
      setTimeout(() => setAppliedAllNotice(false), 2200);
    }
  };

  return (
    <div className="w-full flex flex-col bg-white border-t border-stone-200 shadow-xl z-40 select-none">
      {/* Hidden file input for uploading photos */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleUploadImages(e.target.files)}
      />

      {/* Active Slot Context Alert Banner */}
      {activeSlotIndex !== null && (
        <div className="bg-sky-600 text-white px-3 py-1.5 flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-1.5 font-medium truncate">
            <span className="w-2 h-2 rounded-full bg-sky-200 animate-ping" />
            <span className="font-semibold text-white">Đang chọn Khung #{activeSlotIndex + 1}:</span>
            <span className="text-sky-100 text-[11px] truncate">Chạm ảnh bên dưới để đưa vào khung</span>
          </div>
          <button
            type="button"
            onClick={() => onSelectSlot(null)}
            className="p-1 hover:bg-sky-700 active:bg-sky-800 rounded text-sky-100 hover:text-white shrink-0 cursor-pointer"
            title="Bỏ chọn khung"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Notification */}
      {justAssignedNotice && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-white px-3.5 py-1.5 rounded-full text-xs font-medium shadow-lg backdrop-blur-xs flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{justAssignedNotice}</span>
        </div>
      )}

      {/* SECTION 1: COLLAPSIBLE HORIZONTAL PHOTO TRAY */}
      <div className="flex flex-col border-b border-stone-100 bg-stone-50/70">
        {/* Tray Toggle Header */}
        <div className="flex items-center justify-between px-3 py-1.5 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPhotoDrawerOpen(!isPhotoDrawerOpen)}
              className="flex items-center gap-1.5 font-bold text-stone-800 hover:text-stone-950 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
              <span>{libraryImages.length} ảnh</span>
              {isPhotoDrawerOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
              )}
            </button>

            {/* Thêm chữ button */}
            {onOpenAddTextModal && (
              <button
                type="button"
                onClick={onOpenAddTextModal}
                className="px-2.5 py-1 bg-white hover:bg-stone-100 active:bg-stone-200 text-stone-700 font-semibold text-[11px] rounded-lg border border-stone-200/90 flex items-center gap-1 transition cursor-pointer shadow-2xs"
                title="Thêm chữ nghệ thuật vào trang"
              >
                <Type className="w-3.5 h-3.5 text-stone-600" />
                <span>Thêm chữ</span>
              </button>
            )}

            {/* Smart Relink if missing */}
            {missingImagesCount > 0 && onSmartRelink && (
              <button
                type="button"
                onClick={onSmartRelink}
                className="px-2 py-0.5 bg-amber-500 text-white font-bold text-[10px] rounded-md flex items-center gap-1 shadow-2xs cursor-pointer animate-pulse"
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>Nối {missingImagesCount} ảnh</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Filter toggle */}
            <select
              value={imageFilter}
              onChange={(e) => setImageFilter(e.target.value as any)}
              className="text-[11px] bg-white border border-stone-200 rounded px-1.5 py-0.5 text-stone-600 focus:outline-none focus:border-sky-500"
            >
              <option value="all">Tất cả ({libraryImages.length})</option>
              <option value="unused">Chưa dùng ({libraryImages.filter(i => !usedImageIds.includes(i.id)).length})</option>
              <option value="used">Đã dùng ({libraryImages.filter(i => usedImageIds.includes(i.id)).length})</option>
            </select>
          </div>
        </div>

        {/* Horizontal Scrolling Filmstrip of Thumbnails */}
        {isPhotoDrawerOpen && (
          <div
            ref={scrollStripRef}
            className="flex items-center gap-2 overflow-x-auto px-3 py-2 scrollbar-thin scrollbar-thumb-stone-300 min-h-[76px] max-h-[88px] bg-white"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Direct Upload Card */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-16 w-16 shrink-0 flex flex-col items-center justify-center border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50/50 hover:bg-sky-50 rounded-xl text-sky-700 transition cursor-pointer group"
            >
              <Plus className="w-5 h-5 text-sky-600 group-hover:scale-110 transition" />
              <span className="text-[10px] font-bold mt-0.5">Tải ảnh</span>
            </button>

            {filteredImages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-xs text-stone-400 italic py-2">
                {libraryImages.length === 0 ? 'Chưa có ảnh nào. Hãy chạm nút Tải ảnh.' : 'Không có ảnh phù hợp bộ lọc.'}
              </div>
            ) : (
              filteredImages.map((img) => {
                const isUsed = usedImageIds.includes(img.id);
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => handleSelectImageForSlot(img)}
                    className={`relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border-2 transition transform active:scale-95 cursor-pointer shadow-xs ${
                      isUsed
                        ? 'border-emerald-500/80 opacity-90'
                        : 'border-stone-200 hover:border-sky-500'
                    }`}
                    title={isUsed ? 'Ảnh đã được dùng trong album (chạm để chèn lại)' : 'Chạm để chèn vào khung'}
                  >
                    <img
                      src={img.thumbnailUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover pointer-events-none"
                    />

                    {isUsed && (
                      <div className="absolute top-1 left-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-2xs">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}

                    {img.status === 'processing' && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center">
                        <div className="w-3.5 h-3.5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: MOBILE BOTTOM TAB NAVIGATION BAR */}
      <div className="h-14 bg-white border-t border-stone-200 grid grid-cols-4 px-1 py-1 safe-area-pb">
        {/* Tab 1: Ảnh */}
        <button
          type="button"
          onClick={() => {
            setIsPhotoDrawerOpen(!isPhotoDrawerOpen);
            setActiveSheet(null);
          }}
          className={`flex flex-col items-center justify-center min-h-[44px] rounded-xl text-xs font-semibold transition cursor-pointer ${
            isPhotoDrawerOpen && activeSheet === null
              ? 'text-sky-600 bg-sky-50'
              : 'text-stone-600 hover:text-stone-900 active:bg-stone-100'
          }`}
        >
          <ImageIcon className="w-4 h-4 mb-0.5" />
          <span className="text-[11px]">Ảnh ({libraryImages.length})</span>
        </button>

        {/* Tab 2: Layout */}
        <button
          type="button"
          onClick={() => setActiveSheet(activeSheet === 'layout' ? null : 'layout')}
          className={`flex flex-col items-center justify-center min-h-[44px] rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeSheet === 'layout'
              ? 'text-sky-600 bg-sky-50'
              : 'text-stone-600 hover:text-stone-900 active:bg-stone-100'
          }`}
        >
          <LayoutGrid className="w-4 h-4 mb-0.5" />
          <span className="text-[11px]">Layout</span>
        </button>

        {/* Tab 3: Size & Màu */}
        <button
          type="button"
          onClick={() => setActiveSheet(activeSheet === 'style' ? null : 'style')}
          className={`flex flex-col items-center justify-center min-h-[44px] rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeSheet === 'style'
              ? 'text-sky-600 bg-sky-50'
              : 'text-stone-600 hover:text-stone-900 active:bg-stone-100'
          }`}
        >
          <Palette className="w-4 h-4 mb-0.5" />
          <span className="text-[11px]">Size & Màu</span>
        </button>

        {/* Tab 4: Trang */}
        <button
          type="button"
          onClick={() => setActiveSheet(activeSheet === 'pages' ? null : 'pages')}
          className={`flex flex-col items-center justify-center min-h-[44px] rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeSheet === 'pages'
              ? 'text-sky-600 bg-sky-50'
              : 'text-stone-600 hover:text-stone-900 active:bg-stone-100'
          }`}
        >
          <Layers className="w-4 h-4 mb-0.5" />
          <span className="text-[11px]">Trang ({pages.length})</span>
        </button>
      </div>

      {/* SECTION 3: SLIDE-UP BOTTOM SHEETS */}
      {activeSheet !== null && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          {/* Backdrop click to dismiss */}
          <div className="flex-1" onClick={() => setActiveSheet(null)} />

          {/* Bottom Sheet Modal Container */}
          <div className="bg-white rounded-t-3xl max-h-[82vh] flex flex-col shadow-2xl border-t border-stone-200 animate-in slide-in-from-bottom duration-200 overflow-hidden">
            {/* Pull handle & header */}
            <div className="shrink-0 flex flex-col items-center pt-2 pb-1 border-b border-stone-200/80 px-4 bg-stone-50">
              <div className="w-12 h-1 bg-stone-300 rounded-full mb-2" />
              <div className="w-full flex items-center justify-between pb-1">
                <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  {activeSheet === 'layout' && (
                    <>
                      <LayoutGrid className="w-4 h-4 text-sky-600" />
                      <span>Chọn Layout Trang</span>
                    </>
                  )}
                  {activeSheet === 'style' && (
                    <>
                      <Palette className="w-4 h-4 text-sky-600" />
                      <span>Kích Thước, Màu Sắc & Vùng In</span>
                    </>
                  )}
                  {activeSheet === 'pages' && (
                    <>
                      <Layers className="w-4 h-4 text-sky-600" />
                      <span>Quản Lý Thứ Tự Các Trang</span>
                    </>
                  )}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveSheet(null)}
                  className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-full transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SHEET CONTENT: TAB 1 - LAYOUTS */}
            {activeSheet === 'layout' && (
              <div className="flex-1 flex flex-col overflow-hidden min-h-0 p-4 space-y-3">
                {/* Category Switcher */}
                <div className="flex bg-stone-100 p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setLayoutCategory('basic')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition text-center cursor-pointer ${
                      layoutCategory === 'basic' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                    }`}
                  >
                    Tiêu chuẩn ({BASIC_TEMPLATES.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutCategory('with-text')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition text-center cursor-pointer ${
                      layoutCategory === 'with-text' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                    }`}
                  >
                    Chuyên nghiệp ({WITH_TEXT_TEMPLATES.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutCategory('vip')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition text-center cursor-pointer ${
                      layoutCategory === 'vip' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                    }`}
                  >
                    Họa tiết ({VIP_TEMPLATES.length})
                  </button>
                </div>

                {/* Apply to all pages button */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-stone-500 font-medium">
                    Chạm để áp dụng layout vào trang hiện tại
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyToAllPages}
                    className="text-xs text-sky-600 font-bold hover:underline cursor-pointer"
                  >
                    {appliedAllNotice ? '✓ Đã áp dụng toàn bộ' : 'Áp dụng cho tất cả trang'}
                  </button>
                </div>

                {/* Grid of Templates */}
                <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                  <div className="grid grid-cols-2 gap-3 pb-6">
                    {(layoutCategory === 'basic'
                      ? BASIC_TEMPLATES
                      : layoutCategory === 'with-text'
                      ? WITH_TEXT_TEMPLATES
                      : VIP_TEMPLATES
                    ).map((t) => {
                      const isSelected = templateId === t.id;
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            onChangeTemplate(t.id);
                            setActiveSheet(null);
                          }}
                          className={`flex flex-col p-2 rounded-xl border transition cursor-pointer ${
                            isSelected
                              ? 'border-sky-500 bg-sky-50/40 ring-2 ring-sky-500/20'
                              : 'border-stone-200 hover:border-stone-300 bg-white'
                          }`}
                        >
                          <div className="w-full aspect-[5/2] bg-stone-100 rounded-lg overflow-hidden border border-stone-200/80 mb-1.5 shadow-2xs">
                            <TemplateThumbnail id={t.id} slots={currentPageSlots} />
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-stone-800 truncate">{t.name}</span>
                            <span className="text-[10px] text-stone-400 shrink-0">{t.slotCount} ảnh</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SHEET CONTENT: TAB 2 - STYLE & SIZE */}
            {activeSheet === 'style' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Safe Zone & Guides Master Switch */}
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                          Vùng an toàn & Đường guide
                        </span>
                        <span className="text-[10px] text-stone-500">Hỗ trợ căn chỉnh chuẩn khi in ấn</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const isAny = Boolean(posterSettings.showCutZone || posterSettings.showSafeZone || posterSettings.showGuides);
                        onChangePosterSettings({
                          ...posterSettings,
                          showCutZone: !isAny,
                          showSafeZone: !isAny,
                          showGuides: !isAny,
                        });
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                        posterSettings.showCutZone || posterSettings.showSafeZone || posterSettings.showGuides
                          ? 'bg-sky-600 text-white'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {posterSettings.showCutZone || posterSettings.showSafeZone || posterSettings.showGuides ? 'Bật' : 'Tắt'}
                    </button>
                  </div>
                </div>

                {/* Aspect Ratio Selector */}
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-3">
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                    Kích thước album (Trang đôi)
                  </span>

                  <div>
                    <span className="text-[11px] font-semibold text-stone-600 mb-1.5 block">Layout ngang phổ biến:</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: '50:20', label: '25x20' },
                        { id: '42:15', label: '21x15' },
                        { id: '60:20', label: '30x20' },
                        { id: '70:25', label: '35x25' },
                        { id: '80:30', label: '40x30' },
                      ].map((ratio) => (
                        <button
                          key={ratio.id}
                          type="button"
                          onClick={() => updateSettings('aspectRatio', ratio.id as AspectRatioType)}
                          className={`p-2 text-xs rounded-xl border text-center transition cursor-pointer ${
                            posterSettings.aspectRatio === ratio.id
                              ? 'border-sky-600 bg-sky-50 font-bold text-sky-900 shadow-xs'
                              : 'border-stone-200 bg-white text-stone-700'
                          }`}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-stone-600 mb-1.5 block">Layout vuông:</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: '30:15', label: '15x15' },
                        { id: '40:20', label: '20x20' },
                        { id: '60:30', label: '30x30' },
                      ].map((ratio) => (
                        <button
                          key={ratio.id}
                          type="button"
                          onClick={() => updateSettings('aspectRatio', ratio.id as AspectRatioType)}
                          className={`p-2 text-xs rounded-xl border text-center transition cursor-pointer ${
                            posterSettings.aspectRatio === ratio.id
                              ? 'border-sky-600 bg-sky-50 font-bold text-sky-900 shadow-xs'
                              : 'border-stone-200 bg-white text-stone-700'
                          }`}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-stone-600 mb-1.5 block">Layout đứng:</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: '30:21', label: '15x21' },
                        { id: '40:30', label: '20x30' },
                        { id: '50:35', label: '25x35' },
                        { id: '60:40', label: '30x40' },
                      ].map((ratio) => (
                        <button
                          key={ratio.id}
                          type="button"
                          onClick={() => updateSettings('aspectRatio', ratio.id as AspectRatioType)}
                          className={`p-2 text-xs rounded-xl border text-center transition cursor-pointer ${
                            posterSettings.aspectRatio === ratio.id
                              ? 'border-sky-600 bg-sky-50 font-bold text-sky-900 shadow-xs'
                              : 'border-stone-200 bg-white text-stone-700'
                          }`}
                        >
                          {ratio.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Background Color Presets */}
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-2">
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                    Màu nền phông cưới
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {BG_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => updateSettings('bgColor', preset.value)}
                        className={`flex flex-col items-center p-2 rounded-xl border text-center transition cursor-pointer ${
                          posterSettings.bgColor === preset.value
                            ? 'border-sky-600 ring-2 ring-sky-600/20 bg-white font-medium shadow-xs'
                            : 'border-stone-200 bg-white'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-stone-300 mb-1 shadow-2xs"
                          style={{ backgroundColor: preset.value }}
                        />
                        <span className="text-[10px] text-stone-700 truncate w-full">
                          {preset.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spacing & Gap Slider */}
                <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                      <span>Khoảng cách giữa các khung (Gap)</span>
                      <span className="text-sky-600 font-bold">{posterSettings.gap}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="28"
                      value={posterSettings.gap}
                      onChange={(e) => updateSettings('gap', parseInt(e.target.value))}
                      className="w-full accent-sky-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                      <span>Khoảng lề ngoài (Outer Margin)</span>
                      <span className="text-sky-600 font-bold">{posterSettings.outerMargin}px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="60"
                      value={posterSettings.outerMargin}
                      onChange={(e) => updateSettings('outerMargin', parseInt(e.target.value))}
                      className="w-full accent-sky-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SHEET CONTENT: TAB 3 - PAGES MANAGER */}
            {activeSheet === 'pages' && (
              <div className="flex-1 flex flex-col overflow-hidden min-h-0 p-4 space-y-3">
                {/* Quick actions top bar */}
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onAddPage}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm</span>
                    </button>
                  </div>

                  <span className="text-xs text-stone-500 font-medium">
                    Tổng: {pages.length} layout ({pages.length * 2} trang)
                  </span>
                </div>

                {/* List of Pages */}
                <div className="flex-1 overflow-y-auto min-h-0 space-y-2.5 pr-1 pb-4">
                  {pages.map((p, idx) => {
                    const isCurrent = idx === activePageIndex;
                    const pageDisplayNumber = `${idx * 2 + 1}-${idx * 2 + 2}`;
                    return (
                      <div
                        key={p.id || idx}
                        onClick={() => {
                          onSelectPage(idx);
                          setActiveSheet(null);
                        }}
                        className={`flex items-center gap-3 p-2.5 rounded-2xl border transition cursor-pointer ${
                          isCurrent
                            ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20'
                            : 'border-stone-200 bg-white hover:bg-stone-50'
                        }`}
                      >
                        {/* Page Preview Thumbnail */}
                        <div className="w-24 aspect-[5/2] bg-stone-100 rounded-lg overflow-hidden border border-stone-200 shrink-0 shadow-2xs">
                          <TemplateThumbnail id={p.templateId} slots={p.slots} />
                        </div>

                        {/* Page Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-xs">
                              Trang {pageDisplayNumber}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                                Đang sửa
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-stone-500 block truncate mt-0.5">
                            {p.slots.filter((s) => s.imageUri).length}/{p.slots.length} ảnh đã chèn
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* Move up */}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => onMovePage(idx, idx - 1)}
                            className="p-1.5 text-stone-400 hover:text-stone-700 disabled:opacity-30 rounded-lg hover:bg-stone-100 cursor-pointer"
                            title="Di chuyển lên trước"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>

                          {/* Move down */}
                          <button
                            type="button"
                            disabled={idx === pages.length - 1}
                            onClick={() => onMovePage(idx, idx + 1)}
                            className="p-1.5 text-stone-400 hover:text-stone-700 disabled:opacity-30 rounded-lg hover:bg-stone-100 cursor-pointer"
                            title="Di chuyển xuống sau"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => onDuplicatePage(idx)}
                            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 cursor-pointer"
                            title="Nhân bản trang"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          {pages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onDeletePage(idx)}
                              className="p-1.5 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                              title="Xóa trang"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
