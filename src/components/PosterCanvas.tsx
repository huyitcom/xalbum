import React, { useState, useRef, useEffect } from 'react';
import { imageOptimizer } from '../utils/imageOptimizer';
import { FrameSlot, PosterSettings, TemplateId, TextConfig, CustomTextElement } from '../types';
import { PHOTO_FILTERS, TEMPLATES } from '../data/constants';
import { TEXT_STYLE_PRESETS } from '../data/textStyles';
import { Upload, Sliders, Plus, Trash2, RotateCw, RotateCcw, Type, Check, ImageOff } from 'lucide-react';

interface PosterCanvasProps {
  templateId: TemplateId;
  slots: FrameSlot[];
  textConfig: TextConfig;
  customTexts?: CustomTextElement[];
  posterSettings: PosterSettings;
  activeSlotIndex: number | null;
  selectedTextId?: string | null;
  onSelectSlot: (index: number) => void;
  onSelectText?: (id: string | null) => void;
  onSlotImageChange: (index: number, imageUri: string) => void;
  onSwapSlots?: (indexA: number, indexB: number) => void;
  onUpdateSlot?: (updated: FrameSlot) => void;
  onUpdateCustomText?: (updated: CustomTextElement) => void;
  onDeleteCustomText?: (id: string) => void;
  onDuplicateCustomText?: (id: string) => void;
  onOpenCropModal: (slot: FrameSlot, index: number) => void;
  posterRef: React.RefObject<HTMLDivElement | null>;
  isExporting?: boolean;
}

