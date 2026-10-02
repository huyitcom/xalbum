import React from 'react';
import { RotateCcw, Plus, Clock, BookOpen, Layers, Image as ImageIcon, ArrowRight, Sparkles } from 'lucide-react';
import { AutoSaveSession } from '../utils/projectStorage';
import { TemplateThumbnail } from './EditorSidebar';

interface RestoreOrNewProjectModalProps {
  isOpen: boolean;
  session: AutoSaveSession | null;
  onRestore: () => void;
  onNewProject: () => void;
}

export const RestoreOrNewProjectModal: React.FC<RestoreOrNewProjectModalProps> = ({
  isOpen,
  session,
  onRestore,
  onNewProject,
}) => {
  if (!isOpen || !session || !session.project) return null;

  const project = session.project;
  const pages = Array.isArray(project.pages) ? project.pages : [];
  const firstPage = pages[0];

  const totalSlots = pages.reduce((sum, p) => sum + (p.slots?.length || 0), 0);
  const filledSlots = pages.reduce(
    (sum, p) => sum + (p.slots?.filter((s) => Boolean(s.imageUri))?.length || 0),
    0
  );

  const aspectRatio =
    firstPage?.posterSettings?.aspectRatio || project.aspectRatio || '50:20';

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Gần đây';
    try {
      const d = new Date(timestamp);
      const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return `${timeStr} • ${dateStr}`;
    } catch {
      return 'Gần đây';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-stone-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 pb-4 text-center border-b border-stone-100 bg-gradient-to-b from-stone-50/80 to-white">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/25">
            <BookOpen className="w-7 h-7" />
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 tracking-tight">
            Chào Mừng Trở Lại!
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Hệ thống tìm thấy dự án bạn đang thiết kế dở dang. Bạn muốn tiếp tục hoàn thiện hay bắt đầu một dự án mới?
          </p>
        </div>

        {/* Saved Project Card Details */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 border border-stone-200/90 shadow-2xs flex gap-3.5 items-center">
            {/* Thumbnail Preview */}
            <div
              className="w-24 sm:w-28 shrink-0 bg-white rounded-xl overflow-hidden shadow-xs border border-stone-200 flex items-center justify-center relative"
              style={{
                aspectRatio: aspectRatio.replace(':', '/'),
              }}
            >
              {firstPage ? (
                <TemplateThumbnail
                  id={firstPage.templateId}
                  slots={firstPage.slots}
                  className="w-full h-full"
                />
              ) : (
                <BookOpen className="w-6 h-6 text-stone-300" />
              )}
              <span className="absolute bottom-1 right-1 bg-stone-900/80 text-white text-[8px] font-bold px-1 rounded-xs">
                Trang 1
              </span>
            </div>

            {/* Metadata Info */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                  Dự án đã lưu
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-stone-900 truncate" title={project.name || 'Album Cưới'}>
                {project.name || 'Album Cưới Mới'}
              </h3>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-600">
                <span className="flex items-center gap-1 font-medium">
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                  {pages.length} trang đôi ({pages.length * 2} trang in)
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                  {filledSlots}/{totalSlots} ảnh đã chèn
                </span>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-stone-400 pt-0.5">
                <Clock className="w-3 h-3 text-stone-400" />
                <span>Lưu gần nhất: {formatDate(session.savedAt)}</span>
              </div>
            </div>
          </div>

          {/* Action Choices */}
          <div className="space-y-2.5 pt-1">
            {/* Primary Action: Restore Saved Project */}
            <button
              type="button"
              onClick={onRestore}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white shadow-md shadow-emerald-600/20 flex items-center justify-between transition cursor-pointer group"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base leading-tight">
                    Khôi phục dự án đã lưu
                  </h4>
                  <p className="text-[11px] text-emerald-100/90 leading-tight mt-0.5">
                    Tiếp tục chỉnh sửa album "{project.name || 'Album Cưới'}"
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-emerald-100 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>

            {/* Secondary Action: Create New Project */}
            <button
              type="button"
              onClick={onNewProject}
              className="w-full p-3.5 rounded-2xl bg-white hover:bg-stone-50 active:scale-[0.99] border-2 border-stone-200 hover:border-sky-300 text-stone-800 shadow-xs flex items-center justify-between transition cursor-pointer group"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base leading-tight text-stone-800">
                    Tạo một dự án mới
                  </h4>
                  <p className="text-[11px] text-stone-500 leading-tight mt-0.5">
                    Bắt đầu album mới từ đầu với kích thước & trang trống
                  </p>
                </div>
              </div>
              <Sparkles className="w-4 h-4 text-sky-500 group-hover:rotate-12 transition-transform shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
