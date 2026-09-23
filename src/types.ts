export interface FrameSlot {
  id: string;
  imageUri: string | null;
  zoom: number; // 1 to 3
  offsetX: number; // -100 to 100 percentage
  offsetY: number; // -100 to 100 percentage
  filter: string; // 'none' | 'vintage' | 'warm' | 'bw' | 'airy' | 'film'
  rotation?: number; // 0, 90, 180, 270
}

export interface TextConfig {
  tagline: string;
  taglineFont: string;
  taglineFontSize: number;
  taglineColor: string;
  taglineLetterSpacing: number;

  dateText: string;
  dateFont: string;
  dateFontSize: number;
  dateColor: string;
  dateLetterSpacing: number;

  groomName: string;
  brideName: string;
  connector: string;
  namesFont: string;
  connectorFont: string;
  namesFontSize: number;
  namesColor: string;

  subtext: string;
  subtextFont: string;
  subtextFontSize: number;
  subtextColor: string;

  textAlign: 'center' | 'left' | 'right';
  textUppercase: boolean;
}

export type AspectRatioType = string;

export interface PosterSettings {
  bgColor: string; // hex or preset name
  bgPattern: 'solid' | 'canvas' | 'marble' | 'linen' | 'soft-rose';
  gap: number; // in pixels (e.g. 8 to 24)
  outerMargin: number; // in pixels (e.g. 16 to 48)
  cornerRadius: number; // 0 to 24
  borderStyle: 'none' | 'thin-line' | 'gold-border' | 'double-frame';
  borderColor: string;
  blockBgColor?: string;
  aspectRatio: AspectRatioType;
  // --- Custom Overlay Overrides ---
  customOverlayUri?: string;
  customBackgroundUri?: string;
  customSlotX?: number; // percentage
  customSlotY?: number; // percentage
  customSlotW?: number; // percentage
  customSlotH?: number; // percentage
  customSlotRotation?: number; // degrees
}

export type TemplateCategory = 'basic' | 'with-text' | 'vip';

export type TemplateId = string;

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  slotCount: number;
  aspectRatio: AspectRatioType;
  category?: TemplateCategory;
  previewThumbnail?: string;
  // --- Overlay Architecture ---
  isOverlay?: boolean;
  backgroundUri?: string; // Optional background layer
  overlayUri?: string;    // The transparent PNG with holes
  slotsCoordinates?: {
    x: number;      // percentage
    y: number;      // percentage
    width: number;  // percentage
    height: number; // percentage
    rotation: number; // degrees
    clipPath?: string; // CSS clip-path value
  }[];
}

export interface CustomTextElement {
  id: string;
  text: string;
  styleId: string;
  x: number; // percentage (0 to 100)
  y: number; // percentage (0 to 100)
  fontSize: number;
  rotation?: number; // degrees -180 to 180
  color?: string;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: number;
}

export interface AlbumPage {
  id: string;
  pageNumber: number;
  title: string;
  templateId: TemplateId;
  slots: FrameSlot[];
  textConfig: TextConfig;
  customTexts?: CustomTextElement[];
  posterSettings: PosterSettings;
}

export interface AlbumProject {
  id: string;
  title: string;
  pages: AlbumPage[];
  activePageIndex: number;
}

export interface SavedProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  pageCount: number;
  aspectRatio: AspectRatioType;
  thumbnail?: string | null;
  pages: AlbumPage[];
  isSetupComplete: boolean;
}