export const PosterCanvas: React.FC<PosterCanvasProps> = ({
  templateId,
  slots,
  textConfig,
  customTexts = [],
  posterSettings,
  activeSlotIndex,
  selectedTextId,
  onSelectSlot,
  onSelectText,
  onSlotImageChange,
  onSwapSlots,
  onUpdateSlot,
  onUpdateCustomText,
  onDeleteCustomText,
  onOpenCropModal,
  posterRef,
  isExporting = false,
}) => {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [panningIndex, setPanningIndex] = useState<number | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [tempEditText, setTempEditText] = useState<string>('');

  const textDragRef = useRef<{
    textId: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    containerWidth: number;
    containerHeight: number;
    hasMoved: boolean;
  } | null>(null);

  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  const customTextsRef = useRef(customTexts);
  customTextsRef.current = customTexts;

  const onUpdateCustomTextRef = useRef(onUpdateCustomText);
  onUpdateCustomTextRef.current = onUpdateCustomText;

  const onSelectTextRef = useRef(onSelectText);
  onSelectTextRef.current = onSelectText;

  const onUpdateSlotRef = useRef(onUpdateSlot);
  onUpdateSlotRef.current = onUpdateSlot;

  const onSelectSlotRef = useRef(onSelectSlot);
  onSelectSlotRef.current = onSelectSlot;

  // --- Responsive Scaling Logic ---
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const templateDef = TEMPLATES.find((t) => t.id === templateId);
  const isVipOverlay = Boolean(templateDef?.isOverlay || templateDef?.category === 'vip' || templateId.startsWith('overlay-'));
  
  // VIP templates strictly require 50x20cm (single page 25x20cm)
  const effectiveAspectRatio = isVipOverlay ? '50:20' : (posterSettings.aspectRatio || '50:20');
  const ratioParts = effectiveAspectRatio.split(':').map(Number);
  const wRatio = ratioParts[0] || 50;
  const hRatio = ratioParts[1] || 20;
  const isLandscape = wRatio > hRatio;
  const isExtremeLandscape = wRatio / hRatio >= 2;
  const baseWidth = isExtremeLandscape ? 960 : isLandscape ? 820 : 560;
  const baseHeight = (baseWidth * hRatio) / wRatio;

  useEffect(() => {
    if (!wrapperRef.current) return;
    
    const updateScale = () => {
      if (!wrapperRef.current) return;
      const wrapper = wrapperRef.current;
      // Available width inside the wrapper
      const availableWidth = Math.max(280, Math.floor(wrapper.clientWidth) - 16);
      
      // Calculate available height from the scrollable viewport (main)
      const parentMain = wrapper.closest('main') || wrapper.parentElement;
      const parentHeight = parentMain ? parentMain.clientHeight : (window.innerHeight - 200);
      // Account for viewport padding (roughly 20px)
      const availableHeight = Math.max(220, parentHeight - 20);

      const scaleX = availableWidth / baseWidth;
      const scaleY = availableHeight / baseHeight;

      // Smart fit: fit both width and height, capped at 1.25 so it never becomes unnaturally oversized
      const newScale = Math.max(0.25, Math.min(scaleX, scaleY, 1.25));
      setScale(newScale);
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(wrapperRef.current);
    const parentMain = wrapperRef.current.closest('main') || wrapperRef.current.parentElement;
    if (parentMain) {
      observer.observe(parentMain);
    }
    window.addEventListener('resize', updateScale);
    updateScale();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [baseWidth, baseHeight]);
  // --------------------------------

  const panRef = useRef<{
    slotIndex: number;
    startX: number;
    startY: number;
    initialOffsetX: number;
    initialOffsetY: number;
    containerWidth: number;
    containerHeight: number;
    hasMoved: boolean;
  } | null>(null);

  // Global listener for smooth real-time drag/pan across canvas
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!panRef.current && !textDragRef.current) return;
      
      if (panRef.current) {
        const {
          slotIndex,
          startX,
          startY,
          initialOffsetX,
          initialOffsetY,
          containerWidth,
          containerHeight,
        } = panRef.current;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (Math.hypot(dx, dy) > 2) {
          panRef.current.hasMoved = true;
        }

        if (panRef.current.hasMoved) {
          const currentSlot = slotsRef.current[slotIndex];
          if (currentSlot && onUpdateSlotRef.current) {
            const deltaPctX = -(dx / Math.max(containerWidth, 50)) * 100;
            const deltaPctY = -(dy / Math.max(containerHeight, 50)) * 100;

            const newOffsetX = Math.max(-50, Math.min(50, Math.round(initialOffsetX + deltaPctX)));
            const newOffsetY = Math.max(-50, Math.min(50, Math.round(initialOffsetY + deltaPctY)));

            onUpdateSlotRef.current({
              ...currentSlot,
              offsetX: newOffsetX,
              offsetY: newOffsetY,
            });
          }
        }
      }

      if (textDragRef.current && onUpdateCustomTextRef.current) {
        const { textId, startX, startY, initialX, initialY, containerWidth, containerHeight } = textDragRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (Math.hypot(dx, dy) > 2) {
          textDragRef.current.hasMoved = true;
        }

        if (textDragRef.current.hasMoved) {
          const target = customTextsRef.current.find((t) => t.id === textId);
          if (target) {
            const deltaPctX = (dx / Math.max(containerWidth, 100)) * 100;
            const deltaPctY = (dy / Math.max(containerHeight, 100)) * 100;

            const newX = Math.max(2, Math.min(98, Math.round((initialX + deltaPctX) * 10) / 10));
            const newY = Math.max(2, Math.min(98, Math.round((initialY + deltaPctY) * 10) / 10));

            onUpdateCustomTextRef.current({
              ...target,
              x: newX,
              y: newY,
            });
          }
        }
      }
    };

    const handleGlobalPointerUp = () => {
      if (panRef.current) {
        const { slotIndex, hasMoved } = panRef.current;
        panRef.current = null;
        setPanningIndex(null);

        if (!hasMoved && onSelectSlotRef.current) {
          onSelectSlotRef.current(slotIndex);
        }
      }

      if (textDragRef.current) {
        const { textId, hasMoved } = textDragRef.current;
        textDragRef.current = null;
        if (!hasMoved && onSelectTextRef.current) {
          onSelectTextRef.current(textId);
        }
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: true });
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingTextId) {
          setEditingTextId(null);
        } else if (selectedTextId) {
          onSelectTextRef.current?.(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingTextId, selectedTextId]);

  const getFilterStyle = (filterId: string) => {
    const f = PHOTO_FILTERS.find((item) => item.id === filterId);
    return f ? f.css : 'none';
  };

  const handleSingleFileInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onSlotImageChange(index, event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Drop files from computer directly onto slot
  const handleDropOnSlot = (targetIndex: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverIndex(null);

    const swapIndexStr = e.dataTransfer.getData('application/photobook-swap-slot');
    if (swapIndexStr) {
      const sourceIndex = parseInt(swapIndexStr, 10);
      if (!isNaN(sourceIndex) && sourceIndex !== targetIndex && onSwapSlots) {
        onSwapSlots(sourceIndex, targetIndex);
      }
      return;
    }

    const customId = e.dataTransfer.getData('application/photobook-image-id');
    if (customId) {
      onSlotImageChange(targetIndex, customId);
      return;
    }
    
    const draggedUrl = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
    if (draggedUrl && (draggedUrl.startsWith('data:image/') || draggedUrl.startsWith('img_') || draggedUrl.startsWith('blob:'))) {
      onSlotImageChange(targetIndex, draggedUrl);
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            onSlotImageChange(targetIndex, event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Start dragging image inside slot
  const handleSlotPointerDown = (index: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only primary mouse button or touch
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('label') || target.closest('input')) {
      return;
    }

    if (e.shiftKey) {
      return; // Let HTML5 drag take over
    }

    if (onSelectTextRef.current) {
      onSelectTextRef.current(null);
    }
    setEditingTextId(null);

    const slot = slots[index];
    if (!slot || !slot.imageUri) return;

    const rect = e.currentTarget.getBoundingClientRect();
    panRef.current = {
      slotIndex: index,
      startX: e.clientX,
      startY: e.clientY,
      initialOffsetX: slot.offsetX || 0,
      initialOffsetY: slot.offsetY || 0,
      containerWidth: rect.width || 200,
      containerHeight: rect.height || 200,
      hasMoved: false,
    };
    setPanningIndex(index);
  };

  const renderSlot = (index: number, className: string = '') => {
    const slot = slots[index] || {
      id: `slot-${index}`,
      imageUri: null,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      filter: 'none',
    };

    const isFilled = Boolean(slot.imageUri);
    const filterCss = getFilterStyle(slot.filter);
    const isDragOver = dragOverIndex === index;
    const isPanningThis = panningIndex === index;

    // Convert -50..50 offset to 0%..100% objectPosition
    const posX = Math.max(0, Math.min(100, 50 + (slot.offsetX || 0)));
    const posY = Math.max(0, Math.min(100, 50 + (slot.offsetY || 0)));

    return (
      <div
        key={slot.id || index}
        draggable={isFilled}
        onDragStart={(e) => {
          if (!e.shiftKey) {
            e.preventDefault();
            return;
          }
          e.dataTransfer.setData('application/photobook-swap-slot', index.toString());
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = e.dataTransfer.types.includes('application/photobook-swap-slot') ? 'move' : 'copy';
          if (dragOverIndex !== index) setDragOverIndex(index);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragOverIndex(null);
        }}
        onDrop={(e) => handleDropOnSlot(index, e)}
        onPointerDown={(e) => handleSlotPointerDown(index, e)}
        className={`relative group overflow-hidden select-none transition-shadow duration-150 ${
          activeSlotIndex === index ? 'ring-2 ring-sky-500 ring-offset-1 z-10' : ''
        } ${isPanningThis ? 'cursor-grabbing ring-2 ring-sky-400' : isFilled ? 'cursor-grab' : 'cursor-pointer'} ${className}`}
        style={{
          borderRadius: `${posterSettings.cornerRadius}px`,
          backgroundColor: '#f5f5f4',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <input
          type="file"
          accept="image/*"
          id={`file-input-${index}`}
          className="hidden"
          onChange={(e) => handleSingleFileInput(index, e)}
        />

        {/* Drag Over Visual Indicator for Desktop Files */}
        {isDragOver && (
          <div className="absolute inset-0 z-40 bg-sky-500/25 border-2 border-dashed border-sky-500 rounded-lg flex flex-col items-center justify-center gap-1.5 p-2 backdrop-blur-2xs animate-in fade-in duration-150 pointer-events-none">
            <div className="w-9 h-9 rounded-full bg-white text-sky-600 flex items-center justify-center shadow-md animate-bounce">
              <Upload className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-white bg-sky-600 px-2.5 py-0.5 rounded-full shadow-xs">
              Thả ảnh vào khung #{index + 1}
            </span>
          </div>
        )}

        {isFilled ? (() => {
          let finalSrc = slot.imageUri!;
          let isMissing = false;
          if (finalSrc.startsWith('img_')) {
            const optimized = imageOptimizer.getImage(finalSrc);
            if (optimized) {
              finalSrc = isExporting ? optimized.originalUrl : optimized.previewUrl;
            } else {
              isMissing = true;
            }
          }

          if (isMissing) {
            return (
              <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100/95 text-stone-500 p-2 text-center border-2 border-dashed border-stone-300 pointer-events-auto select-none">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-1.5 shadow-2xs">
                  <ImageOff className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-stone-700">Khung #{index + 1}: Chưa có ảnh</span>
                <span className="text-[10px] text-stone-400 mt-0.5 max-w-[130px] leading-tight">
                  Kéo ảnh từ thư viện vào đây
                </span>
              </div>
            );
          }

          return (
          <div className="w-full h-full relative overflow-hidden pointer-events-none">
            <img
              src={finalSrc}
              alt={`Frame ${index + 1}`}
              crossOrigin={finalSrc?.startsWith('http') ? "anonymous" : undefined}
              draggable={false}
              className="w-full h-full object-cover transition-transform duration-75 pointer-events-none select-none"
              style={{
                objectPosition: `${posX}% ${posY}%`,
                transform: `scale(${Math.max(1, slot.zoom || 1)}) rotate(${slot.rotation || 0}deg)`,
                transformOrigin: `${posX}% ${posY}%`,
                filter: filterCss,
              }}
            />

            {/* Quick Actions (top right) */}
            <div className={`absolute top-2 right-2 flex items-center gap-1.5 transition-opacity duration-150 pointer-events-auto ${activeSlotIndex === index ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'}`}>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCropModal(slot, index);
                }}
                className="flex items-center gap-1 bg-white/95 hover:bg-white text-stone-900 text-[11px] font-semibold px-2 py-1.5 rounded-lg shadow-md transition scale-95 hover:scale-100 cursor-pointer backdrop-blur-xs"
                title="Chỉnh sửa thu phóng & góc xoay"
              >
                <Sliders className="w-3.5 h-3.5 text-sky-600" />
                <span>Sửa</span>
              </button>

              <label
                htmlFor={`file-input-${index}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 bg-stone-900/90 hover:bg-black text-white text-[11px] font-semibold px-2 py-1.5 rounded-lg shadow-md transition cursor-pointer scale-95 hover:scale-100 backdrop-blur-xs"
                title="Tải ảnh mới từ thiết bị"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Đổi</span>
              </label>
            </div>
          </div>
        );
        })() : (
          <label
            htmlFor={`file-input-${index}`}
            className="w-full h-full flex flex-col items-center justify-center p-3 text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 transition cursor-pointer border border-dashed border-stone-300 rounded-lg group/placeholder"
          >
            <div className="w-8 h-8 rounded-full bg-white shadow-xs flex items-center justify-center mb-1 group-hover/placeholder:scale-110 transition">
              <Plus className="w-4 h-4 text-stone-500" />
            </div>
            <span className="text-[11px] font-medium text-stone-500 text-center">
              Khung #{index + 1}
            </span>
            <span className="text-[9px] text-stone-400 text-center">Kéo thả hoặc bấm để tải ảnh</span>
          </label>
        )}
      </div>
    );
  };

  return (
    <div 
      ref={wrapperRef}
      onPointerDown={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('[id^="custom-text-"]') && !target.closest('button') && !target.closest('input') && !target.closest('label')) {
          if (onSelectTextRef.current) onSelectTextRef.current(null);
          setEditingTextId(null);
        }
      }}
      className="w-full flex justify-center items-start py-1 sm:py-2 px-2 overflow-hidden" 
      style={{ height: baseHeight * scale + 16 }}
    >
      <div 
        style={{ 
          width: baseWidth, 
          height: baseHeight, 
          transform: `scale(${scale})`, 
          transformOrigin: 'top center',
          transition: 'transform 0.1s ease-out'
        }}
        className="flex shrink-0 justify-center"
      >
        <div
          id="poster-root"
          ref={posterRef}
          onPointerDown={(e) => {
            const target = e.target as HTMLElement;
            if (!target.closest('[id^="custom-text-"]') && !target.closest('button') && !target.closest('input') && !target.closest('label')) {
              if (onSelectTextRef.current) onSelectTextRef.current(null);
              setEditingTextId(null);
            }
          }}
          className="relative bg-white shadow-2xl transition-all duration-300 overflow-hidden flex flex-col w-full h-full"
          style={{
            backgroundColor: posterSettings.bgColor,
            padding: isVipOverlay ? 0 : `${posterSettings.outerMargin}px`,
            border: isVipOverlay
              ? 'none'
              : posterSettings.borderStyle === 'thin-line'
              ? `1px solid ${posterSettings.borderColor}`
              : posterSettings.borderStyle === 'gold-border'
              ? `3px double #d97706`
              : 'none',
          }}
        >
        {/* Decorative inner line frame if gold border style */}
        {!isVipOverlay && posterSettings.borderStyle === 'double-frame' && (
          <div
            className="absolute inset-3 border border-amber-500/40 pointer-events-none rounded-xs"
            style={{ margin: `${posterSettings.outerMargin - 8}px` }}
          />
        )}

                {/* BASIC TEMPLATES (23 Clean Photo Layouts) */}
        {templateId === 'basic-full-bleed' && (
          <div className="w-full h-full min-h-0">
            {renderSlot(0, 'w-full h-full')}
          </div>
        )}

        {templateId === 'basic-preserve-ratio-2' && (
          <div className="w-full h-full flex overflow-hidden p-3" style={{ gap: `${posterSettings.gap * 2}px` }}>
            <div className="w-1/2 h-full flex items-center justify-center min-h-0 p-2">
              <div className="w-full aspect-[4/3] max-h-full shadow-xs">
                {renderSlot(0, 'w-full h-full')}
              </div>
            </div>
            <div className="w-1/2 h-full flex items-center justify-center min-h-0 p-2">
              <div className="h-full aspect-[3/4] max-w-full shadow-xs">
                {renderSlot(1, 'w-full h-full')}
              </div>
            </div>
          </div>
        )}

        {templateId === 'basic-spread-2-vertical' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-1/2 h-full min-h-0">
              {renderSlot(0, 'w-full h-full')}
            </div>
            <div className="w-1/2 h-full min-h-0">
              {renderSlot(1, 'w-full h-full')}
            </div>
          </div>
        )}

        {templateId === 'basic-left-feature-2right' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-1/2 h-full min-h-0">
              {renderSlot(0, 'w-full h-full')}
            </div>
            <div className="w-1/2 h-full flex flex-col min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
              <div className="w-full h-1/2 min-h-0">
                {renderSlot(1, 'w-full h-full')}
              </div>
              <div className="w-full h-1/2 min-h-0">
                {renderSlot(2, 'w-full h-full')}
              </div>
            </div>
          </div>
        )}

        {templateId === 'basic-right-feature-2left' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-1/2 h-full flex flex-col min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
              <div className="w-full h-1/2 min-h-0">
                {renderSlot(0, 'w-full h-full')}
              </div>
              <div className="w-full h-1/2 min-h-0">
                {renderSlot(1, 'w-full h-full')}
              </div>
            </div>
            <div className="w-1/2 h-full min-h-0">
              {renderSlot(2, 'w-full h-full')}
            </div>
          </div>
        )}

        {templateId === 'basic-four-grid' && (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-full h-full min-h-0">{renderSlot(0, 'w-full h-full')}</div>
            <div className="w-full h-full min-h-0">{renderSlot(1, 'w-full h-full')}</div>
            <div className="w-full h-full min-h-0">{renderSlot(2, 'w-full h-full')}</div>
            <div className="w-full h-full min-h-0">{renderSlot(3, 'w-full h-full')}</div>
          </div>
        )}

        {templateId === 'basic-panorama-top' && (
          <div className="w-full h-full flex flex-col overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-full h-[45%] min-h-0">
              {renderSlot(0, 'w-full h-full')}
            </div>
            <div className="w-full h-[55%] flex min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
              <div className="w-1/2 h-full min-h-0">
                {renderSlot(1, 'w-full h-full')}
              </div>
              <div className="w-1/2 h-full flex flex-col min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
                <div className="w-full h-1/2 min-h-0">
                  {renderSlot(2, 'w-full h-full')}
                </div>
                <div className="w-full h-1/2 min-h-0">
                  {renderSlot(3, 'w-full h-full')}
                </div>
              </div>
            </div>
          </div>
        )}

        {templateId === 'basic-skewed-grid' && (
          <div className="w-full h-full flex flex-col overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-full h-1/2 flex min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
              <div className="w-[58%] h-full min-h-0">{renderSlot(0, 'w-full h-full')}</div>
              <div className="w-[42%] h-full min-h-0">{renderSlot(1, 'w-full h-full')}</div>
            </div>
            <div className="w-full h-1/2 flex min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
              <div className="w-[42%] h-full min-h-0">{renderSlot(2, 'w-full h-full')}</div>
              <div className="w-[58%] h-full min-h-0">{renderSlot(3, 'w-full h-full')}</div>
            </div>
          </div>
        )}

        {templateId === 'basic-stack-right-3' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-[55%] h-full min-h-0">
              {renderSlot(0, 'w-full h-full')}
            </div>
            <div className="w-[45%] h-full flex flex-col min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
              <div className="w-full h-1/3 min-h-0">{renderSlot(1, 'w-full h-full')}</div>
              <div className="w-full h-1/3 min-h-0">{renderSlot(2, 'w-full h-full')}</div>
              <div className="w-full h-1/3 min-h-0">{renderSlot(3, 'w-full h-full')}</div>
            </div>
          </div>
        )}

        {templateId === 'basic-story-5' && (
          <div className="w-full h-full flex flex-col overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-full h-[60%] min-h-0">
              {renderSlot(0, 'w-full h-full')}
            </div>
            <div className="w-full h-[40%] flex min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
              <div className="w-1/4 h-full min-h-0">{renderSlot(1, 'w-full h-full')}</div>
              <div className="w-1/4 h-full min-h-0">{renderSlot(2, 'w-full h-full')}</div>
              <div className="w-1/4 h-full min-h-0">{renderSlot(3, 'w-full h-full')}</div>
              <div className="w-1/4 h-full min-h-0">{renderSlot(4, 'w-full h-full')}</div>
            </div>
          </div>
        )}

        {templateId === 'basic-stack-left-3' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-[45%] h-full flex flex-col min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
              <div className="w-full h-1/3 min-h-0">{renderSlot(0, 'w-full h-full')}</div>
              <div className="w-full h-1/3 min-h-0">{renderSlot(1, 'w-full h-full')}</div>
              <div className="w-full h-1/3 min-h-0">{renderSlot(2, 'w-full h-full')}</div>
            </div>
            <div className="w-[55%] h-full min-h-0">
              {renderSlot(3, 'w-full h-full')}
            </div>
          </div>
        )}

        {templateId === 'basic-left-2split-feature' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-[38%] h-full flex flex-col min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
              <div className="w-full h-1/2 min-h-0">{renderSlot(0, 'w-full h-full')}</div>
              <div className="w-full h-1/2 min-h-0">{renderSlot(1, 'w-full h-full')}</div>
            </div>
            <div className="w-[62%] h-full min-h-0">
              {renderSlot(2, 'w-full h-full')}
            </div>
          </div>
        )}

        {templateId === 'basic-unequal-split-2' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-[40%] h-full min-h-0">{renderSlot(0, 'w-full h-full')}</div>
            <div className="w-[60%] h-full min-h-0">{renderSlot(1, 'w-full h-full')}</div>
          </div>
        )}

        {templateId === 'basic-trio-left' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-1/2 h-full min-h-0">{renderSlot(0, 'w-full h-full')}</div>
            <div className="w-1/2 h-full flex flex-col min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
              <div className="w-full h-1/2 min-h-0">{renderSlot(1, 'w-full h-full')}</div>
              <div className="w-full h-1/2 min-h-0">{renderSlot(2, 'w-full h-full')}</div>
            </div>
          </div>
        )}

        {templateId === 'basic-main-left-portrait' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-[65%] h-full min-h-0">{renderSlot(0, 'w-full h-full')}</div>
            <div className="w-[35%] h-full min-h-0">{renderSlot(1, 'w-full h-full')}</div>
          </div>
        )}

        {templateId === 'basic-center-landscape-pair' && (
          <div className="w-full h-full flex overflow-hidden p-2" style={{ gap: `${posterSettings.gap * 2}px` }}>
            <div className="w-1/2 h-full flex items-center justify-center min-h-0 p-3">
              <div className="w-full aspect-[4/3] shadow-xs">
                {renderSlot(0, 'w-full h-full')}
              </div>
            </div>
            <div className="w-1/2 h-full flex items-center justify-center min-h-0 p-3">
              <div className="w-full aspect-[4/3] shadow-xs">
                {renderSlot(1, 'w-full h-full')}
              </div>
            </div>
          </div>
        )}

        {templateId === 'basic-portrait-two-right' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-1/2 h-full min-h-0">
              {renderSlot(0, 'w-full h-full')}
            </div>
            <div className="w-1/2 h-full flex min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
              <div className="w-1/2 h-full min-h-0">{renderSlot(1, 'w-full h-full')}</div>
              <div className="w-1/2 h-full min-h-0">{renderSlot(2, 'w-full h-full')}</div>
            </div>
          </div>
        )}

        {templateId === 'basic-four-vertical-columns' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-1/4 h-full min-h-0">{renderSlot(0, 'w-full h-full')}</div>
            <div className="w-1/4 h-full min-h-0">{renderSlot(1, 'w-full h-full')}</div>
            <div className="w-1/4 h-full min-h-0">{renderSlot(2, 'w-full h-full')}</div>
            <div className="w-1/4 h-full min-h-0">{renderSlot(3, 'w-full h-full')}</div>
          </div>
        )}

        {templateId === 'basic-four-asymmetric' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-1/2 h-full flex flex-col min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
              <div className="w-full h-1/2 flex min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
                <div className="w-1/2 h-full min-h-0">{renderSlot(0, 'w-full h-full')}</div>
                <div className="w-1/2 h-full min-h-0">{renderSlot(1, 'w-full h-full')}</div>
              </div>
              <div className="w-full h-1/2 min-h-0">
                {renderSlot(2, 'w-full h-full')}
              </div>
            </div>
            <div className="w-1/2 h-full min-h-0">
              {renderSlot(3, 'w-full h-full')}
            </div>
          </div>
        )}

        {templateId === 'basic-mosaic-story' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-1/2 h-full flex flex-col min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
              <div className="w-full h-[35%] min-h-0">{renderSlot(0, 'w-full h-full')}</div>
              <div className="w-full h-[65%] min-h-0">{renderSlot(1, 'w-full h-full')}</div>
            </div>
            <div className="w-1/2 h-full flex flex-col min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
              <div className="w-full h-1/3 min-h-0">{renderSlot(2, 'w-full h-full')}</div>
              <div className="w-full h-1/3 min-h-0">{renderSlot(3, 'w-full h-full')}</div>
              <div className="w-full h-1/3 min-h-0">{renderSlot(4, 'w-full h-full')}</div>
            </div>
          </div>
        )}

        {templateId === 'basic-left-feature-right-2vert' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-1/2 h-full min-h-0">
              {renderSlot(0, 'w-full h-full')}
            </div>
            <div className="w-1/2 h-full flex flex-col min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
              <div className="w-full h-1/2 min-h-0">{renderSlot(1, 'w-full h-full')}</div>
              <div className="w-full h-1/2 min-h-0">{renderSlot(2, 'w-full h-full')}</div>
            </div>
          </div>
        )}

        {templateId === 'basic-left-primary-right-secondary' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-[58%] h-full min-h-0">
              {renderSlot(0, 'w-full h-full')}
            </div>
            <div className="w-[42%] h-full flex items-center justify-center p-4 min-h-0">
              <div className="w-[90%] aspect-[3/4] shadow-xs">
                {renderSlot(1, 'w-full h-full')}
              </div>
            </div>
          </div>
        )}

        {templateId === 'basic-left-primary-right-mosaic' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            <div className="w-1/2 h-full min-h-0">
              {renderSlot(0, 'w-full h-full')}
            </div>
            <div className="w-1/2 h-full grid grid-cols-2 grid-rows-2 min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
              <div className="w-full h-full min-h-0">{renderSlot(1, 'w-full h-full')}</div>
              <div className="w-full h-full min-h-0">{renderSlot(2, 'w-full h-full')}</div>
              <div className="w-full h-full min-h-0">{renderSlot(3, 'w-full h-full')}</div>
              <div className="w-full h-full min-h-0">{renderSlot(4, 'w-full h-full')}</div>
            </div>
          </div>
        )}

        {/* OVERLAY TEMPLATE */}
        {templateDef?.isOverlay && (
          <div className="relative w-full h-full overflow-hidden">
            {/* Background Image Layer */}
            {(posterSettings.customBackgroundUri || templateDef?.backgroundUri) && (
              <img 
                src={posterSettings.customBackgroundUri || templateDef?.backgroundUri || ''} 
                alt="Background"
                crossOrigin={(posterSettings.customBackgroundUri || templateDef?.backgroundUri)?.startsWith('http') ? "anonymous" : undefined}
                className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
              />
            )}
            
            {/* The Slots */}
            {templateDef?.slotsCoordinates?.map((defaultCoord, i) => {
              // Apply overrides if this is the first slot (we only support adjusting slot 0 for now)
              const isFirst = i === 0;
              const x = isFirst && posterSettings.customSlotX !== undefined ? posterSettings.customSlotX : defaultCoord.x;
              const y = isFirst && posterSettings.customSlotY !== undefined ? posterSettings.customSlotY : defaultCoord.y;
              const width = isFirst && posterSettings.customSlotW !== undefined ? posterSettings.customSlotW : defaultCoord.width;
              const height = isFirst && posterSettings.customSlotH !== undefined ? posterSettings.customSlotH : defaultCoord.height;
              const rotation = isFirst && posterSettings.customSlotRotation !== undefined ? posterSettings.customSlotRotation : defaultCoord.rotation;
              const clipPath = defaultCoord.clipPath;

              return (
                <div 
                  key={i}
                  className="absolute z-10"
                  style={{ 
                    left: `${x}%`, 
                    top: `${y}%`, 
                    width: `${width}%`, 
                    height: `${height}%`,
                    transform: `rotate(${rotation}deg)`,
                    clipPath: clipPath
                  }}
                >
                  {renderSlot(i, 'w-full h-full')}
                </div>
              );
            })}
            
            {/* The Overlay */}
            {(posterSettings.customOverlayUri || templateDef?.overlayUri) && (
              <img 
                src={posterSettings.customOverlayUri || templateDef?.overlayUri || ''}
                alt="Overlay"
                crossOrigin={(posterSettings.customOverlayUri || templateDef?.overlayUri)?.startsWith('http') ? "anonymous" : undefined}
                className="absolute inset-0 w-full h-full object-cover z-20 pointer-events-none select-none"
                onError={(e) => {
                  const target = e.currentTarget;
                  const match = target.src.match(/(\d\d-\d\d\.png)/);
                  if (match) {
                    if (!target.src.endsWith('/images/layout/lay01/' + match[1])) {
                      target.src = '/images/layout/lay01/' + match[1];
                    } else if (!target.src.includes('photobookvietnam.net')) {
                      target.src = 'https://www.photobookvietnam.net/images/layout/lay01/' + match[1];
                    }
                  }
                }}
              />
            )}
          </div>
        )}

        {/* Layout Template 15: Album Spread 50x35cm - Memories (3 slots: 1 large left, 2 stacked middle, poem right) */}
        {templateId === 'album-50x35-memories' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            {/* Left Page (50% width): Big full-height portrait - Canh chuẩn 50% trang trái */}
            <div className="w-1/2 h-full min-h-0 flex-1">
              {renderSlot(0, 'w-full h-full')}
            </div>

            {/* Right Page (50% width): Split into 2 stacked photos (left) and Memories poem (right) - Canh chuẩn 50% trang phải */}
            <div className="w-1/2 h-full flex min-h-0 flex-1" style={{ gap: `${posterSettings.gap}px` }}>
              {/* Left Column of Right Page (50% của trang phải): 2 stacked photos */}
              <div className="w-1/2 h-full flex flex-col justify-between min-h-0 flex-1" style={{ gap: `${posterSettings.gap}px` }}>
                <div className="w-full h-[50%] min-h-0 flex-1">
                  {renderSlot(1, 'w-full h-full')}
                </div>
                <div className="w-full h-[50%] min-h-0 flex-1">
                  {renderSlot(2, 'w-full h-full')}
                </div>
              </div>

              {/* Right Column of Right Page (50% của trang phải): White background with Memories calligraphy & poem - Canh giữa chuẩn trang in */}
              <div className="w-1/2 h-full flex flex-col items-center justify-center px-4 py-4 select-none overflow-hidden text-center flex-1">
                <div className="flex flex-col items-center text-center w-full max-w-[92%]">
                  <span
                    style={{
                      fontFamily: 'Alex Brush, Great Vibes, Pinyon Script, cursive',
                      color: textConfig.namesColor || '#9c6d48',
                      fontSize: '46px',
                      lineHeight: 1.1,
                    }}
                    className="font-normal tracking-wide mb-3"
                  >
                    Memories
                  </span>

                  <div
                    style={{
                      fontFamily: textConfig.subtextFont || 'Cormorant Garamond, Georgia, serif',
                      color: textConfig.subtextColor || '#44403c',
                      fontSize: '9px',
                      lineHeight: '1.5',
                      letterSpacing: '0.2px',
                    }}
                    className="text-stone-700 text-center space-y-2.5 font-normal select-none"
                  >
                    <p>
                      There are places I'll remember<br />
                      All my life though some have changed<br />
                      Some forever, not for better<br />
                      Some have gone and some remain<br />
                      All these places have their moments<br />
                      With lovers and friends I still can recall<br />
                      Some are dead and some are living<br />
                      In my life I've loved them all
                    </p>

                    <p>
                      But of all these friends and lovers<br />
                      There is no one compares with you<br />
                      And these memories lose their meaning<br />
                      When I think of love as something new
                    </p>

                    <p>
                      Though I know I'll never lose affection<br />
                      For people and things that went before<br />
                      I know I'll often stop and think about them<br />
                      In my life I love you more
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Layout Template 16: Album Spread 50x35cm - Love is in the air (2 slots: thin frame, 1 landscape left + quotes, 1 tall right) */}
        {templateId === 'album-50x35-in-the-air' && (
          <div className="relative w-full h-full flex overflow-hidden p-2.5">
            {/* Outer Inset Thin Frame Line */}
            <div className="absolute inset-2 sm:inset-3 border border-[#8c7362]/75 pointer-events-none z-10" />

            {/* Left Page (50% width): Top Script Badge, Middle Landscape Photo, Bottom Quote - Canh chuẩn 50% */}
            <div className="w-1/2 h-full flex flex-col items-center justify-between py-3 px-3 z-20 flex-1">
              {/* Top Text Group */}
              <div className="flex flex-col items-center justify-center text-center mt-1 select-none">
                <span
                  style={{
                    fontFamily: 'Alex Brush, Great Vibes, Pinyon Script, cursive',
                    color: textConfig.namesColor || '#6b5645',
                    fontSize: '24px',
                    lineHeight: 1,
                  }}
                  className="font-normal italic"
                >
                  Love is
                </span>
                <span
                  style={{
                    fontFamily: textConfig.namesFont || 'Bodoni Moda, Cinzel, serif',
                    letterSpacing: '3px',
                  }}
                  className="text-[11px] font-bold uppercase bg-[#eee5d8] text-stone-800 px-3 py-0.5 mt-0.5 rounded-2xs"
                >
                  IN THE AIR
                </span>
              </div>

              {/* Middle Landscape Photo Slot */}
              <div className="w-[92%] h-[54%] min-h-0 my-auto shadow-2xs">
                {renderSlot(0, 'w-full h-full')}
              </div>

              {/* Bottom Quote */}
              <div
                style={{
                  fontFamily: 'Bodoni Moda, Cormorant Garamond, Montserrat, serif',
                  fontSize: '7.5px',
                  letterSpacing: '1.4px',
                  color: '#57483e',
                }}
                className="text-center uppercase leading-relaxed max-w-[88%] font-medium select-none mb-1"
              >
                “YOU DON'T LOVE SOMEONE FOR THEIR LOOKS, OR THEIR CLOTHES, OR FOR THEIR FANCY CAR, BUT BECAUSE THEY SING A SONG ONLY YOU CAN HEAR.”
              </div>
            </div>

            {/* Right Page (50% width): Tall Centered Vertical Portrait Photo - Canh chuẩn 50% */}
            <div className="w-1/2 h-full flex items-center justify-center p-3 z-20 flex-1">
              <div className="w-[82%] h-[90%] min-h-0 shadow-2xs">
                {renderSlot(1, 'w-full h-full')}
              </div>
            </div>
          </div>
        )}

        {/* Layout Template 17: Album Spread 50x35cm - Celebrate (4 slots: 1 large left, 1 medium right-left, 2 stacked right-right, bottom vows) */}
        {templateId === 'album-50x35-celebrate' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            {/* Left Page (50% width): Big full-height portrait - Canh chuẩn 50% trang trái */}
            <div className="w-1/2 h-full min-h-0 flex-1">
              {renderSlot(0, 'w-full h-full')}
            </div>

            {/* Right Page (50% width): Top Photo Collage (3 slots) + Bottom Vows Typography - Canh chuẩn 50% trang phải */}
            <div className="w-1/2 h-full flex flex-col justify-between min-h-0 flex-1" style={{ gap: `${posterSettings.gap}px` }}>
              {/* Top Photo Collage (~72% height) */}
              <div className="w-full h-[72%] flex min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
                {/* Column 1: Middle Vertical Photo (~54% width) */}
                <div className="w-[54%] h-full min-h-0">
                  {renderSlot(1, 'w-full h-full')}
                </div>

                {/* Column 2: 2 Stacked Photos (~46% width) */}
                <div className="w-[46%] h-full flex flex-col justify-between min-h-0" style={{ gap: `${posterSettings.gap}px` }}>
                  <div className="w-full h-[50%] min-h-0 flex-1">
                    {renderSlot(2, 'w-full h-full')}
                  </div>
                  <div className="w-full h-[50%] min-h-0 flex-1">
                    {renderSlot(3, 'w-full h-full')}
                  </div>
                </div>
              </div>

              {/* Bottom Vows Typography (~28% height) - Canh giữa chuẩn trang in */}
              <div className="w-full h-[28%] flex flex-col items-center justify-center px-6 py-2 text-center select-none overflow-hidden">
                <p
                  style={{
                    fontFamily: 'Cormorant Garamond, Bodoni Moda, serif',
                    fontSize: '9.5px',
                    lineHeight: '1.55',
                    color: '#44403c',
                    letterSpacing: '0.3px',
                  }}
                  className="max-w-[94%] italic font-light text-center"
                >
                  <span>Love is </span>
                  <span style={{ fontFamily: 'Pinyon Script, Great Vibes, cursive', fontSize: '15px' }} className="font-normal not-italic">the</span>
                  <span> patience to listen, the kindness to understand, and the strength to stay through the hardest times. It's knowing that, together, we are </span>
                  <span style={{ fontFamily: 'Pinyon Script, Great Vibes, cursive', fontSize: '15px' }} className="font-normal not-italic">unstoppable.</span>
                  <br />
                  <span>Marriage is a partnership of equals, built on respect, love, and shared dreams. We lift each other higher, </span>
                  <span style={{ fontFamily: 'Pinyon Script, Great Vibes, cursive', fontSize: '15px' }} className="font-normal not-italic">celebrate</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Layout Template 14: Album Spread 50x35cm - Beyond Time (2 slots) */}
        {templateId === 'album-50x35-beyond-time' && (
          <div className="w-full h-full relative overflow-hidden bg-white">
            {/* Background Full Bleed */}
            <div className="absolute inset-0">
              {renderSlot(0, 'w-full h-full')}
            </div>

            {/* Top Right Text */}
            <div className="absolute top-[8%] right-[8%] z-10 flex flex-col items-end pointer-events-none select-none">
              <h2
                style={{
                  fontFamily: 'Bodoni Moda, Cormorant Garamond, serif',
                  fontSize: '36px',
                  lineHeight: '1',
                  letterSpacing: '3px',
                  color: '#1c1917'
                }}
                className="uppercase"
              >
                TOGETHER
              </h2>
              <h3
                style={{
                  fontFamily: 'Allura, Alex Brush, Dancing Script, cursive',
                  fontSize: '28px',
                  lineHeight: '0.8',
                  color: '#be123c',
                  transform: 'rotate(-2deg)'
                }}
                className="font-normal -mt-3 mr-4"
              >
                Beyond Time
              </h3>
            </div>

            {/* Right Inset Photo */}
            <div className="absolute right-[8%] top-[25%] bottom-[12%] w-[32%] z-10 bg-white p-2.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)]">
              <div className="w-full h-full overflow-hidden min-h-0">
                {renderSlot(1, 'w-full h-full')}
              </div>
            </div>
          </div>
        )}

        {/* Layout Template 15: Album Spread 50x35cm - Romance (3 slots) */}
        {templateId === 'album-50x35-romance' && (
          <div className="w-full h-full flex overflow-hidden bg-white" style={{ gap: `${posterSettings.gap}px` }}>
            {/* Left Page (50% width) */}
            <div className="w-1/2 h-full flex flex-col bg-white">
              <div className="w-full h-[45%] min-h-0">
                {renderSlot(0, 'w-full h-full')}
              </div>
              <div className="w-full h-[10%] flex flex-col items-center justify-center bg-white select-none relative z-10 pointer-events-none">
                <h3
                  style={{
                    fontFamily: 'Allura, Alex Brush, Dancing Script, cursive',
                    fontSize: '24px',
                    color: '#44403c',
                    whiteSpace: 'nowrap'
                  }}
                  className="font-normal tracking-wide"
                >
                  Two souls, one journey
                </h3>
              </div>
              <div className="w-full h-[45%] min-h-0">
                {renderSlot(1, 'w-full h-full')}
              </div>
            </div>

            {/* Right Page (50% width) */}
            <div className="w-1/2 h-full relative min-h-0">
              <div className="absolute inset-0">
                {renderSlot(2, 'w-full h-full')}
              </div>
              <div className="absolute top-[6%] right-[6%] z-10 flex flex-col items-end pointer-events-none select-none text-white drop-shadow-md">
                <h2
                  style={{
                    fontFamily: 'Allura, Alex Brush, Dancing Script, cursive',
                    fontSize: '56px',
                    lineHeight: '1',
                    color: 'rgba(255, 255, 255, 0.95)'
                  }}
                  className="font-normal"
                >
                  Romance
                </h2>
                <p
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '6px',
                    letterSpacing: '0.5px',
                    marginTop: '-8px'
                  }}
                  className="text-white/90 text-right max-w-[80%]"
                >
                  "Love is an irresistible desire to be irresistibly desired."
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Layout Template 16: Album Spread 50x35cm - Perfection (2 slots) */}
        {templateId === 'album-50x35-perfection' && (
          <div className="w-full h-full flex overflow-hidden bg-white" style={{ gap: `${posterSettings.gap}px` }}>
            {/* Left Page */}
            <div className="w-1/2 h-full flex flex-col pt-[8%] pb-[8%] pl-[8%] pr-[4%]">
              <div className="w-full h-[55%] min-h-0 shadow-sm">
                {renderSlot(0, 'w-full h-full')}
              </div>
              <div className="w-full h-[45%] flex flex-col justify-end pb-8 pointer-events-none select-none">
                <p
                  style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '8px', letterSpacing: '1px' }}
                  className="uppercase text-stone-700 mb-1"
                >
                  LOVE IS FINDING
                </p>
                <h2
                  style={{
                    fontFamily: 'Bodoni Moda, Cormorant Garamond, serif',
                    fontSize: '36px',
                    lineHeight: '0.8',
                    color: '#7dd3fc'
                  }}
                  className="font-normal lowercase"
                >
                  perfection
                </h2>
                <h2
                  style={{
                    fontFamily: 'Bodoni Moda, Cormorant Garamond, serif',
                    fontSize: '32px',
                    lineHeight: '1.2',
                    color: '#7dd3fc'
                  }}
                  className="font-normal lowercase ml-12"
                >
                  in each
                </h2>
                <p
                  style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '8px', letterSpacing: '1px' }}
                  className="uppercase text-stone-700 mt-2 ml-12"
                >
                  OTHER'S IMPERFECTION
                </p>
              </div>
            </div>

            {/* Right Page */}
            <div className="w-1/2 h-full flex flex-col pt-[12%] pb-[8%] pr-[8%] pl-[4%]">
              <div className="w-full h-[35%] flex flex-col items-end pointer-events-none select-none">
                <h3
                  style={{
                    fontFamily: 'Bodoni Moda, Cormorant Garamond, serif',
                    fontSize: '24px',
                    letterSpacing: '1.5px',
                    color: '#64748b'
                  }}
                  className="uppercase font-normal"
                >
                  HEART STRINGS
                </h3>
                <h4
                  style={{
                    fontFamily: 'Allura, Alex Brush, Dancing Script, cursive',
                    fontSize: '22px',
                    lineHeight: '0.6',
                    color: '#57534e'
                  }}
                  className="font-normal transform -rotate-2 -mr-4"
                >
                  Love Embrace
                </h4>
              </div>
              <div className="w-full h-[65%] min-h-0 shadow-sm mt-auto">
                {renderSlot(1, 'w-full h-full')}
              </div>
            </div>
          </div>
        )}

        {/* Layout Template 17: Album Spread 50x35cm - Loyalty (2 slots) */}
        {templateId === 'album-50x35-loyalty' && (
          <div className="w-full h-full flex overflow-hidden bg-white" style={{ gap: `${posterSettings.gap}px` }}>
            {/* Left Page */}
            <div className="w-1/2 h-full flex flex-col justify-between pt-[8%] pb-[6%] px-[10%] relative bg-white min-h-0">
              <div className="w-full aspect-[2/3] rounded-t-[1000px] min-h-0 overflow-hidden z-10 border border-stone-100 bg-stone-100">
                {renderSlot(0, 'w-full h-full')}
              </div>
              
              <div className="absolute bottom-[20%] left-[5%] right-[-15%] z-20 pointer-events-none select-none text-center mix-blend-multiply">
                <h2
                  style={{
                    fontFamily: 'Allura, Alex Brush, Dancing Script, cursive',
                    fontSize: '64px',
                    lineHeight: '1',
                    color: '#bae6fd',
                    textShadow: '3px 3px 0 #fff, -3px -3px 0 #fff, 3px -3px 0 #fff, -3px 3px 0 #fff'
                  }}
                  className="font-normal transform -rotate-[6deg]"
                >
                  Loyalty
                </h2>
              </div>

              <div className="mt-auto pointer-events-none select-none text-center z-10">
                <p
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '6.5px',
                    color: '#78716c',
                    lineHeight: '1.4'
                  }}
                  className="font-normal"
                >
                  It only takes a second to say that "<span className="italic text-[#7dd3fc]">I Love You</span>", but it will take a lifetime<br/>
                  to show you how much.
                </p>
              </div>
            </div>

            {/* Right Page */}
            <div className="w-1/2 h-full relative min-h-0">
              <div className="absolute inset-0">
                {renderSlot(1, 'w-full h-full')}
              </div>
              
              <div className="absolute bottom-[8%] left-[10%] z-10 pointer-events-none select-none drop-shadow-md">
                <div className="relative">
                  <h3
                    style={{
                      fontFamily: 'Allura, Alex Brush, Dancing Script, cursive',
                      fontSize: '48px',
                      lineHeight: '0.8',
                      color: '#fff'
                    }}
                    className="font-normal"
                  >
                    Charming
                  </h3>
                  <h3
                    style={{
                      fontFamily: 'Allura, Alex Brush, Dancing Script, cursive',
                      fontSize: '54px',
                      lineHeight: '1',
                      color: '#fff'
                    }}
                    className="font-normal ml-[30%] -mt-3"
                  >
                    Elegant
                  </h3>
                  <div className="absolute top-[35%] left-[105%] w-[120px]">
                    <p
                      style={{
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '6px',
                        color: '#fff',
                        lineHeight: '1.4'
                      }}
                      className="font-normal tracking-wide"
                    >
                      Hand in hand, heart to heart,<br/>
                      always together
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Layout Template 10: Album Spread 50x35cm - Eternal Love (2 slots) */}
        {templateId === 'album-50x35-eternal' && (
          <div className="w-full h-full flex overflow-hidden bg-white" style={{ gap: `${posterSettings.gap}px` }}>
            {/* Left Page & part of right (70% width): Full height photo */}
            <div className="w-[70%] h-full min-h-0">
              {renderSlot(0, 'w-full h-full')}
            </div>

            {/* Right Page Content (30% width) */}
            <div className="w-[30%] h-full flex flex-col pt-[5%] pr-[5%] pb-[4%] select-none overflow-hidden min-h-0 bg-white">
              {/* Top Typography */}
              <div className="text-right space-y-1 mb-8">
                <h2
                  style={{
                    fontFamily: 'Bodoni Moda, Cormorant Garamond, serif',
                    fontSize: '28px',
                    lineHeight: '1.1',
                    letterSpacing: '2px',
                    color: '#64748b' // Slate 500
                  }}
                  className="uppercase font-medium"
                >
                  ETERNAL<br/>LOVE
                </h2>
                <p
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '5px',
                    lineHeight: '1.6',
                    letterSpacing: '1px',
                    color: '#94a3b8'
                  }}
                  className="uppercase max-w-[85%] ml-auto mt-3"
                >
                  IN OUR HEARTS RESONATES LIKE A SYMPHONY, HARMONIOUS, SINCERE, AND EFFORT FOR THE FUTURE TO COME.
                </p>
              </div>

              {/* Bottom Inset Photo */}
              <div className="w-full mt-auto aspect-[3/4] shadow-sm min-h-0">
                {renderSlot(1, 'w-full h-full')}
              </div>
            </div>
          </div>
        )}

        {/* Layout Template 11: Album Spread 50x35cm - Beloved (3 slots) */}
        {templateId === 'album-50x35-beloved' && (
          <div className="w-full h-full flex overflow-hidden bg-white" style={{ gap: `${posterSettings.gap}px` }}>
            {/* Left Page Content (45% width) */}
            <div className="w-[45%] h-full flex flex-col pt-[8%] pl-[6%] pb-[6%] pr-[4%] select-none overflow-hidden min-h-0 bg-white">
              {/* Top Typography */}
              <div className="mb-auto">
                <h2
                  style={{
                    fontFamily: 'Allura, Alex Brush, Dancing Script, cursive',
                    fontSize: '48px',
                    lineHeight: '1',
                    color: '#4d5c41' // Olive green
                  }}
                  className="font-normal transform -rotate-2 origin-left"
                >
                  Beloved
                </h2>
                <p
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '6.5px',
                    letterSpacing: '1px',
                    color: '#78716c'
                  }}
                  className="italic mt-3"
                >
                  My passion for you grew stronger every day
                </p>
              </div>

              {/* Bottom 2 Photos */}
              <div className="w-full h-[65%] flex gap-[8px] min-h-0">
                <div className="w-1/2 h-full shadow-sm min-h-0">
                  {renderSlot(0, 'w-full h-full')}
                </div>
                <div className="w-1/2 h-full shadow-sm min-h-0">
                  {renderSlot(1, 'w-full h-full')}
                </div>
              </div>
            </div>

            {/* Right Page (55% width): Full height photo */}
            <div className="w-[55%] h-full min-h-0">
              {renderSlot(2, 'w-full h-full')}
            </div>
          </div>
        )}

        {/* Layout Template 12: Album Spread 50x35cm - Passionate (2 slots) */}
        {templateId === 'album-50x35-passionate' && (
          <div className="w-full h-full flex overflow-hidden bg-white" style={{ gap: `${posterSettings.gap}px` }}>
            {/* Left Page (60% width) */}
            <div className="w-[60%] h-full min-h-0">
              {renderSlot(0, 'w-full h-full')}
            </div>

            {/* Right Page Content (40% width) */}
            <div className="w-[40%] h-full flex flex-col items-center justify-center relative select-none overflow-hidden min-h-0 bg-white p-8">
              {/* Center Inset Photo */}
              <div className="w-[85%] h-[70%] shadow-md min-h-0 z-10">
                {renderSlot(1, 'w-full h-full')}
              </div>
              
              {/* Typography Bottom */}
              <div className="mt-6 z-10 w-full text-right pr-[15%]">
                <h2
                  style={{
                    fontFamily: 'Allura, Alex Brush, Dancing Script, cursive',
                    fontSize: '42px',
                    lineHeight: '1',
                    color: '#4d5c41'
                  }}
                  className="font-normal"
                >
                  Passionate
                </h2>
              </div>

              {/* Vertical Text Right Edge */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                <p
                  style={{
                    fontFamily: 'Allura, Alex Brush, Dancing Script, cursive',
                    fontSize: '12px',
                    color: '#78716c'
                  }}
                  className="tracking-wider whitespace-nowrap"
                >
                  We are in a passionate love affair.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Layout Template 13: Album Spread 50x35cm - Heart Strings (2 slots) */}
        {templateId === 'album-50x35-heartstrings' && (
          <div className="w-full h-full relative overflow-hidden bg-white">
            {/* Background Full Bleed */}
            <div className="absolute inset-0">
              {renderSlot(0, 'w-full h-full')}
              {/* Light overlay for readability */}
              <div className="absolute inset-0 bg-white/10 pointer-events-none" />
            </div>

            {/* Top Left Typography */}
            <div className="absolute top-[8%] left-[6%] z-10 select-none drop-shadow-md">
              <h2
                style={{
                  fontFamily: 'Bodoni Moda, Cormorant Garamond, serif',
                  fontSize: '22px',
                  letterSpacing: '2px',
                  color: 'white'
                }}
                className="uppercase font-medium text-shadow"
              >
                HEART STRINGS
              </h2>
              <h3
                style={{
                  fontFamily: 'Allura, Alex Brush, Dancing Script, cursive',
                  fontSize: '26px',
                  lineHeight: '0.6',
                  color: 'white'
                }}
                className="font-normal ml-2 transform -rotate-3 text-shadow"
              >
                Love Embrace
              </h3>
            </div>

            {/* Right Inset Photo */}
            <div className="absolute right-[8%] top-1/2 -translate-y-1/2 w-[28%] aspect-[2/3] z-10 shadow-2xl bg-white p-1 pb-1.5 border-[3px] border-white">
              <div className="w-full h-full overflow-hidden min-h-0">
                {renderSlot(1, 'w-full h-full')}
              </div>
            </div>
          </div>
        )}


        {/* Layout Template 4: Album Spread 50x35cm - Shared Dreams (3 slots: 1 large full bleed left, 2 vertical right, calligraphy & quote) */}
        {templateId === 'album-50x35-shared-dreams' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            {/* Left Page (~49.8% width): Big full-height portrait */}
            <div className="w-[49.8%] h-full min-h-0">
              {renderSlot(0, 'w-full h-full')}
            </div>

            {/* Right Page (~50.2% width): Calligraphy Top + 2 Vertical Photos + Romantic Quote Bottom */}
            <div className="w-[50.2%] h-full flex flex-col justify-between p-3 select-none overflow-hidden min-h-0">
              {/* Top Calligraphy Header */}
              <div className="flex flex-col items-end pr-2 pt-1">
                <div className="flex flex-col items-end">
                  <span
                    style={{
                      fontFamily: 'Allura, Alex Brush, Pinyon Script, Great Vibes, cursive',
                      color: textConfig.namesColor || '#b87b64',
                      fontSize: '44px',
                      lineHeight: 1,
                    }}
                    className="font-normal tracking-wide transform -rotate-1"
                  >
                    Shared Dreams
                  </span>
                  <span
                    style={{
                      fontFamily: textConfig.namesFont || 'Playfair Display, Cormorant Garamond, serif',
                    }}
                    className="text-[12px] italic text-stone-800 font-normal pr-1 mt-0.5"
                  >
                    Beautiful lady
                  </span>
                </div>
              </div>

              {/* Middle Section: 2 Vertical Photos Side by Side */}
              <div className="w-full flex items-center justify-center gap-3 px-2 my-auto min-h-0 h-[50%]">
                <div className="w-[47%] h-full min-h-0 shadow-2xs">
                  {renderSlot(1, 'w-full h-full')}
                </div>
                <div className="w-[47%] h-full min-h-0 shadow-2xs">
                  {renderSlot(2, 'w-full h-full')}
                </div>
              </div>

              {/* Bottom Quote with styled accents */}
              <div className="w-full px-4 pb-2 pt-1 text-center">
                <p
                  style={{
                    fontFamily: textConfig.subtextFont || 'Cormorant Garamond, Georgia, serif',
                    fontSize: '9.5px',
                    lineHeight: '1.6',
                    letterSpacing: '0.2px',
                  }}
                  className="text-stone-800 italic font-normal max-w-[94%] mx-auto"
                >
                  <span className="font-bold underline decoration-stone-400 underline-offset-2 not-italic">Happiness</span>{' '}
                  is waking up beside you and knowing that no matter what challenges arise, we'll tackle them as a team. It's the{' '}
                  <span className="font-bold italic">shared dreams</span> and late-night conversations that make our{' '}
                  <span className="font-bold underline decoration-stone-400 underline-offset-2 not-italic">love story</span>{' '}
                  unique. Together, we turn{' '}
                  <span className="font-bold underline decoration-stone-400 underline-offset-2 not-italic">the ordinary</span>{' '}
                  into something extraordinary.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Layout Template 5: Album Spread 50x35cm - Little Home (4 slots: 4 vertical portrait photos aligned horizontally + Little Home badge & quote) */}
        {templateId === 'album-50x35-little-home' && (
          <div className="w-full h-full flex flex-col justify-between p-4 select-none overflow-hidden">
            {/* Top Empty Breathing Room */}
            <div className="h-[12%]" />

            {/* Middle Row: 4 Vertical Photos */}
            <div className="w-full h-[58%] flex items-center justify-between gap-3 px-2 min-h-0">
              {/* Left Spread: 2 Photos */}
              <div className="w-[49%] h-full flex gap-2.5 min-h-0">
                <div className="w-1/2 h-full min-h-0 shadow-2xs">
                  {renderSlot(0, 'w-full h-full')}
                </div>
                <div className="w-1/2 h-full min-h-0 shadow-2xs">
                  {renderSlot(1, 'w-full h-full')}
                </div>
              </div>

              {/* Right Spread: 2 Photos */}
              <div className="w-[49%] h-full flex gap-2.5 min-h-0">
                <div className="w-1/2 h-full min-h-0 shadow-2xs">
                  {renderSlot(2, 'w-full h-full')}
                </div>
                <div className="w-1/2 h-full min-h-0 shadow-2xs">
                  {renderSlot(3, 'w-full h-full')}
                </div>
              </div>
            </div>

            {/* Bottom Row: Left Badge 'YOU ARE MY little home', Center Slash, Right Quote */}
            <div className="w-full h-[28%] flex items-end justify-between px-6 pb-2 pt-2">
              {/* Left Typography: Badge & Calligraphy */}
              <div className="flex flex-col items-start pl-2">
                <span
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    letterSpacing: '2.5px',
                    borderColor: '#a65935',
                    color: '#a65935',
                  }}
                  className="text-[7.5px] uppercase font-bold px-2 py-0.5 border rounded-[2px]"
                >
                  YOU ARE MY
                </span>
                <span
                  style={{
                    fontFamily: 'Allura, Alex Brush, Great Vibes, Pinyon Script, cursive',
                    color: textConfig.namesColor || '#944c2c',
                    fontSize: '32px',
                    lineHeight: 1,
                  }}
                  className="font-normal transform -rotate-1 mt-0.5"
                >
                  little home
                </span>
              </div>

              {/* Center Slash Accent */}
              <div className="w-16 h-12 flex items-center justify-center opacity-60">
                <div
                  className="w-12 h-[1px] bg-[#b8653b] transform -rotate-45"
                  style={{ backgroundColor: '#b8653b' }}
                />
              </div>

              {/* Right Quote */}
              <div className="max-w-[280px] text-right pr-2">
                <p
                  style={{
                    fontFamily: textConfig.subtextFont || 'Cormorant Garamond, Bodoni Moda, serif',
                    fontSize: '8.5px',
                    lineHeight: '1.55',
                    letterSpacing: '0.8px',
                    color: '#8a5035',
                  }}
                  className="font-normal"
                >
                  "But the you who you are tonight is the same you I was in love with yesterday, the same you I'll be in love with tomorrow."
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Layout Template 4 (Symphony): Album Spread 50x35cm - Symphony (3 slots: 1 centered portrait right with left vertical labels, 2 staggered photos left with Symphony script) */}
        {templateId === 'album-50x35-symphony' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            {/* Left Page (50% width): Typography Top + 2 Asymmetrical Photos */}
            <div className="relative w-1/2 h-full flex flex-col justify-between p-3 select-none overflow-hidden min-h-0 flex-1">
              {/* Top Typography: Sweeping "Symphony" Script + Paragraph */}
              <div className="relative w-full pt-1 px-4 z-10">
                <div className="relative flex items-center justify-between">
                  <span
                    style={{
                      fontFamily: 'Allura, Alex Brush, Pinyon Script, Great Vibes, cursive',
                      color: textConfig.namesColor || '#1c1917',
                      fontSize: '56px',
                      lineHeight: 0.9,
                    }}
                    className="font-normal tracking-wide transform -rotate-1 select-none"
                  >
                    Symphony
                  </span>

                  <div className="max-w-[210px] pl-2 text-left">
                    <p
                      style={{
                        fontFamily: 'Montserrat, sans-serif',
                        fontSize: '6.5px',
                        lineHeight: '1.45',
                        letterSpacing: '0.8px',
                        color: '#44403c',
                      }}
                      className="uppercase font-medium"
                    >
                      IN THE ARITHMETIC OF LOVE, ONE PLUS ONE EQUALS EVERYTHING, AND TWO MINUS ONE EQUALS NOTHING. MARRIAGE IS A JOURNEY, NOT A DESTINATION, AND EVERY DAY IS A NEW
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Photos: 2 Photos (1 large on left, 1 smaller aligned at bottom on right) */}
              <div className="w-full flex items-end gap-3 px-4 pb-2 min-h-0 h-[66%]">
                <div className="w-[58%] h-full min-h-0 shadow-2xs">
                  {renderSlot(0, 'w-full h-full')}
                </div>
                <div className="w-[42%] h-[74%] min-h-0 shadow-2xs">
                  {renderSlot(1, 'w-full h-full')}
                </div>
              </div>
            </div>

            {/* Right Page (50% width): Large Portrait Photo with Left Vertical Labels close to the photo edge */}
            <div className="relative w-1/2 h-full flex items-center justify-end pr-3 pl-7 py-1.5 select-none min-h-0 flex-1">
              <div className="relative w-full h-full flex items-center justify-end">
                {/* Large Portrait Photo */}
                <div className="relative w-full h-[97%] min-h-0 shadow-2xs">
                  {/* Vertical Labels along Left Edge of Photo */}
                  <div className="absolute -left-3.5 top-5 flex flex-col items-center pointer-events-none z-20">
                    <span
                      style={{
                        writingMode: 'vertical-rl',
                        fontFamily: 'Montserrat, sans-serif',
                        letterSpacing: '3px',
                      }}
                      className="text-[6.5px] uppercase font-semibold text-stone-800 rotate-180 select-none whitespace-nowrap"
                    >
                      WEDDING PHOTOGRAPHY
                    </span>
                  </div>

                  <div className="absolute -left-3.5 bottom-5 flex flex-col items-center pointer-events-none z-20">
                    <span
                      style={{
                        writingMode: 'vertical-rl',
                        fontFamily: 'Montserrat, sans-serif',
                        letterSpacing: '3px',
                      }}
                      className="text-[7px] uppercase font-bold text-stone-900 rotate-180 select-none whitespace-nowrap"
                    >
                      FASHION MOODBOARD
                    </span>
                  </div>

                  {renderSlot(2, 'w-full h-full')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Layout Template 7: Album Spread 50x35cm - Fairytale (3 slots: Left background full bleed with 50% dark overlay, Left lower inset photo with 'fairytale' typography & quote, Right full bleed) */}
        {templateId === 'album-50x35-fairytale' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            {/* Left Page (50% width): Full height background (50% dark overlay) + Inset Photo + Fairytale typography */}
            <div className="relative w-1/2 h-full min-h-0 overflow-hidden">
              {/* Background Photo with 50% opacity black overlay */}
              <div className="relative w-full h-full">
                {renderSlot(0, 'w-full h-full')}
                {/* 50% Opacity Black Overlay to make background darker than inset */}
                <div className="absolute inset-0 bg-black/50 pointer-events-none z-10 transition-colors" />
              </div>

              {/* Floating Inset Photo in bottom-left */}
              <div className="absolute left-6 bottom-8 w-[48%] h-[64%] shadow-2xl border-[2.5px] border-white rounded-[1px] z-20 min-h-0 overflow-hidden">
                <div className="relative w-full h-full">
                  {renderSlot(1, 'w-full h-full')}

                  {/* Overlaid fairytale typography at the bottom of the inset photo */}
                  <div className="absolute bottom-2 left-0 right-0 px-2 text-center pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-30 select-none">
                    <h2
                      style={{
                        fontFamily: 'Playfair Display, Cormorant Garamond, Bodoni Moda, serif',
                        fontSize: '34px',
                        letterSpacing: '-0.5px',
                        lineHeight: 0.95,
                      }}
                      className="text-white font-normal lowercase tracking-tight"
                    >
                      fairytale
                    </h2>
                    <p
                      style={{
                        fontFamily: 'Montserrat, sans-serif',
                        letterSpacing: '3px',
                        fontSize: '7px',
                      }}
                      className="text-white/95 uppercase font-medium mt-1"
                    >
                      ABOUT TWO OF US
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Quote below inset on dark background */}
              <div className="absolute left-4 right-4 bottom-2 pointer-events-none z-20 text-center select-none">
                <p
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '6.5px',
                    letterSpacing: '0.8px',
                    lineHeight: '1.4',
                  }}
                  className="text-white font-medium uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] max-w-[92%] mx-auto"
                >
                  THE CHANCES OF MEETING YOU ON THIS PLANET ARE LIKE FINDING A NEEDLE IN HAYSTACK, A MIRACLE HAPPENED WHEN WE FOUND EACH OTHER.
                </p>
              </div>
            </div>

            {/* Right Page (50% width): Full height portrait */}
            <div className="w-1/2 h-full min-h-0">
              {renderSlot(2, 'w-full h-full')}
            </div>
          </div>
        )}

        {/* Layout Template 8: Album Spread 50x35cm - Appreciate (4 slots: Left close-up background photo, 2 vertical inset photos, Romantic cursive handwriting letter overlay, Right full bleed) */}
        {templateId === 'album-50x35-appreciate' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            {/* Left Page (50% width): Background Close-up + Handwriting Overlay + 2 Inset Photos */}
            <div className="relative w-1/2 h-full min-h-0 overflow-hidden">
              {/* Background Photo with 50% white overlay */}
              <div className="relative w-full h-full">
                {renderSlot(0, 'w-full h-full')}
                {/* 50% Opacity White Overlay to make background brighter than inset */}
                <div className="absolute inset-0 bg-white/50 pointer-events-none z-10 transition-colors" />
              </div>

              {/* Romantic Cursive Handwriting Lettering Overlay across spread */}
              <div className="absolute inset-0 pointer-events-none z-10 p-4 flex flex-col justify-between select-none overflow-hidden opacity-90">
                <div
                  style={{
                    fontFamily: 'Allura, Alex Brush, Dancing Script, cursive',
                    color: textConfig.namesColor || '#1e382b',
                    fontSize: '19px',
                    lineHeight: '1.3',
                  }}
                  className="space-y-1 transform -rotate-2"
                >
                  <p className="translate-x-2">I just wanted to let you know how much I appreciate having you in my life</p>
                  <p className="translate-x-6 text-right pr-6">...to help me love together</p>
                  <p className="translate-x-4">For helping me grow and create sweet memories</p>
                </div>

                <div
                  style={{
                    fontFamily: 'Allura, Alex Brush, Dancing Script, cursive',
                    color: textConfig.namesColor || '#1e382b',
                    fontSize: '19px',
                    lineHeight: '1.3',
                  }}
                  className="space-y-1.5 transform -rotate-1 pb-1"
                >
                  <p className="text-right pr-4">...know how glad</p>
                  <p className="text-right pr-2">by my side...</p>
                  <p className="translate-x-2">I am to walk this life with you forever.</p>
                </div>
              </div>

              {/* 2 Small Vertical Inset Photo Cards at bottom-left/center */}
              <div className="absolute left-6 bottom-5 flex gap-2.5 w-[54%] h-[48%] z-20 min-h-0">
                <div className="w-1/2 h-full shadow-2xl border-[2px] border-white/95 rounded-[1px] min-h-0 overflow-hidden">
                  {renderSlot(1, 'w-full h-full')}
                </div>
                <div className="w-1/2 h-full shadow-2xl border-[2px] border-white/95 rounded-[1px] min-h-0 overflow-hidden">
                  {renderSlot(2, 'w-full h-full')}
                </div>
              </div>
            </div>

            {/* Right Page (50% width): Full height portrait */}
            <div className="w-1/2 h-full min-h-0">
              {renderSlot(3, 'w-full h-full')}
            </div>
          </div>
        )}

        {/* Layout Template 9: Album Spread 50x35cm - Pure Romance (3 slots: Left full photo, Right editorial with 2 vertical photos & wedding typography) */}
        {templateId === 'album-50x35-together' && (
          <div className="w-full h-full flex overflow-hidden" style={{ gap: `${posterSettings.gap}px` }}>
            {/* Left Page (50% width): Full height portrait */}
            <div className="w-1/2 h-full min-h-0">
              {renderSlot(0, 'w-full h-full')}
            </div>

            {/* Right Page (50% width): Editorial Layout with 2 Vertical Photos + Romantic Wedding Quote */}
            <div className="w-1/2 h-full flex flex-col justify-between p-4 bg-white/95 select-none overflow-hidden min-h-0">
              {/* Top Header */}
              <div className="flex items-center justify-between border-b border-stone-200/80 pb-2 px-1">
                <span
                  style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '3.5px' }}
                  className="text-[7.5px] uppercase font-semibold text-stone-700"
                >
                  WEDDING JOURNAL
                </span>
                <span
                  style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '2.5px' }}
                  className="text-[7.5px] uppercase font-medium text-stone-500"
                >
                  THE SWEETEST DAY
                </span>
              </div>

              {/* Middle Section: 2 Vertical Photos */}
              <div className="w-full flex gap-3 h-[58%] my-auto px-1 min-h-0">
                <div className="w-1/2 h-full shadow-xs min-h-0">
                  {renderSlot(1, 'w-full h-full')}
                </div>
                <div className="w-1/2 h-full shadow-xs min-h-0">
                  {renderSlot(2, 'w-full h-full')}
                </div>
              </div>

              {/* Bottom Quote & Typography */}
              <div className="text-center pt-2 px-2 border-t border-stone-100">
                <h3
                  style={{
                    fontFamily: 'Bodoni Moda, Cormorant Garamond, serif',
                    fontSize: '19px',
                    lineHeight: '1.1',
                    color: textConfig.namesColor || '#1c1917',
                  }}
                  className="italic font-normal"
                >
                  The Journey of Love
                </h3>
                <p
                  style={{
                    fontFamily: textConfig.subtextFont || 'Cormorant Garamond, serif',
                    fontSize: '9.5px',
                    lineHeight: '1.45',
                  }}
                  className="text-stone-600 mt-1 max-w-[90%] mx-auto italic font-normal"
                >
                  "Every love story is beautiful, but ours is my absolute favorite. Two souls, one heart, forever together."
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Custom Overlay Texts Added by User */}
        {customTexts.map((item) => {
          const preset = TEXT_STYLE_PRESETS.find((p) => p.id === item.styleId) || TEXT_STYLE_PRESETS[0];
          const isSelected = selectedTextId === item.id && !isExporting;
          const isEditing = editingTextId === item.id && !isExporting;

          return (
            <div
              key={item.id}
              id={`custom-text-${item.id}`}
              onPointerDown={(e) => {
                if (isExporting || isEditing) return;
                const target = e.target as HTMLElement;
                if (target.closest('button') || target.closest('textarea') || target.closest('input')) {
                  return;
                }
                e.stopPropagation();
                if (e.button !== 0) return;
                
                try {
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                } catch {
                  // Fallback if pointer capture is not supported
                }

                const rootElem = document.getElementById('poster-root');
                const rect = rootElem ? rootElem.getBoundingClientRect() : { width: baseWidth, height: baseHeight };
                textDragRef.current = {
                  textId: item.id,
                  startX: e.clientX,
                  startY: e.clientY,
                  initialX: item.x,
                  initialY: item.y,
                  containerWidth: rect.width || baseWidth,
                  containerHeight: rect.height || baseHeight,
                  hasMoved: false,
                };
                if (onSelectTextRef.current) onSelectTextRef.current(item.id);
              }}
              onDoubleClick={(e) => {
                if (isExporting) return;
                e.stopPropagation();
                setEditingTextId(item.id);
                setTempEditText(item.text);
              }}
              style={{
                position: 'absolute',
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: `translate(-50%, -50%) rotate(${item.rotation || 0}deg)`,
                zIndex: isSelected ? 40 : 30,
                touchAction: 'none',
                userSelect: 'none',
                width: 'max-content',
                maxWidth: 'none',
                whiteSpace: item.text.includes('\n') ? 'pre' : 'nowrap',
              }}
              className={`group/text relative cursor-move transition-shadow duration-75 ${
                isSelected ? 'ring-2 ring-sky-500 rounded-lg bg-sky-50/20 p-2 shadow-lg backdrop-blur-2xs' : 'p-2'
              }`}
            >
              {isEditing ? (
                <div
                  className="flex flex-col gap-1.5 bg-white p-2.5 rounded-xl shadow-2xl border border-stone-200 min-w-[220px]"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <textarea
                    value={tempEditText}
                    onChange={(e) => setTempEditText(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-1.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none font-sans"
                    placeholder="Nhập nội dung chữ..."
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingTextId(null)}
                      className="px-2.5 py-1 text-[11px] font-medium text-stone-600 hover:bg-stone-100 rounded-md transition cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateCustomText && tempEditText.trim()) {
                          onUpdateCustomText({ ...item, text: tempEditText.trim() });
                        }
                        setEditingTextId(null);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-md transition flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      <span>Xong</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative select-none pointer-events-auto w-max max-w-none">
                  {preset.renderCanvas(item.text, item.fontSize, item.color)}

                  {/* Floating Action Bar when Selected */}
                  {isSelected && (
                    <div
                      onPointerDown={(e) => e.stopPropagation()}
                      className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-stone-900/95 text-white px-2 py-1 rounded-xl shadow-xl backdrop-blur-xs text-xs whitespace-nowrap animate-in fade-in zoom-in-90 duration-150 z-50 pointer-events-auto"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTextId(item.id);
                          setTempEditText(item.text);
                        }}
                        className="flex items-center gap-1 px-1.5 py-1 hover:bg-stone-800 rounded-md text-[11px] font-medium transition cursor-pointer"
                        title="Đổi nội dung chữ"
                      >
                        <Type className="w-3 h-3 text-sky-400" />
                        <span>Sửa</span>
                      </button>

                      <div className="w-px h-3.5 bg-stone-700 mx-0.5" />

                      {/* Font Size decrease */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateCustomText) {
                            onUpdateCustomText({ ...item, fontSize: Math.max(12, item.fontSize - 3) });
                          }
                        }}
                        className="w-5 h-5 flex items-center justify-center hover:bg-stone-800 rounded-md text-xs font-bold transition cursor-pointer"
                        title="Giảm cỡ chữ"
                      >
                        -
                      </button>
                      <span className="text-[10px] font-mono text-stone-300 px-0.5">{item.fontSize}px</span>
                      {/* Font Size increase */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateCustomText) {
                            onUpdateCustomText({ ...item, fontSize: Math.min(100, item.fontSize + 3) });
                          }
                        }}
                        className="w-5 h-5 flex items-center justify-center hover:bg-stone-800 rounded-md text-xs font-bold transition cursor-pointer"
                        title="Tăng cỡ chữ"
                      >
                        +
                      </button>

                      <div className="w-px h-3.5 bg-stone-700 mx-0.5" />

                      {/* Rotate -15° */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateCustomText) {
                            const currentRot = item.rotation || 0;
                            const newRot = (currentRot - 15 + 360) % 360;
                            onUpdateCustomText({ ...item, rotation: newRot });
                          }
                        }}
                        className="p-1 hover:bg-stone-800 rounded-md text-stone-300 hover:text-white transition cursor-pointer"
                        title="Xoay chữ -15°"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>

                      {/* Rotate +15° */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateCustomText) {
                            const newRot = ((item.rotation || 0) + 15) % 360;
                            onUpdateCustomText({ ...item, rotation: newRot });
                          }
                        }}
                        className="p-1 hover:bg-stone-800 rounded-md text-stone-300 hover:text-white transition cursor-pointer"
                        title="Xoay chữ +15°"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>

                      <div className="w-px h-3.5 bg-stone-700 mx-0.5" />

                      {/* Delete */}
                      {onDeleteCustomText && (
                        <button
                          type="button"
                          onClick={() => onDeleteCustomText(item.id)}
                          className="p-1 hover:bg-rose-600 rounded-md text-rose-300 hover:text-white transition cursor-pointer"
                          title="Xóa chữ này"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
};
