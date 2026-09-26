import React, { useState, useRef, useEffect } from 'react';
import { RotateCcw, ShoppingBag, Save, FolderOpen, Download, Sparkles, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  totalPages: number;
  activePageIndex?: number;
  currentProjectName?: string;
  autoSaveStatus?: 'saved' | 'saving' | 'idle';
  lastSavedTime?: number | null;
  onOpenOrderModal: () => void;
  onOpenExportModal?: () => void;
  onResetAll: () => void;
  onOpenSaveProject: () => void;
  onOpenProjectManager: () => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalPages: _totalPages,
  currentProjectName,
  autoSaveStatus: _autoSaveStatus,
  lastSavedTime: _lastSavedTime,
  onOpenOrderModal,
  onOpenExportModal,
  onResetAll,
  onOpenSaveProject,
  onOpenProjectManager,
  onOpenLogin,
}) => {
  const { user, userProfile, isVip, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isUserMenuOpen]);

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

      {/* Center: xAlbum Logo & Auto-save info */}
      <div className="flex items-center justify-center gap-3 select-none">
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

        {/* Project Name */}
        <div className="hidden">
          <span className="hidden font-medium text-stone-700 max-w-[140px] truncate" title={currentProjectName}>
            {currentProjectName || 'Album Cưới'}
          </span>
        </div>
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

        {/* Tải Album (VIP) Button */}
        {onOpenExportModal && (
          <button
            onClick={onOpenExportModal}
            className="p-2 sm:p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer shadow-2xs"
            title="Tải trọn bộ Album chất lượng in ấn 300 DPI"
          >
            <Download className="w-4 h-4 text-emerald-600" />
          </button>
        )}

        {/* Đặt hàng */}
        <button
          onClick={onOpenOrderModal}
          className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-2 rounded-xl shadow-xs hover:shadow transition cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="hidden sm:inline">Đặt hàng</span>
        </button>

        {/* User Account / VIP Button */}
        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 bg-stone-100 hover:bg-stone-200/80 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 transition cursor-pointer"
            >
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.displayName || 'User'}
                  className="w-6 h-6 rounded-full object-cover border border-stone-300"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                  {(userProfile?.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="hidden md:inline max-w-[90px] truncate font-semibold">
                {userProfile?.displayName || user.email?.split('@')[0]}
              </span>
              {isVip ? (
                <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-900 text-[10px] font-black shadow-2xs flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  VIP
                </span>
              ) : (
                <span className="hidden sm:inline-block text-[10px] text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded-md">
                  Thường
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white border border-stone-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-stone-100">
                  <p className="text-xs font-bold text-stone-900 truncate">
                    {userProfile?.displayName || 'Người dùng'}
                  </p>
                  <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {isVip ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        Tài khoản VIP (Được tải file)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px]">
                        Tài khoản thường (Chưa có VIP)
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đăng nhập</span>
            <span className="px-1 py-0.2 bg-white/20 text-white text-[9px] rounded-xs font-black">VIP</span>
          </button>
        )}

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
