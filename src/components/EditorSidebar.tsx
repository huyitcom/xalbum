import React, { useState } from 'react';
import {
  TemplateId,
  TextConfig,
  PosterSettings,
  AspectRatioType,
  CustomTextElement,
} from '../types';
import {
  BASIC_TEMPLATES,
  WITH_TEXT_TEMPLATES,
  VIP_TEMPLATES,
  COVER_TEMPLATES,
  BG_PRESETS,
  OVERLAY_SVG,
} from '../data/constants';
import {
  LayoutGrid,
  Palette,
  Check,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  CopyCheck,
  Sparkles,
  Type,
  Heart,
  Calendar,
  Plus,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { imageOptimizer, OptimizedImage } from '../utils/imageOptimizer';
import { useEffect } from 'react';

interface EditorSidebarProps {
  templateId: TemplateId;
  onChangeTemplate: (id: TemplateId) => void;
  onApplyTemplateToAll?: (id: TemplateId) => void;
  textConfig?: TextConfig;
  onChangeTextConfig?: (updated: TextConfig) => void;
  onApplyTextConfigToAll?: (updated: TextConfig) => void;
  customTexts?: CustomTextElement[];
  onOpenAddTextModal?: () => void;
  onUpdateCustomText?: (updated: CustomTextElement) => void;
  onDeleteCustomText?: (id: string) => void;
  selectedTextId?: string | null;
  onSelectText?: (id: string | null) => void;
  posterSettings: PosterSettings;
  onChangePosterSettings: (updated: PosterSettings) => void;
  onAutoFill?: (imageIds: string[]) => void;
  totalEmptySlotsCount?: number;
  usedImageIds?: string[];
  missingImagesCount?: number;
  onSmartRelink?: () => void;
  onClearAllImages?: (clearFromPages?: boolean) => void;
  currentPageSlots?: import('../types').FrameSlot[];
  onApplyThemeSet?: (themeId: string) => void;
}


export const ThumbnailSlot: React.FC<{ slot?: import('../types').FrameSlot; placeholder?: React.ReactNode; className?: string }> = ({ slot, placeholder, className = '' }) => {
  const imageUri = slot?.imageUri;
  if (!imageUri) return <>{placeholder}</>;
  
  let finalSrc = imageUri;
  if (typeof finalSrc === 'string' && finalSrc.startsWith('img_')) {
    const optimized = imageOptimizer.getImage(finalSrc);
    if (optimized) {
      finalSrc = optimized.thumbnailUrl || optimized.previewUrl;
    } else {
      return <>{placeholder || <div className="absolute inset-0 bg-stone-200 flex items-center justify-center text-stone-400 text-[8px]" />}</>;
    }
  }
  return (
    <img
      src={finalSrc}
      alt=""
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.style.display = 'none';
      }}
      className={`absolute inset-0 w-full h-full object-cover rounded-[2px] ${className}`}
    />
  );
};

