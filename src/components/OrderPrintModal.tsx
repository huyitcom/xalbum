import React, { useState } from 'react';
import {
  X,
  Check,
  ShoppingBag,
  Phone,
  MapPin,
  User,
  Calendar,
  ExternalLink,
  MessageCircle,
  Send,
  Mail
} from 'lucide-react';
import { TextConfig, PosterSettings, AlbumPage } from '../types';
import confetti from 'canvas-confetti';

export interface GatePhotoMaterial {
  id: string;
  name: string;
  shortDesc: string;
  highlightTag: string;
  highlightColor: string;
  imagePreview: string;
  popular?: boolean;
}

export const GATE_PHOTO_MATERIALS: GatePhotoMaterial[] = [
  {
    id: 'ruot-day-sieu-sac-net',
    name: 'Album Ruột Dày Siêu Sắc Nét',
    shortDesc: 'Độ dày ấn tượng, công nghệ in siêu sắc nét mang lại dải màu chân thực tuyệt đối.',
    highlightTag: 'Siêu Sắc Nét ✨',
    highlightColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    popular: true,
    imagePreview: 'https://www.photobookvietnam.net/images/sp_5lop.png'
  },
  {
    id: 'ruot-day-can-mang',
    name: 'Album Ruột Dày Cán Màng',
    shortDesc: 'Cán màng lụa mờ bảo vệ chống ẩm, chống xước, bền màu vượt thời gian.',
    highlightTag: 'Bán Chạy Nhất ⭐',
    highlightColor: 'bg-amber-100 text-amber-800 border-amber-200',
    popular: true,
    imagePreview: 'https://www.photobookvietnam.net/images/sp_caocap.png'
  },
  {
    id: 'ruot-mong-sieu-sac-net',
    name: 'Album Ruột Mỏng Siêu Sắc Nét',
    shortDesc: 'Thiết kế mỏng nhẹ tinh tế như tạp chí cao cấp, giữ nguyên chất lượng hiển thị rực rỡ.',
    highlightTag: 'Style Tạp Chí 📕',
    highlightColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    imagePreview: 'https://www.photobookvietnam.net/images/sp_tapchi.png'
  },
  {
    id: 'ruot-mong-can-mang',
    name: 'Album Ruột Mỏng Cán Màng',
    shortDesc: 'Gọn nhẹ dễ lật mở, bề mặt cán màng an toàn bền bỉ lưu giữ kỉ niệm dài lâu.',
    highlightTag: 'Cán Màng Bền Bỉ 💎',
    highlightColor: 'bg-sky-100 text-sky-800 border-sky-200',
    imagePreview: 'https://www.photobookvietnam.net/images/sp_3lop.png'
  }
];

interface OrderPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages?: AlbumPage[];
  activePageIndex?: number;
  textConfig: TextConfig;
  posterSettings: PosterSettings;
  onGetDesignDataUrl?: () => Promise<string | null>;
  onUploadAllPages?: (
    projectFolder: string,
    onProgress?: (current: number, total: number, message: string) => void
  ) => Promise<Array<{ pageNumber: number; url: string }> | false>;
}

