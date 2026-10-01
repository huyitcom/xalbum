import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FolderOpen,
  Plus,
  Trash2,
  Download,
  Calendar,
  Layers,
  Edit2,
  Check,
  Search,
  BookOpen,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { SavedProject } from '../types';
import { imageOptimizer } from '../utils/imageOptimizer';
import {
  getAllProjects,
  deleteProject,
  saveProject,
  exportProjectFile,
  importProjectFile,
} from '../utils/projectStorage';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectId: string | null;
  onLoadProject: (project: SavedProject) => void;
  onNewProject: () => void;
  onOpenSaveCurrent: () => void;
  onResetAll?: () => void;
  onShowToast: (title: string, type: 'success' | 'error' | 'info') => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  currentProjectId,
  onLoadProject,
  onNewProject,
  onOpenSaveCurrent,
  onResetAll,
  onShowToast,
}) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const list = await getAllProjects();
      setProjects(list);
    } catch (err) {
      console.error('Failed to load projects:', err);
      onShowToast('Lỗi khi tải danh sách dự án.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      setSearchQuery('');
      setEditingId(null);
      setDeletingId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpen = (project: SavedProject) => {
    onLoadProject(project);
    onClose();
    onShowToast(`Đã mở dự án "${project.name}"!`, 'success');
  };

  const handleStartRename = (project: SavedProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(project.id);
    setEditingName(project.name);
  };

  const handleSaveRename = async (projectId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingName.trim()) return;

    try {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        const updated = {
          ...project,
          name: editingName.trim(),
          updatedAt: Date.now(),
        };
        await saveProject(updated);
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? updated : p))
        );
        onShowToast('Đã đổi tên dự án!', 'success');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Lỗi khi đổi tên dự án.', 'error');
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setDeletingId(null);
      onShowToast('Đã xóa dự án thành công!', 'info');
    } catch (err) {
      console.error(err);
      onShowToast('Lỗi khi xóa dự án.', 'error');
    }
  };

  const handleExport = (project: SavedProject, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      exportProjectFile(project);
      onShowToast(`Đã tải file "${project.name}.xalbum" về máy!`, 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Lỗi khi xuất file dự án.', 'error');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importProjectFile(file);
      await fetchProjects();
      onShowToast(`Đã nhập thành công dự án "${imported.name}"!`, 'success');
      // Prompt or auto open
      handleOpen(imported);
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'Lỗi khi nhập file dự án.', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatDate = (timestamp: number) => {
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(timestamp));
    } catch {
      return new Date(timestamp).toLocaleDateString('vi-VN');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden file input for project import */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".xalbum,.json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center shadow-xs shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  Quản Lý Dự Án Album
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-semibold">
                  {projects.length} dự án
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Lưu trữ và chuyển đổi giữa các album thiết kế của bạn
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="p-4 sm:px-6 bg-white border-b border-stone-100 flex flex-wrap items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm dự án..."
              className="w-full pl-9 pr-3.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Save Current Project */}
            <button
              onClick={() => {
                onClose();
                onOpenSaveCurrent();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
              title="Lưu lại album đang thiết kế"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lưu album hiện tại</span>
            </button>

            {/* Create New Album */}
            <button
              onClick={() => {
                onClose();
                onNewProject();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs sm:text-sm font-semibold rounded-xl border border-stone-200 transition cursor-pointer"
              title="Khởi tạo một album mới từ đầu"
            >
              <Plus className="w-3.5 h-3.5 text-stone-700" />
              <span>Tạo mới</span>
            </button>

            {/* Mở file dự án từ thiết bị */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs sm:text-sm font-semibold rounded-xl border border-stone-200 transition cursor-pointer"
              title="Mở file dự án (.xalbum/.json) từ máy tính hoặc điện thoại"
            >
              <FolderOpen className="w-3.5 h-3.5 text-stone-700" />
              <span>Mở dự án</span>
            </button>

            {/* Làm mới lại từ đầu */}
            {onResetAll && (
              <button
                onClick={() => {
                  onClose();
                  onResetAll();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-stone-800 text-xs sm:text-sm font-semibold rounded-xl border border-stone-200 transition cursor-pointer"
                title="Khôi phục lại toàn bộ album về các trang mẫu mặc định"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                <span>Làm mới</span>
              </button>
            )}
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50/50">
          {loading ? (
            <div className="py-16 text-center text-stone-400 text-sm">
              Đang tải danh sách dự án...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-3xl bg-stone-100 text-stone-400 flex items-center justify-center mb-3">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-stone-800 mb-1">
                {searchQuery ? 'Không tìm thấy dự án phù hợp' : 'Chưa có dự án nào được lưu'}
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-sm mb-5">
                {searchQuery
                  ? 'Hãy thử tìm bằng từ khóa khác hoặc xóa bộ lọc tìm kiếm.'
                  : 'Hãy nhấn nút "Lưu album hiện tại" để lưu lại thiết kế của bạn hoặc "Nhập file" từ máy tính.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenSaveCurrent();
                  }}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Lưu album hiện tại ngay
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((proj) => {
                const isCurrent = proj.id === currentProjectId;
                const isEditing = editingId === proj.id;
                const isConfirmingDelete = deletingId === proj.id;

                return (
                  <div
                    key={proj.id}
                    onClick={() => !isEditing && !isConfirmingDelete && handleOpen(proj)}
                    className={`group relative bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between ${
                      isCurrent
                        ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-md'
                        : 'border-stone-200 hover:border-stone-300 hover:shadow-md'
                    }`}
                  >
                    {/* Top Content */}
                    <div className="p-4 flex gap-3.5">
                      {/* Thumbnail */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-stone-100 border border-stone-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                        {(() => {
                          let thumbSrc = proj.thumbnail;
                          if (thumbSrc && thumbSrc.startsWith('img_')) {
                            const opt = imageOptimizer.getImage(thumbSrc);
                            thumbSrc = opt ? (opt.thumbnailUrl || opt.previewUrl || opt.originalUrl) : null;
                          }
                          return thumbSrc ? (
                            <img
                              src={thumbSrc}
                              alt={proj.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <BookOpen className="w-8 h-8 text-stone-300" />
                          );
                        })()}
                        <span className="absolute bottom-1 right-1 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                          {proj.pageCount}P
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          {isEditing ? (
                            <form
                              onSubmit={(e) => handleSaveRename(proj.id, e)}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 mb-1"
                            >
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                autoFocus
                                className="flex-1 px-2 py-1 bg-stone-50 border border-sky-400 rounded-lg text-xs font-semibold text-stone-900 focus:outline-hidden"
                              />
                              <button
                                type="submit"
                                className="p-1 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </form>
                          ) : (
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-bold text-sm text-stone-900 truncate group-hover:text-sky-600 transition">
                                {proj.name}
                              </h4>
                              {isCurrent && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                                  Đang mở
                                </span>
                              )}
                            </div>
                          )}

                          <div className="space-y-1 text-[11px] text-stone-500">
                            <div className="flex items-center gap-1.5">
                              <Layers className="w-3 h-3 text-stone-400" />
                              <span>{proj.pageCount} trang • Tỉ lệ {proj.aspectRatio}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-stone-400" />
                              <span>Sửa: {formatDate(proj.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div
                      className="px-4 py-2.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isConfirmingDelete ? (
                        <div className="w-full flex items-center justify-between gap-2 animate-in fade-in">
                          <span className="text-xs text-red-600 font-semibold">
                            Xóa dự án này?
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-2.5 py-1 text-xs text-stone-600 bg-white border border-stone-200 rounded-lg hover:bg-stone-100"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={(e) => handleDelete(proj.id, e)}
                              className="px-2.5 py-1 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700 font-semibold"
                            >
                              Xóa ngay
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOpen(proj)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>Mở album</span>
                          </button>

                          <div className="flex items-center gap-1">
                            {/* Rename */}
                            <button
                              onClick={(e) => handleStartRename(proj, e)}
                              title="Đổi tên dự án"
                              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Export File */}
                            <button
                              onClick={(e) => handleExport(proj, e)}
                              title="Tải file dự án về máy tính (.xalbum)"
                              className="p-1.5 text-stone-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => setDeletingId(proj.id)}
                              title="Xóa dự án"
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
