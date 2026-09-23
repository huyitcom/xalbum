import React, { useState, useRef } from 'react';
import { X, Download, FileArchive, Loader2, Sparkles, Lock, KeyRound, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { AlbumPage } from '../types';
import JSZip from 'jszip';
import { captureCanvasAs300DpiJpeg } from '../utils/albumExporter';
import { PosterCanvas } from './PosterCanvas';

interface ExportAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: AlbumPage[];
  activePageIndex: number;
  currentCanvasRef?: React.RefObject<HTMLDivElement | null>;
}

export const ExportAlbumModal: React.FC<ExportAlbumModalProps> = ({
  isOpen,
  onClose,
  pages,
  activePageIndex: _activePageIndex,
  currentCanvasRef: _currentCanvasRef,
}) => {
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number; step: string }>({
    current: 0,
    total: pages.length,
    step: '',
  });

  // Hidden offscreen container for sequential rendering of all pages
  const [offscreenPage, setOffscreenPage] = useState<AlbumPage | null>(null);
  const offscreenCanvasRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleStartDownloadFlow = () => {
    setShowPasswordPrompt(true);
    setPassword('');
    setPasswordError('');
  };

  const handlePasswordSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (password.trim() === '341341') {
      setPasswordError('');
      handleExportZip();
    } else {
      setPasswordError('Mật khẩu không chính xác. Vui lòng nhập lại!');
    }
  };

  // Export full album as ZIP with 300 DPI JPEGs
  const handleExportZip = async () => {
    try {
      setIsExportingZip(true);
      const zip = new JSZip();
      const folder = zip.folder('Album_Cuoi_50x35cm');

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        setExportProgress({
          current: i + 1,
          total: pages.length,
          step: `Đang render Trang ${i + 1}/${pages.length} (${page.title})...`,
        });

        // Set offscreen page state
        setOffscreenPage(page);

        // Wait for React to render offscreen DOM and images to be loaded
        await new Promise((resolve) => setTimeout(resolve, 600));

        if (offscreenCanvasRef.current) {
          const dataUrl = await captureCanvasAs300DpiJpeg(
            offscreenCanvasRef.current,
            page.posterSettings.aspectRatio || '50x35',
            page.posterSettings.bgColor || '#ffffff'
          );

          const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
          const pageNumStr = String(i + 1).padStart(2, '0');
          folder?.file(`Trang_${pageNumStr}.jpg`, base64Data, { base64: true });
        }
      }

      setExportProgress({
        current: pages.length,
        total: pages.length,
        step: 'Đang nén file ZIP chất lượng cao...',
      });

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      const sizeStr = (pages[0]?.posterSettings?.aspectRatio || '50:20').replace(':', 'x') + 'cm';
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `Album_Cuoi_${sizeStr}_Tron_Bo_${pages.length}_Trang.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportProgress({
        current: pages.length,
        total: pages.length,
        step: 'Hoàn tất tải xuống!',
      });

      setTimeout(() => {
        setIsExportingZip(false);
        setOffscreenPage(null);
        setShowPasswordPrompt(false);
        setPassword('');
      }, 1200);
    } catch (err: any) {
      console.error('Lỗi khi nén file zip album:', err);
      alert(`Đã xảy ra lỗi khi tạo file ZIP: ${err?.message || 'Lỗi không xác định'}. Vui lòng thử lại!`);
      setIsExportingZip(false);
      setOffscreenPage(null);
    }
  };

  const percent = exportProgress.total > 0 ? Math.round((exportProgress.current / exportProgress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-stone-50 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">Tải Album Thiết Kế</h3>
              <p className="text-xs text-stone-500">Chuẩn in ấn 300 DPI (5906 x 4134 px - 50x35cm)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExportingZip}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Download Full Album ZIP Card */}
          <div className="border-2 border-sky-400/80 bg-sky-50/40 rounded-2xl p-4 transition flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileArchive className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <span>Tải Trọn Bộ Toàn Bộ Album</span>
                    <span className="text-[10px] bg-sky-200 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                      {pages.length} Trang
                    </span>
                  </div>
                  <div className="text-xs text-stone-600 mt-0.5">
                    Nén tất cả các trang thành 1 file ZIP (300 DPI sẵn sàng in ấn)
                  </div>
                </div>
              </div>
            </div>

            {/* Export Progress UI */}
            {isExportingZip ? (
              <div className="bg-white rounded-xl p-3 border border-sky-200 space-y-2 mt-1">
                <div className="flex items-center justify-between text-xs font-medium text-stone-700">
                  <span className="flex items-center gap-1.5 text-sky-700">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {exportProgress.step || 'Đang chuẩn bị...'}
                  </span>
                  <span className="font-bold text-sky-600">{percent}%</span>
                </div>
                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            ) : showPasswordPrompt ? (
              /* Password Prompt Form */
              <form onSubmit={handlePasswordSubmit} className="bg-white rounded-xl p-3.5 border border-sky-200 space-y-3 mt-1 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                  <KeyRound className="w-4 h-4 text-sky-600" />
                  <span>Xác thực mật khẩu tải album</span>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Nhập mật khẩu..."
                    autoFocus
                    className={`w-full px-3 py-2 pr-9 text-xs border rounded-lg focus:outline-none focus:ring-2 bg-stone-50/50 font-mono tracking-wider ${
                      passwordError
                        ? 'border-rose-400 focus:ring-rose-300 text-rose-900 bg-rose-50/30'
                        : 'border-stone-200 focus:ring-sky-400 focus:border-sky-400 text-stone-800'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {passwordError && (
                  <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-medium animate-shake">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordPrompt(false);
                      setPassword('');
                      setPasswordError('');
                    }}
                    className="w-1/3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Xác nhận & Tải</span>
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={handleStartDownloadFlow}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <FileArchive className="w-4 h-4" />
                <span>Tải File ZIP Trọn Bộ ({pages.length} Trang)</span>
              </button>
            )}
          </div>

          <div className="p-3 bg-stone-50 rounded-xl text-stone-500 text-[11px] leading-relaxed flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              File ảnh xuất ra có độ phân giải <strong>5906 x 4134 px (300 DPI)</strong>, hoàn toàn tương thích và đạt tiêu chuẩn sản xuất album photobook tại Photobook Vietnam.
            </span>
          </div>
        </div>
      </div>

      {/* Hidden Offscreen Element for Batch Rendering */}
      {offscreenPage && (
        <div className="fixed top-[-10000px] left-[-10000px] pointer-events-none w-[1200px] z-[-1] opacity-100">
          <PosterCanvas
            templateId={offscreenPage.templateId}
            slots={offscreenPage.slots}
            textConfig={offscreenPage.textConfig}
            customTexts={offscreenPage.customTexts || []}
            posterSettings={offscreenPage.posterSettings}
            activeSlotIndex={null}
            onSelectSlot={() => {}}
            onSlotImageChange={() => {}}
            onUpdateSlot={() => {}}
            onOpenCropModal={() => {}}
            posterRef={offscreenCanvasRef}
            isExporting={true}
          />
        </div>
      )}
    </div>
  );
};

