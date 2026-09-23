import React from 'react';
import { RotateCcw, ShoppingBag, Save, FolderOpen } from 'lucide-react';

interface NavbarProps {
  totalPages: number;
  activePageIndex?: number;
  currentProjectName?: string;
  onOpenOrderModal: () => void;
  onOpenExportModal?: () => void;
  onResetAll: () => void;
  onOpenSaveProject: () => void;
  onOpenProjectManager: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalPages: _totalPages,
  currentProjectName: _currentProjectName,
  onOpenOrderModal,
  onOpenExportModal: _onOpenExportModal,
  onResetAll,
  onOpenSaveProject,
  onOpenProjectManager,
}) => {
  return (
    <header className="w-full bg-white border-b border-stone-200 sticky top-0 z-40 px-3 sm:px-6 py-2.5 shadow-xs flex items-center justify-between gap-4">
      {/* Left: Photobook Vietnam Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="https://photobookvietnam.net"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center hover:opacity-90 transition"
        >
          <img
            src="https://www.photobookvietnam.net/images/logo_reve.png"
            alt="Photobook Vietnam"
            className="h-6 sm:h-7 md:h-8 w-auto object-contain max-w-[140px] sm:max-w-[190px]"
            referrerPolicy="no-referrer"
          />
        </a>
      </div>

      {/* Center: xAlbum Logo */}
      <div className="flex items-center justify-center select-none">
        <a
          href="#"
          className="flex items-center group decoration-none"
        >
          <img
            src="https://www.photobookvietnam.net/images/xalbum_logo.png"
            alt="xAlbum"
            className="h-7 sm:h-8 md:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        </a>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        
        {/* Project Manager / Open */}
        <button
          onClick={onOpenProjectManager}
          className="p-2 sm:p-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl border border-stone-200 transition cursor-pointer shadow-2xs"
          title="Quản lý dự án"
        >
          <FolderOpen className="w-4 h-4 text-stone-700" />
        </button>

        {/* Save Project */}
        <button
          onClick={onOpenSaveProject}
          className="p-2 sm:p-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition cursor-pointer shadow-2xs"
          title="Lưu album hiện tại"
        >
          <Save className="w-4 h-4 text-sky-700" />
        </button>

        {/* Đặt hàng */}
        <button
          onClick={onOpenOrderModal}
          className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-2 rounded-xl shadow-xs hover:shadow transition cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Đặt hàng</span>
        </button>

        <button
          onClick={onResetAll}
          title="Làm mới lại từ đầu"
          className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