export const TemplateThumbnail: React.FC<{ id?: string; slots?: import('../types').FrameSlot[]; className?: string }> = ({ id, slots, className = '' }) => {
  if (!id || typeof id !== 'string') {
    return <div className={`w-full h-full bg-stone-100 rounded-[2px] ${className}`} />;
  }

  // --- COVER TEMPLATES (Bìa Album Photobook) ---
  if (id === 'cover-classic-wrap') {
    return (
      <div className={`w-full h-full bg-[#fdfbf7] p-0.5 flex select-none overflow-hidden border border-amber-900/10 ${className}`}>
        {/* Back Cover (Left) */}
        <div className="w-[47%] h-full flex flex-col items-center justify-between p-1 bg-stone-100/70 rounded-[1px] border border-amber-800/10">
          <div className="w-2.5 h-2.5 rounded-full border border-amber-600/40 flex items-center justify-center text-[4px] text-amber-700 font-serif">M</div>
          <div className="w-6 h-6 rounded-full bg-stone-300 relative overflow-hidden border border-amber-600/30">
            <ThumbnailSlot slot={slots?.[1]} />
          </div>
          <div className="text-[3.5px] text-stone-500 text-center leading-[3.5px]">
            <span className="italic opacity-60">printed by</span><br />
            <span className="font-semibold uppercase tracking-tighter">PHOTOBOOK VIETNAM</span>
          </div>
        </div>

        {/* Spine (Center) */}
        <div className="w-[6%] h-full bg-stone-200/90 border-x border-amber-800/20 flex flex-col items-center justify-center">
          <div className="w-[1px] h-full bg-amber-700/20" />
        </div>

        {/* Front Cover (Right) */}
        <div className="w-[47%] h-full flex flex-col items-center justify-between p-1 bg-amber-50/40 rounded-[1px] border border-amber-800/20">
          <div className="text-[5px] font-serif font-bold text-amber-900 tracking-widest uppercase">WEDDING</div>
          <div className="w-11 h-8 bg-stone-300 rounded-[1px] relative overflow-hidden shadow-2xs border border-amber-600/30">
            <ThumbnailSlot slot={slots?.[0]} />
          </div>
          <div className="text-[4px] font-serif text-stone-700 font-semibold truncate max-w-full">ALBUM CƯỚI</div>
        </div>
      </div>
    );
  }

  if (id === 'cover-editorial-vogue') {
    return (
      <div className={`w-full h-full bg-[#f8f8f8] p-0.5 flex select-none overflow-hidden border border-stone-200 ${className}`}>
        {/* Back Cover */}
        <div className="w-[47%] h-full flex flex-col items-center justify-between p-1 bg-white rounded-[1px]">
          <div className="text-[4px] font-mono tracking-widest text-stone-500">THE ARCHIVE</div>
          <div className="flex gap-0.5 w-full h-5">
            <div className="w-1/2 h-full bg-stone-300 relative overflow-hidden rounded-[1px]"><ThumbnailSlot slot={slots?.[1]} /></div>
            <div className="w-1/2 h-full bg-stone-300 relative overflow-hidden rounded-[1px]"><ThumbnailSlot slot={slots?.[2]} /></div>
          </div>
          <div className="w-4 h-1 bg-stone-800/10 rounded-[1px]" />
        </div>

        {/* Spine */}
        <div className="w-[6%] h-full bg-stone-800 text-white flex items-center justify-center">
          <div className="text-[3px] font-mono tracking-tighter uppercase rotate-90 whitespace-nowrap">VOGUE</div>
        </div>

        {/* Front Cover */}
        <div className="w-[47%] h-full relative overflow-hidden rounded-[1px] bg-stone-900 text-white">
          <ThumbnailSlot slot={slots?.[0]} className="opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40 flex flex-col justify-between p-0.5">
            <div className="text-[5px] font-serif font-black tracking-widest text-white leading-none">THE WEDDING</div>
            <div className="text-[4px] font-sans text-stone-200 font-bold uppercase truncate">SPECIAL ISSUE</div>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'cover-minimalist-embossed') {
    return (
      <div className={`w-full h-full bg-[#f5f4f0] p-0.5 flex select-none overflow-hidden border border-stone-200 ${className}`}>
        {/* Back Cover */}
        <div className="w-[47%] h-full flex flex-col items-center justify-center p-1 bg-stone-100/60 rounded-[1px]">
          <div className="w-3 h-3 rounded-full border border-stone-400/40 flex items-center justify-center text-[4px] text-stone-600 font-serif">♥</div>
          <div className="text-[4px] text-stone-400 font-serif mt-0.5">FOREVER</div>
        </div>

        {/* Spine */}
        <div className="w-[6%] h-full bg-stone-200/80 border-x border-stone-300/60" />

        {/* Front Cover */}
        <div className="w-[47%] h-full flex flex-col items-center justify-center p-1 bg-white rounded-[1px] border border-stone-200/80 shadow-2xs">
          <div className="text-[4.5px] font-sans text-stone-500 tracking-wider uppercase mb-0.5">MEMORIES</div>
          <div className="w-8 h-8 bg-stone-300 relative overflow-hidden rounded-[1px] shadow-inner border border-stone-300">
            <ThumbnailSlot slot={slots?.[0]} />
          </div>
          <div className="text-[4px] font-serif text-stone-800 font-semibold mt-0.5 truncate max-w-full">OUR WEDDING</div>
        </div>
      </div>
    );
  }

  if (id === 'cover-all-we-need-is-love') {
    return (
      <div className={`w-full h-full bg-[#faf9f5] p-0.5 flex select-none overflow-hidden border border-stone-200 ${className}`}>
        {/* Back Cover (Left) */}
        <div className="w-[47%] h-full flex flex-col items-center justify-between p-1 bg-white rounded-[1px] border border-stone-200/60">
          <div className="text-[3px] font-serif text-stone-500 italic">our story</div>
          <div className="w-6 h-6 bg-stone-200 relative overflow-hidden rounded-[1px] shadow-2xs border border-stone-300">
            <ThumbnailSlot slot={slots?.[3]} />
          </div>
          <div className="text-[2.5px] text-stone-400 text-center leading-[3px]">
            <span className="italic opacity-60">printed by</span><br />
            <span className="font-semibold uppercase tracking-tighter">PHOTOBOOK VIETNAM</span>
          </div>
        </div>

        {/* Spine (Center) */}
        <div className="w-[6%] h-full bg-stone-100 border-x border-stone-300/60 flex items-center justify-center">
          <div className="w-[0.5px] h-full bg-stone-300" />
        </div>

        {/* Front Cover (Right) */}
        <div className="w-[47%] h-full relative overflow-hidden bg-white p-0.5 rounded-[1px] border border-stone-200/60">
          <div className="w-full h-full relative overflow-hidden bg-white">
            {/* Top-Left text */}
            <div className="absolute top-[2%] left-[2%] z-20 text-[3.5px] font-bold text-stone-800 leading-tight">
              All we need<br />is love...
            </div>
            {/* Top-Right triangle */}
            <div 
              className="absolute bg-stone-300"
              style={{ top: 0, left: '55%', width: '45%', height: '52%', clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%)' }}
            >
              <ThumbnailSlot slot={slots?.[1]} />
            </div>
            {/* Bottom-Left triangle */}
            <div 
              className="absolute bg-stone-300"
              style={{ top: '60%', left: 0, width: '56%', height: '40%', clipPath: 'polygon(0% 0%, 100% 100%, 0% 100%)' }}
            >
              <ThumbnailSlot slot={slots?.[2]} />
            </div>
            {/* Center hero */}
            <div 
              className="absolute inset-0 bg-stone-400"
              style={{ clipPath: 'polygon(0% 56%, 55% 17%, 98% 56%, 100% 100%, 60% 100%)' }}
            >
              <ThumbnailSlot slot={slots?.[0]} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- BASIC TEMPLATES (23 Clean Photo Layouts matching album design standard) ---
  if (id === 'basic-full-bleed') {
    return (
      <div className={`w-full h-full bg-white p-1 select-none overflow-hidden ${className}`}>
        <div className="w-full h-full bg-stone-300 rounded-[2px] relative overflow-hidden flex items-center justify-center">
          <ThumbnailSlot slot={slots?.[0]} placeholder="" />
        </div>
      </div>
    );
  }

  if (id === 'basic-preserve-ratio-2') {
    return (
      <div className={`w-full h-full bg-white p-1 flex gap-1.5 items-center select-none overflow-hidden ${className}`}>
        <div className="w-1/2 h-full flex items-center justify-center p-0.5">
          <div className="w-full h-[65%] bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
        </div>
        <div className="w-1/2 h-full flex items-center justify-center p-0.5">
          <div className="w-[65%] h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
        </div>
      </div>
    );
  }

  if (id === 'basic-spread-2-vertical') {
    return (
      <div className={`w-full h-full bg-white p-1 flex gap-1 select-none overflow-hidden ${className}`}>
        <div className="w-1/2 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
        <div className="w-1/2 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
      </div>
    );
  }

  if (id === 'basic-left-feature-2right') {
    return (
      <div className={`w-full h-full bg-white p-1 flex gap-1 select-none overflow-hidden ${className}`}>
        <div className="w-1/2 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
        <div className="w-1/2 h-full flex flex-col gap-1">
          <div className="w-full h-1/2 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
          <div className="w-full h-1/2 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} /></div>
        </div>
      </div>
    );
  }

  if (id === 'basic-right-feature-2left') {
    return (
      <div className={`w-full h-full bg-white p-1 flex gap-1 select-none overflow-hidden ${className}`}>
        <div className="w-1/2 h-full flex flex-col gap-1">
          <div className="w-full h-1/2 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
          <div className="w-full h-1/2 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
        </div>
        <div className="w-1/2 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} /></div>
      </div>
    );
  }

  if (id === 'basic-four-grid') {
    return (
      <div className={`w-full h-full bg-white p-1 grid grid-cols-2 grid-rows-2 gap-1 select-none overflow-hidden ${className}`}>
        <div className="w-full h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
        <div className="w-full h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
        <div className="w-full h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} /></div>
        <div className="w-full h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[3]} /></div>
      </div>
    );
  }

  if (id === 'basic-panorama-top') {
    return (
      <div className={`w-full h-full bg-white p-1 flex flex-col gap-1 select-none overflow-hidden ${className}`}>
        <div className="w-full h-[45%] bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
        <div className="w-full h-[55%] flex gap-1">
          <div className="w-1/2 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
          <div className="w-1/2 h-full flex flex-col gap-1">
            <div className="w-full h-1/2 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} /></div>
            <div className="w-full h-1/2 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[3]} /></div>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'basic-skewed-grid') {
    return (
      <div className={`w-full h-full bg-white p-1 flex flex-col gap-1 select-none overflow-hidden ${className}`}>
        <div className="w-full h-1/2 flex gap-1">
          <div className="w-[58%] h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
          <div className="w-[42%] h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
        </div>
        <div className="w-full h-1/2 flex gap-1">
          <div className="w-[42%] h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} /></div>
          <div className="w-[58%] h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[3]} /></div>
        </div>
      </div>
    );
  }

  if (id === 'basic-stack-right-3') {
    return (
      <div className={`w-full h-full bg-white p-1 flex gap-1 select-none overflow-hidden ${className}`}>
        <div className="w-[55%] h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
        <div className="w-[45%] h-full flex flex-col gap-0.5">
          <div className="w-full h-1/3 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
          <div className="w-full h-1/3 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} /></div>
          <div className="w-full h-1/3 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[3]} /></div>
        </div>
      </div>
    );
  }

  if (id === 'basic-story-5') {
    return (
      <div className={`w-full h-full bg-white p-1 flex flex-col gap-1 select-none overflow-hidden ${className}`}>
        <div className="w-full h-[58%] bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
        <div className="w-full h-[42%] flex gap-0.5">
          <div className="w-1/4 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
          <div className="w-1/4 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} /></div>
          <div className="w-1/4 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[3]} /></div>
          <div className="w-1/4 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[4]} /></div>
        </div>
      </div>
    );
  }

  if (id === 'basic-stack-left-3') {
    return (
      <div className={`w-full h-full bg-white p-1 flex gap-1 select-none overflow-hidden ${className}`}>
        <div className="w-[45%] h-full flex flex-col gap-0.5">
          <div className="w-full h-1/3 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
          <div className="w-full h-1/3 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
          <div className="w-full h-1/3 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} /></div>
        </div>
        <div className="w-[55%] h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[3]} /></div>
      </div>
    );
  }

  if (id === 'basic-left-2split-feature') {
    return (
      <div className={`w-full h-full bg-white p-1 flex gap-1 select-none overflow-hidden ${className}`}>
        <div className="w-[38%] h-full flex flex-col gap-1">
          <div className="w-full h-1/2 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
          <div className="w-full h-1/2 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
        </div>
        <div className="w-[62%] h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} /></div>
      </div>
    );
  }

  if (id === 'basic-unequal-split-2') {
    return (
      <div className={`w-full h-full bg-white p-1 flex gap-1 select-none overflow-hidden ${className}`}>
        <div className="w-[40%] h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
        <div className="w-[60%] h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
      </div>
    );
  }

  if (id === 'basic-trio-left') {
    return (
      <div className={`w-full h-full bg-white p-1 flex gap-1 select-none overflow-hidden ${className}`}>
        <div className="w-1/2 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
        <div className="w-1/2 h-full flex flex-col gap-1">
          <div className="w-full h-1/2 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
          <div className="w-full h-1/2 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} /></div>
        </div>
      </div>
    );
  }

  if (id === 'basic-main-left-portrait') {
    return (
      <div className={`w-full h-full bg-white p-1 flex gap-1 select-none overflow-hidden ${className}`}>
        <div className="w-[65%] h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
        <div className="w-[35%] h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
      </div>
    );
  }

  if (id === 'basic-center-landscape-pair') {
    return (
      <div className={`w-full h-full bg-white p-1 flex gap-1.5 select-none overflow-hidden ${className}`}>
        <div className="w-1/2 h-full flex items-center justify-center p-0.5">
          <div className="w-full h-[65%] bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
        </div>
        <div className="w-1/2 h-full flex items-center justify-center p-0.5">
          <div className="w-full h-[65%] bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
        </div>
      </div>
    );
  }

  if (id === 'basic-portrait-two-right') {
    return (
      <div className={`w-full h-full bg-white p-1 flex gap-1 select-none overflow-hidden ${className}`}>
        <div className="w-1/2 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
        <div className="w-1/2 h-full flex gap-0.5">
          <div className="w-1/2 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
          <div className="w-1/2 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} /></div>
        </div>
      </div>
    );
  }

  if (id === 'basic-four-vertical-columns') {
    return (
      <div className={`w-full h-full bg-white p-1 flex gap-0.5 select-none overflow-hidden ${className}`}>
        <div className="w-1/4 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
        <div className="w-1/4 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
        <div className="w-1/4 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} /></div>
        <div className="w-1/4 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[3]} /></div>
      </div>
    );
  }

  if (id === 'basic-four-asymmetric') {
    return (
      <div className={`w-full h-full bg-white p-1 flex gap-1 select-none overflow-hidden ${className}`}>
        <div className="w-1/2 h-full flex flex-col gap-0.5">
          <div className="w-full h-1/2 flex gap-0.5">
            <div className="w-1/2 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
            <div className="w-1/2 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
          </div>
          <div className="w-full h-1/2 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} /></div>
        </div>
        <div className="w-1/2 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[3]} /></div>
      </div>
    );
  }

  if (id === 'basic-mosaic-story') {
    return (
      <div className={`w-full h-full bg-white p-1 flex gap-1 select-none overflow-hidden ${className}`}>
        <div className="w-1/2 h-full flex flex-col gap-0.5">
          <div className="w-full h-[35%] bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
          <div className="w-full h-[65%] bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
        </div>
        <div className="w-1/2 h-full flex flex-col gap-0.5">
          <div className="w-full h-1/3 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} /></div>
          <div className="w-full h-1/3 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[3]} /></div>
          <div className="w-full h-1/3 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[4]} /></div>
        </div>
      </div>
    );
  }

  if (id === 'basic-left-feature-right-2vert') {
    return (
      <div className={`w-full h-full bg-white p-1 flex gap-1 select-none overflow-hidden ${className}`}>
        <div className="w-1/2 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
        <div className="w-1/2 h-full flex flex-col gap-1">
          <div className="w-full h-1/2 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
          <div className="w-full h-1/2 bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} /></div>
        </div>
      </div>
    );
  }

  if (id === 'basic-left-primary-right-secondary') {
    return (
      <div className={`w-full h-full bg-white p-1 flex gap-1 select-none overflow-hidden ${className}`}>
        <div className="w-[58%] h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
        <div className="w-[42%] h-full flex items-center justify-center p-0.5">
          <div className="w-[85%] h-[80%] bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
        </div>
      </div>
    );
  }

  if (id === 'basic-left-primary-right-mosaic') {
    return (
      <div className={`w-full h-full bg-white p-1 flex gap-1 select-none overflow-hidden ${className}`}>
        <div className="w-1/2 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
        <div className="w-1/2 h-full grid grid-cols-2 grid-rows-2 gap-0.5">
          <div className="w-full h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
          <div className="w-full h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} /></div>
          <div className="w-full h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[3]} /></div>
          <div className="w-full h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[4]} /></div>
        </div>
      </div>
    );
  }

  // --- WITH-TEXT TEMPLATES ---
  if (id === 'album-50x35-memories') {
    return (
      <div className={`w-full h-full bg-white p-1.5 flex gap-1 items-center select-none overflow-hidden ${className}`}>
        {/* Left Page (50%) */}
        <div className="w-1/2 h-full bg-stone-200 rounded-[2px] flex items-center justify-center text-[7px] text-stone-400 font-bold relative overflow-hidden flex-1">
          <ThumbnailSlot slot={slots?.[0]} placeholder="1" />
        </div>
        {/* Right Page (50%) */}
        <div className="w-1/2 h-full flex gap-1 items-center flex-1">
          <div className="w-1/2 h-full flex flex-col gap-1">
            <div className="w-full h-[50%] bg-stone-200 rounded-[2px] flex items-center justify-center text-[6px] text-stone-400 relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} placeholder="2" /></div>
            <div className="w-full h-[50%] bg-stone-200 rounded-[2px] flex items-center justify-center text-[6px] text-stone-400 relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} placeholder="3" /></div>
          </div>
          <div className="w-1/2 h-full flex flex-col items-center justify-center px-0.5 text-center">
            <span className="text-[6px] font-serif text-amber-800 font-bold italic scale-90">Memories</span>
            <div className="w-full space-y-0.5 mt-0.5">
              <div className="w-4/5 mx-auto h-[1.5px] bg-stone-300 rounded-full" />
              <div className="w-3/5 mx-auto h-[1.5px] bg-stone-300 rounded-full" />
              <div className="w-2/3 mx-auto h-[1.5px] bg-stone-300 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-in-the-air') {
    return (
      <div className={`w-full h-full bg-white p-1.5 relative flex items-center select-none overflow-hidden ${className}`}>
        <div className="absolute inset-1 border border-[#8c7362]/60 rounded-[1px] pointer-events-none" />
        <div className="w-1/2 h-full flex flex-col items-center justify-between py-1 px-1 z-10 flex-1">
          <span className="text-[5px] font-serif text-stone-700 uppercase tracking-widest font-bold">LOVE IS</span>
          <div className="w-[90%] h-[55%] bg-stone-200 rounded-[2px] flex items-center justify-center text-[6px] text-stone-400 relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} placeholder="1" /></div>
          <div className="w-4/5 h-[1.5px] bg-stone-300 rounded-full" />
        </div>
        <div className="w-1/2 h-full flex items-center justify-center p-1 z-10 flex-1">
          <div className="w-[80%] h-[88%] bg-stone-200 rounded-[2px] flex items-center justify-center text-[7px] text-stone-400 font-bold relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} placeholder="2" /></div>
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-celebrate') {
    return (
      <div className={`w-full h-full bg-white p-1.5 flex gap-1 items-center select-none overflow-hidden ${className}`}>
        {/* Left Page (50%) */}
        <div className="w-1/2 h-full bg-stone-200 rounded-[2px] flex items-center justify-center text-[7px] text-stone-400 font-bold relative overflow-hidden flex-1">
          <ThumbnailSlot slot={slots?.[0]} placeholder="1" />
        </div>
        {/* Right Page (50%) */}
        <div className="w-1/2 h-full flex flex-col justify-between flex-1">
          <div className="w-full h-[70%] flex gap-1">
            <div className="w-[54%] h-full bg-stone-200 rounded-[2px] flex items-center justify-center text-[6px] text-stone-400 relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} placeholder="2" /></div>
            <div className="w-[46%] h-full flex flex-col gap-1">
              <div className="w-full h-[50%] bg-stone-200 rounded-[2px] flex items-center justify-center text-[5px] text-stone-400 relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} placeholder="3" /></div>
              <div className="w-full h-[50%] bg-stone-200 rounded-[2px] flex items-center justify-center text-[5px] text-stone-400 relative overflow-hidden"><ThumbnailSlot slot={slots?.[3]} placeholder="4" /></div>
            </div>
          </div>
          <div className="w-full h-[25%] flex flex-col items-center justify-center">
            <div className="w-4/5 h-[1.5px] bg-stone-300 rounded-full mb-0.5" />
            <span className="text-[5px] font-serif text-stone-600 italic">Celebrate</span>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-shared-dreams') {
    return (
      <div className={`w-full h-full bg-white p-1.5 flex gap-1 items-center select-none overflow-hidden ${className}`}>
        <div className="w-[49%] h-full bg-stone-200 rounded-[2px] flex items-center justify-center text-[7px] text-stone-400 font-bold relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} placeholder="1" /></div>
        <div className="w-[51%] h-full flex flex-col justify-between p-0.5">
          <div className="text-right">
            <span className="text-[5px] font-serif text-[#b87b64] italic font-bold">Shared Dreams</span>
          </div>
          <div className="w-full flex gap-1 justify-center my-auto h-[50%]">
            <div className="w-1/2 h-full bg-stone-200 rounded-[2px] flex items-center justify-center text-[5.5px] text-stone-400 relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} placeholder="2" /></div>
            <div className="w-1/2 h-full bg-stone-200 rounded-[2px] flex items-center justify-center text-[5.5px] text-stone-400 relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} placeholder="3" /></div>
          </div>
          <div className="w-full space-y-0.5">
            <div className="w-full h-[1.5px] bg-stone-300 rounded-full" />
            <div className="w-3/4 h-[1.5px] bg-stone-300 rounded-full mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-little-home') {
    return (
      <div className={`w-full h-full bg-white p-1.5 flex flex-col justify-between select-none overflow-hidden ${className}`}>
        <div className="w-full h-[58%] flex justify-between gap-1 my-auto">
          <div className="w-[23%] h-full bg-stone-200 rounded-[2px] flex items-center justify-center text-[5.5px] text-stone-400 relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} placeholder="1" /></div>
          <div className="w-[23%] h-full bg-stone-200 rounded-[2px] flex items-center justify-center text-[5.5px] text-stone-400 relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} placeholder="2" /></div>
          <div className="w-[23%] h-full bg-stone-200 rounded-[2px] flex items-center justify-center text-[5.5px] text-stone-400 relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} placeholder="3" /></div>
          <div className="w-[23%] h-full bg-stone-200 rounded-[2px] flex items-center justify-center text-[5.5px] text-stone-400 relative overflow-hidden"><ThumbnailSlot slot={slots?.[3]} placeholder="4" /></div>
        </div>
        <div className="w-full flex justify-between items-end pt-0.5">
          <span className="text-[5px] font-serif text-[#944c2c] italic font-bold">little home</span>
          <div className="w-1/3 h-[1.5px] bg-stone-300 rounded-full mb-0.5" />
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-symphony') {
    return (
      <div className={`w-full h-full bg-white p-1.5 flex gap-1 items-center select-none overflow-hidden ${className}`}>
        {/* Left Page (50%) */}
        <div className="w-1/2 h-full flex flex-col justify-between flex-1">
          <div className="flex justify-between items-center">
            <span className="text-[6px] font-serif text-stone-900 italic font-bold">Symphony</span>
            <div className="w-1/3 h-[1px] bg-stone-300 rounded-full relative overflow-hidden" />
          </div>
          <div className="w-full flex items-end gap-1 h-[68%]">
            <div className="w-[58%] h-full bg-stone-200 rounded-[2px] flex items-center justify-center text-[6px] text-stone-400 relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} placeholder="1" /></div>
            <div className="w-[42%] h-[75%] bg-stone-200 rounded-[2px] flex items-center justify-center text-[5.5px] text-stone-400 relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} placeholder="2" /></div>
          </div>
        </div>
        {/* Right Page (50%): Large photo with left vertical label indicator close to edge */}
        <div className="w-1/2 h-full relative flex items-center justify-end pr-1 pl-2 py-0.5 flex-1">
          <div className="w-full h-[96%] relative flex items-center justify-end">
            <div className="absolute -left-1.5 top-1.5 bottom-1.5 flex flex-col justify-between items-center pointer-events-none">
              <div className="w-[1px] h-2.5 bg-stone-400 rounded-full" />
              <div className="w-[1px] h-2.5 bg-stone-500 rounded-full" />
            </div>
            <div className="w-full h-full bg-stone-200 rounded-[2px] flex items-center justify-center text-[7px] text-stone-400 font-bold relative overflow-hidden">
              <ThumbnailSlot slot={slots?.[2]} placeholder="3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-fairytale') {
    return (
      <div className={`w-full h-full bg-white p-1.5 flex gap-1 items-center select-none overflow-hidden ${className}`}>
        {/* Left Side: Background 1 + Inset 2 */}
        <div className="relative w-1/2 h-full bg-stone-200 rounded-[2px] overflow-hidden flex items-center justify-center text-[6px] text-stone-400 font-bold">
          <span>1</span>
          <div className="absolute left-1 bottom-1 w-[46%] h-[60%] bg-stone-100 border border-white rounded-[1px] shadow-xs flex flex-col items-center justify-between p-0.5 z-10">
            <span className="text-[5px] text-stone-500 font-bold">2</span>
            <span className="text-[4px] font-serif text-stone-800 lowercase">fairytale</span>
          </div>
        </div>
        {/* Right Side: Photo 3 */}
        <div className="w-1/2 h-full bg-stone-200 rounded-[2px] flex items-center justify-center text-[7px] text-stone-400 font-bold relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} placeholder="3" /></div>
      </div>
    );
  }

  if (id === 'album-50x35-appreciate') {
    return (
      <div className={`w-full h-full bg-white p-1.5 flex gap-1 items-center select-none overflow-hidden ${className}`}>
        {/* Left Side: Background 1 + 2 Insets (2, 3) */}
        <div className="relative w-1/2 h-full bg-stone-200 rounded-[2px] overflow-hidden flex items-center justify-center text-[6px] text-stone-400 font-bold">
          <span>1</span>
          <div className="absolute top-1 left-1">
            <span className="text-[4.5px] font-serif text-[#1e382b] italic">appreciate...</span>
          </div>
          <div className="absolute left-1 bottom-1 flex gap-0.5 w-[55%] h-[48%] z-10">
            <div className="w-1/2 h-full bg-stone-100 border border-white rounded-[1px] flex items-center justify-center text-[5px] text-stone-400"><ThumbnailSlot slot={slots?.[1]} placeholder="2" /></div>
            <div className="w-1/2 h-full bg-stone-100 border border-white rounded-[1px] flex items-center justify-center text-[5px] text-stone-400"><ThumbnailSlot slot={slots?.[2]} placeholder="3" /></div>
          </div>
        </div>
        {/* Right Side: Photo 4 */}
        <div className="w-1/2 h-full bg-stone-200 rounded-[2px] flex items-center justify-center text-[7px] text-stone-400 font-bold relative overflow-hidden"><ThumbnailSlot slot={slots?.[3]} placeholder="4" /></div>
      </div>
    );
  }

  if (id === 'album-50x35-together') {
    return (
      <div className={`w-full h-full bg-white p-1.5 flex gap-1 items-center select-none overflow-hidden ${className}`}>
        {/* Left Side: Photo 1 */}
        <div className="w-1/2 h-full bg-stone-200 rounded-[2px] flex items-center justify-center text-[7px] text-stone-400 font-bold relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} placeholder="1" /></div>
        {/* Right Side: 2 Vertical Photos (2, 3) + headers */}
        <div className="w-1/2 h-full flex flex-col justify-between p-0.5">
          <div className="flex justify-between">
            <span className="text-[4px] font-mono text-stone-500 font-bold">WEDDING JOURNAL</span>
          </div>
          <div className="w-full flex gap-1 justify-center my-auto h-[55%]">
            <div className="w-1/2 h-full bg-stone-200 rounded-[2px] flex items-center justify-center text-[5.5px] text-stone-400 relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} placeholder="2" /></div>
            <div className="w-1/2 h-full bg-stone-200 rounded-[2px] flex items-center justify-center text-[5.5px] text-stone-400 relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} placeholder="3" /></div>
          </div>
          <div className="text-center">
            <span className="text-[4.5px] font-serif text-stone-700 italic">Journey of Love</span>
          </div>
        </div>
      </div>
    );
  }


  if (id === 'album-50x35-eternal') {
    return (
      <div className={`w-full h-full flex bg-stone-100 p-0.5 gap-0.5 ${className}`}>
        <div className="w-[70%] h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
        <div className="w-[30%] h-full bg-white flex flex-col p-1 justify-between">
          <div>
            <div className="w-[80%] h-1 bg-stone-300 self-end mb-0.5 ml-auto rounded-full" />
            <div className="w-[50%] h-1 bg-stone-300 self-end ml-auto rounded-full" />
          </div>
          <div className="w-full h-[60%] bg-stone-300 mt-auto rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-beloved') {
    return (
      <div className={`w-full h-full flex bg-stone-100 p-0.5 gap-0.5 ${className}`}>
        <div className="w-[45%] h-full bg-white flex flex-col p-1.5 justify-between">
          <div className="w-[60%] h-1.5 bg-stone-300 mb-1 rounded-full" />
          <div className="flex gap-1 h-[60%]">
            <div className="w-1/2 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
            <div className="w-1/2 h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
          </div>
        </div>
        <div className="w-[55%] h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} /></div>
      </div>
    );
  }

  if (id === 'album-50x35-passionate') {
    return (
      <div className={`w-full h-full flex bg-stone-100 p-0.5 gap-0.5 ${className}`}>
        <div className="w-[60%] h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
        <div className="w-[40%] h-full bg-white flex flex-col p-1 relative justify-center items-center">
          <div className="w-[80%] h-[65%] bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
          <div className="w-[60%] h-1 bg-stone-300 absolute bottom-1 right-1 rounded-full" />
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-heartstrings') {
    return (
      <div className={`w-full h-full bg-stone-300 p-0.5 relative overflow-hidden rounded-[2px] ${className}`}>
        <div className="w-[30%] h-1.5 bg-white/60 absolute top-1 left-1 rounded-full" />
        <div className="w-[20%] h-[70%] bg-stone-400 absolute right-3 top-1/2 -translate-y-1/2 border border-white rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
      </div>
    );
  }


  if (id === 'album-50x35-beyond-time') {
    return (
      <div className={`w-full h-full bg-stone-300 relative overflow-hidden rounded-[2px] ${className}`}>
        <div className="absolute top-[10%] right-[10%] w-[35%] h-[65%] bg-stone-400 border border-white shadow-sm rounded-[1px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
        <div className="absolute top-[4%] right-[10%] w-[20%] h-[1.5px] bg-white/70 rounded-full" />
      </div>
    );
  }

  if (id === 'album-50x35-romance') {
    return (
      <div className={`w-full h-full flex bg-stone-100 p-0.5 gap-0.5 ${className}`}>
        <div className="w-1/2 h-full flex flex-col justify-between">
          <div className="w-full h-[45%] bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
          <div className="w-[60%] h-[1.5px] bg-stone-400 mx-auto rounded-full" />
          <div className="w-full h-[45%] bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
        </div>
        <div className="w-1/2 h-full bg-stone-300 rounded-[2px] relative overflow-hidden">
           <div className="absolute top-[8%] right-[10%] w-[40%] h-[2px] bg-white/70 rounded-full" />
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-perfection') {
    return (
      <div className={`w-full h-full bg-white p-[1px] flex flex-wrap rounded-[2px] ${className}`}>
        <div className="w-1/2 h-1/2 p-[1.5px]">
          <div className="w-full h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
        </div>
        <div className="w-1/2 h-1/2 p-1 flex flex-col justify-center items-start">
           <div className="w-[70%] h-[1.5px] bg-stone-300 mb-[1.5px] rounded-full" />
           <div className="w-[40%] h-[1.5px] bg-stone-300 rounded-full" />
        </div>
        <div className="w-1/2 h-1/2 p-1 flex flex-col justify-end items-start pb-1.5">
           <div className="w-[60%] h-[1.5px] bg-stone-300 mb-[1.5px] rounded-full" />
           <div className="w-[80%] h-[1.5px] bg-stone-300 mb-[1.5px] rounded-full" />
           <div className="w-[40%] h-[1.5px] bg-stone-300 rounded-full" />
        </div>
        <div className="w-1/2 h-1/2 p-[1.5px]">
          <div className="w-full h-full bg-stone-300 rounded-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} /></div>
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-loyalty') {
    return (
      <div className={`w-full h-full flex bg-white p-0.5 gap-0.5 rounded-[2px] ${className}`}>
        <div className="w-1/2 h-full flex flex-col items-center justify-center relative p-1">
          <div className="w-[70%] h-[75%] bg-stone-300 rounded-t-full rounded-b-[2px] relative overflow-hidden"><ThumbnailSlot slot={slots?.[0]} /></div>
          <div className="w-[50%] h-[1.5px] bg-stone-300 absolute bottom-1 rounded-full" />
        </div>
        <div className="w-1/2 h-full bg-stone-300 rounded-[2px] relative overflow-hidden">
           <div className="absolute bottom-[5%] right-[10%] w-[40%] h-[2px] bg-white/70 rounded-full" />
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-velvet-promise') {
    return (
      <div className={`w-full h-full bg-white p-1 flex gap-1 items-center select-none overflow-hidden ${className}`}>
        {/* Left Side: Photo 1 with border */}
        <div className="w-1/2 h-full p-1 flex items-center justify-center">
          <div className="w-full h-full bg-stone-200 rounded-[2px] flex items-center justify-center text-[6px] text-stone-400 font-bold relative overflow-hidden">
            <ThumbnailSlot slot={slots?.[0]} placeholder="1" />
          </div>
        </div>
        {/* Right Side: Title + 2 horizontal photos + quote */}
        <div className="w-1/2 h-full flex flex-col justify-between py-1 px-1">
          <div className="text-center">
            <span className="text-[4px] font-serif text-[#a6724a] font-bold tracking-wider uppercase block">VELVET PROMISE</span>
          </div>
          <div className="w-full flex-1 flex flex-col justify-center gap-1 my-0.5">
            <div className="w-full h-[45%] bg-stone-200 rounded-[1.5px] relative overflow-hidden">
              <ThumbnailSlot slot={slots?.[1]} placeholder="2" />
            </div>
            <div className="w-full h-[45%] bg-stone-200 rounded-[1.5px] relative overflow-hidden">
              <ThumbnailSlot slot={slots?.[2]} placeholder="3" />
            </div>
          </div>
          <div className="w-4/5 mx-auto space-y-0.5 text-center">
            <div className="w-full h-[1px] bg-stone-300 rounded-full" />
            <div className="w-2/3 mx-auto h-[1px] bg-stone-300 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-love-beyond') {
    return (
      <div className={`w-full h-full bg-white flex items-center select-none overflow-hidden ${className}`}>
        {/* Left Side: 100% Full bleed photo */}
        <div className="w-1/2 h-full bg-stone-200 flex items-center justify-center text-[7px] text-stone-400 font-bold relative overflow-hidden">
          <ThumbnailSlot slot={slots?.[0]} placeholder="1" />
        </div>
        {/* Right Side: Header + 2 horizontal photos */}
        <div className="w-1/2 h-full flex flex-col justify-between p-1.5">
          <div className="flex flex-col leading-none">
            <span className="text-[4.5px] font-serif text-stone-900 font-bold whitespace-nowrap">LOVE BEYOND</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[2.5px] font-mono text-stone-500">[NEWSEASON]</span>
              <span className="text-[4px] font-serif text-[#b86b3a] italic">The Silence</span>
            </div>
          </div>
          <div className="w-full flex-1 flex flex-col justify-center gap-1 my-0.5">
            <div className="w-full h-[45%] bg-stone-200 rounded-[1.5px] relative overflow-hidden">
              <ThumbnailSlot slot={slots?.[1]} placeholder="2" />
            </div>
            <div className="w-full h-[45%] bg-stone-200 rounded-[1.5px] relative overflow-hidden">
              <ThumbnailSlot slot={slots?.[2]} placeholder="3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-blooming-flowers') {
    return (
      <div className={`w-full h-full bg-white flex items-center select-none overflow-hidden ${className}`}>
        {/* Left Side: 2 vertical photos with center pink text */}
        <div className="w-1/2 h-full flex flex-col items-center justify-between p-1 shrink-0">
          <div className="w-[70%] h-[38%] bg-stone-200 rounded-[1.5px] relative overflow-hidden">
            <ThumbnailSlot slot={slots?.[1]} placeholder="2" />
          </div>
          <div className="text-center leading-none py-0.5">
            <span className="text-[4px] font-serif text-[#e11d67] font-bold block">“BLOOMING”</span>
            <span className="text-[3.5px] font-serif text-[#ff4d8d] italic block">flowers</span>
          </div>
          <div className="w-[70%] h-[38%] bg-stone-200 rounded-[1.5px] relative overflow-hidden">
            <ThumbnailSlot slot={slots?.[2]} placeholder="3" />
          </div>
        </div>
        {/* Right Side: Full bleed photo */}
        <div className="w-1/2 h-full bg-stone-200 flex items-center justify-center text-[7px] text-stone-400 font-bold relative overflow-hidden shrink-0">
          <ThumbnailSlot slot={slots?.[0]} placeholder="1" />
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-sweet-escape') {
    return (
      <div className={`w-full h-full bg-white flex items-center select-none overflow-hidden ${className}`}>
        {/* Left Side: 2 Arched vertical photos with Sweet Escape script */}
        <div className="w-1/2 h-full flex flex-col items-center justify-between p-1 shrink-0 bg-white">
          <div className="w-[72%] h-[40%] bg-stone-200 rounded-tl-[8px] rounded-tr-[1.5px] rounded-br-[1.5px] rounded-bl-[1.5px] relative overflow-hidden">
            <ThumbnailSlot slot={slots?.[2]} placeholder="3" />
          </div>
          <div className="text-center leading-none -my-0.5 z-10">
            <span className="text-[4px] font-serif italic text-stone-800 font-normal">Sweet Escape</span>
          </div>
          <div className="w-[72%] h-[40%] bg-stone-200 rounded-tl-[1.5px] rounded-tr-[1.5px] rounded-br-[8px] rounded-bl-[1.5px] relative overflow-hidden">
            <ThumbnailSlot slot={slots?.[3]} placeholder="4" />
          </div>
        </div>
        {/* Right Side: 2 horizontal stacked photos */}
        <div className="w-1/2 h-full flex flex-col gap-[1px] shrink-0">
          <div className="w-full h-1/2 bg-stone-200 relative overflow-hidden">
            <ThumbnailSlot slot={slots?.[0]} placeholder="1" />
          </div>
          <div className="w-full h-1/2 bg-stone-200 relative overflow-hidden">
            <ThumbnailSlot slot={slots?.[1]} placeholder="2" />
          </div>
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-great-ending') {
    return (
      <div className={`w-full h-full bg-white flex items-center select-none overflow-hidden ${className}`}>
        {/* Left Side: 1 Portrait with white passepartout border */}
        <div className="w-1/2 h-full flex items-center justify-center p-1 shrink-0">
          <div className="w-[82%] h-[90%] bg-stone-200 rounded-[1px] relative overflow-hidden border border-white">
            <ThumbnailSlot slot={slots?.[0]} placeholder="1" />
          </div>
        </div>
        {/* Right Side: 3x3 Grid (8 slots + typography) */}
        <div className="w-1/2 h-full p-1 flex items-center justify-center shrink-0">
          <div className="w-full h-[90%] grid grid-cols-3 grid-rows-3 gap-[1px]">
            <div className="bg-stone-200 relative overflow-hidden"><ThumbnailSlot slot={slots?.[1]} placeholder="" /></div>
            <div className="bg-stone-200 relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} placeholder="" /></div>
            <div className="bg-stone-200 relative overflow-hidden"><ThumbnailSlot slot={slots?.[3]} placeholder="" /></div>
            <div className="bg-stone-200 relative overflow-hidden"><ThumbnailSlot slot={slots?.[4]} placeholder="" /></div>
            <div className="bg-stone-200 relative overflow-hidden"><ThumbnailSlot slot={slots?.[5]} placeholder="" /></div>
            <div className="bg-stone-200 relative overflow-hidden"><ThumbnailSlot slot={slots?.[6]} placeholder="" /></div>
            <div className="bg-stone-200 relative overflow-hidden"><ThumbnailSlot slot={slots?.[7]} placeholder="" /></div>
            <div className="bg-stone-200 relative overflow-hidden"><ThumbnailSlot slot={slots?.[8]} placeholder="" /></div>
            <div className="flex flex-col justify-end items-end p-0.5 leading-none">
              <span className="text-[2.5px] font-serif font-bold italic uppercase text-stone-900">GREAT</span>
              <span className="text-[2.5px] font-serif font-bold uppercase text-stone-900 leading-none">— ENDING</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-maison-amour') {
    return (
      <div className={`w-full h-full bg-white flex items-center select-none overflow-hidden ${className}`}>
        {/* Left Side: Maison Amour title + 3 staggered vertical photos + pink bottom bar */}
        <div className="w-1/2 h-full flex flex-col justify-between pt-0.5 px-1 pb-0 shrink-0 bg-white">
          <div className="text-center leading-none">
            <span className="text-[4px] font-serif italic text-rose-400 font-bold">Maison Amour</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-0.5 min-h-0">
            <div className="w-[30%] h-[75%] mt-1 bg-stone-200 relative overflow-hidden rounded-[0.5px]">
              <ThumbnailSlot slot={slots?.[1]} placeholder="2" />
            </div>
            <div className="w-[36%] h-[92%] -mt-1 bg-stone-200 relative overflow-hidden rounded-[0.5px] shadow-2xs z-10">
              <ThumbnailSlot slot={slots?.[2]} placeholder="3" />
            </div>
            <div className="w-[30%] h-[75%] mt-1 bg-stone-200 relative overflow-hidden rounded-[0.5px]">
              <ThumbnailSlot slot={slots?.[3]} placeholder="4" />
            </div>
          </div>
          <div className="w-full h-[2px] bg-[#f8cdd7] shrink-0 mt-0.5"></div>
        </div>
        {/* Right Side: Full bleed photo */}
        <div className="w-1/2 h-full bg-stone-200 flex items-center justify-center text-[7px] text-stone-400 font-bold relative overflow-hidden shrink-0">
          <ThumbnailSlot slot={slots?.[0]} placeholder="1" />
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-seasons-of-love') {
    return (
      <div className={`w-full h-full bg-white flex items-center select-none overflow-hidden ${className}`}>
        {/* Left Side: 1 Portrait with white margin */}
        <div className="w-1/2 h-full flex items-center justify-center p-1 shrink-0 bg-white">
          <div className="w-[82%] h-[88%] bg-stone-200 relative overflow-hidden rounded-[0.5px]">
            <ThumbnailSlot slot={slots?.[0]} placeholder="1" />
          </div>
        </div>
        {/* Right Side: Header typography + 3 vertical photos + footer */}
        <div className="w-1/2 h-full flex flex-col justify-between p-1 shrink-0 bg-white">
          <div className="flex justify-between items-start">
            <span className="text-[3px] font-sans text-stone-400">|SEASONS</span>
            <span className="text-[4px] font-serif uppercase tracking-wider text-stone-800 font-semibold">THE SEASONS</span>
          </div>
          <div className="flex-1 flex items-center justify-between gap-0.5 my-0.5 min-h-0">
            <div className="w-1/3 h-full bg-stone-200 relative overflow-hidden rounded-[0.5px]">
              <ThumbnailSlot slot={slots?.[1]} placeholder="2" />
            </div>
            <div className="w-1/3 h-full bg-stone-200 relative overflow-hidden rounded-[0.5px]">
              <ThumbnailSlot slot={slots?.[2]} placeholder="3" />
            </div>
            <div className="w-1/3 h-full bg-stone-200 relative overflow-hidden rounded-[0.5px]">
              <ThumbnailSlot slot={slots?.[3]} placeholder="4" />
            </div>
          </div>
          <div className="text-right">
            <span className="text-[2.5px] font-sans text-stone-400 uppercase tracking-tighter">OFTEN FORMED • LOVE</span>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-quietly-yours') {
    return (
      <div className={`w-full h-full bg-white flex items-center select-none overflow-hidden ${className}`}>
        {/* Left Side: faint vertical text + 2 stacked vertical photos */}
        <div className="w-1/2 h-full flex items-center justify-center relative p-1 shrink-0 bg-white">
          <div className="absolute left-0.5 inset-y-0 flex items-center pointer-events-none select-none">
            <span style={{ writingMode: 'vertical-rl' }} className="text-[5px] font-serif uppercase text-stone-200 font-bold rotate-180">
              QUIETLY
            </span>
          </div>
          <div className="w-[62%] h-full flex flex-col justify-between gap-0.5 min-h-0">
            <div className="w-full h-1/2 bg-stone-200 relative overflow-hidden rounded-[0.5px]">
              <ThumbnailSlot slot={slots?.[1]} placeholder="2" />
            </div>
            <div className="w-full h-1/2 bg-stone-200 relative overflow-hidden rounded-[0.5px]">
              <ThumbnailSlot slot={slots?.[2]} placeholder="3" />
            </div>
          </div>
        </div>
        {/* Right Side: Full bleed photo */}
        <div className="w-1/2 h-full bg-stone-200 flex items-center justify-center text-[7px] text-stone-400 font-bold relative overflow-hidden shrink-0">
          <ThumbnailSlot slot={slots?.[0]} placeholder="1" />
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-finest-chapter') {
    return (
      <div className={`w-full h-full bg-white flex items-center select-none overflow-hidden ${className}`}>
        {/* Left Side: 2 Vertical Photos */}
        <div className="w-1/2 h-full flex items-center justify-center p-1 shrink-0 bg-white gap-0.5">
          <div className="w-1/2 h-[86%] bg-stone-200 relative overflow-hidden rounded-[0.5px]">
            <ThumbnailSlot slot={slots?.[0]} placeholder="1" />
          </div>
          <div className="w-1/2 h-[86%] bg-stone-200 relative overflow-hidden rounded-[0.5px]">
            <ThumbnailSlot slot={slots?.[1]} placeholder="2" />
          </div>
        </div>
        {/* Right Side: 2 Staggered photos + Chapter text */}
        <div className="w-1/2 h-full p-1 flex items-center justify-center shrink-0 bg-white">
          <div className="w-full h-[86%] flex justify-between gap-0.5">
            <div className="w-[48%] h-full flex flex-col justify-end">
              <div className="w-full h-[82%] bg-stone-200 relative overflow-hidden rounded-[0.5px]">
                <ThumbnailSlot slot={slots?.[2]} placeholder="3" />
              </div>
            </div>
            <div className="w-[48%] h-full flex flex-col justify-between">
              <div className="w-full h-[78%] bg-stone-200 relative overflow-hidden rounded-[0.5px]">
                <ThumbnailSlot slot={slots?.[3]} placeholder="4" />
              </div>
              <div className="text-right leading-none">
                <span className="text-[3px] font-serif text-stone-700 uppercase font-semibold">FINEST</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-familiar-soul') {
    return (
      <div className={`w-full h-full bg-white flex items-center select-none overflow-hidden ${className}`}>
        {/* Left Side: 2 stacked photos + middle crimson text */}
        <div className="w-1/2 h-full flex flex-col justify-between items-center py-1 px-1.5 shrink-0 bg-white">
          <div className="w-[62%] h-[42%] bg-stone-200 relative overflow-hidden rounded-[0.5px]">
            <ThumbnailSlot slot={slots?.[1]} placeholder="2" />
          </div>
          <div className="w-full flex items-center justify-between px-0.5 leading-none">
            <span className="text-[2px] font-sans text-stone-500 uppercase">#CONCEPT</span>
            <span className="text-[3.5px] font-serif text-[#b91c1c] font-bold">Familiar Soul</span>
            <span className="text-[2px] font-sans text-stone-500 uppercase">#DESIGN</span>
          </div>
          <div className="w-[62%] h-[42%] bg-stone-200 relative overflow-hidden rounded-[0.5px]">
            <ThumbnailSlot slot={slots?.[2]} placeholder="3" />
          </div>
        </div>
        {/* Right Side: Full bleed photo */}
        <div className="w-1/2 h-full bg-stone-200 flex items-center justify-center text-[7px] text-stone-400 font-bold relative overflow-hidden shrink-0">
          <ThumbnailSlot slot={slots?.[0]} placeholder="1" />
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-ordinary-forever') {
    return (
      <div className={`w-full h-full bg-white flex items-center select-none overflow-hidden ${className}`}>
        {/* Left Side: 1 full-page background photo + 6 small overlaid photo boxes */}
        <div className="relative w-1/2 h-full bg-stone-200 shrink-0 overflow-hidden">
          {/* Background photo */}
          <div className="absolute inset-0 w-full h-full">
            <ThumbnailSlot slot={slots?.[1]} placeholder="2" />
          </div>
          {/* 6 small photo boxes overlay */}
          <div className="relative z-10 w-full h-full grid grid-cols-3 grid-rows-3 gap-[1px] p-[2px] pointer-events-none">
            {/* Row 1: 2 empty cells for background, 1 small photo */}
            <div />
            <div />
            <div className="bg-stone-100 shadow-[0_0.5px_1px_rgba(0,0,0,0.2)] border-[0.5px] border-white/90 relative overflow-hidden">
              <ThumbnailSlot slot={slots?.[2]} placeholder="3" />
            </div>

            {/* Row 2: 3 small photos */}
            <div className="bg-stone-100 shadow-[0_0.5px_1px_rgba(0,0,0,0.2)] border-[0.5px] border-white/90 relative overflow-hidden">
              <ThumbnailSlot slot={slots?.[3]} placeholder="4" />
            </div>
            <div className="bg-stone-100 shadow-[0_0.5px_1px_rgba(0,0,0,0.2)] border-[0.5px] border-white/90 relative overflow-hidden">
              <ThumbnailSlot slot={slots?.[4]} placeholder="5" />
            </div>
            <div className="bg-stone-100 shadow-[0_0.5px_1px_rgba(0,0,0,0.2)] border-[0.5px] border-white/90 relative overflow-hidden">
              <ThumbnailSlot slot={slots?.[5]} placeholder="6" />
            </div>

            {/* Row 3: 2 small photos, 1 empty cell */}
            <div className="bg-stone-100 shadow-[0_0.5px_1px_rgba(0,0,0,0.2)] border-[0.5px] border-white/90 relative overflow-hidden">
              <ThumbnailSlot slot={slots?.[6]} placeholder="7" />
            </div>
            <div className="bg-stone-100 shadow-[0_0.5px_1px_rgba(0,0,0,0.2)] border-[0.5px] border-white/90 relative overflow-hidden">
              <ThumbnailSlot slot={slots?.[7]} placeholder="8" />
            </div>
            <div />
          </div>
        </div>
        {/* Right Side: Title + Centered Portrait + Quote */}
        <div className="w-1/2 h-full flex flex-col justify-between p-1 shrink-0 bg-white">
          <div className="flex justify-between items-start">
            <span className="text-[3.5px] font-serif uppercase tracking-wider text-stone-800 font-semibold leading-tight">ORDINARY<br/>FOREVER</span>
            <span className="text-[2.5px] font-sans text-stone-400">|NEW|</span>
          </div>
          <div className="w-[66%] h-[58%] mx-auto bg-stone-200 relative overflow-hidden rounded-[0.5px]">
            <ThumbnailSlot slot={slots?.[0]} placeholder="1" />
          </div>
          <div className="text-center">
            <span className="text-[2px] font-sans text-stone-400 uppercase tracking-tighter">THE STRONGEST BONDS</span>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-mutual-muse') {
    return (
      <div className={`w-full h-full bg-white flex items-center select-none overflow-hidden ${className}`}>
        {/* Left Side: 2 side-by-side vertical photos + text */}
        <div className="relative w-1/2 h-full flex shrink-0 overflow-hidden bg-stone-100">
          <div className="w-[46%] h-full bg-stone-200 relative overflow-hidden">
            <ThumbnailSlot slot={slots?.[0]} placeholder="1" />
          </div>
          <div className="w-[54%] h-full bg-stone-200 relative overflow-hidden">
            <ThumbnailSlot slot={slots?.[1]} placeholder="2" />
          </div>
          <div className="absolute left-[20%] bottom-1 flex items-baseline leading-none z-10">
            <span className="text-[3.5px] font-serif text-[#8b181b] font-bold">Mutual</span>
            <span className="text-[3px] font-serif italic text-[#b95d52]">Muse</span>
          </div>
        </div>
        {/* Right Side: 3x3 grid with center box */}
        <div className="w-1/2 h-full p-1 flex items-center justify-center shrink-0 bg-white">
          <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-[1px]">
            <div className="bg-stone-200 relative overflow-hidden"><ThumbnailSlot slot={slots?.[2]} placeholder="3" /></div>
            <div className="bg-stone-200 relative overflow-hidden"><ThumbnailSlot slot={slots?.[3]} placeholder="4" /></div>
            <div className="bg-stone-200 relative overflow-hidden"><ThumbnailSlot slot={slots?.[4]} placeholder="5" /></div>
            <div className="bg-stone-200 relative overflow-hidden"><ThumbnailSlot slot={slots?.[5]} placeholder="6" /></div>
            <div className="bg-white flex flex-col items-center justify-center p-0.5 border border-stone-200">
              <span className="text-[2.5px] font-serif uppercase text-stone-700 font-bold leading-none text-center">CHERISHED<br/>MOMENTS</span>
            </div>
            <div className="bg-stone-200 relative overflow-hidden"><ThumbnailSlot slot={slots?.[6]} placeholder="7" /></div>
            <div className="bg-stone-200 relative overflow-hidden"><ThumbnailSlot slot={slots?.[7]} placeholder="8" /></div>
            <div className="bg-stone-200 relative overflow-hidden"><ThumbnailSlot slot={slots?.[8]} placeholder="9" /></div>
            <div className="bg-stone-200 relative overflow-hidden"><ThumbnailSlot slot={slots?.[9]} placeholder="10" /></div>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-meadow') {
    return (
      <div className={`w-full h-full bg-white flex items-center select-none overflow-hidden ${className}`}>
        {/* Left Side: 3 staggered photos + Meadow green title */}
        <div className="relative w-1/2 h-full flex flex-col justify-between p-1 shrink-0 bg-white">
          {/* Top hashtags */}
          <div className="flex justify-between items-center px-0.5 text-[2px] font-sans text-stone-500 uppercase italic">
            <span>#NEWSEASON</span>
            <span>#MOMENTGOLD</span>
            <span>#PREWEDDING</span>
          </div>
          {/* 3 staggered portrait photos */}
          <div className="flex items-center justify-between gap-0.5 my-0.5 min-h-0">
            <div className="w-[30%] h-[68%] mt-2 bg-stone-200 relative overflow-hidden rounded-[0.5px]">
              <ThumbnailSlot slot={slots?.[1]} placeholder="2" />
            </div>
            <div className="w-[32%] h-[82%] -mt-1 bg-stone-200 relative overflow-hidden rounded-[0.5px] shadow-2xs">
              <ThumbnailSlot slot={slots?.[2]} placeholder="3" />
            </div>
            <div className="w-[30%] h-[68%] mt-2 bg-stone-200 relative overflow-hidden rounded-[0.5px]">
              <ThumbnailSlot slot={slots?.[3]} placeholder="4" />
            </div>
          </div>
          {/* Meadow title & quote */}
          <div className="text-center leading-none">
            <span className="text-[4px] font-serif text-[#15803d] font-bold">MEADOW</span>
            <span className="text-[1.8px] font-sans text-stone-400 block tracking-tighter uppercase mt-0.5">SMALLEST MOMENTS</span>
          </div>
        </div>
        {/* Right Side: Full bleed photo with Cherished moments text */}
        <div className="relative w-1/2 h-full bg-stone-200 flex items-center justify-center text-[7px] text-stone-400 font-bold overflow-hidden shrink-0">
          <ThumbnailSlot slot={slots?.[0]} placeholder="1" />
          <div className="absolute bottom-1 right-1 left-1 text-center pointer-events-none">
            <span className="text-[2.5px] font-serif uppercase tracking-widest text-white drop-shadow-sm font-semibold">CHERISHED MOMENTS</span>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-lifetime-side') {
    return (
      <div className={`w-full h-full bg-white flex items-center select-none overflow-hidden ${className}`}>
        {/* Left Side: 1 Portrait with white margin */}
        <div className="w-1/2 h-full flex items-center justify-center p-1 shrink-0 bg-white">
          <div className="w-[82%] h-[88%] bg-stone-200 relative overflow-hidden rounded-[0.5px]">
            <ThumbnailSlot slot={slots?.[0]} placeholder="1" />
          </div>
        </div>
        {/* Right Side: Top landscape photo + wax seal & text, bottom 2 detail photos */}
        <div className="w-1/2 h-full p-1 flex flex-col justify-between shrink-0 bg-white">
          {/* Top row */}
          <div className="flex items-center justify-between gap-1 h-[46%]">
            <div className="w-[52%] h-full bg-stone-200 relative overflow-hidden rounded-[0.5px]">
              <ThumbnailSlot slot={slots?.[1]} placeholder="2" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#f472b6] flex items-center justify-center shadow-2xs mb-0.5">
                <span className="text-[2px] text-white">🎀</span>
              </div>
              <span className="text-[2.8px] font-serif uppercase text-stone-900 font-bold leading-none">A LIFETIME</span>
              <span className="text-[3px] font-serif italic text-stone-800 leading-none">By Your Side</span>
            </div>
          </div>
          {/* Bottom row */}
          <div className="flex items-end justify-between gap-1 h-[48%]">
            <div className="flex flex-col justify-between h-full w-[38%]">
              <div className="w-full h-[70%] bg-stone-200 relative overflow-hidden rounded-[0.5px]">
                <ThumbnailSlot slot={slots?.[2]} placeholder="3" />
              </div>
              <div className="text-[1.8px] font-sans text-stone-500 uppercase leading-none">
                <span>#PREWEDDING</span>
              </div>
            </div>
            <div className="w-[54%] h-full bg-stone-200 relative overflow-hidden rounded-[0.5px]">
              <ThumbnailSlot slot={slots?.[3]} placeholder="4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-roselune') {
    return (
      <div className={`w-full h-full bg-white flex items-center select-none overflow-hidden ${className}`}>
        {/* Left Side: 1 Portrait with white margin & text */}
        <div className="w-1/2 h-full flex items-center justify-center p-1 shrink-0 bg-white relative">
          <div className="w-[82%] h-[88%] bg-stone-200 relative overflow-hidden rounded-[0.5px]">
            <ThumbnailSlot slot={slots?.[0]} placeholder="1" />
            <div className="absolute bottom-1 inset-x-0 text-center">
              <span className="text-[2px] font-serif uppercase tracking-widest text-white drop-shadow-sm">CHERISHED MOMENTS</span>
            </div>
          </div>
        </div>
        {/* Right Side: Top photo + black bar quote, vertical Roselune, bottom 2 photos */}
        <div className="w-1/2 h-full p-1 flex flex-col justify-between shrink-0 bg-white">
          <div className="flex items-center justify-between gap-1 h-[46%]">
            <div className="w-[54%] h-full bg-stone-200 relative overflow-hidden rounded-[0.5px]">
              <ThumbnailSlot slot={slots?.[1]} placeholder="2" />
            </div>
            <div className="flex-1 flex items-center gap-0.5 border-l border-stone-800 pl-0.5 leading-none">
              <span className="text-[1.8px] font-sans text-stone-600 uppercase">TOGETHER WE DISCOVERED</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-0.5 h-[48%]">
            <div className="flex items-center justify-center h-full">
              <span style={{ writingMode: 'vertical-rl' }} className="text-[3px] font-serif text-stone-800 rotate-180 font-bold">
                Roselune
              </span>
            </div>
            <div className="w-[36%] h-[72%] bg-stone-200 relative overflow-hidden rounded-[0.5px]">
              <ThumbnailSlot slot={slots?.[2]} placeholder="3" />
            </div>
            <div className="w-[48%] h-full bg-stone-200 relative overflow-hidden rounded-[0.5px]">
              <ThumbnailSlot slot={slots?.[3]} placeholder="4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (id === 'album-50x35-quietly-seals') {
    return (
      <div className={`w-full h-full bg-white flex items-center select-none overflow-hidden ${className}`}>
        {/* Left Side: 1 Portrait with white margin */}
        <div className="w-1/2 h-full flex items-center justify-center p-1 shrink-0 bg-white">
          <div className="w-[82%] h-[84%] bg-stone-200 relative overflow-hidden rounded-[0.5px]">
            <ThumbnailSlot slot={slots?.[0]} placeholder="1" />
          </div>
        </div>
        {/* Right Side: Top row of 3 photos + bottom wax seal, Quietly Yours & Send to her */}
        <div className="w-1/2 h-full p-1 flex flex-col justify-between shrink-0 bg-white">
          {/* Top row of 3 photos */}
          <div className="flex items-center justify-between gap-0.5 h-[42%] mt-1">
            <div className="w-1/3 h-full bg-stone-200 relative overflow-hidden rounded-[0.5px]">
              <ThumbnailSlot slot={slots?.[1]} placeholder="2" />
            </div>
            <div className="w-1/3 h-full bg-stone-200 relative overflow-hidden rounded-[0.5px]">
              <ThumbnailSlot slot={slots?.[2]} placeholder="3" />
            </div>
            <div className="w-1/3 h-full bg-stone-300 relative overflow-hidden rounded-[0.5px]">
              <ThumbnailSlot slot={slots?.[3]} placeholder="4" />
            </div>
          </div>
          {/* Bottom area */}
          <div className="flex flex-col items-center justify-center my-auto leading-none text-center">
            <div className="w-2.5 h-2.5 rounded-full bg-[#991b1b] flex items-center justify-center shadow-2xs mb-0.5">
              <span className="text-[2px] text-white">❤</span>
            </div>
            <span className="text-[3.2px] font-black uppercase tracking-wider text-stone-900">QUIETLY YOURS</span>
            <div className="w-full flex justify-between items-center px-1 mt-0.5">
              <span className="text-[1.8px] font-serif italic text-stone-500">Love quietly</span>
              <span className="text-[2.5px] font-serif italic text-stone-800">Send to her!</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- OVERLAY / VIP TEMPLATES ---
  if (typeof id === 'string' && id.startsWith('overlay-')) {
    const vipTmpl = VIP_TEMPLATES.find((t) => t.id === id);
    const slotsCoords = vipTmpl?.slotsCoordinates || [
      { x: 25, y: 25, width: 50, height: 50, rotation: 0 },
    ];
    const match = (vipTmpl?.overlayUri || '').match(/(\d\d-\d\d\.png)/);
    const filename = match ? match[1] : '';
    // Prioritize direct live URL from photobookvietnam.net which is guaranteed to be available across all environments (including Vercel)
    const overlayImg = vipTmpl?.overlayUri || (filename ? `https://www.photobookvietnam.net/images/layout/lay01/${filename}` : OVERLAY_SVG);

    return (
      <div className={`w-full h-full relative overflow-hidden bg-stone-50 flex items-center justify-center select-none ${className}`}>
        {/* Slot cutouts behind */}
        {slotsCoords.map((coord, idx) => (
          <div
            key={idx}
            className="absolute bg-stone-300 rounded-[1px] overflow-hidden shadow-2xs z-0"
            style={{
              left: `${coord.x}%`,
              top: `${coord.y}%`,
              width: `${coord.width}%`,
              height: `${coord.height}%`,
              transform: `rotate(${coord.rotation || 0}deg)`,
            }}
          >
            <ThumbnailSlot slot={slots?.[idx]} placeholder="" />
          </div>
        ))}

        {/* Overlay PNG */}
        <img
          src={overlayImg}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
          onError={(e) => {
            const target = e.currentTarget;
            target.onerror = null;
            const currentSrc = target.src || '';
            const fileMatch = currentSrc.match(/(\d\d-\d\d\.png)/) || (filename ? [null, filename] : null);
            const fName = fileMatch ? fileMatch[1] : '';
            if (fName && !currentSrc.includes('photobookvietnam.net')) {
              target.src = `https://www.photobookvietnam.net/images/layout/lay01/${fName}`;
            } else {
              target.src = OVERLAY_SVG;
            }
          }}
        />
      </div>
    );
  }

  return <div className="w-full h-full bg-stone-100"></div>;
};

export const EditorSidebar: React.FC<EditorSidebarProps> = ({
  templateId,
  onChangeTemplate,
  onApplyTemplateToAll,
  textConfig,
  onChangeTextConfig,
  onApplyTextConfigToAll,
  customTexts = [],
  onOpenAddTextModal,
  onUpdateCustomText,
  onDeleteCustomText,
  selectedTextId,
  onSelectText,
  posterSettings,
  onChangePosterSettings,
  onAutoFill,
  totalEmptySlotsCount = 0,
  usedImageIds = [],
  missingImagesCount = 0,
  onSmartRelink,
  onClearAllImages,
  currentPageSlots,
  onApplyThemeSet,
}) => {
  const [activeTab, setActiveTab] = useState<'images' | 'layouts' | 'text' | 'style'>('images');
  const [layoutCategory, setLayoutCategory] = useState<'cover' | 'basic' | 'with-text' | 'vip'>('basic');
  const [isDraggingOverLibrary, setIsDraggingOverLibrary] = useState(false);
  const [libraryImages, setLibraryImages] = useState<OptimizedImage[]>(() => imageOptimizer.getImages());
  const [imageColumns, setImageColumns] = useState<number>(2);
  const [imageFilter, setImageFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [showAutoFillModal, setShowAutoFillModal] = useState(false);
  const [showConfirmClearModal, setShowConfirmClearModal] = useState(false);
  const [clearFromPagesToo, setClearFromPagesToo] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [lastUploadedCount, setLastUploadedCount] = useState(0);
  const [pendingUploads, setPendingUploads] = useState(0);
  const [appliedAllNotice, setAppliedAllNotice] = useState(false);
  const [textAppliedNotice, setTextAppliedNotice] = useState(false);

  const handleConfirmClearAll = async () => {
    setIsClearing(true);
    try {
      await imageOptimizer.clearAllImages();
      if (clearFromPagesToo && onClearAllImages) {
        onClearAllImages(true);
      }
      setShowConfirmClearModal(false);
    } catch (err) {
      console.error('Lỗi khi xóa ảnh trong thư viện:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const handleApplyToAllPages = () => {
    if (onApplyTemplateToAll) {
      onApplyTemplateToAll(templateId);
      setAppliedAllNotice(true);
      setTimeout(() => setAppliedAllNotice(false), 2200);
    }
  };

  const processingCount = libraryImages.filter(img => img.status === 'processing').length;
  const isAddingImages = imageOptimizer.isAdding;
  useEffect(() => {
    if (pendingUploads > 0 && processingCount === 0 && !isAddingImages) {
      if (totalEmptySlotsCount > 0) {
        setLastUploadedCount(pendingUploads);
        setShowAutoFillModal(true);
      }
      setPendingUploads(0);
    }
  }, [processingCount, pendingUploads, totalEmptySlotsCount, isAddingImages]);

  useEffect(() => {
    const unsubscribe = imageOptimizer.subscribe(() => {
      setLibraryImages(imageOptimizer.getImages());
    });
    return unsubscribe;
  }, []);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAddImages = (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length > 0) {
      setPendingUploads(validFiles.length);
      imageOptimizer.addImages(validFiles);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleAddImages(e.target.files);
    }
  };

  const removeLibraryImage = (id: string) => {
    imageOptimizer.removeImage(id);
  };

  const updateSettings = (key: keyof PosterSettings, value: any) => {
    onChangePosterSettings({ ...posterSettings, [key]: value });
  };

  return (
    <div className="w-full lg:w-96 bg-white border-l border-stone-200 flex flex-col h-full shadow-sm">
      {/* Sidebar Navigation Tabs */}
      <div className="grid grid-cols-4 border-b border-stone-200 bg-stone-50/80 p-1">
        <button
          onClick={() => setActiveTab('images')}
          className={`flex flex-col items-center justify-center py-2 px-1 text-xs font-semibold rounded-xl transition cursor-pointer ${
            activeTab === 'images'
              ? 'bg-white text-sky-600 shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <ImageIcon className="w-4 h-4 mb-1" />
          Ảnh ({libraryImages.length})
        </button>
        <button
          onClick={() => setActiveTab('layouts')}
          className={`flex flex-col items-center justify-center py-2 px-1 text-xs font-semibold rounded-xl transition cursor-pointer ${
            activeTab === 'layouts'
              ? 'bg-white text-sky-600 shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <LayoutGrid className="w-4 h-4 mb-1" />
          Layout
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex flex-col items-center justify-center py-2 px-1 text-xs font-semibold rounded-xl transition cursor-pointer ${
            activeTab === 'text'
              ? 'bg-white text-sky-600 shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Type className="w-4 h-4 mb-1" />
          Chữ & Bìa
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`flex flex-col items-center justify-center py-2 px-1 text-xs font-semibold rounded-xl transition cursor-pointer ${
            activeTab === 'style'
              ? 'bg-white text-sky-600 shadow-xs'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Palette className="w-4 h-4 mb-1" />
          Size & Màu
        </button>
      </div>

      {/* Sidebar Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* TAB: LAYOUT TEMPLATES */}
        {activeTab === 'layouts' && (
          <div className="flex-1 flex flex-col p-4 overflow-hidden animate-fade-in min-h-0">
            {/* Sub-tabs: Bìa Album, Tiêu chuẩn, Chuyên nghiệp, Họa tiết */}
            <div className="flex bg-stone-100 p-1 rounded-xl mb-3 shrink-0 gap-1 overflow-x-auto scrollbar-none">
              {/* Tab 0: Bìa Album */}
              <button
                type="button"
                onClick={() => setLayoutCategory('cover')}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition text-center whitespace-nowrap cursor-pointer flex items-center gap-1 shrink-0 ${
                  layoutCategory === 'cover'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-800'
                }`}
              >
                <span>📖</span>
                <span>Bìa ({COVER_TEMPLATES.length})</span>
              </button>

              {/* Tab 1: Tiêu chuẩn */}
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

              {/* Tab 2: Chuyên nghiệp */}
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

              {/* Tab 3: Họa tiết */}
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

            <div className="flex-1 overflow-y-auto pr-1 -mr-1 pb-2">
              {/* VIP Theme Set Header Card */}
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
                      <img src="https://www.photobookvietnam.net/images/layout/lay01/01-02.png" alt="Hoa cỏ mùa xuân" className="w-full h-full object-cover" />
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
                {(layoutCategory === 'cover' ? COVER_TEMPLATES : layoutCategory === 'vip' ? VIP_TEMPLATES : layoutCategory === 'basic' ? BASIC_TEMPLATES : WITH_TEXT_TEMPLATES).map((tmpl) => (
                  <div key={tmpl.id} className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => onChangeTemplate(tmpl.id)}
                      title={`${tmpl.name} (${tmpl.slotCount} ảnh)`}
                      className={`w-full ${tmpl.aspectRatio === '50:20' ? 'aspect-[50/20]' : 'aspect-[50/35]'} rounded-xl border-2 transition overflow-hidden relative group cursor-pointer flex items-center justify-center ${
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
                ))}
              </div>
            </div>

            {/* Bottom Action Button for Tab Cơ bản */}
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
        )}

        {/* TAB 1: IMAGE LIBRARY */}
        {activeTab === 'images' && (
          <div 
            className={`flex-1 flex flex-col p-5 overflow-hidden animate-fade-in min-h-0 transition-colors ${
              isDraggingOverLibrary ? 'bg-sky-50 ring-2 ring-inset ring-sky-400/50' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOverLibrary(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDraggingOverLibrary(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingOverLibrary(false);
              if (e.dataTransfer.files) {
                handleAddImages(e.dataTransfer.files);
              }
            }}
          >
            

            
            
            {/* Upload Button and Drop Area */}
            <div className="flex-none w-full mb-3">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                ref={fileInputRef}
              />
              <div className="flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2.5 px-3 border-2 border-dashed border-sky-300 hover:border-sky-500 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer group shadow-2xs"
                >
                  <UploadCloud className="w-4 h-4 group-hover:scale-110 transition-transform text-sky-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Tải ảnh lên</span>
                </button>

                {libraryImages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmClearModal(true)}
                    className="py-2.5 px-3 border border-rose-200 hover:border-rose-300 bg-rose-50/80 hover:bg-rose-100 text-rose-700 active:bg-rose-200 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs group shrink-0"
                    title="Xóa toàn bộ ảnh trong thư viện để nạp ảnh mới"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold whitespace-nowrap">Xóa hết ({libraryImages.length})</span>
                  </button>
                )}
              </div>

              {missingImagesCount > 0 && onSmartRelink && (
                <button
                  type="button"
                  onClick={onSmartRelink}
                  className="w-full mt-2 py-2 px-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer animate-in fade-in"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Nối lại {missingImagesCount} ảnh vào khung</span>
                </button>
              )}
            </div>

            
            {/* Column Selector & Usage Filter Pills */}
            {libraryImages.length > 0 && (() => {
              const usedCount = libraryImages.filter(img => usedImageIds.includes(img.id)).length;
              const unusedCount = libraryImages.length - usedCount;

              return (
                <div className="flex flex-col gap-2 mb-3 flex-none">
                  {/* Segmented Filter Pills */}
                  <div className="grid grid-cols-3 gap-1 bg-stone-100/90 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setImageFilter('all')}
                      className={`py-1 px-1.5 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                        imageFilter === 'all'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-500 hover:text-stone-700'
                      }`}
                    >
                      Tất cả ({libraryImages.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageFilter('unused')}
                      className={`py-1 px-1.5 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                        imageFilter === 'unused'
                          ? 'bg-white text-amber-800 shadow-xs'
                          : 'text-stone-500 hover:text-stone-700'
                      }`}
                    >
                      Chưa dùng ({unusedCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageFilter('used')}
                      className={`py-1 px-1.5 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                        imageFilter === 'used'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-stone-500 hover:text-stone-700'
                      }`}
                    >
                      Đã dùng ({usedCount})
                    </button>
                  </div>

                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[10px] text-stone-400 font-semibold">
                      {imageFilter === 'unused' ? 'Hình chưa đưa vào layout' : imageFilter === 'used' ? 'Hình đã đưa vào layout' : 'Toàn bộ thư viện ảnh'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-stone-400 font-semibold">Cột:</span>
                      <div className="flex bg-stone-100 rounded-lg p-0.5">
                        {[2, 3, 4].map((col) => (
                          <button
                            key={col}
                            onClick={() => setImageColumns(col)}
                            className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                              imageColumns === col ? 'bg-white shadow-xs text-sky-600 font-bold' : 'text-stone-500 hover:text-stone-700'
                            }`}
                          >
                            {col}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Images Grid */}
            <div className="flex-1 overflow-y-auto pr-1 -mr-1 min-h-0 pb-10">
              {libraryImages.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-stone-400 text-center bg-stone-50 rounded-xl border border-stone-100">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-[11px]">Chưa có ảnh nào.</p>
                  <p className="text-[10px] opacity-70">Tải ảnh lên để bắt đầu thiết kế</p>
                </div>
              ) : (
                (() => {
                  const filteredImages = libraryImages.filter(img => {
                    const isUsed = usedImageIds.includes(img.id);
                    if (imageFilter === 'used') return isUsed;
                    if (imageFilter === 'unused') return !isUsed;
                    return true;
                  });

                  if (filteredImages.length === 0) {
                    return (
                      <div className="py-8 flex flex-col items-center justify-center text-stone-400 text-center bg-stone-50 rounded-xl border border-stone-100 mt-2">
                        <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-[11px]">Không có ảnh nào phù hợp.</p>
                      </div>
                    );
                  }

                  return (
                    <div style={{ columnCount: imageColumns, columnGap: '8px' }}>
                      {filteredImages.map((img) => {
                        const isUsed = usedImageIds.includes(img.id);
                        return (
                        <div
                      key={img.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', img.id);
                        e.dataTransfer.setData('application/photobook-image-id', img.id);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      className={`relative w-full mb-2 break-inside-avoid bg-stone-200 rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing border ${isUsed ? 'border-emerald-500 shadow-emerald-500/20' : 'border-stone-200 shadow-sm'} hover:ring-2 hover:ring-sky-500 transition-all inline-block`}
                    >
                      <img src={img.thumbnailUrl} alt="Library item" className={`w-full h-auto block pointer-events-none ${isUsed ? 'opacity-80' : ''}`} />
                      {isUsed && (
                        <div className="absolute top-1 left-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      {img.status === 'processing' && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex flex-col items-center justify-center">
                          <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLibraryImage(img.id);
                        }}
                        className="absolute top-1 right-1 p-1 bg-white/90 text-red-500 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all cursor-pointer shadow-sm z-10"
                        title="Xóa ảnh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )})}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TEXT & ALBUM COVER TYPOGRAPHY */}
        {activeTab === 'text' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-fade-in text-stone-800">
            {/* Header info */}
            <div className="bg-gradient-to-r from-sky-50 to-amber-50/60 p-3.5 rounded-2xl border border-sky-200/80 space-y-1.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-sky-600" />
                  Nội Dung Chữ & Bìa Album
                </span>
                {templateId.startsWith('cover-') && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs">
                    Trang Bìa
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                💡 <span className="font-semibold text-stone-700">Mẹo:</span> Bạn có thể nhấp trực tiếp vào bất kỳ dòng chữ nào trên bìa/trang để chỉnh sửa tức thì.
              </p>
            </div>

            {/* Couple Names & Date Form */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-3.5">
              <div className="flex items-center justify-between pb-1 border-b border-stone-200/60">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                  Tên Cô Dâu & Chú Rể
                </span>
              </div>

              {/* Groom Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-600 flex items-center justify-between">
                  <span>Tên Chú Rể</span>
                  <span className="text-[10px] text-stone-400 font-normal">Hiển thị trên bìa & gáy</span>
                </label>
                <input
                  type="text"
                  value={textConfig?.groomName || ''}
                  onChange={(e) => {
                    if (onChangeTextConfig && textConfig) {
                      onChangeTextConfig({
                        ...textConfig,
                        groomName: e.target.value,
                      });
                    }
                  }}
                  placeholder="VD: TUẤN ANH"
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition shadow-2xs uppercase"
                />
              </div>

              {/* Connector */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-600 flex items-center justify-between">
                  <span>Từ Nối Giữa Hai Tên</span>
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {['and', '&', '✦', 'và', 'with'].map((conn) => (
                    <button
                      key={conn}
                      type="button"
                      onClick={() => {
                        if (onChangeTextConfig && textConfig) {
                          onChangeTextConfig({
                            ...textConfig,
                            connector: conn,
                          });
                        }
                      }}
                      className={`py-1 text-xs rounded-lg border text-center font-medium transition cursor-pointer ${
                        (textConfig?.connector || 'and').trim() === conn
                          ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-2xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {conn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bride Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-600 flex items-center justify-between">
                  <span>Tên Cô Dâu</span>
                  <span className="text-[10px] text-stone-400 font-normal">Hiển thị trên bìa & gáy</span>
                </label>
                <input
                  type="text"
                  value={textConfig?.brideName || ''}
                  onChange={(e) => {
                    if (onChangeTextConfig && textConfig) {
                      onChangeTextConfig({
                        ...textConfig,
                        brideName: e.target.value,
                      });
                    }
                  }}
                  placeholder="VD: BẢO NGỌC"
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition shadow-2xs uppercase"
                />
              </div>

              {/* Wedding Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-600 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-stone-500" />
                    Ngày Cưới / Năm
                  </span>
                </label>
                <input
                  type="text"
                  value={textConfig?.dateText || ''}
                  onChange={(e) => {
                    if (onChangeTextConfig && textConfig) {
                      onChangeTextConfig({
                        ...textConfig,
                        dateText: e.target.value,
                      });
                    }
                  }}
                  placeholder="VD: 10.06.2026 hoặc OCTOBER 2026"
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition shadow-2xs"
                />
              </div>

              {/* Tagline */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-600 flex items-center justify-between">
                  <span>Tiêu Đề Bìa / Khẩu Hiệu (Tagline)</span>
                </label>
                <input
                  type="text"
                  value={textConfig?.tagline || ''}
                  onChange={(e) => {
                    if (onChangeTextConfig && textConfig) {
                      onChangeTextConfig({
                        ...textConfig,
                        tagline: e.target.value,
                      });
                    }
                  }}
                  placeholder="VD: OUR WEDDING DAY hoặc SAVE THE DATE"
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition shadow-2xs uppercase"
                />
              </div>

              {/* Subtext / Quotes */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-stone-600 flex items-center justify-between">
                  <span>Lời Chúc / Lời Thề Ước (Trích dẫn)</span>
                </label>
                <textarea
                  rows={3}
                  value={textConfig?.subtext || ''}
                  onChange={(e) => {
                    if (onChangeTextConfig && textConfig) {
                      onChangeTextConfig({
                        ...textConfig,
                        subtext: e.target.value,
                      });
                    }
                  }}
                  placeholder="Nhập lời chúc, câu châm ngôn hoặc trích dẫn tình yêu..."
                  className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none transition shadow-2xs resize-none"
                />

                {/* Quick Quote Suggestions */}
                <div className="pt-1">
                  <span className="text-[10px] text-stone-400 font-semibold block mb-1">Mẫu gợi ý nhanh:</span>
                  <div className="space-y-1">
                    {[
                      '“Every love story is beautiful, but ours is my favorite.”',
                      '“Together is our favorite place to be.”',
                      '“Two lives, two hearts, joined together in friendship, united forever in love.”',
                      '“You are my today and all of my tomorrows.”',
                    ].map((quote, qIdx) => (
                      <button
                        key={qIdx}
                        type="button"
                        onClick={() => {
                          if (onChangeTextConfig && textConfig) {
                            onChangeTextConfig({
                              ...textConfig,
                              subtext: quote,
                            });
                          }
                        }}
                        className="w-full text-left text-[10px] p-1.5 bg-white hover:bg-stone-100 text-stone-600 hover:text-stone-900 rounded-lg border border-stone-200/80 truncate transition cursor-pointer"
                        title={quote}
                      >
                        {quote}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Font Selection */}
              <div className="space-y-1.5 pt-1 border-t border-stone-200/60">
                <label className="text-[11px] font-semibold text-stone-600 block">
                  Kiểu Phông Chữ Tên (Typography)
                </label>
                <select
                  value={textConfig?.namesFont || 'Bodoni Moda, serif'}
                  onChange={(e) => {
                    if (onChangeTextConfig && textConfig) {
                      onChangeTextConfig({
                        ...textConfig,
                        namesFont: e.target.value,
                      });
                    }
                  }}
                  className="w-full text-xs p-2 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none cursor-pointer shadow-2xs font-medium"
                >
                  <option value="Bodoni Moda, serif">Bodoni Moda (Cổ điển, Sang trọng)</option>
                  <option value="Cormorant Garamond, serif">Cormorant Garamond (Thơ mộng, Tinh tế)</option>
                  <option value="Cinzel, serif">Cinzel (Hoàng gia, Đẳng cấp)</option>
                  <option value="Montserrat, sans-serif">Montserrat (Hiện đại, Tinh gọn)</option>
                  <option value="Playfair Display, serif">Playfair Display (Lãng mạn, Nữ tính)</option>
                  <option value="Great Vibes, cursive">Great Vibes (Viết tay nghệ thuật)</option>
                  <option value="Alex Brush, cursive">Alex Brush (Thư pháp bay bổng)</option>
                  <option value="Plus Jakarta Sans, sans-serif">Plus Jakarta Sans (Tối giản, Dễ đọc)</option>
                </select>
              </div>

              {/* Color Swatches */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-stone-600 block">
                  Màu Sắc Chữ
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {[
                    { name: 'Đen than', value: '#1c1917' },
                    { name: 'Vàng Gold', value: '#b45309' },
                    { name: 'Nâu ấm', value: '#78350f' },
                    { name: 'Trắng tuyết', value: '#ffffff' },
                    { name: 'Hồng pastel', value: '#be185d' },
                    { name: 'Xanh Navy', value: '#1e3a8a' },
                  ].map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {
                        if (onChangeTextConfig && textConfig) {
                          onChangeTextConfig({
                            ...textConfig,
                            namesColor: color.value,
                          });
                        }
                      }}
                      className={`h-7 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                        (textConfig?.namesColor || '#1c1917') === color.value
                          ? 'ring-2 ring-sky-500 border-sky-500 scale-105'
                          : 'border-stone-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {(textConfig?.namesColor || '#1c1917') === color.value && (
                        <Check className={`w-3.5 h-3.5 ${color.value === '#ffffff' ? 'text-black' : 'text-white'}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply to all album button */}
              {onApplyTextConfigToAll && textConfig && (
                <div className="pt-2 border-t border-stone-200/60">
                  <button
                    type="button"
                    onClick={() => {
                      onApplyTextConfigToAll(textConfig);
                      setTextAppliedNotice(true);
                      setTimeout(() => setTextAppliedNotice(false), 2200);
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                      textAppliedNotice
                        ? 'bg-emerald-600 text-white shadow-emerald-600/20 ring-2 ring-emerald-500/30'
                        : 'bg-stone-900 hover:bg-black text-white active:scale-[0.98]'
                    }`}
                  >
                    {textAppliedNotice ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-100" />
                        <span>Đã áp dụng cho tất cả các trang!</span>
                      </>
                    ) : (
                      <>
                        <CopyCheck className="w-4 h-4 text-stone-300" />
                        <span>Áp dụng tên & ngày cho toàn bộ Album</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Custom Overlay Text Section */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Chữ Nghệ Thuật Tự Do
                </span>
                <span className="text-[10px] text-stone-400 font-semibold">
                  {customTexts?.length || 0} chữ trên trang
                </span>
              </div>

              {onOpenAddTextModal && (
                <button
                  type="button"
                  onClick={onOpenAddTextModal}
                  className="w-full py-2 px-3 bg-white hover:bg-sky-50 border-2 border-dashed border-sky-300 hover:border-sky-500 text-sky-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4 h-4 text-sky-600" />
                  <span>Thêm Chữ Nghệ Thuật Mới</span>
                </button>
              )}

              {/* List of custom texts on this page */}
              {customTexts && customTexts.length > 0 && (
                <div className="space-y-2 pt-1">
                  {customTexts.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onSelectText?.(item.id)}
                      className={`p-2.5 bg-white rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
                        selectedTextId === item.id
                          ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-stone-800 truncate max-w-[180px]">
                          "{item.text}"
                        </span>
                        {onDeleteCustomText && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteCustomText(item.id);
                            }}
                            className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Xóa chữ này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Controls for selected text */}
                      <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[11px] text-stone-500">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onUpdateCustomText) {
                                onUpdateCustomText({ ...item, fontSize: Math.max(12, item.fontSize - 3) });
                              }
                            }}
                            className="w-5 h-5 bg-stone-100 hover:bg-stone-200 rounded flex items-center justify-center font-bold text-stone-700"
                            title="Giảm cỡ chữ"
                          >
                            -
                          </button>
                          <span className="text-[10px] font-mono px-1">{item.fontSize}px</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onUpdateCustomText) {
                                onUpdateCustomText({ ...item, fontSize: Math.min(100, item.fontSize + 3) });
                              }
                            }}
                            className="w-5 h-5 bg-stone-100 hover:bg-stone-200 rounded flex items-center justify-center font-bold text-stone-700"
                            title="Tăng cỡ chữ"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onUpdateCustomText) {
                                const newRot = ((item.rotation || 0) - 15 + 360) % 360;
                                onUpdateCustomText({ ...item, rotation: newRot });
                              }
                            }}
                            className="p-1 bg-stone-100 hover:bg-stone-200 rounded text-stone-600"
                            title="Xoay -15°"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onUpdateCustomText) {
                                const newRot = ((item.rotation || 0) + 15) % 360;
                                onUpdateCustomText({ ...item, rotation: newRot });
                              }
                            }}
                            className="p-1 bg-stone-100 hover:bg-stone-200 rounded text-stone-600"
                            title="Xoay +15°"
                          >
                            <RotateCw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: FRAME & BACKGROUND STYLE */}
        {activeTab === 'style' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5 animate-fade-in">
            {/* Safe Zone & Print Guides (Vùng an toàn & Đường guide in ấn) - Ẩn theo yêu cầu người dùng */}

            {/* Custom Overlay Section */}
            {(() => {
              return null;
            })()}

            {/* Aspect Ratio Selector */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-4">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                Kích thước
              </span>
              
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Layout vuông</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '30:15', label: '15x15' },
                    { id: '40:20', label: '20x20' },
                    { id: '60:30', label: '30x30' },
                  ].map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => updateSettings('aspectRatio', ratio.id as AspectRatioType)}
                      className={`p-2 text-xs rounded-xl border text-center transition ${
                        posterSettings.aspectRatio === ratio.id
                          ? 'border-sky-600 bg-sky-50 font-semibold text-sky-900'
                          : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Layout đứng</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '30:21', label: '15x21' },
                    { id: '40:30', label: '20x30' },
                    { id: '50:35', label: '25x35' },
                    { id: '60:40', label: '30x40' },
                  ].map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => updateSettings('aspectRatio', ratio.id as AspectRatioType)}
                      className={`p-2 text-xs rounded-xl border text-center transition ${
                        posterSettings.aspectRatio === ratio.id
                          ? 'border-sky-600 bg-sky-50 font-semibold text-sky-900'
                          : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Layout ngang</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: '50:20', label: '25x20' },
                    { id: '42:15', label: '21x15' },
                    { id: '60:20', label: '30x20' },
                    { id: '70:25', label: '35x25' },
                    { id: '80:30', label: '40x30' },
                  ].map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => updateSettings('aspectRatio', ratio.id as AspectRatioType)}
                      className={`p-2 text-xs rounded-xl border text-center transition ${
                        posterSettings.aspectRatio === ratio.id
                          ? 'border-sky-600 bg-sky-50 font-semibold text-sky-900'
                          : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-700'
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
                Màu Nền Phông Cưới
              </span>
              <div className="grid grid-cols-3 gap-2">
                {BG_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => updateSettings('bgColor', preset.value)}
                    className={`flex flex-col items-center p-2 rounded-xl border text-center transition ${
                      posterSettings.bgColor === preset.value
                        ? 'border-sky-600 ring-2 ring-sky-600/20 bg-white font-medium'
                        : 'border-stone-200 bg-white hover:bg-stone-100'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-stone-300 mb-1 shadow-xs"
                      style={{ backgroundColor: preset.value }}
                    />
                    <span className="text-[10px] text-stone-700 truncate w-full">
                      {preset.name.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Gap Spacing Slider */}
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1.5">
                  <span>Khoảng Cách Giữa Các Khung</span>
                  <span className="text-sky-600 font-bold">{posterSettings.gap}px</span>
                </div>

                {/* Quick Gap Preset Buttons */}
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[
                    { label: 'Siêu khít (3px)', value: 3 },
                    { label: 'Chuẩn mẫu (6px)', value: 6 },
                    { label: 'Vừa (10px)', value: 10 },
                    { label: 'Rộng (16px)', value: 16 },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => updateSettings('gap', preset.value)}
                      className={`py-1 px-1.5 text-[10px] rounded-lg border text-center transition ${
                        posterSettings.gap === preset.value
                          ? 'border-sky-600 bg-sky-50 font-bold text-sky-700'
                          : 'border-stone-200 bg-white hover:bg-stone-100 text-stone-600'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
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
                  <span>Khoảng Lề Viền Ngoài (Outer Margin)</span>
                  <span>{posterSettings.outerMargin}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="60"
                  value={posterSettings.outerMargin}
                  onChange={(e) => updateSettings('outerMargin', parseInt(e.target.value))}
                  className="w-full accent-sky-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                  <span>Bo Góc Khung Ảnh</span>
                  <span>{posterSettings.cornerRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={posterSettings.cornerRadius}
                  onChange={(e) => updateSettings('cornerRadius', parseInt(e.target.value))}
                  className="w-full accent-sky-600"
                />
              </div>
            </div>


          </div>
        )}
      </div>

      {/* Auto Fill Prompt Modal */}
      {showAutoFillModal && onAutoFill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-stone-200 p-6 text-center">
            <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <LayoutGrid className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-stone-800 text-xl mb-2">Đã tải ảnh xong!</h3>
            <p className="text-sm text-stone-600 mb-6">
              Bạn có muốn tự động rải <span className="font-bold text-sky-600">{lastUploadedCount} ảnh</span> này vào 
              <span className="font-bold text-sky-600"> {totalEmptySlotsCount} khung hình trống</span> trên Album không?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  const unusedImages = libraryImages.filter(img => !usedImageIds.includes(img.id));
                  onAutoFill(unusedImages.length > 0 ? unusedImages.map(img => img.id) : libraryImages.map(img => img.id));
                  setShowAutoFillModal(false);
                }}
                className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white rounded-xl shadow-sm hover:shadow-md font-bold transition-all"
              >
                Đồng ý, rải ảnh ngay!
              </button>
              <button
                onClick={() => setShowAutoFillModal(false)}
                className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold transition-all relative overflow-hidden"
              >
                Không, tôi tự xếp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Clear All Library Images */}
      {showConfirmClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-sm bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Xóa hết ảnh trong thư viện?</h3>
                <p className="text-xs text-stone-500">Dọn dẹp thư viện để tải bộ ảnh mới</p>
              </div>
            </div>

            <div className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200/70 space-y-1">
              <p>
                Bạn có chắc chắn muốn xóa toàn bộ <strong className="text-rose-600 font-bold">{libraryImages.length} ảnh</strong> trong thư viện không?
              </p>
              <p className="text-[11px] text-stone-500">
                Sau khi xóa, bạn có thể bấm nút <strong>Tải ảnh lên</strong> để chọn bộ ảnh mới.
              </p>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-stone-200 hover:bg-stone-50/80 cursor-pointer transition select-none">
              <input
                type="checkbox"
                checked={clearFromPagesToo}
                onChange={(e) => setClearFromPagesToo(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-stone-300 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-semibold text-stone-800 block">Làm trống các khung ảnh trong album</span>
                <span className="text-stone-500 text-[11px] block mt-0.5">Xóa ảnh đã dàn trang để sẵn sàng điền bộ ảnh mới</span>
              </div>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowConfirmClearModal(false)}
                disabled={isClearing}
                className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                disabled={isClearing}
                className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isClearing ? 'Đang xóa...' : `Xác nhận xóa hết (${libraryImages.length})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};