import { useState, useRef, useEffect } from 'react';
import {
  AlbumPage,
  FrameSlot,
  PosterSettings,
  TemplateId,
  TextConfig,
  CustomTextElement,
  SavedProject,
} from './types';
import {
  INITIAL_ALBUM_PAGES,
  SAMPLE_WEDDING_PHOTOS,
  TEMPLATES,
  WITH_TEXT_TEMPLATES,
  VIP_THEME_SETS,
  createDefaultPage,
  generateAlbumPages,
} from './data/constants';
import { TextStylePreset } from './data/textStyles';
import { Navbar } from './components/Navbar';
import { PosterCanvas } from './components/PosterCanvas';
import { EditorSidebar } from './components/EditorSidebar';
import { MobileBottomStudio } from './components/MobileBottomStudio';
import { MobileTopFilmstrip } from './components/MobileTopFilmstrip';
import { PageFilmstrip } from './components/PageFilmstrip';
import { PhotoCropModal } from './components/PhotoCropModal';
import { OrderPrintModal } from './components/OrderPrintModal';
import { ExportAlbumModal } from './components/ExportAlbumModal';
import { TemplatePickerModal } from './components/TemplatePickerModal';
import { InitialSetupModal } from './components/InitialSetupModal';
import { AddTextModal } from './components/AddTextModal';
import { SaveProjectModal } from './components/SaveProjectModal';
import { ProjectManagerModal } from './components/ProjectManagerModal';
import { RestoreOrNewProjectModal } from './components/RestoreOrNewProjectModal';
import { LoginModal } from './components/LoginModal';
import { useAuth } from './context/AuthContext';
import {
  saveProject,
  buildSavedProject,
  exportProjectFile,
  saveAutoSaveSession,
  getAutoSaveSession,
  clearAutoSaveSession,
  AutoSaveSession,
} from './utils/projectStorage';
import { imageOptimizer } from './utils/imageOptimizer';
import { AlertCircle, Sparkles, X } from 'lucide-react';

import { ProcessingToast } from './components/ProcessingToast';
import { toJpeg, getFontEmbedCSS } from 'html-to-image';
import { setDpiInJpegDataUrl } from './utils/imageUtils';