export const OrderPrintModal: React.FC<OrderPrintModalProps> = ({
  isOpen,
  onClose,
  pages = [],
  textConfig,
  posterSettings,
  onGetDesignDataUrl,
  onUploadAllPages,
}) => {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('ruot-day-sieu-sac-net');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitProgressMsg, setSubmitProgressMsg] = useState<string>('');
  const [submitProgressPercent, setSubmitProgressPercent] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [savedFolderRef, setSavedFolderRef] = useState<string>('');

  // Admin Download State
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [adminPwd, setAdminPwd] = useState<string>('');
  const [adminError, setAdminError] = useState<boolean>(false);
  const [isAdminDownloading, setIsAdminDownloading] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentMaterial = GATE_PHOTO_MATERIALS.find((m) => m.id === selectedMaterialId) || GATE_PHOTO_MATERIALS[0];

  const currentSize = posterSettings.aspectRatio.split(':').map((val, idx) => idx === 0 ? parseInt(val) / 2 : val).join('x');
  const totalPageCount = pages.length > 0 ? pages.length * 2 : 2;

  const handleSendOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerPhone.trim()) {
      alert('Vui lòng nhập số điện thoại hoặc Zalo để Photobook Vietnam liên hệ tư vấn và gửi bản in thử!');
      return;
    }

    setIsSubmitting(true);
    setSubmitProgressPercent(5);
    setSubmitProgressMsg('Đang khởi tạo thư mục dự án...');

    let isSuccess = false;

    try {
      const initRes = await fetch('/api/order/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: customerName.trim() || 'Khách hàng' })
      });
      
      const initText = await initRes.text();
      let initData: any;
      try {
        initData = JSON.parse(initText);
      } catch {
        throw new Error(
          initRes.ok
            ? 'Phản hồi từ máy chủ không hợp lệ.'
            : `Không thể kết nối đến API (/api/order/init - mã lỗi ${initRes.status}). Chi tiết Vercel: ${initText.substring(0, 150)}`
        );
      }
      
      if (!initRes.ok || !initData?.projectFolder) {
        let errMsg = initData?.error || 'Không thể khởi tạo thư mục lưu trữ.';
        if (initData?.details) errMsg += '\\nChi tiết: ' + initData.details;
        throw new Error(errMsg);
      }
      
      const projectFolder = initData.projectFolder;
      setSavedFolderRef(projectFolder);

      // Export all spreads at 300 DPI high resolution, page by page
      let uploadedPages: Array<{ pageNumber: number; url: string }> = [];

      if (onUploadAllPages && pages.length > 0) {
        const uploadResult = await onUploadAllPages(projectFolder, (curr, tot, msg) => {
          const pct = Math.round((curr / tot) * 80) + 10;
          setSubmitProgressPercent(pct);
          setSubmitProgressMsg(msg);
        });
        
        if (!uploadResult || uploadResult.length === 0) {
           throw new Error('Lỗi trong quá trình kết xuất và tải trang lên Cloudinary.');
        }
        uploadedPages = uploadResult;
      } else if (onGetDesignDataUrl) {
        setSubmitProgressMsg('Đang kết xuất trang thiết kế 300 DPI...');
        setSubmitProgressPercent(50);
        const singleDataUrl = await onGetDesignDataUrl();
        if (singleDataUrl) {
          const uploadRes = await fetch('/api/order/upload-page', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectFolder,
              pageNumber: 1,
              dataUrl: singleDataUrl
            })
          });
          const uploadText = await uploadRes.text();
          let uploadData: any;
          try {
            uploadData = JSON.parse(uploadText);
          } catch {
            throw new Error(`Lỗi máy chủ khi tải ảnh lên (${uploadRes.status})`);
          }
          if (uploadRes.ok && uploadData.success) {
            uploadedPages.push({ pageNumber: 1, url: uploadData.url });
          } else {
            throw new Error(uploadData.error || 'Lỗi tải trang đơn');
          }
        }
      }

      setSubmitProgressPercent(95);
      setSubmitProgressMsg('Đang hoàn tất đơn hàng & gửi email thông báo...');

      const orderData = {
        customerDetails: {
          fullName: customerName.trim() || 'Khách hàng',
          phone: customerPhone.trim(),
          email: customerEmail.trim(),
          address: customerAddress.trim() || 'Tư vấn giao hàng tận nơi',
        },
        groomName: textConfig.groomName || 'Chú rể',
        brideName: textConfig.brideName || 'Cô dâu',
        weddingDate: textConfig.dateText.replace('\n', ' - '),
        albumSize: `${currentSize} cm`,
        pageCount: totalPageCount,
        materialId: currentMaterial.id,
        materialName: currentMaterial.name,
        customerName: customerName.trim() || 'Khách hàng',
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        customerAddress: customerAddress.trim() || 'Tư vấn giao hàng tận nơi',
        notes: notes.trim() || 'Không có',
      };

      const finalizeRes = await fetch('/api/order/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectFolder, orderData, uploadedPages }),
      });
      
      const finalizeText = await finalizeRes.text();
      let finalizeData: any;
      try {
        finalizeData = JSON.parse(finalizeText);
      } catch {
        console.warn('Phản hồi finalize:', finalizeText);
      }

      if (!finalizeRes.ok) {
        console.warn('Cảnh báo email thông báo:', finalizeData?.error || 'Lỗi gửi email');
      }

      isSuccess = true;
    } catch (err) {
      console.error('Error submitting order:', err);
      alert('Đã xảy ra lỗi khi gửi đơn hàng: ' + (err as Error).message);
    } finally {
      setSubmitProgressPercent(100);
      setIsSubmitting(false);
      if (isSuccess) {
        setIsSubmitted(true);
        // Trigger confetti celebration
        try {
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 },
          });
        } catch (_) {}
      }
    }
  };

  const handleOpenZalo = () => {
    // Generate text message for Zalo
    const message = encodeURIComponent(
      `Chào Photobook Vietnam, tôi muốn đặt in Album Cưới ${currentSize}cm:\n` +
      `- Dâu rể: ${textConfig.groomName || 'Chú rể'} & ${textConfig.brideName || 'Cô dâu'}\n` +
      `- Kích thước: ${currentSize} cm\n` +
      `- Số trang thiết kế: ${totalPageCount} trang\n` +
      `- Chất liệu: ${currentMaterial.name}\n` +
      `- Khách hàng: ${customerName || 'Khách hàng'} - SĐT: ${customerPhone}\n` +
      `- Địa chỉ: ${customerAddress || 'Tư vấn giao hàng'}\n` +
      `- Ghi chú: ${notes || 'Không có'}`
    );
    
    const link = document.createElement('a');
    link.href = `https://zalo.me/0938023079?text=${message}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-6xl w-full shadow-2xl overflow-hidden border border-stone-200 my-auto max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-4 bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-xs shrink-0">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold leading-tight">
              Đặt hàng
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {!isSubmitted ? (
            <>
              {/* Current Design Quick Summary */}
              <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm sm:text-base">
                <span className="text-stone-600 font-medium">Kích thước album:</span>
                <span className="font-bold text-sky-700">{currentSize} cm ({totalPageCount} trang)</span>
              </div>

              {/* Step 1: Choose Gate Photo Material */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-semibold">1</span>
                    Chọn Chất Liệu In Album Photobook
                  </h3>
                  <a
                    href="https://www.photobookvietnam.net"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1 font-medium hover:underline"
                  >
                    <span>Xem chi tiết chất liệu tại website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
                  {GATE_PHOTO_MATERIALS.map((mat) => {
                    const isSelected = mat.id === selectedMaterialId;
                    return (
                      <div
                        key={mat.id}
                        onClick={() => setSelectedMaterialId(mat.id)}
                        className={`group relative rounded-xl sm:rounded-2xl border-2 overflow-hidden transition-all duration-200 cursor-pointer flex flex-col ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50/40 ring-2 ring-sky-500/20 shadow-md scale-[1.01]'
                            : 'border-stone-200 hover:border-stone-300 bg-white hover:shadow-xs'
                        }`}
                      >
                        {/* Material Product Image Preview (Compact 2-columns on mobile) */}
                        <div className="relative w-full aspect-[4/3] sm:aspect-[4/5] bg-stone-50 p-1.5 sm:p-3 overflow-hidden flex items-center justify-center border-b border-stone-100">
                          <img
                            src={mat.imagePreview}
                            alt={mat.name}
                            className="w-full h-full object-contain drop-shadow-xs transition duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />

                          {/* Top Badge */}
                          <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 z-10">
                            <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full border shadow-2xs backdrop-blur-xs ${mat.highlightColor}`}>
                              {mat.highlightTag}
                            </span>
                          </div>

                          {/* Selection Checkmark */}
                          <div
                            className={`absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 z-10 w-5 h-5 sm:w-6 sm:h-6 rounded-full border flex items-center justify-center shadow-xs transition ${
                              isSelected
                                ? 'bg-sky-600 border-sky-600 text-white'
                                : 'border-stone-300 bg-white/90 text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3] text-white" />
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                              {mat.name}
                            </h4>
                            <p className="text-[10px] sm:text-[11px] text-stone-500 mt-0.5 sm:mt-1 leading-tight sm:leading-relaxed line-clamp-2">
                              {mat.shortDesc}
                            </p>
                          </div>

                          <div className="mt-1.5 sm:mt-2.5 pt-1.5 sm:pt-2 border-t border-stone-100 flex items-center justify-between">
                            <span className={`text-[10px] sm:text-[11px] font-medium ${isSelected ? 'text-sky-600 font-bold' : 'text-stone-400 group-hover:text-stone-600'}`}>
                              {isSelected ? '✓ Đã chọn' : 'Bấm để chọn'}
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-stone-400">Ép gỗ cao cấp</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Customer Information Form */}
              <div className="border-t border-stone-200 pt-5">
                <h3 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center font-semibold">2</span>
                  Thông tin nhận hàng
                </h3>

                <form onSubmit={handleSendOrder} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-stone-400" />
                        Họ & Tên Người Đặt
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Nguyễn Văn A"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        Số Điện Thoại / Zalo <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Ví dụ: 0938023079"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        Email (Tùy chọn)
                      </label>
                      <input
                        type="email"
                        placeholder="Để nhận bản sao đơn in"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        Địa Chỉ Giao Hàng (Tỉnh / Thành phố)
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Quận 1, TP. Hồ Chí Minh"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        Ghi Chú Ngày Cưới / Yêu Cầu Đặc Biệt
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Cần gấp trước ngày 20 tới..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                      />
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {isAdminMode ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          autoFocus
                          placeholder="Mật khẩu Admin..."
                          value={adminPwd}
                          onChange={(e) => {
                            setAdminPwd(e.target.value);
                            setAdminError(false);
                          }}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              if (adminPwd === '341341') {
                                if (onGetDesignDataUrl) {
                                  setIsAdminDownloading(true);
                                  try {
                                    const dataUrl = await onGetDesignDataUrl();
                                    if (dataUrl) {
                                      const groom = (textConfig.groomName || 'Groom').replace(/\s+/g, '_');
                                      const bride = (textConfig.brideName || 'Bride').replace(/\s+/g, '_');
                                      const sizeCode = posterSettings.aspectRatio.replace(':', 'x');
                                      const fileName = `Anh_Cong_${groom}_${bride}_${sizeCode}_300DPI_${Date.now()}.jpg`;
                                      const link = document.createElement('a');
                                      link.download = fileName;
                                      link.href = dataUrl;
                                      link.click();
                                      setIsAdminMode(false);
                                      setAdminPwd('');
                                    } else {
                                      alert('Không thể tạo file ảnh!');
                                    }
                                  } catch (err) {
                                    console.error(err);
                                    alert('Lỗi xuất file!');
                                  } finally {
                                    setIsAdminDownloading(false);
                                  }
                                }
                              } else {
                                setAdminError(true);
                              }
                            }
                          }}
                          className="w-32 px-2 py-1.5 text-xs border border-stone-300 rounded focus:ring-1 focus:ring-sky-500 focus:outline-none"
                        />
                        {adminError && <span className="text-xs text-red-500 font-medium">Sai mật khẩu!</span>}
                        {isAdminDownloading && <span className="text-xs text-stone-500">Đang xuất file...</span>}
                        {!isAdminDownloading && (
                          <button 
                            type="button" 
                            onClick={() => { setIsAdminMode(false); setAdminPwd(''); setAdminError(false); }} 
                            className="text-xs text-stone-500 underline ml-1"
                          >
                            Đóng
                          </button>
                        )}
                      </div>
                    ) : (
                      <div 
                        className="text-xs text-stone-500 cursor-pointer hover:text-stone-700 transition"
                        onClick={() => setIsAdminMode(true)}
                      >
                        Chúng tôi sẽ kiểm tra file và liên lạc lại với bạn trong vòng 24h
                      </div>
                    )}

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-semibold transition disabled:opacity-50"
                      >
                        Đóng
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-50 min-w-[200px]"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Đang Xử Lý ({submitProgressPercent}%)...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Đặt hàng ngay</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {isSubmitting && (
                    <div className="mt-3 p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-sky-800">
                        <span>{submitProgressMsg || 'Đang tiến hành xử lý dự án...'}</span>
                        <span>{submitProgressPercent}%</span>
                      </div>
                      <div className="w-full bg-sky-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-600 h-full transition-all duration-300 rounded-full"
                          style={{ width: `${submitProgressPercent}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-sky-700">
                        ⚡ Toàn bộ các trang album đang được xuất độ nét cao 300 DPI và lưu trữ trực tiếp vào hệ thống máy chủ Photobook Vietnam.
                      </p>
                    </div>
                  )}
                </form>
              </div>
            </>
          ) : (
            /* Order Success State */
            <div className="py-6 px-4 text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <h3 className="text-xl font-bold font-serif text-stone-900">
                  Đã Ghi Nhận Yêu Cầu Đặt Hàng Thành Công!
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 mt-1.5 max-w-lg mx-auto">
                  Photobook Vietnam đã nhận đầy đủ thông tin thiết kế và {totalPageCount} trang album chuẩn in 300 DPI của bạn. Đội ngũ kỹ thuật sẽ liên hệ qua SĐT / Zalo <span className="font-semibold text-stone-900">{customerPhone}</span> để kiểm tra file in, gửi bản duyệt mẫu và xác nhận đơn hàng.
                </p>
              </div>

              {/* Order Summary Box */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 max-w-lg mx-auto text-left text-xs space-y-2">
                <div className="font-bold text-stone-800 border-b border-stone-200 pb-2 flex justify-between">
                  <span>Tóm Tắt Đơn Đặt In Album</span>
                  <span className="text-sky-700 font-bold">{totalPageCount} trang thiết kế</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Khách hàng:</span>
                  <span className="font-semibold text-stone-800">{customerName || 'Khách hàng'} - {customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Dâu Rể:</span>
                  <span className="font-semibold text-stone-800">{textConfig.groomName} & {textConfig.brideName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Kích thước Album:</span>
                  <span className="font-semibold text-stone-800">{currentSize} ({totalPageCount} trang)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Chất liệu đã chọn:</span>
                  <span className="font-semibold text-sky-700">{currentMaterial.name}</span>
                </div>
                {customerAddress && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Địa chỉ giao:</span>
                    <span className="font-semibold text-stone-800">{customerAddress}</span>
                  </div>
                )}
                {savedFolderRef && (
                  <div className="pt-2 border-t border-stone-200 text-[11px] text-stone-500">
                    📂 <b>Mã thư mục lưu file:</b> <code className="text-sky-700">{savedFolderRef}</code>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleOpenZalo}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0068FF] hover:bg-[#0055d4] text-white text-xs sm:text-sm font-semibold px-6 py-2.5 rounded-xl shadow-md transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Mở Chat Zalo Với Photobook Vietnam</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs sm:text-sm font-semibold transition"
                >
                  Đóng Cửa Sổ
                </button>
              </div>

              <div className="text-[11px] text-stone-400 pt-3">
                Hotline hỗ trợ nhanh: <a href="tel:0938023079" className="text-sky-600 font-semibold underline">0938.023.079</a> | Website: <a href="https://www.photobookvietnam.net" target="_blank" rel="noreferrer" className="text-sky-600 underline">photobookvietnam.net</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
