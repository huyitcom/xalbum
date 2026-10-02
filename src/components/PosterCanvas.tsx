import React, { useState, useRef, useEffect } from 'react';
import { imageOptimizer } from '../utils/imageOptimizer';
import { FrameSlot, PosterSettings, TemplateId, TextConfig, CustomTextElement } from '../types';
import { PHOTO_FILTERS, TEMPLATES, OVERLAY_SVG } from '../data/constants';
import { TEXT_STYLE_PRESETS } from '../data/textStyles';
import { Upload, Sliders, Plus, Trash2, RotateCw, RotateCcw, Type, Check, ImageOff } from 'lucide-react';

interface PosterCanvasProps {
  templateId: TemplateId;
  slots: FrameSlot[];
  textConfig: TextConfig;
  onChangeTextConfig?: (updated: TextConfig) => void;
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
  onUpdatePosterSettings?: (settings: PosterSettings) => void;
  pageNumber?: number;
}

export const PosterCanvas: React.FC<PosterCanvasProps> = ({
  templateId,
  slots,
  textConfig,
  onChangeTextConfig,
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
  onUpdatePosterSettings: _onUpdatePosterSettings,
  pageNumber,
}) => {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [panningIndex, setPanningIndex] = useState<number | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [tempEditText, setTempEditText] = useState<string>('');
  const [editingConfigKey, setEditingConfigKey] = useState<keyof TextConfig | null>(null);
  const [tempConfigValue, setTempConfigValue] = useState<string>('');

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

  // Re-render when imageOptimizer loads or updates images from IndexedDB
  const [, setOptimizerTick] = useState(0);
  useEffect(() => {
    return imageOptimizer.subscribe(() => {
      setOptimizerTick((prev) => prev + 1);
    });
  }, []);

  // --- Responsive Scaling Logic ---
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const templateDef = TEMPLATES.find((t) => t.id === templateId);
  const isVipOverlay = Boolean(templateDef?.isOverlay || templateDef?.category === 'vip' || (typeof templateId === 'string' && templateId.startsWith('overlay-')));
  
  // VIP templates strictly require 50x20cm (single page 25x20cm)
  const effectiveAspectRatio = isVipOverlay ? '50:20' : (posterSettings.aspectRatio || '50:20');
  const ratioParts = effectiveAspectRatio.split(':').map(Number);
  const wRatio = ratioParts[0] || 50;
  const hRatio = ratioParts[1] || 20;
  const isLandscape = wRatio > hRatio;
  const isExtremeLandscape = wRatio / hRatio >= 2;
  const baseWidth = isExtremeLandscape ? 960 : isLandscape ? 820 : 560;
  const baseHeight = (baseWidth * hRatio) / wRatio;
  // Constant chrome height for top label (24px) + bottom legend (32px)
  const CHROME_HEIGHT = 56;
  const totalCanvasHeight = baseHeight + CHROME_HEIGHT;

  useEffect(() => {
    if (!wrapperRef.current) return;

    let rafId: number | null = null;
    
    const updateScale = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
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
        const scaleY = availableHeight / totalCanvasHeight;

        // Smart fit: fit both width and height, capped at 1.25 so it never becomes unnaturally oversized
        const newScale = Math.max(0.25, Math.min(scaleX, scaleY, 1.25));
        
        setScale((prev) => {
          // Only update if difference is meaningful to prevent ResizeObserver layout loops
          if (Math.abs(prev - newScale) < 0.005) return prev;
          return newScale;
        });
      });
    };

    const parentMain = wrapperRef.current.closest('main') || wrapperRef.current.parentElement;
    const observer = new ResizeObserver(updateScale);
    if (parentMain) {
      observer.observe(parentMain);
    }
    window.addEventListener('resize', updateScale);
    updateScale();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [baseWidth, baseHeight, totalCanvasHeight]);
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
        onClick={() => {
          if (onSelectSlotRef.current) onSelectSlotRef.current(index);
        }}
        className={`relative group overflow-hidden select-none transition-shadow duration-150 ${
          activeSlotIndex === index ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-white shadow-md z-20' : ''
        } ${isPanningThis ? 'cursor-grabbing ring-2 ring-sky-400' : isFilled ? 'cursor-grab' : 'cursor-pointer'} ${className}`}
        style={{
          borderRadius: className.includes('rounded-none') ? 0 : `${posterSettings.cornerRadius}px`,
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

        {/* Selected Slot Indicator Badge */}
        {activeSlotIndex === index && (
          <div className="absolute top-1.5 left-1.5 z-30 bg-sky-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm pointer-events-none animate-in fade-in duration-150">
            Khung #{index + 1}
          </div>
        )}

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
          if (typeof finalSrc === 'string' && finalSrc.startsWith('img_')) {
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
              onError={(e) => {
                e.currentTarget.onerror = null;
              }}
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
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectSlotRef.current) onSelectSlotRef.current(index);
            }}
            className="w-full h-full flex flex-col items-center justify-center p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 transition cursor-pointer border border-dashed border-stone-300 rounded-lg group/placeholder"
          >
            <div className="w-8 h-8 rounded-full bg-white shadow-xs flex items-center justify-center mb-1 group-hover/placeholder:scale-110 transition">
              <Plus className="w-4 h-4 text-stone-500" />
            </div>
            <span className="text-[11px] font-medium text-stone-500 text-center">
              Khung #{index + 1}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] text-stone-400 text-center">Chạm để chọn</span>
              <span className="text-[9px] text-stone-300">·</span>
              <label
                htmlFor={`file-input-${index}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[9px] text-sky-600 hover:underline cursor-pointer"
              >
                Tải file
              </label>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEditableText = (
    field: keyof TextConfig,
    value: string | undefined,
    fallback: string,
    options: {
      className?: string;
      style?: React.CSSProperties;
      label?: string;
      as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3';
      multiline?: boolean;
    } = {}
  ) => {
    const Tag = options.as || 'span';
    const displayValue = value || fallback;
    const isEditingThis = editingConfigKey === field && !isExporting;

    if (isEditingThis) {
      return (
        <span
          className="relative inline-flex items-center justify-center z-50 my-0.5 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {options.multiline ? (
            <textarea
              autoFocus
              value={tempConfigValue}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                setTempConfigValue(e.target.value);
                if (onChangeTextConfig) {
                  onChangeTextConfig({
                    ...textConfig,
                    [field]: e.target.value,
                  });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
                  e.preventDefault();
                  setEditingConfigKey(null);
                }
              }}
              onBlur={() => setEditingConfigKey(null)}
              rows={2}
              style={options.style}
              className={`bg-white text-stone-900 border-2 border-sky-500 rounded-xl shadow-2xl px-3 py-1.5 outline-none text-center resize-none ${options.className || ''}`}
            />
          ) : (
            <input
              type="text"
              autoFocus
              value={tempConfigValue}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                setTempConfigValue(e.target.value);
                if (onChangeTextConfig) {
                  onChangeTextConfig({
                    ...textConfig,
                    [field]: e.target.value,
                  });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  e.preventDefault();
                  setEditingConfigKey(null);
                }
              }}
              onBlur={() => setEditingConfigKey(null)}
              style={options.style}
              className={`bg-white text-stone-900 border-2 border-sky-500 rounded-xl shadow-2xl px-3 py-1 outline-none text-center min-w-[120px] ${options.className || ''}`}
            />
          )}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setEditingConfigKey(null);
            }}
            className="absolute -top-7 right-0 bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md cursor-pointer whitespace-nowrap z-50 flex items-center gap-1"
          >
            <Check className="w-3 h-3" />
            <span>Xong</span>
          </button>
        </span>
      );
    }

    return (
      <Tag
        style={options.style}
        onPointerDown={(e) => {
          if (!isExporting) e.stopPropagation();
        }}
        onClick={(e) => {
          if (isExporting) return;
          e.stopPropagation();
          setEditingConfigKey(field);
          setTempConfigValue(String(textConfig[field] !== undefined ? textConfig[field] : (value || fallback)));
        }}
        onDoubleClick={(e) => {
          if (isExporting) return;
          e.stopPropagation();
          setEditingConfigKey(field);
          setTempConfigValue(String(textConfig[field] !== undefined ? textConfig[field] : (value || fallback)));
        }}
        className={`group/edit-text transition-all duration-150 ${options.className || ''} ${
          !isExporting
            ? 'cursor-pointer hover:outline-dashed hover:outline-2 hover:outline-sky-500 hover:bg-sky-500/15 rounded-md px-1 py-0.5 relative select-none'
            : ''
        }`}
        title={!isExporting ? `Nhấp để sửa ${options.label || 'chữ'}` : undefined}
      >
        {displayValue}
        {!isExporting && (
          <span className="group-hover/edit-text:flex hidden absolute -top-6 left-1/2 -translate-x-1/2 bg-stone-900/95 text-white text-[9px] font-sans font-medium px-2 py-0.5 rounded-md shadow-lg items-center gap-1 z-50 pointer-events-none whitespace-nowrap">
            ✏️ Sửa {options.label || 'chữ'}
          </span>
        )}
      </Tag>
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
      style={{ height: totalCanvasHeight * scale + 16 }}
    >
      <div 
        style={{ 
          width: baseWidth, 
          height: totalCanvasHeight,
          transform: `scale(${scale})`, 
          transformOrigin: 'top center',
          transition: 'transform 0.1s ease-out'
        }}
        className="flex shrink-0 justify-between flex-col items-center"
      >
        {/* Top Header Bar: luôn hiển thị số trang (Trang 1-2) cố định */}
        {!isExporting && (
          <div className="w-full h-6 flex items-center justify-start text-xs text-stone-600 font-medium px-1 select-none shrink-0">
            <span className="font-semibold text-stone-700 tracking-tight">
              Trang {pageNumber ? `${(pageNumber - 1) * 2 + 1}-${pageNumber * 2}` : '1-2'}
            </span>
          </div>
        )}

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
          className="relative bg-white shadow-2xl transition-all duration-300 overflow-hidden flex flex-col shrink-0"
          style={{
            width: baseWidth,
            height: baseHeight,
            backgroundColor: posterSettings.bgColor,
            padding: (isVipOverlay || templateId.startsWith('cover-') || templateId === 'album-50x35-love-beyond' || templateId === 'album-50x35-blooming-flowers' || templateId === 'album-50x35-sweet-escape' || templateId === 'album-50x35-great-ending' || templateId === 'album-50x35-maison-amour' || templateId === 'album-50x35-seasons-of-love' || templateId === 'album-50x35-quietly-yours' || templateId === 'album-50x35-finest-chapter' || templateId === 'album-50x35-familiar-soul' || templateId === 'album-50x35-ordinary-forever' || templateId === 'album-50x35-mutual-muse') ? 0 : `${posterSettings.outerMargin}px`,
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

                {/* ======================================================== */}
        {/* COVER TEMPLATES: BÌA ALBUM PHOTOBOOK CHUYÊN NGHIỆP      */}
        {/* ======================================================== */}

        {/* COVER 1: Bìa Bọc Toàn Cảnh Hoàng Gia (Luxury Wrap) */}
        {templateId === 'cover-classic-wrap' && (
          <div className="w-full h-full flex overflow-hidden relative select-none bg-[#fdfbf7]">
            {/* TRANG TRÁI: BÌA SAU (BACK COVER - 47%) */}
            <div className="w-[47%] h-full flex flex-col justify-between items-center p-6 relative border-r border-amber-900/10">
              {/* Decorative Inset Frame */}
              <div className="absolute inset-4 border border-amber-800/15 pointer-events-none rounded-xs" />

              {/* Top: Monogram Seal (Đã bỏ chữ SAVE THE DATE theo yêu cầu) */}
              <div className="flex flex-col items-center pt-4 z-10">
                <div 
                  className="w-13 h-13 rounded-full border-2 border-amber-700/40 flex items-center justify-center bg-amber-50/50 shadow-2xs cursor-pointer hover:scale-105 hover:ring-2 hover:ring-amber-400 transition group/monogram relative"
                  title="Nhấp để sửa chữ lồng viết tắt"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingConfigKey('groomName');
                    setTempConfigValue(textConfig.groomName || 'TUẤN ANH');
                  }}
                >
                  <span
                    style={{ fontFamily: 'Bodoni Moda, serif' }}
                    className="text-amber-900 font-bold text-base tracking-widest select-none"
                  >
                    {((textConfig.groomName || 'T').trim().charAt(0) || 'T')}&{((textConfig.brideName || 'N').trim().charAt(0) || 'N')}
                  </span>
                  {!isExporting && (
                    <span className="group-hover/monogram:flex hidden absolute -top-5 left-1/2 -translate-x-1/2 bg-stone-900/95 text-white text-[8px] font-sans px-1.5 py-0.5 rounded shadow z-40 whitespace-nowrap">
                      ✏️ Sửa tên viết tắt
                    </span>
                  )}
                </div>
              </div>

              {/* Center: Cameo Memory Photo (Slot 1) */}
              <div className="flex flex-col items-center gap-3 z-10 my-auto">
                <div className="w-36 h-36 rounded-full overflow-hidden p-1 bg-gradient-to-tr from-amber-600/30 via-amber-200/50 to-amber-700/40 shadow-md">
                  <div className="w-full h-full rounded-full overflow-hidden border border-white">
                    {renderSlot(1, 'w-full h-full rounded-full')}
                  </div>
                </div>

                {/* Romantic Vow Quote - Chỉ hiện khi người dùng tự nhập trích dẫn riêng */}
                {textConfig.subtext && textConfig.subtext.trim() !== '' && textConfig.subtext !== 'Rất hân hạnh được đón tiếp quý khách' && (
                  renderEditableText('subtext', textConfig.subtext, '', {
                    as: 'p',
                    style: { fontFamily: 'Cormorant Garamond, Georgia, serif' },
                    className: 'text-stone-600 text-xs italic max-w-[220px] text-center leading-relaxed',
                    multiline: true,
                    label: 'trích dẫn / lời chúc',
                  })
                )}
              </div>

              {/* Bottom: Printed by PHOTOBOOK VIETNAM */}
              <div className="flex flex-col items-center gap-0.5 z-10 pb-1 text-center select-none">
                <span
                  style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
                  className="text-[9.5px] italic text-stone-400 tracking-wider leading-tight"
                >
                  printed by
                </span>
                <span
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  className="text-[9px] font-semibold tracking-[0.22em] uppercase text-stone-500 leading-tight"
                >
                  PHOTOBOOK VIETNAM
                </span>
              </div>
            </div>

            {/* CHÍNH GIỮA: GÁY SÁCH / GÁY ALBUM (SPINE - 6%) */}
            <div 
              className="w-[6%] h-full bg-gradient-to-r from-stone-100 via-stone-200/90 to-stone-100 flex flex-col justify-between items-center py-6 relative border-x border-amber-900/20 shadow-[inset_0_0_12px_rgba(0,0,0,0.06)] cursor-pointer group/spine"
              onClick={(e) => {
                e.stopPropagation();
                setEditingConfigKey('groomName');
                setTempConfigValue(textConfig.groomName || 'TUẤN ANH');
              }}
              title="Nhấp để sửa tên & ngày trên gáy sách"
            >
              {/* Spine crease lines */}
              <div className="absolute inset-y-0 left-0 w-px bg-amber-950/15" />
              <div className="absolute inset-y-0 right-0 w-px bg-amber-950/15" />

              {/* Top Spine Mark */}
              <div className="w-3 h-3 rotate-45 border border-amber-700/50 flex items-center justify-center shrink-0">
                <div className="w-1 h-1 bg-amber-700 rounded-full" />
              </div>

              {/* Center Spine Typography (Vertical rotated text) */}
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                <span
                  style={{
                    fontFamily: 'Bodoni Moda, serif',
                    writingMode: 'vertical-rl',
                    letterSpacing: '0.22em',
                  }}
                  className="text-amber-900 font-bold text-xs uppercase select-none whitespace-nowrap group-hover/spine:text-amber-700 transition"
                >
                  {textConfig.groomName || 'TUẤN ANH'} & {textConfig.brideName || 'BẢO NGỌC'} • {textConfig.dateText ? textConfig.dateText.replace('\n', ' • ') : '2026'}
                </span>
              </div>

              {/* Bottom Spine Mark */}
              <div className="w-3 h-3 rotate-45 border border-amber-700/50 flex items-center justify-center shrink-0">
                <div className="w-1 h-1 bg-amber-700 rounded-full" />
              </div>

              {!isExporting && (
                <span className="group-hover/spine:flex hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-stone-900/95 text-white text-[8.5px] px-1.5 py-0.5 rounded shadow z-40 whitespace-nowrap">
                  ✏️ Sửa gáy
                </span>
              )}
            </div>

            {/* TRANG PHẢI: BÌA TRƯỚC (FRONT COVER - 47%) */}
            <div className="w-[47%] h-full flex flex-col justify-between items-center p-6 relative border-l border-amber-900/10">
              {/* Outer Decorative Gold Frame */}
              <div className="absolute inset-4 border-2 border-amber-800/25 pointer-events-none rounded-xs flex flex-col justify-between p-1.5">
                <div className="w-full flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-amber-700" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-amber-700" />
                </div>
                <div className="w-full flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-amber-700" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-amber-700" />
                </div>
              </div>

              {/* Top: Header Banner */}
              <div className="flex flex-col items-center pt-2 z-10 text-center">
                {renderEditableText('tagline', textConfig.tagline, 'OUR WEDDING DAY', {
                  style: { fontFamily: 'Cinzel, Cormorant Garamond, serif' },
                  className: 'text-xs uppercase tracking-[0.3em] text-amber-900 font-bold',
                  label: 'tiêu đề bìa',
                })}
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-8 h-px bg-amber-600/40" />
                  <span className="text-[10px] text-amber-700">✦</span>
                  <div className="w-8 h-px bg-amber-600/40" />
                </div>
              </div>

              {/* Center: Main Wedding Photo Frame (Slot 0) */}
              <div className="w-[84%] h-[60%] z-10 p-1.5 bg-white border border-amber-700/30 rounded-xs shadow-lg flex items-center justify-center my-auto">
                <div className="w-full h-full border border-amber-200/60 overflow-hidden relative">
                  {renderSlot(0, 'w-full h-full')}
                </div>
              </div>

              {/* Bottom: Couple Names & Wedding Date */}
              <div className="flex flex-col items-center pb-2 z-10 text-center">
                <div className="flex items-baseline justify-center gap-2 flex-wrap">
                  {renderEditableText('groomName', textConfig.groomName, 'TUẤN ANH', {
                    style: {
                      fontFamily: textConfig.namesFont || 'Bodoni Moda, serif',
                      color: textConfig.namesColor || '#1c1917',
                    },
                    className: 'text-xl sm:text-2xl font-bold tracking-wide uppercase',
                    label: 'tên chú rể',
                  })}
                  {renderEditableText('connector', textConfig.connector, 'and', {
                    style: {
                      fontFamily: textConfig.connectorFont || 'Great Vibes, cursive',
                      color: '#b45309',
                    },
                    className: 'text-2xl sm:text-3xl font-normal lowercase px-1',
                    label: 'từ nối',
                  })}
                  {renderEditableText('brideName', textConfig.brideName, 'BẢO NGỌC', {
                    style: {
                      fontFamily: textConfig.namesFont || 'Bodoni Moda, serif',
                      color: textConfig.namesColor || '#1c1917',
                    },
                    className: 'text-xl sm:text-2xl font-bold tracking-wide uppercase',
                    label: 'tên cô dâu',
                  })}
                </div>

                {renderEditableText('dateText', textConfig.dateText.replace('\n', ' • '), '10.06.2026', {
                  as: 'p',
                  style: { fontFamily: textConfig.dateFont || 'Bodoni Moda, serif' },
                  className: 'text-xs font-semibold text-stone-600 tracking-widest mt-1 uppercase',
                  label: 'ngày cưới',
                })}
              </div>
            </div>
          </div>
        )}

        {/* COVER 2: Bìa Tạp Chí Hiện Đại (Editorial Vogue) */}
        {templateId === 'cover-editorial-vogue' && (
          <div className="w-full h-full flex overflow-hidden relative select-none bg-[#111110]">
            {/* TRANG TRÁI: BÌA SAU (BACK COVER - 47%) */}
            <div className="w-[47%] h-full flex flex-col justify-between p-7 bg-[#1c1b1a] text-white relative border-r border-white/10">
              {/* Top: Archive Monogram */}
              <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-stone-400">
                  The Archive • Vol. 01
                </span>
                {renderEditableText('dateText', textConfig.dateText.split('\n')[1] || textConfig.dateText, '2026', {
                  className: 'font-mono text-[9px] uppercase text-stone-400',
                  label: 'năm / ngày cưới',
                })}
              </div>

              {/* Center: 2 Offset Candid Photos (Slot 1 & 2) */}
              <div className="flex gap-3 my-auto h-[55%]">
                <div className="w-1/2 h-full flex flex-col">
                  <div className="w-full h-[85%] bg-stone-800 rounded-xs overflow-hidden border border-white/20 shadow-md">
                    {renderSlot(1, 'w-full h-full')}
                  </div>
                  <span className="text-[8px] font-mono text-stone-400 mt-1 uppercase tracking-wider">Fig. 01 — Ceremony</span>
                </div>
                <div className="w-1/2 h-full flex flex-col pt-6">
                  <div className="w-full h-[85%] bg-stone-800 rounded-xs overflow-hidden border border-white/20 shadow-md">
                    {renderSlot(2, 'w-full h-full')}
                  </div>
                  <span className="text-[8px] font-mono text-stone-400 mt-1 uppercase tracking-wider">Fig. 02 — Reception</span>
                </div>
              </div>

              {/* Bottom: Editorial Note & Coordinates */}
              <div className="border-t border-white/15 pt-3 flex items-end justify-between">
                <div className="max-w-[190px]">
                  {renderEditableText('subtext', textConfig.subtext, 'A timeless photographic collection capturing our most unforgettable promises and shared milestones.', {
                    as: 'p',
                    className: 'text-[9px] text-stone-300 font-sans leading-relaxed',
                    multiline: true,
                    label: 'trích dẫn',
                  })}
                  <p className="text-[8px] font-mono text-stone-400 mt-1">LAT 10°46'N • LONG 106°40'E</p>
                </div>

                {/* Minimalist Barcode */}
                <div className="flex flex-col items-end gap-1">
                  <div className="w-14 h-4 flex items-center gap-[1.5px] bg-white p-0.5 rounded-[1px]">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} className="bg-black h-full" style={{ width: `${(i % 4 === 0 ? 2 : 1)}px` }} />
                    ))}
                  </div>
                  <span className="text-[7.5px] font-mono text-stone-400">978-0-PBVN-2026</span>
                </div>
              </div>
            </div>

            {/* CHÍNH GIỮA: GÁY SÁCH (SPINE - 6%) */}
            <div 
              className="w-[6%] h-full bg-[#111110] flex flex-col justify-between items-center py-6 relative border-x border-white/15 cursor-pointer group/spine"
              onClick={(e) => {
                e.stopPropagation();
                setEditingConfigKey('groomName');
                setTempConfigValue(textConfig.groomName || 'TUẤN ANH');
              }}
              title="Nhấp để sửa tên trên gáy sách"
            >
              <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest rotate-90">VOL.1</span>
              <span
                style={{
                  fontFamily: 'Bodoni Moda, serif',
                  writingMode: 'vertical-rl',
                  letterSpacing: '0.25em',
                }}
                className="text-white font-bold text-xs uppercase tracking-widest select-none whitespace-nowrap group-hover/spine:text-amber-300 transition"
              >
                THE WEDDING • {(textConfig.groomName || 'TUẤN ANH').toUpperCase()} & {(textConfig.brideName || 'BẢO NGỌC').toUpperCase()}
              </span>
              <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest rotate-90">2026</span>
              {!isExporting && (
                <span className="group-hover/spine:flex hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-stone-900/95 text-white text-[8.5px] px-1.5 py-0.5 rounded shadow z-40 whitespace-nowrap">
                  ✏️ Sửa gáy
                </span>
              )}
            </div>

            {/* TRANG PHẢI: BÌA TRƯỚC (FRONT COVER - 47%) */}
            <div className="w-[47%] h-full relative overflow-hidden bg-black text-white">
              {/* Full-bleed Photo */}
              <div className="absolute inset-0">
                {renderSlot(0, 'w-full h-full rounded-none')}
              </div>

              {/* High-end Gradient overlay for editorial look */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/75 pointer-events-none" />

              {/* Vogue Typography Overlay */}
              <div className="absolute inset-0 p-7 flex flex-col justify-between pointer-events-none">
                {/* Top Masthead */}
                <div className="flex flex-col items-center text-center pointer-events-auto">
                  <div className="w-full flex items-center justify-between text-[8px] font-mono tracking-[0.25em] text-white/80 uppercase border-b border-white/30 pb-1 mb-2">
                    <span>Exclusive Collector's Edition</span>
                    {renderEditableText('dateText', textConfig.dateText.replace('\n', ' • '), 'OCTOBER 2026', {
                      className: 'font-mono text-[8px] tracking-[0.25em] text-white/80 uppercase',
                      label: 'ngày tháng',
                    })}
                  </div>
                  {renderEditableText('tagline', textConfig.tagline, 'THE WEDDING', {
                    as: 'h1',
                    style: { fontFamily: 'Bodoni Moda, Didot, serif', letterSpacing: '0.18em' },
                    className: 'text-4xl sm:text-5xl font-extrabold text-white uppercase leading-none tracking-widest drop-shadow-md',
                    label: 'tiêu đề',
                  })}
                  <span className="text-[9px] font-sans tracking-[0.3em] uppercase text-stone-200 mt-1">
                    A Romance in Full Bloom
                  </span>
                </div>

                {/* Bottom Credits */}
                <div className="flex flex-col items-start text-left pointer-events-auto">
                  <span className="text-[10px] font-mono tracking-widest text-amber-300 uppercase mb-1">
                    STARRING
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide leading-tight text-white drop-shadow-md flex items-baseline flex-wrap gap-1" style={{ fontFamily: 'Bodoni Moda, serif' }}>
                    {renderEditableText('groomName', textConfig.groomName, 'TUẤN ANH', {
                      style: { fontFamily: 'Bodoni Moda, serif' },
                      className: 'text-2xl sm:text-3xl font-extrabold uppercase tracking-wide leading-tight text-white drop-shadow-md',
                      label: 'tên chú rể',
                    })}
                    {renderEditableText('connector', textConfig.connector, 'and', {
                      style: { fontFamily: 'Playfair Display, Great Vibes, serif' },
                      className: 'text-amber-400 italic px-2 font-normal lowercase',
                      label: 'từ nối',
                    })}
                    {renderEditableText('brideName', textConfig.brideName, 'BẢO NGỌC', {
                      style: { fontFamily: 'Bodoni Moda, serif' },
                      className: 'text-2xl sm:text-3xl font-extrabold uppercase tracking-wide leading-tight text-white drop-shadow-md',
                      label: 'tên cô dâu',
                    })}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-stone-300">
                    <span>DATE: {renderEditableText('dateText', textConfig.dateText.replace('\n', ' / '), '10/06/2026', {
                      className: 'text-[10px] font-mono text-stone-300',
                      label: 'ngày cưới',
                    })}</span>
                    <span>•</span>
                    <span>SPECIAL ALBUM EDITION</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COVER 3: Bìa Khung Cửa Sổ Cổ Điển (Classic Window) */}
        {templateId === 'cover-minimalist-embossed' && (
          <div className="w-full h-full flex overflow-hidden relative select-none bg-[#f5f4ef]">
            {/* TRANG TRÁI: BÌA SAU (BACK COVER - 47%) */}
            <div className="w-[47%] h-full flex flex-col justify-between items-center p-8 bg-[#f5f4ef] relative border-r border-stone-300/60">
              <div className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center text-stone-400 text-xs">
                ✦
              </div>

              <div className="flex flex-col items-center text-center my-auto">
                <span
                  style={{ fontFamily: 'Great Vibes, cursive' }}
                  className="text-3xl text-stone-700 mb-2"
                >
                  Together Forever
                </span>
                {renderEditableText('subtext', textConfig.subtext, '“Two lives, two hearts, joined together in friendship, united forever in love.”', {
                  as: 'p',
                  style: { fontFamily: 'Cormorant Garamond, serif' },
                  className: 'text-stone-500 text-xs max-w-[200px] leading-relaxed italic',
                  multiline: true,
                  label: 'trích dẫn tình yêu',
                })}
              </div>

              <div className="text-center">
                <span className="text-[8.5px] font-mono text-stone-400 uppercase tracking-widest">
                  Photobook Vietnam • Handcrafted Quality
                </span>
              </div>
            </div>

            {/* CHÍNH GIỮA: GÁY SÁCH (SPINE - 6%) */}
            <div 
              className="w-[6%] h-full bg-[#eeece6] flex items-center justify-center relative border-x border-stone-300/80 shadow-[inset_0_0_8px_rgba(0,0,0,0.05)] cursor-pointer group/spine"
              onClick={(e) => {
                e.stopPropagation();
                setEditingConfigKey('groomName');
                setTempConfigValue(textConfig.groomName || 'TUẤN ANH');
              }}
              title="Nhấp để sửa tên trên gáy sách"
            >
              <span
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  writingMode: 'vertical-rl',
                  letterSpacing: '0.2em',
                }}
                className="text-stone-700 font-semibold text-xs uppercase select-none whitespace-nowrap group-hover/spine:text-amber-800 transition"
              >
                {textConfig.groomName || 'TUẤN ANH'} & {textConfig.brideName || 'BẢO NGỌC'} • WEDDING ALBUM
              </span>
              {!isExporting && (
                <span className="group-hover/spine:flex hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-stone-900/95 text-white text-[8.5px] px-1.5 py-0.5 rounded shadow z-40 whitespace-nowrap">
                  ✏️ Sửa gáy
                </span>
              )}
            </div>

            {/* TRANG PHẢI: BÌA TRƯỚC (FRONT COVER - 47%) */}
            <div className="w-[47%] h-full flex flex-col justify-between items-center p-8 bg-[#f5f4ef] relative border-l border-stone-300/60">
              {/* Top Tagline */}
              <div className="text-center pt-2">
                {renderEditableText('tagline', textConfig.tagline, 'WEDDING INVITATION & ALBUM', {
                  style: { fontFamily: 'Montserrat, sans-serif' },
                  className: 'text-[10px] uppercase tracking-[0.35em] text-stone-500 font-semibold',
                  label: 'tiêu đề',
                })}
              </div>

              {/* Center Recessed Window Cutout (Slot 0) */}
              <div className="w-[72%] h-[58%] rounded-t-full bg-white p-2.5 shadow-[inset_0_3px_8px_rgba(0,0,0,0.15)] border-2 border-stone-300/70 my-auto flex items-center justify-center">
                <div className="w-full h-full rounded-t-full overflow-hidden relative shadow-sm border border-stone-200">
                  {renderSlot(0, 'w-full h-full rounded-t-full')}
                </div>
              </div>

              {/* Bottom Typography */}
              <div className="text-center pb-2">
                <div
                  style={{ fontFamily: 'Bodoni Moda, serif' }}
                  className="text-2xl font-bold uppercase text-stone-800 tracking-wider flex items-baseline justify-center flex-wrap gap-1"
                >
                  {renderEditableText('groomName', textConfig.groomName, 'TUẤN ANH', {
                    style: { fontFamily: 'Bodoni Moda, serif' },
                    className: 'text-2xl font-bold uppercase text-stone-800 tracking-wider',
                    label: 'tên chú rể',
                  })}
                  {renderEditableText('connector', textConfig.connector, '&', {
                    style: { fontFamily: 'Cormorant Garamond, serif' },
                    className: 'font-serif italic font-normal text-amber-700 px-2 lowercase',
                    label: 'từ nối',
                  })}
                  {renderEditableText('brideName', textConfig.brideName, 'BẢO NGỌC', {
                    style: { fontFamily: 'Bodoni Moda, serif' },
                    className: 'text-2xl font-bold uppercase text-stone-800 tracking-wider',
                    label: 'tên cô dâu',
                  })}
                </div>
                {renderEditableText('dateText', textConfig.dateText.replace('\n', ' • '), '10.06.2026', {
                  as: 'p',
                  style: { fontFamily: 'Cormorant Garamond, serif' },
                  className: 'text-xs text-stone-600 tracking-widest mt-1',
                  label: 'ngày cưới',
                })}
              </div>
            </div>
          </div>
        )}

        {/* COVER 4: Vát Chéo Nghệ Thuật (All We Need Is Love) */}
        {templateId === 'cover-all-we-need-is-love' && (
          <div className="w-full h-full flex overflow-hidden relative select-none bg-[#faf9f5]">
            {/* TRANG TRÁI: BÌA SAU (BACK COVER - 47%) */}
            <div className="w-[47%] h-full flex flex-col justify-between items-center p-6 sm:p-8 relative border-r border-stone-300/60 bg-[#ffffff]">
              {/* Decorative Subtle Inset Border */}
              <div className="absolute inset-4 sm:inset-5 border border-stone-200 pointer-events-none rounded-[2px]" />

              {/* Top: Romantic Chapter Header */}
              <div className="flex flex-col items-center pt-3 z-10 text-center">
                <span
                  style={{ fontFamily: 'Dancing Script, Caveat, cursive' }}
                  className="text-2xl sm:text-3xl text-stone-800 font-bold tracking-wide"
                >
                  our story begins here...
                </span>
                <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-stone-400 mt-1">
                  CHAPTER ONE • THE WEDDING MEMORIES
                </span>
              </div>

              {/* Center: Fine-art Polaroid Memory Frame (Slot 3) */}
              <div className="flex flex-col items-center gap-2 z-10 my-auto">
                <div className="p-2 sm:p-2.5 bg-white rounded-[2px] shadow-md border border-stone-200/90 rotate-[-1.5deg] hover:rotate-0 transition-transform duration-300">
                  <div className="w-36 h-36 sm:w-44 sm:h-44 bg-stone-100 overflow-hidden relative border border-stone-100">
                    {renderSlot(3, 'w-full h-full')}
                  </div>
                  <div className="pt-2 pb-1 text-center">
                    <span
                      style={{ fontFamily: 'Caveat, cursive' }}
                      className="text-sm text-stone-600 font-medium"
                    >
                      forever & always
                    </span>
                  </div>
                </div>

                {/* Romantic Subtext / Vow Quote */}
                {textConfig.subtext && textConfig.subtext.trim() !== '' && textConfig.subtext !== 'Rất hân hạnh được đón tiếp quý khách' && (
                  renderEditableText('subtext', textConfig.subtext, '', {
                    as: 'p',
                    style: { fontFamily: 'Cormorant Garamond, Georgia, serif' },
                    className: 'text-stone-600 text-xs italic max-w-[220px] text-center leading-relaxed mt-1',
                    multiline: true,
                    label: 'trích dẫn / lời chúc',
                  })
                )}
              </div>

              {/* Bottom: Official Imprint (printed by PHOTOBOOK VIETNAM) */}
              <div className="flex flex-col items-center gap-0.5 z-10 pb-1 text-center select-none">
                <span
                  style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
                  className="text-[9.5px] italic text-stone-400 tracking-wider leading-tight"
                >
                  printed by
                </span>
                <span
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                  className="text-[9px] font-semibold tracking-[0.22em] uppercase text-stone-500 leading-tight"
                >
                  PHOTOBOOK VIETNAM
                </span>
              </div>
            </div>

            {/* CHÍNH GIỮA: GÁY SÁCH / GÁY ALBUM (SPINE - 6%) */}
            <div 
              className="w-[6%] h-full bg-[#fbfbfa] flex flex-col justify-between items-center py-6 relative border-x border-stone-300/80 shadow-[inset_0_0_10px_rgba(0,0,0,0.04)] cursor-pointer group/spine"
              onClick={(e) => {
                e.stopPropagation();
                setEditingConfigKey('groomName');
                setTempConfigValue(textConfig.groomName || 'TUẤN ANH');
              }}
              title="Nhấp để sửa tên trên gáy sách"
            >
              <div className="text-[8px] font-mono text-stone-400 uppercase tracking-widest rotate-90">
                VOL.1
              </div>
              <span
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  writingMode: 'vertical-rl',
                  letterSpacing: '0.22em',
                }}
                className="text-stone-800 font-bold text-xs uppercase tracking-widest select-none whitespace-nowrap group-hover/spine:text-sky-600 transition"
              >
                {(textConfig.groomName || 'TUẤN ANH').toUpperCase()} & {(textConfig.brideName || 'BẢO NGỌC').toUpperCase()} • {textConfig.dateText.split('\n')[1] || textConfig.dateText.replace('\n', ' ') || '2026'}
              </span>
              <div className="text-[8px] font-mono text-stone-400 uppercase tracking-widest rotate-90">
                PBVN
              </div>
              {!isExporting && (
                <span className="group-hover/spine:flex hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-stone-900/95 text-white text-[8.5px] px-1.5 py-0.5 rounded shadow z-40 whitespace-nowrap">
                  ✏️ Sửa gáy
                </span>
              )}
            </div>

            {/* TRANG PHẢI: BÌA TRƯỚC (FRONT COVER - 47%) */}
            <div className="w-[47%] h-full relative overflow-hidden bg-white p-3.5 sm:p-5 select-none border-l border-stone-200">
              {/* Outer Framed Canvas */}
              <div className="w-full h-full relative overflow-hidden bg-white">
                {/* 1. Top-Left: Handwritten Script Calligraphy */}
                <div className="absolute top-[4%] left-[4%] z-30 pointer-events-auto flex flex-col items-start select-none max-w-[210px]">
                  {renderEditableText('tagline', textConfig.tagline && textConfig.tagline !== 'SAVE THE DATE' ? textConfig.tagline : 'All we need\nis love...', 'All we need\nis love...', {
                    as: 'div',
                    style: { fontFamily: 'Dancing Script, Caveat, cursive' },
                    className: 'text-2xl sm:text-3xl md:text-[34px] font-bold text-stone-900 tracking-wide leading-[1.1] whitespace-pre-line cursor-pointer hover:opacity-85 transition',
                    multiline: true,
                    label: 'chữ nghệ thuật bìa trước',
                  })}
                  {/* Subtle Couple Sub-caption */}
                  <div className="mt-1.5 text-[8.5px] sm:text-[9.5px] font-semibold tracking-[0.22em] uppercase text-stone-400 font-sans">
                    {(textConfig.groomName || 'TUẤN ANH').toUpperCase()} & {(textConfig.brideName || 'BẢO NGỌC').toUpperCase()}
                  </div>
                </div>

                {/* 2. Top-Right Corner Photo (Slot 1) */}
                <div 
                  className="absolute z-20 overflow-hidden shadow-2xs"
                  style={{
                    top: '0%',
                    left: '55%',
                    width: '45%',
                    height: '52%',
                    clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%)',
                  }}
                >
                  {renderSlot(1, 'w-full h-full')}
                </div>

                {/* 3. Bottom-Left Corner Photo (Slot 2) */}
                <div 
                  className="absolute z-20 overflow-hidden shadow-2xs"
                  style={{
                    top: '60%',
                    left: '0%',
                    width: '56%',
                    height: '40%',
                    clipPath: 'polygon(0% 0%, 100% 100%, 0% 100%)',
                  }}
                >
                  {renderSlot(2, 'w-full h-full')}
                </div>

                {/* 4. Center & Bottom-Right Hero Photo (Slot 0) - Reduced size & pushed back to give text ample room */}
                <div 
                  className="absolute inset-0 z-10 overflow-hidden shadow-2xs"
                  style={{
                    clipPath: 'polygon(0% 56%, 55% 17%, 98% 56%, 100% 100%, 60% 100%)',
                  }}
                >
                  {renderSlot(0, 'w-full h-full')}
                </div>
              </div>
            </div>
          </div>
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
                  target.onerror = null;
                  const currentSrc = target.src || '';
                  const fileMatch = currentSrc.match(/(\d\d-\d\d\.png)/) || (templateDef?.overlayUri || '').match(/(\d\d-\d\d\.png)/);
                  const fName = fileMatch ? fileMatch[1] : '';
                  if (fName && !currentSrc.includes('photobookvietnam.net')) {
                    target.src = `https://www.photobookvietnam.net/images/layout/lay01/${fName}`;
                  } else {
                    target.src = OVERLAY_SVG;
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
        {/* Layout Template: Velvet Promise (3 slots: Left large portrait with elegant border margin, Right 2 horizontal landscape with VELVET PROMISE title & romantic quote) */}
        {templateId === 'album-50x35-velvet-promise' && (
          <div className="w-full h-full flex bg-white overflow-hidden">
            {/* Left Page (Exact 50%): Elegant framed portrait */}
            <div className="w-1/2 h-full flex items-center justify-center py-6 px-6 sm:px-10 min-h-0 bg-white">
              <div className="w-full h-full min-h-0 shadow-xs">
                {renderSlot(0, 'w-full h-full')}
              </div>
            </div>

            {/* Right Page (Exact 50%): Editorial Layout with Title + 2 Horizontal Photos + Quote */}
            <div className="w-1/2 h-full flex flex-col justify-between py-6 px-6 sm:px-10 bg-white select-none overflow-hidden min-h-0">
              {/* Top Title: VELVET PROMISE */}
              <div className="w-full text-center pt-1 pb-1 shrink-0">
                <h2
                  style={{
                    fontFamily: "'Cinzel', 'Playfair Display', serif",
                    color: '#a6724a',
                    fontSize: '22px',
                    letterSpacing: '0.14em',
                    fontWeight: 600,
                    lineHeight: 1.1,
                  }}
                  className="uppercase tracking-[0.14em] select-none text-center whitespace-nowrap inline-block"
                >
                  VELVET PROMISE
                </h2>
              </div>

              {/* Middle: 2 Horizontal Photos stacked - full flex-1 height */}
              <div className="w-full flex-1 flex flex-col justify-center gap-3.5 my-1.5 min-h-0">
                <div className="w-full flex-1 min-h-0 shadow-xs">
                  {renderSlot(1, 'w-full h-full')}
                </div>
                <div className="w-full flex-1 min-h-0 shadow-xs">
                  {renderSlot(2, 'w-full h-full')}
                </div>
              </div>

              {/* Bottom: Romantic Quote */}
              <div className="w-full text-center pb-1 pt-0.5 shrink-0">
                <p
                  style={{
                    fontFamily: "'Playfair Display', 'Cormorant Garamond', serif",
                    fontStyle: 'italic',
                    fontSize: '11px',
                    lineHeight: 1.5,
                    color: '#44403c',
                  }}
                  className="max-w-[92%] mx-auto text-stone-700"
                >
                  Every moment beside you feels like a quiet kind of forever.
                  <br />
                  In your smile, I found warmth, peace, and the love I had always been searching for.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Layout Template: Love Beyond (3 slots: Left FULL BLEED portrait page, Right 2 horizontal photos with LOVE BEYOND The Silence calligraphy header) */}
        {templateId === 'album-50x35-love-beyond' && (
          <div className="w-full h-full flex bg-white overflow-hidden">
            {/* Left Page (Exact 50% width): Full bleed portrait filling 100% of left page up to center line */}
            <div className="w-1/2 h-full min-h-0 overflow-hidden">
              {renderSlot(0, 'w-full h-full rounded-none')}
            </div>

            {/* Right Page (Exact 50% width): Artistic Typography Header + 2 Horizontal Photos */}
            <div className="w-1/2 h-full flex flex-col justify-between py-6 px-6 sm:px-10 bg-white select-none overflow-hidden min-h-0">
              {/* Header: LOVE BEYOND on 1 line + The Silence below */}
              <div className="w-full relative pt-1 pb-1 shrink-0">
                <div className="flex flex-col">
                  {/* Line 1: LOVE BEYOND */}
                  <div className="whitespace-nowrap leading-none">
                    <span
                      style={{
                        fontFamily: "'Bodoni Moda', 'Playfair Display', serif",
                        fontSize: '32px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#1c1917',
                        lineHeight: 1,
                      }}
                      className="tracking-wider uppercase whitespace-nowrap inline-block"
                    >
                      LOVE BEYOND
                    </span>
                  </div>

                  {/* Line 2: [NEWSEASON] + The Silence */}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span
                      style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: '9px',
                        letterSpacing: '0.22em',
                        color: '#57534e',
                        fontWeight: 600,
                      }}
                      className="tracking-widest uppercase inline-block shrink-0"
                    >
                      [NEWSEASON]
                    </span>
                    <span
                      style={{
                        fontFamily: "'Alex Brush', 'Great Vibes', cursive",
                        fontSize: '42px',
                        color: '#b86b3a',
                        lineHeight: 0.8,
                        transform: 'rotate(-3deg)',
                      }}
                      className="select-none pointer-events-none whitespace-nowrap inline-block"
                    >
                      The Silence
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle: 2 Horizontal Photos - full flex-1 height */}
              <div className="w-full flex-1 flex flex-col justify-center gap-3.5 my-1.5 min-h-0">
                <div className="w-full flex-1 min-h-0 shadow-xs">
                  {renderSlot(1, 'w-full h-full')}
                </div>
                <div className="w-full flex-1 min-h-0 shadow-xs">
                  {renderSlot(2, 'w-full h-full')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Layout Template: Blooming Flowers (3 slots: Left 2 vertical photos with “BLOOMING” flowers pink typography, Right full-bleed photo) */}
        {templateId === 'album-50x35-blooming-flowers' && (
          <div className="w-full h-full flex bg-white overflow-hidden">
            {/* Left Page (Exact 50% width): 2 Vertical Photos with centered fashion typography */}
            <div className="w-1/2 shrink-0 flex-none h-full flex flex-col items-center justify-between py-6 px-10 sm:px-14 bg-white select-none overflow-hidden min-h-0">
              {/* Top Vertical Photo */}
              <div className="w-[72%] flex-1 min-h-0 shadow-xs">
                {renderSlot(1, 'w-full h-full')}
              </div>

              {/* Center Typography: “BLOOMING” flowers */}
              <div className="w-full flex flex-col items-center justify-center py-2 relative select-none shrink-0">
                <h2
                  style={{
                    fontFamily: "'Bodoni Moda', 'Playfair Display', serif",
                    fontSize: '32px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#e11d67',
                    lineHeight: 1,
                  }}
                  className="uppercase tracking-wider text-center"
                >
                  “BLOOMING”
                </h2>
                <span
                  style={{
                    fontFamily: "'Alex Brush', 'Dancing Script', cursive",
                    fontSize: '36px',
                    color: '#ff4d8d',
                    lineHeight: 0.8,
                    marginTop: '-8px',
                  }}
                  className="select-none pointer-events-none"
                >
                  flowers
                </span>
              </div>

              {/* Bottom Vertical Photo */}
              <div className="w-[72%] flex-1 min-h-0 shadow-xs">
                {renderSlot(2, 'w-full h-full')}
              </div>
            </div>

            {/* Right Page (Exact 50% width): Full bleed portrait covering 100% of the right page */}
            <div className="w-1/2 shrink-0 flex-none h-full min-h-0 overflow-hidden">
              {renderSlot(0, 'w-full h-full rounded-none')}
            </div>
          </div>
        )}

        {/* Layout Template: Mẫu số 19 (Sweet Escape) */}
        {templateId === 'album-50x35-sweet-escape' && (
          <div className="w-full h-full flex bg-white overflow-hidden">
            {/* Left Page (Exact 50% width): 2 Arched Vertical Photos + Sweet Escape Calligraphy */}
            <div className="w-1/2 shrink-0 flex-none h-full flex flex-col items-center justify-between py-5 px-8 sm:px-12 bg-white select-none overflow-hidden min-h-0 relative">
              {/* Top Vertical Photo with Top-Left Arch (Slot 2) */}
              <div className="w-[74%] h-[44%] relative flex items-center justify-center">
                <div className="w-full h-full shadow-sm rounded-tl-[80px] sm:rounded-tl-[95px] rounded-tr-md rounded-br-md rounded-bl-md overflow-hidden">
                  {renderSlot(2, 'w-full h-full')}
                </div>
                {/* Right side hashtag metadata */}
                <div className="absolute -right-8 top-3 flex flex-col gap-0.5 text-[9px] font-sans font-medium text-stone-500 select-none pointer-events-none">
                  <span>#Mood</span>
                  <span>#Roselune</span>
                </div>
              </div>

              {/* Middle: Sweet Escape Script running across */}
              <div className="w-full flex items-center justify-center -my-3.5 z-10 select-none pointer-events-none">
                <span
                  style={{
                    fontFamily: "'Alex Brush', 'Dancing Script', cursive",
                    fontSize: '56px',
                    color: '#292524',
                    lineHeight: 0.8,
                    transform: 'rotate(-2deg)',
                  }}
                  className="whitespace-nowrap tracking-wide select-none"
                >
                  Sweet Escape
                </span>
              </div>

              {/* Bottom Vertical Photo with Bottom-Right Arch (Slot 3) */}
              <div className="w-[74%] h-[44%] relative flex items-center justify-center">
                <div className="w-full h-full shadow-sm rounded-tl-md rounded-tr-md rounded-br-[80px] sm:rounded-br-[95px] rounded-bl-md overflow-hidden">
                  {renderSlot(3, 'w-full h-full')}
                </div>
                {/* Right side poetic vertical text */}
                <div
                  className="absolute -right-8 bottom-3 select-none pointer-events-none text-[9.5px] font-sans text-stone-600 tracking-wider whitespace-nowrap"
                  style={{ writingMode: 'vertical-rl' }}
                >
                  Love becomes beautiful when we grow gently together.
                </div>
              </div>
            </div>

            {/* Right Page (Exact 50% width): 2 Horizontal Full-Bleed Photos without Text */}
            <div className="w-1/2 shrink-0 flex-none h-full flex flex-col min-h-0 overflow-hidden">
              {/* Top Photo (Slot 0) */}
              <div className="w-full h-1/2 min-h-0 relative border-b border-white/20">
                {renderSlot(0, 'w-full h-full rounded-none')}
              </div>

              {/* Bottom Photo (Slot 1) */}
              <div className="w-full h-1/2 min-h-0 relative">
                {renderSlot(1, 'w-full h-full rounded-none')}
              </div>
            </div>
          </div>
        )}

        {/* Layout Template: Mẫu số 20 (Great Ending) */}
        {templateId === 'album-50x35-great-ending' && (
          <div className="w-full h-full flex bg-white overflow-hidden">
            {/* Left Page (Exact 50% width): Large Portrait Photo with Elegant Passepartout Margin */}
            <div className="w-1/2 shrink-0 flex-none h-full flex items-center justify-center p-6 sm:p-10 select-none overflow-hidden min-h-0">
              <div className="w-[84%] h-[92%] bg-white p-2 sm:p-2.5 shadow-sm rounded-xs overflow-hidden">
                {renderSlot(0, 'w-full h-full')}
              </div>
            </div>

            {/* Right Page (Exact 50% width): 3x3 Grid (8 Photos + 1 Editorial Great Ending Typography) */}
            <div className="w-1/2 shrink-0 flex-none h-full p-6 sm:p-10 flex items-center justify-center bg-white select-none overflow-hidden min-h-0">
              <div className="w-full h-[92%] grid grid-cols-3 grid-rows-3 gap-2 sm:gap-2.5">
                {/* Row 1 */}
                <div className="w-full h-full min-h-0 shadow-2xs overflow-hidden bg-stone-100">
                  {renderSlot(1, 'w-full h-full')}
                </div>
                <div className="w-full h-full min-h-0 shadow-2xs overflow-hidden bg-stone-100">
                  {renderSlot(2, 'w-full h-full')}
                </div>
                <div className="w-full h-full min-h-0 shadow-2xs overflow-hidden bg-stone-100">
                  {renderSlot(3, 'w-full h-full')}
                </div>

                {/* Row 2 */}
                <div className="w-full h-full min-h-0 shadow-2xs overflow-hidden bg-stone-100">
                  {renderSlot(4, 'w-full h-full')}
                </div>
                <div className="w-full h-full min-h-0 shadow-2xs overflow-hidden bg-stone-100">
                  {renderSlot(5, 'w-full h-full')}
                </div>
                <div className="w-full h-full min-h-0 shadow-2xs overflow-hidden bg-stone-100">
                  {renderSlot(6, 'w-full h-full')}
                </div>

                {/* Row 3 */}
                <div className="w-full h-full min-h-0 shadow-2xs overflow-hidden bg-stone-100">
                  {renderSlot(7, 'w-full h-full')}
                </div>
                <div className="w-full h-full min-h-0 shadow-2xs overflow-hidden bg-stone-100">
                  {renderSlot(8, 'w-full h-full')}
                </div>

                {/* Slot 9: Editorial Typography (Canh phải hoàn toàn, không có WE SING OF A) */}
                <div className="w-full h-full min-h-0 flex flex-col justify-end items-end select-none pointer-events-none pb-1 sm:pb-2 text-right">
                  <div className="flex flex-col items-end text-right">
                    <span style={{ fontFamily: "'Bodoni Moda', 'Playfair Display', serif" }} className="text-[16px] sm:text-[19px] font-black italic tracking-normal uppercase text-stone-900 leading-none">
                      GREAT
                    </span>
                    <span style={{ fontFamily: "'Bodoni Moda', 'Playfair Display', serif" }} className="text-[16px] sm:text-[19px] font-black tracking-normal uppercase text-stone-900 leading-none mt-1 whitespace-nowrap">
                      — ENDING
                    </span>
                  </div>
                  <p className="font-serif italic text-[8.5px] sm:text-[10px] leading-snug text-stone-700 text-right mt-2 sm:mt-2.5">
                    “Since I met you
                    <br />
                    This small town hasn't got room
                    <br />
                    For my big feelings.”
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Layout Template: Mẫu số 21 (Maison Amour) */}
        {templateId === 'album-50x35-maison-amour' && (
          <div className="w-full h-full flex bg-white overflow-hidden">
            {/* Left Page (Exact 50% width): Header Tags, Maison Amour Calligraphy, 3 Staggered Photos, Love Poem & Pink Bottom Bar */}
            <div className="w-1/2 shrink-0 flex-none h-full flex flex-col justify-between pt-5 px-8 sm:px-12 pb-0 bg-white select-none overflow-hidden min-h-0 relative">
              {/* Top Header Tags */}
              <div className="w-full flex items-center justify-between text-[9px] sm:text-[10px] font-sans font-bold tracking-[0.2em] text-rose-400 uppercase select-none px-2 shrink-0">
                <span>#ORIGINAL</span>
                <span>#SERIES .999.</span>
                <span>#DETAIL</span>
              </div>

              {/* Big Title: Maison Amour */}
              <div className="w-full text-center my-0.5 select-none shrink-0">
                <span
                  style={{
                    fontFamily: "'Alex Brush', 'Dancing Script', cursive",
                    fontSize: '52px',
                    color: '#fb7185',
                    lineHeight: 1,
                  }}
                  className="inline-block select-none pointer-events-none drop-shadow-2xs"
                >
                  Maison Amour
                </span>
              </div>

              {/* Middle: 3 Staggered Vertical Photos */}
              <div className="w-full flex-1 flex items-center justify-center gap-3 my-1.5 min-h-0">
                {/* Left Slot (Slot 1) */}
                <div className="w-[30%] h-[80%] mt-6 shadow-xs overflow-hidden">
                  {renderSlot(1, 'w-full h-full')}
                </div>
                {/* Center Slot (Slot 2, taller, hero) */}
                <div className="w-[38%] h-[96%] -mt-3 shadow-md z-10 overflow-hidden ring-2 ring-white">
                  {renderSlot(2, 'w-full h-full')}
                </div>
                {/* Right Slot (Slot 3) */}
                <div className="w-[30%] h-[78%] mt-4 shadow-xs overflow-hidden">
                  {renderSlot(3, 'w-full h-full')}
                </div>
              </div>

              {/* Bottom Love Poem */}
              <div className="w-full text-center pb-2.5 px-3 select-none shrink-0">
                <p style={{ fontFamily: "'Bodoni Moda', 'Playfair Display', serif" }} className="text-[10px] sm:text-[11.5px] text-stone-800 leading-relaxed font-normal">
                  Life will continue to surprise us with <span style={{ fontFamily: "'Alex Brush', cursive" }} className="text-rose-500 text-sm font-normal italic">unexpected paths</span>, yet
                  <br />
                  every <span style={{ fontFamily: "'Alex Brush', cursive" }} className="text-rose-500 text-sm font-normal italic">journey feels</span> less uncertain when taken together.
                  <br />
                  In every challenge and every celebration, we <span style={{ fontFamily: "'Alex Brush', cursive" }} className="text-rose-500 text-sm font-normal italic">discover another reason</span>
                  <br />
                  to believe in what we have built.
                </p>
              </div>

              {/* Bottom Soft Pink Bar */}
              <div className="w-full h-3.5 sm:h-4 bg-[#f8cdd7] shrink-0 -mx-8 sm:-mx-12 px-8 sm:px-12"></div>
            </div>

            {/* Right Page (Exact 50% width): 1 Full Bleed Portrait Photo covering 100% of right page */}
            <div className="w-1/2 shrink-0 flex-none h-full min-h-0 overflow-hidden">
              {renderSlot(0, 'w-full h-full rounded-none')}
            </div>
          </div>
        )}

        {/* Layout Template: Mẫu số 22 (The Seasons of Love) */}
        {templateId === 'album-50x35-seasons-of-love' && (
          <div className="w-full h-full flex bg-white overflow-hidden">
            {/* Left Page (Exact 50% width): Large Portrait with Elegant White Margin */}
            <div className="w-1/2 shrink-0 flex-none h-full flex items-center justify-center p-6 sm:p-10 select-none overflow-hidden min-h-0">
              <div className="w-[84%] h-[92%] bg-stone-100 shadow-sm rounded-xs overflow-hidden">
                {renderSlot(0, 'w-full h-full')}
              </div>
            </div>

            {/* Right Page (Exact 50% width): Header (Tags + The Seasons Of Love), 3 Vertical Photos Triptych, Footer Romantic Text with Black Badges */}
            <div className="w-1/2 shrink-0 flex-none h-full p-6 sm:p-8 flex flex-col justify-between bg-white select-none overflow-hidden min-h-0">
              {/* Header Area */}
              <div className="w-full flex items-start justify-between shrink-0 pt-1">
                {/* Left Tags */}
                <div className="flex flex-col gap-1 text-[7.5px] sm:text-[9px] font-sans font-semibold tracking-[0.2em] text-stone-600 uppercase select-none">
                  <span>|THE SEASON OF LOVEEE</span>
                  <span>|LOVER.RR &nbsp;—&nbsp; SIGNATURE</span>
                  <span>|GOOD.MOOD</span>
                </div>

                {/* Right Title */}
                <div className="flex flex-col items-end text-right leading-none select-none">
                  <h2
                    style={{ fontFamily: "'Bodoni Moda', 'Playfair Display', serif" }}
                    className="text-2xl sm:text-3xl font-normal tracking-[0.14em] text-stone-900 uppercase"
                  >
                    THE SEASONS
                  </h2>
                  <div className="flex items-baseline justify-end -mt-1 sm:-mt-1.5">
                    <span
                      style={{ fontFamily: "'Alex Brush', 'Dancing Script', cursive" }}
                      className="text-2xl sm:text-3xl font-normal text-stone-900 italic mr-1.5 select-none"
                    >
                      Of
                    </span>
                    <span
                      style={{ fontFamily: "'Bodoni Moda', 'Playfair Display', serif" }}
                      className="text-3xl sm:text-4xl font-normal tracking-[0.18em] text-stone-900 uppercase"
                    >
                      LOVE
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle Section: 3 Vertical Photos (Triptych) */}
              <div className="w-full flex-1 flex items-center justify-between gap-2.5 sm:gap-3.5 my-3 min-h-0">
                <div className="w-1/3 h-full min-h-0 shadow-2xs overflow-hidden bg-stone-100">
                  {renderSlot(1, 'w-full h-full')}
                </div>
                <div className="w-1/3 h-full min-h-0 shadow-2xs overflow-hidden bg-stone-100">
                  {renderSlot(2, 'w-full h-full')}
                </div>
                <div className="w-1/3 h-full min-h-0 shadow-2xs overflow-hidden bg-stone-100">
                  {renderSlot(3, 'w-full h-full')}
                </div>
              </div>

              {/* Footer Section: Romantic paragraph with black badges */}
              <div className="w-full shrink-0 pb-1 text-right select-none">
                <p className="text-[6.5px] sm:text-[7.5px] font-sans font-medium uppercase tracking-[0.12em] text-stone-700 leading-[1.65] max-w-[96%] ml-auto">
                  THE STRONGEST BONDS ARE{' '}
                  <span className="bg-black text-white px-1.5 py-0.5 font-serif italic text-[7.5px] sm:text-[8.5px] tracking-normal font-normal">
                    OFTEN FORMED
                  </span>{' '}
                  THROUGH
                  <br />
                  COUNTLESS QUIET MOMENTS RATHER THAN GRAND DECLARATIONS.
                  <br />
                  THEY{' '}
                  <span className="bg-black text-white px-1.5 py-0.5 font-serif italic text-[7.5px] sm:text-[8.5px] tracking-normal font-normal">
                    GROW THROUGH TRUST
                  </span>{' '}
                  SHARED EXPERIENCES, AND THE
                  <br />
                  WILLINGNESS TO STAND TOGETHER THROUGH EVERY CHALLENGE.
                  <br />
                  TODAY, WE{' '}
                  <span className="bg-black text-white px-1.5 py-0.5 font-serif italic text-[7.5px] sm:text-[8.5px] tracking-normal font-normal">
                    CELEBRATE A LOVE
                  </span>{' '}
                  THAT HAS BECOME OUR GREATEST
                  <br />
                  SOURCE OF STRENGTH AND A FUTURE FILLED WITH ENDLESS{' '}
                  <span className="bg-black text-white px-1.5 py-0.5 font-serif italic text-[7.5px] sm:text-[8.5px] tracking-normal font-normal">
                    OPPORTUNITIES
                  </span>
                  <br />
                  TO CREATE BEAUTIFUL MEMORIES.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Layout Template: Mẫu số 23 (Quietly Yours) */}
        {templateId === 'album-50x35-quietly-yours' && (
          <div className="w-full h-full flex bg-white overflow-hidden">
            {/* Left Page (Exact 50% width): Vertical Watermark Quietly Yours, 2 Stacked Photos, Right Vertical Hashtags */}
            <div className="relative w-1/2 shrink-0 flex-none h-full flex items-center justify-center bg-white select-none overflow-hidden min-h-0 pl-14 sm:pl-16 pr-6 sm:pr-8 py-6 sm:py-8">
              {/* Left Edge Vertical Watermark Display Text */}
              <div className="absolute left-1 sm:left-2 inset-y-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
                <span
                  style={{
                    fontFamily: "'Playfair Display', 'Bodoni Moda', serif",
                    writingMode: 'vertical-rl',
                    letterSpacing: '0.12em',
                  }}
                  className="text-5xl sm:text-7xl font-bold uppercase text-stone-200/70 select-none tracking-widest whitespace-nowrap rotate-180"
                >
                  QUIETLY YOURS
                </span>
              </div>

              {/* 2 Stacked Vertical Photos (Slot 1, Slot 2) */}
              <div className="relative z-10 w-[62%] h-full flex flex-col justify-between gap-3 sm:gap-4 min-h-0">
                <div className="w-full h-1/2 min-h-0 shadow-xs overflow-hidden bg-stone-100">
                  {renderSlot(1, 'w-full h-full')}
                </div>
                <div className="w-full h-1/2 min-h-0 shadow-xs overflow-hidden bg-stone-100">
                  {renderSlot(2, 'w-full h-full')}
                </div>
              </div>

              {/* Right Vertical Hashtags */}
              <div className="relative z-10 flex flex-col justify-between h-[88%] ml-3 sm:ml-4 select-none pointer-events-none text-stone-500 font-sans text-[7px] sm:text-[8px] font-semibold tracking-[0.25em]">
                <span style={{ writingMode: 'vertical-rl' }} className="rotate-180 uppercase whitespace-nowrap">
                  #NEWCHAPTER.
                </span>
                <span style={{ writingMode: 'vertical-rl' }} className="rotate-180 uppercase whitespace-nowrap">
                  #LOVECHRONICLE.
                </span>
                <span style={{ writingMode: 'vertical-rl' }} className="rotate-180 uppercase whitespace-nowrap">
                  #GROOM/BRIDE.
                </span>
              </div>
            </div>

            {/* Right Page (Exact 50% width): Full Bleed Photo Covering 100% of Right Page */}
            <div className="w-1/2 shrink-0 flex-none h-full min-h-0 overflow-hidden bg-stone-100">
              {renderSlot(0, 'w-full h-full rounded-none')}
            </div>
          </div>
        )}

        {/* Layout Template: Mẫu số 24 (Our Finest Chapter) */}
        {templateId === 'album-50x35-finest-chapter' && (
          <div className="w-full h-full flex bg-white overflow-hidden">
            {/* Left Page (Exact 50% width): 2 Vertical Photos Side-by-Side */}
            <div className="w-1/2 shrink-0 flex-none h-full flex items-center justify-center p-6 sm:p-10 select-none overflow-hidden min-h-0 gap-3.5 sm:gap-4.5">
              <div className="w-1/2 h-[86%] shadow-xs overflow-hidden bg-stone-100">
                {renderSlot(0, 'w-full h-full')}
              </div>
              <div className="w-1/2 h-[86%] shadow-xs overflow-hidden bg-stone-100">
                {renderSlot(1, 'w-full h-full')}
              </div>
            </div>

            {/* Right Page (Exact 50% width): 2 Asymmetric Vertical Photos + Our Finest Chapter Typography */}
            <div className="w-1/2 shrink-0 flex-none h-full p-6 sm:p-10 flex items-center justify-center select-none overflow-hidden min-h-0">
              <div className="w-full h-[86%] flex justify-between gap-4">
                {/* Left Staggered Photo: Slot 2 (Sitting Lower Down) */}
                <div className="w-[48%] h-full flex flex-col justify-end">
                  <div className="w-full h-[84%] shadow-xs overflow-hidden bg-stone-100">
                    {renderSlot(2, 'w-full h-full')}
                  </div>
                </div>

                {/* Right Staggered Photo: Slot 3 (Positioned High) + Typography Bottom */}
                <div className="w-[48%] h-full flex flex-col justify-between">
                  <div className="w-full h-[80%] shadow-xs overflow-hidden bg-stone-100">
                    {renderSlot(3, 'w-full h-full')}
                  </div>
                  <div className="w-full flex flex-col items-end text-right pt-2 select-none pointer-events-none">
                    <span
                      style={{ fontFamily: "'Bodoni Moda', 'Playfair Display', serif" }}
                      className="text-base sm:text-xl font-normal tracking-[0.18em] text-stone-900 uppercase leading-none"
                    >
                      OUR FINEST
                    </span>
                    <span
                      style={{ fontFamily: "'Alex Brush', 'Dancing Script', cursive" }}
                      className="text-2xl sm:text-3xl font-normal text-rose-400 italic -mt-1 sm:-mt-1.5 mr-0.5 leading-none select-none"
                    >
                      Chapter
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Layout Template: Mẫu số 25 (Familiar Soul) */}
        {templateId === 'album-50x35-familiar-soul' && (
          <div className="w-full h-full flex bg-white overflow-hidden">
            {/* Left Page (Exact 50% width): 2 Vertical Photos with Center Crimson Title & Tags */}
            <div className="relative w-1/2 shrink-0 flex-none h-full flex flex-col items-center justify-between py-6 px-10 sm:px-14 bg-white select-none overflow-hidden min-h-0">
              {/* Top Vertical Photo (Slot 1) */}
              <div className="w-[62%] h-[43%] shadow-xs overflow-hidden bg-stone-100 min-h-0">
                {renderSlot(1, 'w-full h-full')}
              </div>

              {/* Middle Section: Metadata Tags + Familiar Soul Title */}
              <div className="w-full flex items-center justify-between px-2 -my-2.5 z-10 select-none pointer-events-none">
                {/* Left Metadata */}
                <div className="flex flex-col text-[7.5px] sm:text-[9px] font-sans font-medium tracking-[0.2em] text-stone-700 leading-tight uppercase">
                  <span>#CONCEPT</span>
                  <span>#PREWEDDING</span>
                </div>

                {/* Center Title */}
                <h2
                  style={{
                    fontFamily: "'Bodoni Moda', 'Playfair Display', serif",
                    color: '#b91c1c',
                    lineHeight: 1,
                  }}
                  className="text-2xl sm:text-3xl font-normal tracking-wide text-center whitespace-nowrap px-2"
                >
                  Familiar Soul
                </h2>

                {/* Right Metadata */}
                <div className="flex flex-col text-[7.5px] sm:text-[9px] font-sans font-medium tracking-[0.2em] text-stone-700 leading-tight uppercase text-right">
                  <span>#PHOTODESIGN</span>
                  <span>#GROOM-BRIDE</span>
                </div>
              </div>

              {/* Bottom Vertical Photo (Slot 2) */}
              <div className="w-[62%] h-[43%] shadow-xs overflow-hidden bg-stone-100 min-h-0">
                {renderSlot(2, 'w-full h-full')}
              </div>
            </div>

            {/* Right Page (Exact 50% width): 1 Full Bleed Portrait Photo covering 100% of right page */}
            <div className="w-1/2 shrink-0 flex-none h-full min-h-0 overflow-hidden bg-stone-100">
              {renderSlot(0, 'w-full h-full rounded-none')}
            </div>
          </div>
        )}

        {/* Layout Template: Mẫu số 26 (Ordinary Forever) */}
        {templateId === 'album-50x35-ordinary-forever' && (
          <div className="w-full h-full flex bg-white overflow-hidden">
            {/* Left Page (Exact 50% width): 1 Full-bleed background photo + 6 small overlaid photo boxes */}
            <div className="relative w-1/2 shrink-0 flex-none h-full bg-stone-100 overflow-hidden min-h-0 select-none">
              {/* 1 Full Page Background Photo (Slot 1) */}
              <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                {renderSlot(1, 'w-full h-full rounded-none')}
              </div>

              {/* 6 Overlaid Small Photo Boxes (Slots 2-7) in 3x3 layout */}
              <div className="relative z-10 w-full h-full grid grid-cols-3 grid-rows-3 gap-2 sm:gap-2.5 p-3 sm:p-4 min-h-0 pointer-events-none">
                {/* Row 1: Col 1 & 2 Empty (shows background photo with indicator if empty), Col 3 (Slot 2) */}
                <div className="col-span-2 row-span-1 pointer-events-none flex flex-col justify-start p-2 select-none">
                  {!slots[1]?.imageUri && (
                    <div
                      className="pointer-events-auto inline-flex items-center gap-1.5 self-start bg-black/60 hover:bg-black/80 text-white text-[9px] sm:text-[10px] px-2.5 py-1 rounded-md backdrop-blur-xs shadow-sm cursor-pointer transition-colors"
                      onClick={() => {
                        const el = document.getElementById('file-input-1');
                        el?.click();
                      }}
                    >
                      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Ảnh nền toàn trang</span>
                    </div>
                  )}
                </div>
                <div className="w-full h-full min-h-0 shadow-md border-2 border-white/90 bg-white/30 backdrop-blur-2xs overflow-hidden pointer-events-auto rounded-[2px]">
                  {renderSlot(2, 'w-full h-full')}
                </div>

                {/* Row 2: Col 1 (Slot 3), Col 2 (Slot 4), Col 3 (Slot 5) */}
                <div className="w-full h-full min-h-0 shadow-md border-2 border-white/90 bg-white/30 backdrop-blur-2xs overflow-hidden pointer-events-auto rounded-[2px]">
                  {renderSlot(3, 'w-full h-full')}
                </div>
                <div className="w-full h-full min-h-0 shadow-md border-2 border-white/90 bg-white/30 backdrop-blur-2xs overflow-hidden pointer-events-auto rounded-[2px]">
                  {renderSlot(4, 'w-full h-full')}
                </div>
                <div className="w-full h-full min-h-0 shadow-md border-2 border-white/90 bg-white/30 backdrop-blur-2xs overflow-hidden pointer-events-auto rounded-[2px]">
                  {renderSlot(5, 'w-full h-full')}
                </div>

                {/* Row 3: Col 1 (Slot 6), Col 2 (Slot 7), Col 3 Empty (shows background photo) */}
                <div className="w-full h-full min-h-0 shadow-md border-2 border-white/90 bg-white/30 backdrop-blur-2xs overflow-hidden pointer-events-auto rounded-[2px]">
                  {renderSlot(6, 'w-full h-full')}
                </div>
                <div className="w-full h-full min-h-0 shadow-md border-2 border-white/90 bg-white/30 backdrop-blur-2xs overflow-hidden pointer-events-auto rounded-[2px]">
                  {renderSlot(7, 'w-full h-full')}
                </div>
                <div className="pointer-events-none select-none" />
              </div>
            </div>

            {/* Right Page (Exact 50% width): Editorial Title + Portrait Photo + Romantic Badge Quotes */}
            <div className="w-1/2 shrink-0 flex-none h-full p-6 sm:p-8 flex flex-col justify-between bg-white select-none overflow-hidden min-h-0">
              {/* Header Area */}
              <div className="w-full flex items-start justify-between shrink-0 pt-1">
                {/* Title */}
                <div className="flex flex-col select-none leading-none">
                  <span
                    style={{ fontFamily: "'Bodoni Moda', 'Playfair Display', serif" }}
                    className="text-xl sm:text-2xl font-normal tracking-[0.16em] text-stone-900 uppercase"
                  >
                    AN ORDINARY
                  </span>
                  <div className="flex items-baseline -mt-1 sm:-mt-1.5">
                    <span
                      style={{ fontFamily: "'Alex Brush', 'Dancing Script', cursive" }}
                      className="text-2xl sm:text-3xl font-normal text-stone-900 italic mr-1.5 select-none"
                    >
                      Kind
                    </span>
                    <span
                      style={{ fontFamily: "'Bodoni Moda', 'Playfair Display', serif" }}
                      className="text-xl sm:text-2xl font-normal tracking-[0.16em] text-stone-900 uppercase"
                    >
                      OF FOREVER
                    </span>
                  </div>
                </div>

                {/* Right Tags */}
                <div className="flex flex-col text-[7px] sm:text-[8px] font-sans font-medium tracking-[0.2em] text-stone-500 uppercase text-right leading-relaxed select-none">
                  <span>|EDITORIAL NEW|</span>
                  <span>|WEDDING PHOTOBOOK|</span>
                </div>
              </div>

              {/* Middle Section: Centered Portrait Photo (Slot 0) */}
              <div className="w-full flex-1 flex items-center justify-center my-3 min-h-0">
                <div className="w-[66%] h-[92%] shadow-xs overflow-hidden bg-stone-100">
                  {renderSlot(0, 'w-full h-full')}
                </div>
              </div>

              {/* Footer Section: Romantic paragraph with black badges */}
              <div className="w-full shrink-0 pb-1 text-center select-none">
                <p className="text-[6.5px] sm:text-[7.5px] font-sans font-medium uppercase tracking-[0.12em] text-stone-700 leading-[1.65] max-w-[96%] mx-auto">
                  THE STRONGEST BONDS ARE{' '}
                  <span className="bg-black text-white px-1.5 py-0.5 font-serif italic text-[7.5px] sm:text-[8.5px] tracking-normal font-normal">
                    OFTEN FORMED
                  </span>{' '}
                  THROUGH
                  <br />
                  COUNTLESS QUIET MOMENTS RATHER THAN GRAND DECLARATIONS.
                  <br />
                  THEY{' '}
                  <span className="bg-black text-white px-1.5 py-0.5 font-serif italic text-[7.5px] sm:text-[8.5px] tracking-normal font-normal">
                    GROW THROUGH TRUST
                  </span>{' '}
                  SHARED EXPERIENCES, AND THE
                  <br />
                  WILLINGNESS TO STAND TOGETHER THROUGH EVERY CHALLENGE.
                  <br />
                  TODAY, WE{' '}
                  <span className="bg-black text-white px-1.5 py-0.5 font-serif italic text-[7.5px] sm:text-[8.5px] tracking-normal font-normal">
                    CELEBRATE A LOVE
                  </span>{' '}
                  THAT HAS BECOME OUR GREATEST
                  <br />
                  SOURCE OF STRENGTH AND A FUTURE FILLED WITH ENDLESS{' '}
                  <span className="bg-black text-white px-1.5 py-0.5 font-serif italic text-[7.5px] sm:text-[8.5px] tracking-normal font-normal">
                    OPPORTUNITIES
                  </span>
                  <br />
                  TO CREATE BEAUTIFUL MEMORIES.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Layout Template: Mẫu số 27 (Mutual Muse) */}
        {templateId === 'album-50x35-mutual-muse' && (
          <div className="w-full h-full flex bg-white overflow-hidden">
            {/* Left Page (Exact 50% width): 2 Vertical Full-Bleed Photos + Mutual Muse Bottom Overlap */}
            <div className="relative w-1/2 shrink-0 flex-none h-full flex overflow-hidden min-h-0 bg-stone-100">
              {/* Left Photo (Slot 0) */}
              <div className="w-[46%] h-full min-h-0 overflow-hidden bg-stone-200">
                {renderSlot(0, 'w-full h-full rounded-none')}
              </div>
              {/* Right Photo (Slot 1) */}
              <div className="w-[54%] h-full min-h-0 overflow-hidden bg-stone-200">
                {renderSlot(1, 'w-full h-full rounded-none')}
              </div>

              {/* Bottom Overlapping Typography */}
              <div className="absolute left-[24%] bottom-6 sm:bottom-8 z-20 pointer-events-none select-none flex items-baseline drop-shadow-xs">
                <span
                  style={{ fontFamily: "'Bodoni Moda', 'Playfair Display', serif" }}
                  className="text-3xl sm:text-4xl font-normal tracking-wide text-[#8b181b] uppercase"
                >
                  Mutual
                </span>
                <span
                  style={{ fontFamily: "'Alex Brush', 'Dancing Script', cursive" }}
                  className="text-3xl sm:text-4xl font-normal italic text-[#b95d52] -ml-1 select-none"
                >
                  Muse
                </span>
              </div>
            </div>

            {/* Right Page (Exact 50% width): 3x3 Grid with 8 Photos + Center Cherished Moments Box */}
            <div className="w-1/2 shrink-0 flex-none h-full p-5 sm:p-7 flex items-center justify-center bg-white select-none overflow-hidden min-h-0">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-2 sm:gap-2.5 min-h-0">
                {/* Row 1 */}
                <div className="w-full h-full min-h-0 shadow-2xs overflow-hidden bg-stone-100">
                  {renderSlot(2, 'w-full h-full')}
                </div>
                <div className="w-full h-full min-h-0 shadow-2xs overflow-hidden bg-stone-100">
                  {renderSlot(3, 'w-full h-full')}
                </div>
                <div className="w-full h-full min-h-0 shadow-2xs overflow-hidden bg-stone-100">
                  {renderSlot(4, 'w-full h-full')}
                </div>

                {/* Row 2 */}
                <div className="w-full h-full min-h-0 shadow-2xs overflow-hidden bg-stone-100">
                  {renderSlot(5, 'w-full h-full')}
                </div>
                {/* Center Typography Card (Row 2, Col 2) */}
                <div className="w-full h-full bg-white flex flex-col items-center justify-center p-2 text-center select-none shadow-2xs border border-stone-100">
                  <h3
                    style={{ fontFamily: "'Bodoni Moda', 'Playfair Display', serif", letterSpacing: '0.2em' }}
                    className="text-[10px] sm:text-[12px] font-normal text-stone-900 uppercase leading-snug"
                  >
                    CHERISHED
                    <br />
                    MOMENTS
                  </h3>
                  <div className="mt-3 sm:mt-4 text-[7px] sm:text-[8px] font-serif italic text-stone-600 leading-tight">
                    <p>With you,</p>
                    <p>forever is just the beginning.</p>
                  </div>
                </div>
                <div className="w-full h-full min-h-0 shadow-2xs overflow-hidden bg-stone-100">
                  {renderSlot(6, 'w-full h-full')}
                </div>

                {/* Row 3 */}
                <div className="w-full h-full min-h-0 shadow-2xs overflow-hidden bg-stone-100">
                  {renderSlot(7, 'w-full h-full')}
                </div>
                <div className="w-full h-full min-h-0 shadow-2xs overflow-hidden bg-stone-100">
                  {renderSlot(8, 'w-full h-full')}
                </div>
                <div className="w-full h-full min-h-0 shadow-2xs overflow-hidden bg-stone-100">
                  {renderSlot(9, 'w-full h-full')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Layout Template: Mẫu số 28 (Meadow) */}
        {templateId === 'album-50x35-meadow' && (
          <div className="w-full h-full flex bg-white overflow-hidden">
            {/* Left Page (Exact 50% width): 3 Staggered Photos + Meadow Typography + Hashtags */}
            <div className="relative w-1/2 shrink-0 flex-none h-full flex flex-col justify-between py-6 px-6 sm:px-10 bg-white select-none overflow-hidden min-h-0">
              {/* Top Hashtags */}
              <div className="w-full flex items-center justify-between pt-1 px-1 text-[7.5px] sm:text-[9.5px] font-sans font-medium tracking-[0.22em] text-stone-700 uppercase italic select-none">
                <span>#NEWSEASON</span>
                <span>#MOMENTGOLD</span>
                <span>#PREWEDDING</span>
              </div>

              {/* Middle Section: 3 Staggered Portrait Photos with Cherished Moments Watermark */}
              <div className="w-full flex-1 flex items-center justify-between gap-3 sm:gap-4 my-2 min-h-0 relative">
                {/* Left Photo (Slot 1) - Lower */}
                <div className="w-[30%] h-[72%] mt-10 shadow-sm relative overflow-hidden bg-stone-100 min-h-0">
                  {renderSlot(1, 'w-full h-full')}
                  <div className="absolute inset-x-0 bottom-2 text-center pointer-events-none select-none px-1">
                    <span
                      style={{ fontFamily: "'Bodoni Moda', 'Playfair Display', serif", letterSpacing: '0.14em' }}
                      className="text-[6.5px] sm:text-[8px] font-normal uppercase text-white drop-shadow-sm whitespace-nowrap block"
                    >
                      CHERISHED MOMENTS
                    </span>
                    <span className="text-[5px] sm:text-[6px] font-serif italic text-white/95 drop-shadow-sm leading-none block">
                      With you, forever is just the beginning.
                    </span>
                  </div>
                </div>

                {/* Center Photo (Slot 2) - Higher */}
                <div className="w-[34%] h-[84%] -mt-6 shadow-md relative overflow-hidden bg-stone-100 z-10 min-h-0">
                  {renderSlot(2, 'w-full h-full')}
                  <div className="absolute inset-x-0 bottom-3 text-center pointer-events-none select-none px-1">
                    <span
                      style={{ fontFamily: "'Bodoni Moda', 'Playfair Display', serif", letterSpacing: '0.14em' }}
                      className="text-[7.5px] sm:text-[9px] font-normal uppercase text-white drop-shadow-sm whitespace-nowrap block"
                    >
                      CHERISHED MOMENTS
                    </span>
                    <span className="text-[5.5px] sm:text-[6.5px] font-serif italic text-white/95 drop-shadow-sm leading-none block">
                      With you, forever is just the beginning.
                    </span>
                  </div>
                </div>

                {/* Right Photo (Slot 3) - Lower */}
                <div className="w-[30%] h-[72%] mt-10 shadow-sm relative overflow-hidden bg-stone-100 min-h-0">
                  {renderSlot(3, 'w-full h-full')}
                  <div className="absolute inset-x-0 bottom-2 text-center pointer-events-none select-none px-1">
                    <span
                      style={{ fontFamily: "'Bodoni Moda', 'Playfair Display', serif", letterSpacing: '0.14em' }}
                      className="text-[6.5px] sm:text-[8px] font-normal uppercase text-white drop-shadow-sm whitespace-nowrap block"
                    >
                      CHERISHED MOMENTS
                    </span>
                    <span className="text-[5px] sm:text-[6px] font-serif italic text-white/95 drop-shadow-sm leading-none block">
                      With you, forever is just the beginning.
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom: Meadow Typography + Romantic Quote */}
              <div className="w-full shrink-0 flex flex-col items-center text-center pb-2 select-none">
                {/* Meadow Title */}
                <div className="flex items-baseline justify-center select-none leading-none -mb-1">
                  <span
                    style={{ fontFamily: "'Alex Brush', 'Dancing Script', cursive", color: '#15803d' }}
                    className="text-5xl sm:text-7xl font-normal leading-none -mb-2"
                  >
                    M
                  </span>
                  <span
                    style={{ fontFamily: "'Playfair Display', 'Bodoni Moda', serif", color: '#15803d' }}
                    className="text-xs sm:text-sm italic font-normal -ml-1 mr-1"
                  >
                    e.
                  </span>
                  <span
                    style={{ fontFamily: "'Bodoni Moda', 'Playfair Display', serif", color: '#166534', letterSpacing: '0.14em' }}
                    className="text-2xl sm:text-4xl font-normal uppercase leading-none"
                  >
                    ADOW
                  </span>
                </div>
                {/* Quote */}
                <p className="mt-2 text-[6.5px] sm:text-[8px] font-sans font-medium uppercase tracking-[0.12em] text-stone-700 leading-relaxed max-w-[92%] mx-auto">
                  TOGETHER WE DISCOVERED THAT HAPPINESS IS OFTEN FOUND IN THE SMALLEST MOMENTS.
                  <br />
                  A SMILE ACROSS THE ROOM, A GENTLE TOUCH, OR SIMPLY BEING BESIDE ONE
                  <br />
                  ANOTHER CAN BECOME MEMORIES THAT REMAIN MEANINGFUL LONG AFTER THE
                  <br />
                  MOMENT ITSELF HAS PASSED.
                </p>
              </div>
            </div>

            {/* Right Page (Exact 50% width): Full Bleed Photo with Large Cherished Moments Title */}
            <div className="relative w-1/2 shrink-0 flex-none h-full overflow-hidden min-h-0 bg-stone-100">
              {renderSlot(0, 'w-full h-full rounded-none')}
              <div className="absolute inset-x-0 bottom-0 pt-20 pb-8 px-6 sm:px-10 flex flex-col items-center text-center pointer-events-none select-none bg-gradient-to-t from-black/40 via-black/15 to-transparent">
                <h2
                  style={{ fontFamily: "'Bodoni Moda', 'Cinzel', serif", letterSpacing: '0.22em' }}
                  className="text-2xl sm:text-4xl font-normal uppercase text-white tracking-[0.22em] drop-shadow-md whitespace-nowrap"
                >
                  CHERISHED MOMENTS
                </h2>
                <div className="mt-1 sm:mt-1.5 text-xs sm:text-sm font-serif italic text-white/95 drop-shadow-sm leading-tight">
                  <p>With you,</p>
                  <p>forever is just the beginning.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Layout Template: Mẫu số 29 (A Lifetime By Your Side) */}
        {templateId === 'album-50x35-lifetime-side' && (
          <div className="w-full h-full flex bg-white overflow-hidden">
            {/* Left Page (Exact 50% width): Large Framed Portrait Photo */}
            <div className="w-1/2 shrink-0 flex-none h-full p-6 sm:p-10 flex items-center justify-center bg-white min-h-0">
              <div className="w-[84%] h-[88%] shadow-xs overflow-hidden bg-stone-100">
                {renderSlot(0, 'w-full h-full')}
              </div>
            </div>

            {/* Right Page (Exact 50% width): Editorial Multi-photo with Pink Wax Seal & Typography */}
            <div className="w-1/2 shrink-0 flex-none h-full py-6 px-6 sm:px-10 flex flex-col justify-between bg-white select-none overflow-hidden min-h-0">
              {/* Top Row: Landscape Photo (Slot 1) + Pink Wax Seal & Lifetime by your side */}
              <div className="w-full h-[46%] flex items-center justify-between gap-4 min-h-0">
                <div className="w-[54%] h-full shadow-xs overflow-hidden bg-stone-100">
                  {renderSlot(1, 'w-full h-full')}
                </div>
                <div className="flex-1 flex flex-col items-center justify-center pl-2 sm:pl-4 text-center select-none pointer-events-none">
                  {/* Pink Wax Seal */}
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-pink-300 via-rose-300 to-pink-400 shadow-md flex items-center justify-center border border-white/70 mb-2 relative">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 drop-shadow-2xs" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-4.5-4a4 4 0 0 1 3.5 2.05 4 4 0 0 1 3.5-2.05 4 4 0 1 1 2 7.46V19a1 1 0 0 1-1.6.8L12 17.5l-2.9 2.3A1 1 0 0 1 7.5 19v-2.54A4 4 0 1 1 7.5 9z" opacity="0.85" />
                    </svg>
                  </div>
                  <span
                    style={{ fontFamily: "'Bodoni Moda', 'Playfair Display', serif", letterSpacing: '0.16em' }}
                    className="text-base sm:text-xl font-normal uppercase text-stone-900 leading-none whitespace-nowrap"
                  >
                    A LIFETIME
                  </span>
                  <div className="flex items-baseline mt-1 leading-none">
                    <span
                      style={{ fontFamily: "'Bodoni Moda', 'Playfair Display', serif" }}
                      className="text-xs sm:text-sm uppercase font-normal text-stone-800 mr-1.5"
                    >
                      BY
                    </span>
                    <span
                      style={{ fontFamily: "'Alex Brush', 'Dancing Script', cursive" }}
                      className="text-2xl sm:text-3xl font-normal italic text-stone-900 -mb-1"
                    >
                      Your Side
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Detail Photo (Slot 2) + Hashtags, and Tall Detail Photo (Slot 3) */}
              <div className="w-full h-[50%] flex items-end justify-between gap-4 min-h-0">
                <div className="w-[42%] h-full flex flex-col justify-between">
                  <div className="w-full h-[72%] shadow-xs overflow-hidden bg-stone-100">
                    {renderSlot(2, 'w-full h-full')}
                  </div>
                  <div className="flex flex-col text-[7.5px] sm:text-[9px] font-sans font-medium tracking-[0.2em] text-stone-700 leading-relaxed uppercase pb-1 select-none pointer-events-none">
                    <span>#PREWEDDING</span>
                    <span>#MOMENTGOLD</span>
                    <span>#GOODVIBE</span>
                  </div>
                </div>
                <div className="w-[54%] h-full shadow-xs overflow-hidden bg-stone-100">
                  {renderSlot(3, 'w-full h-full')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Layout Template: Mẫu số 30 (Roselune) */}
        {templateId === 'album-50x35-roselune' && (
          <div className="w-full h-full flex bg-white overflow-hidden">
            {/* Left Page (Exact 50% width): Large Portrait with Cherished Moments Overlay */}
            <div className="w-1/2 shrink-0 flex-none h-full p-6 sm:p-10 flex items-center justify-center bg-white min-h-0 relative">
              <div className="w-[84%] h-[88%] shadow-xs overflow-hidden bg-stone-100 relative">
                {renderSlot(0, 'w-full h-full')}
                <div className="absolute inset-x-0 bottom-[22%] text-center pointer-events-none select-none px-4">
                  <h3
                    style={{ fontFamily: "'Bodoni Moda', 'Cinzel', serif", letterSpacing: '0.22em' }}
                    className="text-xl sm:text-2xl font-normal uppercase text-white drop-shadow-md whitespace-nowrap"
                  >
                    CHERISHED MOMENTS
                  </h3>
                  <p className="text-[10px] sm:text-xs font-serif italic text-white/95 drop-shadow-sm mt-0.5">
                    With you, forever is just the beginning.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Page (Exact 50% width): Editorial Layout with Top Photo, Quote, Vertical Roselune & 2 Detail Photos */}
            <div className="w-1/2 shrink-0 flex-none h-full py-6 px-6 sm:px-10 flex flex-col justify-between bg-white select-none overflow-hidden min-h-0">
              {/* Top Row: Landscape Photo (Slot 1) with Cherished Moments + Black bar Quote */}
              <div className="w-full h-[46%] flex items-center justify-between gap-4 min-h-0">
                <div className="w-[54%] h-full shadow-xs overflow-hidden bg-stone-100 relative">
                  {renderSlot(1, 'w-full h-full')}
                  <div className="absolute inset-x-0 bottom-2 text-center pointer-events-none select-none px-1">
                    <span
                      style={{ fontFamily: "'Bodoni Moda', 'Playfair Display', serif", letterSpacing: '0.14em' }}
                      className="text-[7.5px] sm:text-[9px] font-normal uppercase text-white drop-shadow-sm whitespace-nowrap block"
                    >
                      CHERISHED MOMENTS
                    </span>
                    <span className="text-[5.5px] sm:text-[6.5px] font-serif italic text-white/95 drop-shadow-sm leading-none block">
                      With you, forever is just the beginning.
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex items-center pl-2 sm:pl-4 select-none pointer-events-none">
                  <div className="border-l-2 border-black pl-3 py-1">
                    <p className="text-[7.5px] sm:text-[8.5px] font-sans font-medium uppercase tracking-[0.14em] text-stone-900 leading-[1.6]">
                      TOGETHER WE DISCOVERED A LOVE
                      <br />
                      THAT FEELS CALM, SINCERE, AND
                      <br />
                      ENDLESS,
                      <br />
                      LIKE SUNLIGHT RESTING GENTLY
                      <br />
                      THROUGH A QUIET MORNING
                      <br />
                      WINDOW.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Vertical Roselune text + 2 Detail Photos (Slot 2 & Slot 3) */}
              <div className="w-full h-[50%] flex items-end justify-between gap-3 min-h-0">
                {/* Vertical Roselune */}
                <div className="flex items-center justify-center shrink-0 pr-1 sm:pr-2 select-none pointer-events-none">
                  <span
                    style={{
                      fontFamily: "'Bodoni Moda', 'Playfair Display', serif",
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      letterSpacing: '0.08em',
                    }}
                    className="text-2xl sm:text-3xl font-normal text-stone-900 select-none"
                  >
                    Roselune
                  </span>
                </div>

                {/* Slot 2 (Medium portrait) */}
                <div className="w-[38%] h-[80%] shadow-xs overflow-hidden bg-stone-100">
                  {renderSlot(2, 'w-full h-full')}
                </div>

                {/* Slot 3 (Large portrait) */}
                <div className="w-[50%] h-full shadow-xs overflow-hidden bg-stone-100">
                  {renderSlot(3, 'w-full h-full')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Layout Template: Mẫu số 31 (Quietly Yours) */}
        {templateId === 'album-50x35-quietly-seals' && (
          <div className="w-full h-full flex bg-white overflow-hidden">
            {/* Left Page (Exact 50% width): Large Framed Portrait Photo */}
            <div className="w-1/2 shrink-0 flex-none h-full p-6 sm:p-10 flex items-center justify-center bg-white min-h-0">
              <div className="w-[84%] h-[84%] shadow-xs overflow-hidden bg-stone-100">
                {renderSlot(0, 'w-full h-full')}
              </div>
            </div>

            {/* Right Page (Exact 50% width): Top Triptych (3 photos) + Heart Wax Seal + QUIETLY YOURS + Send to her! */}
            <div className="w-1/2 shrink-0 flex-none h-full py-6 px-6 sm:px-10 flex flex-col justify-between bg-white select-none overflow-hidden min-h-0">
              {/* Top Row: 3 Photos Triptych (Slot 1, Slot 2, Slot 3) */}
              <div className="w-full h-[45%] flex items-center justify-between gap-2.5 sm:gap-3.5 pt-2 min-h-0">
                <div className="w-1/3 h-full shadow-xs overflow-hidden bg-stone-100">
                  {renderSlot(1, 'w-full h-full')}
                </div>
                <div className="w-1/3 h-full shadow-xs overflow-hidden bg-stone-100">
                  {renderSlot(2, 'w-full h-full')}
                </div>
                <div className="w-1/3 h-full shadow-xs overflow-hidden bg-stone-100">
                  {renderSlot(3, 'w-full h-full')}
                </div>
              </div>

              {/* Bottom Section: Heart Wax Seal + QUIETLY YOURS Typography + Quote & Calligraphy */}
              <div className="w-full flex-1 flex flex-col items-center justify-center select-none pointer-events-none mt-2">
                {/* Heart Wax Seal */}
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-gradient-to-br from-[#801b1b] via-[#601212] to-[#400808] shadow-md flex items-center justify-center border border-[#a83232]/50 relative mb-1.5">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#b93b3b] drop-shadow-inner" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>

                {/* Title */}
                <h2
                  style={{ fontFamily: "'Bodoni Moda', 'Playfair Display', serif", fontWeight: 900, letterSpacing: '0.08em' }}
                  className="text-3xl sm:text-4xl font-black uppercase text-center text-stone-900 leading-none tracking-wider whitespace-nowrap"
                >
                  QUIETLY YOURS
                </h2>

                {/* Subtitle Columns */}
                <div className="w-full flex items-center justify-between px-2 pt-2 sm:pt-3">
                  {/* Left Column: Quote */}
                  <div className="text-left">
                    <p
                      style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}
                      className="text-[10px] sm:text-xs text-stone-700 leading-tight"
                    >
                      Love quietly transforms
                      <br />
                      ordinary moments into memories
                      <br />
                      that continue glowing softly
                      <br />
                      throughout our lives.
                    </p>
                  </div>

                  {/* Right Column: Send to her */}
                  <div className="text-right flex items-center justify-end">
                    <span
                      style={{ fontFamily: "'Alex Brush', 'Dancing Script', cursive" }}
                      className="text-3xl sm:text-4xl font-normal italic text-stone-900 leading-none select-none"
                    >
                      Send to her!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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

        {/* SAFE ZONE & PRINT GUIDE OVERLAY (Hiển thị Vùng Cắt Xén, Khung An Toàn & Đường Gióng Căn Chỉnh) */}
        {!isExporting && (posterSettings.showCutZone || posterSettings.showSafeZone || posterSettings.showGuides) && (
          <div className="absolute inset-0 z-30 pointer-events-none select-none overflow-hidden">
            {/* 1. CUT ZONE (Vùng cắt xén / Bleed Trim Margin: viền đỏ nhạt mép ngoài) */}
            {posterSettings.showCutZone && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  border: '14px solid rgba(244, 63, 94, 0.12)',
                  boxShadow: 'inset 0 0 0 1px rgba(239, 68, 68, 0.5)',
                }}
              />
            )}

            {/* 2. SAFE ZONE (Vùng an toàn - 2 khung viền Cyan trên trang Trái & trang Phải) */}
            {posterSettings.showSafeZone && (
              <>
                {/* Left Page Safe Zone */}
                <div 
                  className="absolute pointer-events-none"
                  style={{
                    top: '4.5%',
                    bottom: '4.5%',
                    left: '3.5%',
                    right: '51.5%',
                    border: '1.5px solid #06b6d4',
                    boxShadow: '0 0 0 0.5px rgba(6, 182, 212, 0.7)',
                  }}
                />

                {/* Right Page Safe Zone */}
                <div 
                  className="absolute pointer-events-none"
                  style={{
                    top: '4.5%',
                    bottom: '4.5%',
                    left: '51.5%',
                    right: '3.5%',
                    border: '1.5px solid #06b6d4',
                    boxShadow: '0 0 0 0.5px rgba(6, 182, 212, 0.7)',
                  }}
                />
              </>
            )}

            {/* 3. PRINT GUIDES (Đường gióng tâm trang, đường gáy giữa & nếp gấp) */}
            {posterSettings.showGuides && (
              <>
                {/* Center Spine Line (Đường gáy chính giữa 50%) */}
                <div 
                  className="absolute top-0 bottom-0 pointer-events-none"
                  style={{
                    left: '50%',
                    width: '1px',
                    backgroundColor: 'rgba(239, 68, 68, 0.75)',
                    zIndex: 2,
                  }}
                />

                {/* Spine Gutter Guide Lines (2 đường nếp gấp 2 bên gáy) */}
                <div 
                  className="absolute top-0 bottom-0 pointer-events-none"
                  style={{
                    left: '48.5%',
                    width: '1px',
                    backgroundColor: 'rgba(6, 182, 212, 0.85)',
                  }}
                />
                <div 
                  className="absolute top-0 bottom-0 pointer-events-none"
                  style={{
                    left: '51.5%',
                    width: '1px',
                    backgroundColor: 'rgba(6, 182, 212, 0.85)',
                  }}
                />

                {/* Horizontal Center Guide (Trục ngang 50%) */}
                <div 
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{
                    top: '50%',
                    height: '1px',
                    backgroundColor: 'rgba(6, 182, 212, 0.75)',
                  }}
                />

                {/* Left Page Quarter Guide (Trục dọc 25% chia đôi trang trái) */}
                <div 
                  className="absolute top-0 bottom-0 pointer-events-none"
                  style={{
                    left: '25%',
                    width: '1px',
                    backgroundColor: 'rgba(6, 182, 212, 0.65)',
                  }}
                />

                {/* Right Page Quarter Guide (Trục dọc 75% chia đôi trang phải) */}
                <div 
                  className="absolute top-0 bottom-0 pointer-events-none"
                  style={{
                    left: '75%',
                    width: '1px',
                    backgroundColor: 'rgba(6, 182, 212, 0.65)',
                  }}
                />
              </>
            )}
          </div>
        )}
      </div>

        {/* Bottom Legend Bar - Ẩn theo yêu cầu người dùng */}
      </div>
    </div>
  );
};