export default function App() {
  const { isVip } = useAuth();

  // Multi-page Album State
  const [pages, setPages] = useState<AlbumPage[]>(() => INITIAL_ALBUM_PAGES);
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>(false);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);

  const currentPage = pages[activePageIndex] || pages[0];

  // Active slot interaction & crop modal
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [editingSlot, setEditingSlot] = useState<{ slot: FrameSlot; index: number } | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isExportAlbumOpen, setIsExportAlbumOpen] = useState(false);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [isAddTextModalOpen, setIsAddTextModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginPromptMessage, setLoginPromptMessage] = useState<string | undefined>(undefined);

  // Current Project Tracking
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string>('Album Cưới 1');

  // Auto-Save State
  const [hasRestoredSession, setHasRestoredSession] = useState<boolean>(false);
  const [pendingRestoreSession, setPendingRestoreSession] = useState<AutoSaveSession | null>(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState<boolean>(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Custom UI for Dialogs/Toasts (since iframe blocks window.alert/confirm)
  const [toastMsg, setToastMsg] = useState<{ title: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const showAlert = (title: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMsg({ title, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const posterRef = useRef<HTMLDivElement>(null);

  // Missing images tracking and Smart Relink
  const [missingImagesCount, setMissingImagesCount] = useState(0);
  const [libraryImagesCount, setLibraryImagesCount] = useState(0);
  const [isRelinkDismissed, setIsRelinkDismissed] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      const allImgs = imageOptimizer.getImages();
      setLibraryImagesCount(allImgs.length);

      let missing = 0;
      pages.forEach((page) => {
        page.slots.forEach((slot) => {
          if (
            slot.imageUri &&
            typeof slot.imageUri === 'string' &&
            slot.imageUri.startsWith('img_') &&
            !imageOptimizer.getImage(slot.imageUri)
          ) {
            missing++;
          }
        });
      });
      setMissingImagesCount(missing);
    };

    updateStats();
    const unsub = imageOptimizer.subscribe(updateStats);
    return unsub;
  }, [pages]);

  // 1. Check for saved session on initial mount: prompt user to restore or start new
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const session = await getAutoSaveSession();
        if (
          isMounted &&
          session &&
          session.project &&
          session.project.isSetupComplete &&
          Array.isArray(session.project.pages) &&
          session.project.pages.length > 0
        ) {
          // Found previous session! Show choice modal instead of auto-restoring silently
          setPendingRestoreSession(session);
          setShowRestorePrompt(true);
        } else {
          // No previous session, ready for setup
          if (isMounted) {
            setHasRestoredSession(true);
          }
        }
      } catch (err) {
        console.warn('Could not check auto-save session:', err);
        if (isMounted) {
          setHasRestoredSession(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Helper: Đảm bảo trang Bìa Album luôn ở vị trí đầu tiên (trước trang 1-2)
  const ensureCoverIsFirst = (pagesList: AlbumPage[]): AlbumPage[] => {
    const coverIdx = pagesList.findIndex((p) => p.templateId?.startsWith('cover-'));
    if (coverIdx > 0) {
      const copy = [...pagesList];
      const [coverPage] = copy.splice(coverIdx, 1);
      copy.unshift(coverPage);
      return copy;
    }
    return pagesList;
  };

  // Đảm bảo nếu state hiện tại có bìa ở sau trang 1-2, lập tức đưa lên đầu tiên
  useEffect(() => {
    setPages((prev) => ensureCoverIsFirst(prev));
  }, []);

  const handleConfirmRestore = () => {
    if (!pendingRestoreSession || !pendingRestoreSession.project) return;
    const session = pendingRestoreSession;
    const restoredPages = ensureCoverIsFirst(session.project.pages);
    setPages(restoredPages);
    setIsSetupComplete(true);
    if (session.project.originalId || (session.project.id && session.project.id !== 'xalbum_autosave_session')) {
      setCurrentProjectId(session.project.originalId || session.project.id);
    }
    if (session.project.name) {
      setCurrentProjectName(session.project.name);
    }
    const coverIdxOriginal = session.project.pages.findIndex((p) => p.templateId?.startsWith('cover-'));
    if (coverIdxOriginal > 0 && session.activePageIndex === coverIdxOriginal) {
      setActivePageIndex(0);
    } else if (typeof session.activePageIndex === 'number') {
      setActivePageIndex(Math.min(session.activePageIndex, restoredPages.length - 1));
    }
    setAutoSaveStatus('saved');
    setLastSavedTime(session.savedAt || Date.now());
    setHasRestoredSession(true);
    setShowRestorePrompt(false);
    setPendingRestoreSession(null);
    showAlert(`Đã khôi phục dự án "${session.project.name || 'Album Cưới'}" thành công!`, 'success');
  };

  const handleStartNewProjectFromPrompt = async () => {
    setShowRestorePrompt(false);
    setPendingRestoreSession(null);
    await clearAutoSaveSession();
    setCurrentProjectId(null);
    setCurrentProjectName('Album Cưới Mới');
    setHasRestoredSession(true);
    setIsSetupComplete(false); // Opens InitialSetupModal so user selects size & pages
    setAutoSaveStatus('idle');
    setLastSavedTime(null);
    showAlert('Bắt đầu tạo dự án album mới!', 'info');
  };

  // 2. Debounced auto-save when designing
  useEffect(() => {
    if (!hasRestoredSession || !isSetupComplete) return;

    setAutoSaveStatus('saving');

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const proj = buildSavedProject(
          currentProjectName,
          pages,
          isSetupComplete,
          currentProjectId || undefined
        );
        const session = {
          project: {
            ...proj,
            originalId: currentProjectId || undefined,
          },
          activePageIndex,
          savedAt: Date.now(),
        };
        await saveAutoSaveSession(session);
        setAutoSaveStatus('saved');
        setLastSavedTime(Date.now());
      } catch (err) {
        console.warn('Auto-save error:', err);
      }
    }, 1000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [pages, currentProjectName, currentProjectId, activePageIndex, isSetupComplete, hasRestoredSession]);

  // 3. Immediate flush when window unloads or becomes hidden
  useEffect(() => {
    if (!hasRestoredSession || !isSetupComplete) return;

    const flushAutoSave = () => {
      try {
        const proj = buildSavedProject(
          currentProjectName,
          pages,
          isSetupComplete,
          currentProjectId || undefined
        );
        const session = {
          project: {
            ...proj,
            originalId: currentProjectId || undefined,
          },
          activePageIndex,
          savedAt: Date.now(),
        };
        saveAutoSaveSession(session);
      } catch (err) {
        console.warn('Error flushing auto-save:', err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushAutoSave();
      }
    };

    const handleBeforeUnload = () => {
      flushAutoSave();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pages, currentProjectName, currentProjectId, activePageIndex, isSetupComplete, hasRestoredSession]);

  const handleSmartRelinkPhotos = () => {
    const readyImages = imageOptimizer.getImages().map((img) => img.id);
    if (readyImages.length === 0) {
      showAlert('Vui lòng tải ảnh vào Thư viện trước khi kết nối lại.', 'error');
      return;
    }

    let relinkedCount = 0;
    let imgIdx = 0;

    setPages((prevPages) =>
      prevPages.map((page) => ({
        ...page,
        slots: page.slots.map((slot) => {
          if (
            slot.imageUri &&
            typeof slot.imageUri === 'string' &&
            slot.imageUri.startsWith('img_') &&
            !imageOptimizer.getImage(slot.imageUri)
          ) {
            if (imgIdx < readyImages.length) {
              const newUri = readyImages[imgIdx++];
              relinkedCount++;
              return { ...slot, imageUri: newUri };
            }
          }
          return slot;
        }),
      }))
    );

    showAlert(`Đã tự động kết nối ${relinkedCount} ảnh vào các khung bị thiếu!`, 'success');
  };

  // Sync active page bounds
  useEffect(() => {
    if (activePageIndex >= pages.length) {
      setActivePageIndex(Math.max(0, pages.length - 1));
    }
  }, [pages.length, activePageIndex]);

  // Update current page properties helper
  const updateCurrentPage = (updater: (prevPage: AlbumPage) => AlbumPage) => {
    setPages((prevPages) => {
      const copy = [...prevPages];
      const target = copy[activePageIndex];
      if (target) {
        copy[activePageIndex] = updater(target);
      }
      return copy;
    });
  };

  // Change Template for the active page
  const handleTemplateChange = (newTemplateId: TemplateId) => {
    const selectedTemplate = TEMPLATES.find((t) => t.id === newTemplateId);
    const targetCount = selectedTemplate ? selectedTemplate.slotCount : 3;
    const isCoverTemplate = Boolean(typeof newTemplateId === 'string' && newTemplateId.startsWith('cover-'));
    const isSwitchingOverlay = Boolean(
      selectedTemplate?.isOverlay ||
        selectedTemplate?.category === 'vip' ||
        (typeof newTemplateId === 'string' && newTemplateId.startsWith('overlay-'))
    );

    setSelectedTextId(null);
    setActiveSlotIndex(null);

    setPages((prevPages) => {
      let updatedPages = prevPages.map((page, idx) => {
        if (idx !== activePageIndex) {
          if (isSwitchingOverlay) {
            return {
              ...page,
              posterSettings: {
                ...page.posterSettings,
                aspectRatio: '50:20',
              },
            };
          }
          return page;
        }

        const currentSlots = page.slots || [];
        let newSlots: FrameSlot[];

        if (currentSlots.length === targetCount) {
          newSlots = currentSlots;
        } else if (currentSlots.length < targetCount) {
          const added = Array.from({ length: targetCount - currentSlots.length }, (_, i) => ({
            id: `slot-${page.pageNumber}-${currentSlots.length + i}-${Date.now()}`,
            imageUri: SAMPLE_WEDDING_PHOTOS[(currentSlots.length + i) % SAMPLE_WEDDING_PHOTOS.length] || null,
            zoom: 1,
            offsetX: 0,
            offsetY: 0,
            filter: 'none',
            rotation: 0,
          }));
          newSlots = [...currentSlots, ...added];
        } else {
          newSlots = currentSlots.slice(0, targetCount);
        }

        const overlaySettings = isSwitchingOverlay
          ? {
              aspectRatio: '50:20',
              outerMargin: 0,
              gap: 0,
              borderStyle: 'none' as const,
              customOverlayUri: selectedTemplate?.overlayUri,
              customSlotX: undefined,
              customSlotY: undefined,
              customSlotW: undefined,
              customSlotH: undefined,
              customSlotRotation: undefined,
            }
          : {
              customOverlayUri: undefined,
            };

        return {
          ...page,
          templateId: newTemplateId,
          title: isCoverTemplate ? 'Bìa Album' : page.title,
          slots: newSlots,
          posterSettings: {
            ...page.posterSettings,
            ...overlaySettings,
            aspectRatio: isSwitchingOverlay
              ? '50:20'
              : (selectedTemplate?.aspectRatio || page.posterSettings.aspectRatio || '50:20'),
          },
        };
      });

      // Nếu chọn layout Bìa Album và trang không ở vị trí đầu tiên, đưa ngay lên đầu trước Trang 1-2!
      if (isCoverTemplate && activePageIndex !== 0) {
        const copy = [...updatedPages];
        const [coverPage] = copy.splice(activePageIndex, 1);
        copy.unshift(coverPage);
        updatedPages = copy;
      }

      return updatedPages;
    });

    if (isCoverTemplate && activePageIndex !== 0) {
      setActivePageIndex(0);
      showAlert('Đã đem Bìa Album lên trang đầu tiên trước Trang 1-2!', 'success');
    }
  };

  // Apply Template to ALL pages in album
  const handleApplyTemplateToAll = (newTemplateId: TemplateId) => {
    const selectedTemplate = TEMPLATES.find((t) => t.id === newTemplateId);
    const targetCount = selectedTemplate ? selectedTemplate.slotCount : 3;
    const isSwitchingOverlay = Boolean(selectedTemplate?.isOverlay || selectedTemplate?.category === 'vip' || (typeof newTemplateId === 'string' && newTemplateId.startsWith('overlay-')));

    setPages((prevPages) => {
      return prevPages.map((page) => {
        const currentSlots = page.slots || [];
        let newSlots: FrameSlot[];

        if (currentSlots.length === targetCount) {
          newSlots = currentSlots;
        } else if (currentSlots.length < targetCount) {
          const added = Array.from({ length: targetCount - currentSlots.length }, (_, i) => ({
            id: `slot-${page.pageNumber}-${currentSlots.length + i}-${Date.now()}`,
            imageUri: SAMPLE_WEDDING_PHOTOS[(currentSlots.length + i) % SAMPLE_WEDDING_PHOTOS.length] || null,
            zoom: 1,
            offsetX: 0,
            offsetY: 0,
            filter: 'none',
            rotation: 0,
          }));
          newSlots = [...currentSlots, ...added];
        } else {
          newSlots = currentSlots.slice(0, targetCount);
        }

        const overlaySettings = isSwitchingOverlay
          ? {
              aspectRatio: '50:20',
              outerMargin: 0,
              gap: 0,
              borderStyle: 'none' as const,
              customOverlayUri: selectedTemplate?.overlayUri,
              customSlotX: undefined,
              customSlotY: undefined,
              customSlotW: undefined,
              customSlotH: undefined,
              customSlotRotation: undefined,
            }
          : {};

        return {
          ...page,
          templateId: newTemplateId,
          slots: newSlots,
          posterSettings: {
            ...page.posterSettings,
            ...overlaySettings,
            aspectRatio: isSwitchingOverlay ? '50:20' : (selectedTemplate?.aspectRatio || page.posterSettings.aspectRatio || '50:20'),
          },
        };
      });
    });
  };

  // Apply an entire Theme Set (e.g. "Hoa cỏ mùa xuân") across all album pages with synchronized 50:20 ratio
  const handleApplyThemeSet = (themeId: string) => {
    const theme = VIP_THEME_SETS.find((t) => t.id === themeId) || VIP_THEME_SETS[0];
    if (!theme) return;

    setPages((prevPages) => {
      return prevPages.map((page, index) => {
        const targetTemplate = theme.templates[index % theme.templates.length];
        const targetCount = targetTemplate.slotCount;
        const currentSlots = page.slots || [];

        let newSlots: FrameSlot[];
        if (currentSlots.length === targetCount) {
          newSlots = currentSlots;
        } else if (currentSlots.length < targetCount) {
          const added = Array.from({ length: targetCount - currentSlots.length }, (_, i) => ({
            id: `slot-${page.pageNumber}-${currentSlots.length + i}-${Date.now()}`,
            imageUri: SAMPLE_WEDDING_PHOTOS[(currentSlots.length + i) % SAMPLE_WEDDING_PHOTOS.length] || null,
            zoom: 1,
            offsetX: 0,
            offsetY: 0,
            filter: 'none',
            rotation: 0,
          }));
          newSlots = [...currentSlots, ...added];
        } else {
          newSlots = currentSlots.slice(0, targetCount);
        }

        return {
          ...page,
          templateId: targetTemplate.id,
          slots: newSlots,
          posterSettings: {
            ...page.posterSettings,
            aspectRatio: theme.aspectRatio,
            outerMargin: 0,
            gap: 0,
            borderStyle: 'none' as const,
            customOverlayUri: targetTemplate.overlayUri,
            customSlotX: undefined,
            customSlotY: undefined,
            customSlotW: undefined,
            customSlotH: undefined,
            customSlotRotation: undefined,
          },
        };
      });
    });

    showAlert(`Đã áp dụng trọn bộ "${theme.name}" (10 layout, kích thước 50x20 cm) cho toàn bộ album!`, 'success');
  };

  // Add New Page to Album
  const handleAddPage = (templateId?: TemplateId) => {
    const newPageNumber = pages.length + 1;
    const defaultTemplateId = templateId || WITH_TEXT_TEMPLATES[(newPageNumber - 1) % WITH_TEXT_TEMPLATES.length].id;
    const currentAspectRatio = currentPage?.posterSettings?.aspectRatio || '50:20';
    const newPage = createDefaultPage(newPageNumber, defaultTemplateId, (pages.length * 3) % SAMPLE_WEDDING_PHOTOS.length);
    newPage.posterSettings.aspectRatio = currentAspectRatio;
    setPages((prev) => [...prev, newPage]);
    setActivePageIndex(pages.length);
  };

  // Duplicate Current Page
  const handleDuplicatePage = (index: number) => {
    const sourcePage = pages[index];
    if (!sourcePage) return;

    const duplicatedPage: AlbumPage = {
      ...sourcePage,
      id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${sourcePage.title} (Bản sao)`,
      pageNumber: index + 2,
      slots: sourcePage.slots.map((s, i) => ({
        ...s,
        id: `slot-dup-${Date.now()}-${i}`,
      })),
      textConfig: { ...sourcePage.textConfig },
      posterSettings: { ...sourcePage.posterSettings },
    };

    setPages((prev) => {
      const updated = [...prev];
      updated.splice(index + 1, 0, duplicatedPage);
      // Re-number pages sequentially
      return updated.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    });
    setActivePageIndex(index + 1);
  };

  // Delete a Page
  const handleDeletePage = (index: number) => {
    if (pages.length <= 1) {
      showAlert('Album cần có ít nhất 1 trang thiết kế.', 'error');
      return;
    }
    setConfirmDialog({
      message: `Bạn có chắc chắn muốn xóa Trang ${index + 1}?`,
      onConfirm: () => {
        setPages((prev) => {
          const filtered = prev.filter((_, i) => i !== index);
          return filtered.map((p, i) => ({ ...p, pageNumber: i + 1 }));
        });
        setActivePageIndex((prev) => (prev >= index ? Math.max(0, prev - 1) : prev));
        setConfirmDialog(null);
      }
    });
  };

  // Move Page Order (Reorder)
  const handleMovePage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= pages.length) return;
    setPages((prev) => {
      const updated = [...prev];
      const [movedPage] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, movedPage);
      return updated.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    });
    setActivePageIndex(toIndex);
  };

  // Single Slot Image Update
  const handleSlotImageChange = (index: number, imageUri: string) => {
    updateCurrentPage((page) => {
      const updatedSlots = [...page.slots];
      if (updatedSlots[index]) {
        updatedSlots[index] = {
          ...updatedSlots[index],
          imageUri,
          zoom: 1,
          offsetX: 0,
          offsetY: 0,
        };
      }
      return { ...page, slots: updatedSlots };
    });
  };

  // Update Slot Configuration (crop / zoom / filter)
  const handleUpdateSlot = (updatedSlot: FrameSlot) => {
    updateCurrentPage((page) => ({
      ...page,
      slots: page.slots.map((s) => (s.id === updatedSlot.id ? updatedSlot : s)),
    }));
    if (editingSlot && editingSlot.slot.id === updatedSlot.id) {
      setEditingSlot({ ...editingSlot, slot: updatedSlot });
    }
  };

  // Swap slots
  const handleSwapSlots = (indexA: number, indexB: number) => {
    updateCurrentPage((page) => {
      const updatedSlots = [...page.slots];
      if (updatedSlots[indexA] && updatedSlots[indexB]) {
        const temp = { ...updatedSlots[indexA] };
        
        updatedSlots[indexA] = {
          ...updatedSlots[indexA],
          imageUri: updatedSlots[indexB].imageUri,
          zoom: updatedSlots[indexB].zoom,
          offsetX: updatedSlots[indexB].offsetX,
          offsetY: updatedSlots[indexB].offsetY,
          filter: updatedSlots[indexB].filter,
          rotation: updatedSlots[indexB].rotation,
        };
        
        updatedSlots[indexB] = {
          ...updatedSlots[indexB],
          imageUri: temp.imageUri,
          zoom: temp.zoom,
          offsetX: temp.offsetX,
          offsetY: temp.offsetY,
          filter: temp.filter,
          rotation: temp.rotation,
        };
      }
      return { ...page, slots: updatedSlots };
    });
  };

  // Remove Photo from Slot
  const handleRemovePhoto = (slotId: string) => {
    updateCurrentPage((page) => ({
      ...page,
      slots: page.slots.map((s) =>
        s.id === slotId
          ? { ...s, imageUri: null, zoom: 1, offsetX: 0, offsetY: 0, filter: 'none' }
          : s
      ),
    }));
  };

  // Batch Apply Uploaded Photos to current page (or across pages if many)
  const handleApplyBatchPhotos = (images: string[]) => {
    setPages((prevPages) => {
      let imageIndex = 0;
      return prevPages.map((page) => {
        const updatedSlots = page.slots.map((slot) => {
          const isSlotEmptyOrMissing =
            !slot.imageUri ||
            (typeof slot.imageUri === 'string' && slot.imageUri.includes('unsplash.com')) ||
            (typeof slot.imageUri === 'string' && slot.imageUri.startsWith('img_') && !imageOptimizer.getImage(slot.imageUri));

          // If the slot is empty/missing and we still have images to place
          if (imageIndex < images.length && isSlotEmptyOrMissing) {
            const newSlot = {
              ...slot,
              imageUri: images[imageIndex],
              zoom: 1,
              offsetX: 0,
              offsetY: 0,
            };
            imageIndex++;
            return newSlot;
          }
          return slot;
        });
        return { ...page, slots: updatedSlots };
      });
    });
  };

  // Clear all photos from pages slots (reset slots to empty state)
  const handleClearAllPhotos = (clearFromPages: boolean = true) => {
    if (clearFromPages) {
      setPages((prevPages) =>
        prevPages.map((page) => ({
          ...page,
          slots: page.slots.map((s) => ({
            ...s,
            imageUri: null,
            zoom: 1,
            offsetX: 0,
            offsetY: 0,
            filter: 'none',
          })),
        }))
      );
    }
    showAlert('Đã xóa toàn bộ ảnh trong thư viện thành công!', 'success');
  };

  // Update Text Configuration for active page
  const handleTextConfigChange = (newTextConfig: TextConfig) => {
    updateCurrentPage((page) => ({
      ...page,
      textConfig: newTextConfig,
    }));
  };

  // Apply Bride & Groom Names and Wedding Date to ALL pages in album
  const handleApplyTextConfigToAll = (newTextConfig: TextConfig) => {
    setPages((prev) =>
      prev.map((page) => ({
        ...page,
        textConfig: {
          ...page.textConfig,
          groomName: newTextConfig.groomName,
          brideName: newTextConfig.brideName,
          connector: newTextConfig.connector,
          dateText: newTextConfig.dateText,
          tagline: newTextConfig.tagline,
          namesFont: newTextConfig.namesFont,
          namesColor: newTextConfig.namesColor,
        },
      }))
    );
    showAlert('Đã áp dụng tên cô dâu chú rể & ngày cưới cho toàn bộ album!', 'success');
  };

  // Add a new custom overlay text
  const handleAddCustomText = (preset: TextStylePreset) => {
    const newText: CustomTextElement = {
      id: `text-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: preset.defaultText,
      styleId: preset.id,
      x: 50,
      y: 50,
      fontSize: preset.defaultFontSize,
      color: preset.defaultColor,
      rotation: 0,
      fontFamily: preset.fontFamily,
    };

    updateCurrentPage((page) => ({
      ...page,
      customTexts: [...(page.customTexts || []), newText],
    }));
    setSelectedTextId(newText.id);
    setIsAddTextModalOpen(false);
  };

  // Update an existing custom overlay text
  const handleUpdateCustomText = (updated: CustomTextElement) => {
    updateCurrentPage((page) => ({
      ...page,
      customTexts: (page.customTexts || []).map((t) => (t.id === updated.id ? updated : t)),
    }));
  };

  // Delete a custom overlay text
  const handleDeleteCustomText = (id: string) => {
    updateCurrentPage((page) => ({
      ...page,
      customTexts: (page.customTexts || []).filter((t) => t.id !== id),
    }));
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  };

  // Duplicate a custom overlay text
  const handleDuplicateCustomText = (id: string) => {
    const current = (currentPage.customTexts || []).find((t) => t.id === id);
    if (current) {
      const duplicated: CustomTextElement = {
        ...current,
        id: `text-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        x: Math.min(90, current.x + 4),
        y: Math.min(90, current.y + 4),
      };
      updateCurrentPage((page) => ({
        ...page,
        customTexts: [...(page.customTexts || []), duplicated],
      }));
      setSelectedTextId(duplicated.id);
    }
  };

  // Update Poster / Page Settings
  const handlePosterSettingsChange = (newPosterSettings: PosterSettings) => {
    setPages((prevPages) => {
      const target = prevPages[activePageIndex];
      const aspectChanged = target && target.posterSettings.aspectRatio !== newPosterSettings.aspectRatio;
      const safeZoneChanged = target && (
        target.posterSettings.showSafeZone !== newPosterSettings.showSafeZone ||
        target.posterSettings.showCutZone !== newPosterSettings.showCutZone ||
        target.posterSettings.showGuides !== newPosterSettings.showGuides
      );

      return prevPages.map((page, index) => {
        if (index === activePageIndex) {
          return {
            ...page,
            posterSettings: newPosterSettings,
          };
        }
        let updatedSettings = page.posterSettings;
        if (aspectChanged) {
          updatedSettings = {
            ...updatedSettings,
            aspectRatio: newPosterSettings.aspectRatio,
          };
        }
        if (safeZoneChanged) {
          updatedSettings = {
            ...updatedSettings,
            showSafeZone: newPosterSettings.showSafeZone,
            showCutZone: newPosterSettings.showCutZone,
            showGuides: newPosterSettings.showGuides,
          };
        }
        if (updatedSettings !== page.posterSettings) {
          return {
            ...page,
            posterSettings: updatedSettings,
          };
        }
        return page;
      });
    });
  };

  // Standard 300 DPI Print Dimensions (5906 x 4134 for 50x35cm album)
  const getPrintDimensions = (aspectRatio: string) => {
    const parts = aspectRatio.split(':').map(Number);
    const w = parts[0] || 50;
    const h = parts[1] || 35;
    return {
      width: Math.round((w / 2.54) * 300),
      height: Math.round((h / 2.54) * 300)
    };
  };

  // Get Canvas Image Data URL for Order Submission (High-Resolution 300DPI JPEG)
  const handleGetDesignDataUrl = async (): Promise<string | null> => {
    const currentRef = posterRef.current;
    if (!currentRef) return null;
    return new Promise((resolve) => {
      setIsExporting(true);
      setTimeout(async () => {
        try {
          const { width: targetWidth } = getPrintDimensions(currentPage.posterSettings.aspectRatio);
          const baseWidth = 820;
          const elemWidth = currentRef.offsetWidth || baseWidth;
          const pixelRatio = targetWidth / elemWidth;

          const fontEmbedCSS = await getFontEmbedCSS(currentRef);

          const rawDataUrl = await toJpeg(currentRef, {
            pixelRatio: pixelRatio,
            quality: 0.96,
            backgroundColor: currentPage.posterSettings.bgColor || '#ffffff',
            cacheBust: true,
            fontEmbedCSS: fontEmbedCSS,
          });

          const finalUrl = setDpiInJpegDataUrl(rawDataUrl, 300);
          setIsExporting(false);
          resolve(finalUrl);
        } catch (err) {
          console.error('Failed to capture high-res canvas at 300 DPI:', err);
          setIsExporting(false);
          resolve(null);
        }
      }, 500);
    });
  };

  // Export and Upload all album pages sequentially at 300 DPI for complete project submission
  const handleUploadAllPages = async (
    projectFolder: string,
    onProgress?: (current: number, total: number, message: string) => void
  ): Promise<Array<{ pageNumber: number; url: string }> | false> => {
    const currentRef = posterRef.current;
    if (!currentRef || pages.length === 0) return false;

    const savedIndex = activePageIndex;
    setIsExporting(true);
    let success = true;
    const uploadedPages: Array<{ pageNumber: number; url: string }> = [];

    try {
      for (let i = 0; i < pages.length; i++) {
        if (onProgress) {
          onProgress(i + 1, pages.length, `Đang kết xuất trang ${i + 1}/${pages.length} (300 DPI)...`);
        }

        // Switch to the target page to render its elements
        setActivePageIndex(i);
        // Allow React state & images to paint
        await new Promise((r) => setTimeout(r, 450));

        const pageItem = pages[i];
        const { width: targetWidth } = getPrintDimensions(pageItem.posterSettings.aspectRatio);
        const elemWidth = currentRef.offsetWidth || 820;
        const pixelRatio = targetWidth / elemWidth;

        const fontEmbedCSS = await getFontEmbedCSS(currentRef);

        const rawDataUrl = await toJpeg(currentRef, {
          pixelRatio: pixelRatio,
          quality: 0.96,
          backgroundColor: pageItem.posterSettings.bgColor || '#ffffff',
          cacheBust: true,
          fontEmbedCSS: fontEmbedCSS,
        });

        const finalUrl = setDpiInJpegDataUrl(rawDataUrl, 300);
        
        if (onProgress) {
          onProgress(i + 1, pages.length, `Đang lưu trữ trang ${i + 1} lên hệ thống...`);
        }

        // Upload directly to Cloudinary or fallback to server
        let uploadedPageUrl: string | null = null;

        // Try direct signed Cloudinary upload first (bypasses Vercel 4.5MB payload limit)
        try {
          const fileName = `Trang_${String(i + 1).padStart(2, '0')}`;
          const signRes = await fetch('/api/order/sign-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              folder: `photobook_orders/${projectFolder}`,
              public_id: fileName,
            }),
          });

          const signText = await signRes.text();
          let signData: any = {};
          try {
            signData = JSON.parse(signText);
          } catch {
            signData = {};
          }

          if (signRes.ok && signData.success && signData.signature && signData.cloudName) {
            const formData = new FormData();
            formData.append('file', finalUrl);
            formData.append('api_key', signData.apiKey);
            formData.append('timestamp', String(signData.timestamp));
            formData.append('signature', signData.signature);
            if (signData.folder) formData.append('folder', signData.folder);
            if (signData.public_id) formData.append('public_id', signData.public_id);

            const cldRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, {
              method: 'POST',
              body: formData,
            });

            const cldData = await cldRes.json();
            if (cldRes.ok && cldData.secure_url) {
              uploadedPageUrl = cldData.secure_url;
            } else {
              console.warn('[Cloudinary Direct Upload Warning]', cldData);
            }
          }
        } catch (directErr) {
          console.warn('[Direct Cloudinary Upload Bypass Failed, trying server proxy]:', directErr);
        }

        // Fallback to server proxy upload if direct upload wasn't used
        if (!uploadedPageUrl) {
          const uploadRes = await fetch('/api/order/upload-page', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectFolder,
              pageNumber: i + 1,
              dataUrl: finalUrl
            })
          });

          const uploadText = await uploadRes.text();
          let uploadData: any;
          try {
            uploadData = JSON.parse(uploadText);
          } catch {
            throw new Error(`Lỗi máy chủ (${uploadRes.status}): Vui lòng kiểm tra biến môi trường Cloudinary trên Vercel.`);
          }

          if (!uploadRes.ok || !uploadData.success || !uploadData.url) {
            throw new Error(uploadData?.error || 'Upload failed for page ' + (i + 1));
          }
          uploadedPageUrl = uploadData.url;
        }

        if (uploadedPageUrl) {
          uploadedPages.push({ pageNumber: i + 1, url: uploadedPageUrl });
        }
      }
    } catch (err: any) {
      console.error('Error batch exporting and uploading pages for order:', err);
      success = false;
      throw err; // Re-throw to be caught with clear message in modal
    } finally {
      setActivePageIndex(savedIndex);
      setIsExporting(false);
    }

    return success ? uploadedPages : false;
  };

  // Project persistence
  const handleSaveProject = async (name: string, asNew: boolean) => {
    try {
      const existingId = asNew ? undefined : (currentProjectId || undefined);
      const newProj = buildSavedProject(name, pages, isSetupComplete, existingId);
      await saveProject(newProj);
      setCurrentProjectId(newProj.id);
      setCurrentProjectName(newProj.name);

      // Update auto-save session with new project identity
      await saveAutoSaveSession({
        project: {
          ...newProj,
          originalId: newProj.id,
        },
        activePageIndex,
        savedAt: Date.now(),
      });
      setAutoSaveStatus('saved');
      setLastSavedTime(Date.now());

      setIsSaveModalOpen(false);
      showAlert(`Đã lưu dự án "${newProj.name}" thành công!`, 'success');
    } catch (error: any) {
      console.error('Save error:', error);
      showAlert(error?.message || 'Không thể lưu dự án.', 'error');
    }
  };

  const handleExportCurrentProjectFile = () => {
    if (!isVip) {
      setLoginPromptMessage('Bạn cần đăng nhập tài khoản VIP để tải file sao lưu dự án (.xalbum) về máy tính.');
      setIsLoginModalOpen(true);
      return;
    }
    try {
      const proj = buildSavedProject(currentProjectName, pages, isSetupComplete, currentProjectId || undefined);
      exportProjectFile(proj);
      showAlert(`Đã tải file "${proj.name}.xalbum" về máy tính!`, 'success');
    } catch (error) {
      console.error(error);
      showAlert('Lỗi khi xuất file dự án về máy tính.', 'error');
    }
  };

  const handleLoadProject = (project: SavedProject) => {
    const pagesToLoad = ensureCoverIsFirst(project.pages);
    setPages(pagesToLoad);
    setIsSetupComplete(project.isSetupComplete);
    setCurrentProjectId(project.id);
    setCurrentProjectName(project.name);
    setActivePageIndex(0);
    setSelectedTextId(null);
    setActiveSlotIndex(null);
    setIsProjectManagerOpen(false);
    setIsRelinkDismissed(false);

    // Save auto-save session for loaded project
    saveAutoSaveSession({
      project: {
        ...project,
        originalId: project.id,
      },
      activePageIndex: 0,
      savedAt: Date.now(),
    });
    setAutoSaveStatus('saved');
    setLastSavedTime(Date.now());
  };

  const handleNewProject = () => {
    setConfirmDialog({
      message: 'Tạo một dự án album mới? Hãy chắc chắn bạn đã lưu album hiện tại trước khi tạo mới.',
      onConfirm: async () => {
        await clearAutoSaveSession();
        const defaultPages = generateAlbumPages(10, '50:20');
        setPages(defaultPages);
        setActivePageIndex(0);
        setCurrentProjectId(null);
        setCurrentProjectName('Album Cưới Mới');
        setIsSetupComplete(false);
        setSelectedTextId(null);
        setActiveSlotIndex(null);
        setAutoSaveStatus('idle');
        setLastSavedTime(null);
        setConfirmDialog(null);
        showAlert('Đã tạo dự án album mới!', 'success');
      }
    });
  };

  // Reset Entire Project to Default
  const handleResetAll = () => {
    setConfirmDialog({
      message: 'Khôi phục lại toàn bộ album về các trang mẫu mặc định ban đầu?',
      onConfirm: async () => {
        await clearAutoSaveSession();
        const currentAspectRatio = currentPage?.posterSettings?.aspectRatio || '50:20';
        setPages(generateAlbumPages(10, currentAspectRatio));
        setActivePageIndex(0);
        setAutoSaveStatus('idle');
        setLastSavedTime(null);
        setConfirmDialog(null);
      }
    });
  };

  const handleSetupComplete = (aspectRatio: import('./types').AspectRatioType, pageCount: number) => {
    // Generate pages cycling through rich WITH_TEXT_TEMPLATES
    const newPages = generateAlbumPages(pageCount, aspectRatio);
    setPages(newPages);
    setActivePageIndex(0);
    setIsSetupComplete(true);
    setAutoSaveStatus('saving');
  };
  
  return (
    <div className="h-[100dvh] overflow-hidden flex flex-col bg-stone-100 font-sans text-stone-900 selection:bg-sky-200 selection:text-sky-900">
      {/* Modal: Khôi phục dự án đã lưu hay Tạo dự án mới */}
      {showRestorePrompt && pendingRestoreSession && (
        <RestoreOrNewProjectModal
          isOpen={showRestorePrompt}
          session={pendingRestoreSession}
          onRestore={handleConfirmRestore}
          onNewProject={handleStartNewProjectFromPrompt}
        />
      )}

      {hasRestoredSession && !isSetupComplete && <InitialSetupModal onComplete={handleSetupComplete} />}

      {/* Top Navbar */}
      <Navbar
        totalPages={pages.length}
        activePageIndex={activePageIndex}
        currentProjectName={currentProjectName}
        autoSaveStatus={autoSaveStatus}
        lastSavedTime={lastSavedTime}
        onOpenOrderModal={() => setIsOrderModalOpen(true)}
        onOpenExportModal={() => setIsExportAlbumOpen(true)}
        onResetAll={handleResetAll}
        onOpenSaveProject={() => setIsSaveModalOpen(true)}
        onOpenProjectManager={() => setIsProjectManagerOpen(true)}
        onOpenLogin={() => {
          setLoginPromptMessage(undefined);
          setIsLoginModalOpen(true);
        }}
      />

      {/* Main App Layout: Left Workspace (Canvas + Filmstrip) + Right Control Panel */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Workspace Center Display (Canvas Area + Fixed Bottom Filmstrip Navigator) */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-stone-200/60 relative">
          {/* Mobile Only: Top Filmstrip Bar for fast page selection right above canvas */}
          <div className="lg:hidden shrink-0 w-full z-20">
            <MobileTopFilmstrip
              pages={pages}
              activePageIndex={activePageIndex}
              onSelectPage={(index) => setActivePageIndex(index)}
              onAddPage={handleAddPage}
            />
          </div>

          {/* Scrollable Canvas Viewport */}
          <main 
            onPointerDown={(e) => {
              const target = e.target as HTMLElement;
              if (!target.closest('[id^="custom-text-"]') && !target.closest('button') && !target.closest('input') && !target.closest('textarea') && !target.closest('label')) {
                setSelectedTextId(null);
                setActiveSlotIndex(null);
              }
            }}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-auto flex flex-col items-center justify-start p-2 sm:p-4 2xl:p-6"
          >
            <div className="w-full max-w-7xl 2xl:max-w-[90%] flex flex-col items-center my-auto">
              {/* Missing Images Auto-Relink Banner */}
              {missingImagesCount > 0 && !isRelinkDismissed && (
                <div className="w-full max-w-4xl mb-4 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950 animate-in fade-in">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="p-2 bg-amber-200/80 text-amber-900 rounded-xl shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <p className="font-bold text-amber-950 text-[13px]">
                        Phát hiện {missingImagesCount} khung ảnh chưa có dữ liệu ảnh (từ file .xalbum cũ).
                      </p>
                      <p className="text-amber-800 mt-0.5">
                        {libraryImagesCount > 0
                          ? `Thư viện hiện có ${libraryImagesCount} ảnh. Nhấp nút bên dưới để tự động kết nối ảnh vào khung mà không cần xếp lại từng trang!`
                          : `Vui lòng tải ảnh vào Thư viện ảnh ở thanh bên phải, sau đó bấm Tự động nối ảnh để phục hồi.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {libraryImagesCount > 0 && (
                      <button
                        type="button"
                        onClick={handleSmartRelinkPhotos}
                        className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Tự động nối {Math.min(missingImagesCount, libraryImagesCount)} ảnh
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsRelinkDismissed(true)}
                      className="p-1.5 text-amber-700 hover:text-amber-950 hover:bg-amber-200/60 rounded-lg transition cursor-pointer"
                      title="Đóng thông báo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <PosterCanvas
                isExporting={isExporting}
                templateId={currentPage.templateId}
                slots={currentPage.slots}
                textConfig={currentPage.textConfig}
                onChangeTextConfig={handleTextConfigChange}
                posterSettings={currentPage.posterSettings}
                customTexts={currentPage.customTexts || []}
                selectedTextId={selectedTextId}
                onSelectText={(id) => setSelectedTextId(id)}
                onUpdateCustomText={handleUpdateCustomText}
                onDeleteCustomText={handleDeleteCustomText}
                onDuplicateCustomText={handleDuplicateCustomText}
                activeSlotIndex={activeSlotIndex}
                onSelectSlot={(index) => setActiveSlotIndex(index)}
                onSlotImageChange={handleSlotImageChange}
                onSwapSlots={handleSwapSlots}
                onUpdateSlot={handleUpdateSlot}
                onOpenCropModal={(slot, index) => setEditingSlot({ slot, index })}
                posterRef={posterRef}
                onUpdatePosterSettings={handlePosterSettingsChange}
                pageNumber={activePageIndex + 1}
              />
            </div>
          </main>

          {/* Desktop Only: Permanently Fixed Bottom Filmstrip for Page Management & Quick Navigation */}
          <div className="hidden lg:block shrink-0 flex-none w-full border-t border-stone-200 bg-white z-20 shadow-xs">
            <PageFilmstrip
              pages={pages}
              activePageIndex={activePageIndex}
              onSelectPage={(index) => setActivePageIndex(index)}
              onAddPage={handleAddPage}
              onDuplicatePage={handleDuplicatePage}
              onDeletePage={handleDeletePage}
              onMovePage={handleMovePage}
              onOpenTemplatePicker={() => setIsTemplatePickerOpen(true)}
              onOpenAddTextModal={() => setIsAddTextModalOpen(true)}
              onAutoFill={() => {
                import('./utils/imageOptimizer').then(({ imageOptimizer }) => {
                  const images = imageOptimizer.getImages().map(i => i.id);
                  if (images.length === 0) {
                    alert('Vui lòng tải ảnh lên trước khi rải hình!');
                    return;
                  }
                  handleApplyBatchPhotos(images);
                });
              }}
            />
          </div>

          {/* Mobile Only: Bottom Studio with collapsible photo strip + tab tools */}
          <div className="lg:hidden shrink-0 flex-none w-full z-30">
            <MobileBottomStudio
              pages={pages}
              activePageIndex={activePageIndex}
              onSelectPage={(index) => setActivePageIndex(index)}
              onAddPage={handleAddPage}
              onDuplicatePage={handleDuplicatePage}
              onDeletePage={handleDeletePage}
              onMovePage={handleMovePage}
              templateId={currentPage.templateId}
              onChangeTemplate={handleTemplateChange}
              onApplyTemplateToAll={handleApplyTemplateToAll}
              textConfig={currentPage.textConfig}
              onChangeTextConfig={handleTextConfigChange}
              onApplyTextConfigToAll={handleApplyTextConfigToAll}
              posterSettings={currentPage.posterSettings}
              onChangePosterSettings={handlePosterSettingsChange}
              activeSlotIndex={activeSlotIndex}
              onSelectSlot={(index) => setActiveSlotIndex(index)}
              onSlotImageChange={handleSlotImageChange}
              onAutoFill={handleApplyBatchPhotos}
              totalEmptySlotsCount={pages.reduce(
                (acc, page) =>
                  acc +
                  page.slots.filter(
                    (s) =>
                      !s.imageUri ||
                      (typeof s.imageUri === 'string' && s.imageUri.includes('unsplash.com')) ||
                      (typeof s.imageUri === 'string' && s.imageUri.startsWith('img_') && !imageOptimizer.getImage(s.imageUri))
                  ).length,
                0
              )}
              usedImageIds={pages.flatMap((p) => p.slots).map((s) => s.imageUri).filter(Boolean) as string[]}
              missingImagesCount={missingImagesCount}
              onSmartRelink={handleSmartRelinkPhotos}
              onOpenAddTextModal={() => setIsAddTextModalOpen(true)}
              currentPageSlots={currentPage.slots}
              onApplyThemeSet={handleApplyThemeSet}
            />
          </div>
        </div>

        {/* Right Editor Controls Sidebar - Desktop Only */}
        <div className="hidden lg:flex h-full shrink-0">
          <EditorSidebar
            templateId={currentPage.templateId}
            onChangeTemplate={handleTemplateChange}
            onApplyTemplateToAll={handleApplyTemplateToAll}
            onApplyThemeSet={handleApplyThemeSet}
            textConfig={currentPage.textConfig}
            onChangeTextConfig={handleTextConfigChange}
            onApplyTextConfigToAll={handleApplyTextConfigToAll}
            customTexts={currentPage.customTexts || []}
            onOpenAddTextModal={() => setIsAddTextModalOpen(true)}
            onUpdateCustomText={handleUpdateCustomText}
            onDeleteCustomText={handleDeleteCustomText}
            selectedTextId={selectedTextId}
            onSelectText={(id) => setSelectedTextId(id)}
            posterSettings={currentPage.posterSettings}
            onChangePosterSettings={handlePosterSettingsChange}
            onAutoFill={handleApplyBatchPhotos}
            totalEmptySlotsCount={pages.reduce(
              (acc, page) =>
                acc +
                page.slots.filter(
                  (s) =>
                    !s.imageUri ||
                    (typeof s.imageUri === 'string' && s.imageUri.includes('unsplash.com')) ||
                    (typeof s.imageUri === 'string' && s.imageUri.startsWith('img_') && !imageOptimizer.getImage(s.imageUri))
                ).length,
              0
            )}
            usedImageIds={pages.flatMap((p) => p.slots).map((s) => s.imageUri).filter(Boolean) as string[]}
            missingImagesCount={missingImagesCount}
            onSmartRelink={handleSmartRelinkPhotos}
            onClearAllImages={handleClearAllPhotos}
            currentPageSlots={currentPage.slots}
          />
        </div>
      </div>

      {/* Modals */}
      {editingSlot && (
        <PhotoCropModal
          slot={editingSlot.slot}
          slotIndex={editingSlot.index}
          onClose={() => setEditingSlot(null)}
          onUpdateSlot={handleUpdateSlot}
          onRemovePhoto={handleRemovePhoto}
        />
      )}

      <AddTextModal
        isOpen={isAddTextModalOpen}
        onClose={() => setIsAddTextModalOpen(false)}
        onSelectStyle={handleAddCustomText}
      />

      <ExportAlbumModal
        isOpen={isExportAlbumOpen}
        onClose={() => setIsExportAlbumOpen(false)}
        pages={pages}
        activePageIndex={activePageIndex}
        currentCanvasRef={posterRef}
        onOpenLogin={() => {
          setLoginPromptMessage('Vui lòng đăng nhập tài khoản VIP để tải trọn bộ album in ấn chất lượng cao.');
          setIsLoginModalOpen(true);
        }}
      />

      <OrderPrintModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        pages={pages}
        activePageIndex={activePageIndex}
        textConfig={currentPage.textConfig}
        posterSettings={currentPage.posterSettings}
        onGetDesignDataUrl={handleGetDesignDataUrl}
        onUploadAllPages={handleUploadAllPages}
      />

      <ProcessingToast />
      
      {/* Custom Toast Message */}
      {toastMsg && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
          toastMsg.type === 'success' ? 'bg-green-600' :
          toastMsg.type === 'error' ? 'bg-red-600' :
          'bg-stone-800'
        } text-white font-medium text-sm max-w-sm text-center`}>
          {toastMsg.title}
        </div>
      )}

      {/* Custom Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-stone-900/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center text-center">
            <h3 className="text-lg font-bold text-stone-900 mb-3">Xác nhận</h3>
            <p className="text-[15px] text-stone-600 mb-6">{confirmDialog.message}</p>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="flex-1 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition cursor-pointer shadow-sm hover:shadow"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      <TemplatePickerModal
        isOpen={isTemplatePickerOpen}
        onClose={() => setIsTemplatePickerOpen(false)}
        currentTemplateId={currentPage.templateId}
        onSelectTemplate={(newId) => {
          handleTemplateChange(newId);
          setIsTemplatePickerOpen(false);
        }}
        onApplyTemplateToAll={(newId) => {
          handleApplyTemplateToAll(newId);
          setIsTemplatePickerOpen(false);
        }}
        currentPageSlots={currentPage.slots}
        onApplyThemeSet={handleApplyThemeSet}
      />

      <SaveProjectModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        currentProjectName={currentProjectName}
        currentProjectId={currentProjectId}
        onSave={handleSaveProject}
        onExportFile={handleExportCurrentProjectFile}
      />

      <ProjectManagerModal
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        currentProjectId={currentProjectId}
        onLoadProject={handleLoadProject}
        onNewProject={handleNewProject}
        onOpenSaveCurrent={() => setIsSaveModalOpen(true)}
        onResetAll={handleResetAll}
        onShowToast={showAlert}
      />

      {/* Login / VIP Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        promptMessage={loginPromptMessage}
      />
    </div>
  );
}
