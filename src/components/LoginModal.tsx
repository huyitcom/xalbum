import React, { useState } from 'react';
import { X, Loader2, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  promptMessage?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  promptMessage,
}) => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const getFriendlyErrorMessage = (err: any) => {
    const code = err?.code || '';
    const msg = String(err?.message || '');

    if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      return `Tên miền hiện tại (${hostname}) chưa được thêm vào Authorized Domains trong Firebase Console của dự án photo-picker-507413.`;
    }
    if (
      msg.includes('identity-toolkit-api-has-not-been-used') ||
      msg.includes('identitytoolkit.googleapis.com') ||
      code.includes('identity-toolkit')
    ) {
      return 'Dịch vụ Identity Toolkit API chưa được bật trên Google Cloud Console của dự án Firebase.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'Phương thức đăng nhập Google chưa được kích hoạt trong Firebase Console (Authentication > Sign-in method).';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất. Vui lòng thử lại!';
    }
    if (code === 'auth/popup-blocked') {
      return 'Trình duyệt đã chặn cửa sổ bật lên (popup). Vui lòng cho phép popup để đăng nhập Google.';
    }
    if (code === 'auth/cancelled-popup-request') {
      return 'Yêu cầu đăng nhập đã bị hủy.';
    }
    if (
      err?.name === 'SecurityError' ||
      msg.includes('cross-origin frame') ||
      msg.includes('$$typeof')
    ) {
      return 'Khung xem trước chặn popup xác thực. Vui lòng mở ứng dụng ở tab trình duyệt mới để đăng nhập Google.';
    }
    return typeof err?.message === 'string' ? err.message : 'Đã có lỗi xảy ra khi xác thực tài khoản Google. Vui lòng thử lại!';
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 leading-tight">
                Đăng nhập tài khoản
              </h3>
              <p className="text-[11px] text-stone-500">Hệ thống phân quyền VIP photobook</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prompt Note */}
        {promptMessage && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              {promptMessage}
            </p>
          </div>
        )}

        {/* VIP Notice Banner */}
        {!promptMessage && (
          <div className="mx-6 mt-4 p-3 bg-stone-50 border border-stone-200/70 rounded-xl flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
              VIP
            </div>
            <p className="text-xs text-stone-600 leading-snug">
              Tài khoản VIP được quyền tải toàn bộ file in ấn chất lượng cao (300 DPI) và sao lưu không giới hạn.
            </p>
          </div>
        )}

        <div className="p-6 pt-4 flex flex-col gap-4">
          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex flex-col gap-2 w-full">
                <span className="leading-relaxed">{error}</span>

                {/* Domain copy helper for unauthorized-domain */}
                {(error.includes('Authorized Domains') || error.includes('unauthorized-domain')) && (
                  <div className="flex flex-col gap-2 pt-1 border-t border-rose-200/60">
                    <div className="flex items-center justify-between gap-2 bg-white/80 p-2 rounded-lg border border-rose-200">
                      <span className="text-[11px] font-mono text-stone-700 truncate select-all">
                        {typeof window !== 'undefined' ? window.location.hostname : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(window.location.hostname);
                          }
                        }}
                        className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-[10px] font-bold cursor-pointer transition shrink-0"
                      >
                        Sao chép tên miền
                      </button>
                    </div>

                    <a
                      href="https://console.firebase.google.com/project/photo-picker-507413/authentication/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-sky-700 underline font-semibold hover:text-sky-800 self-start"
                    >
                      Mở Firebase Authorized Domains →
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <p className="text-xs text-stone-600 text-center leading-relaxed">
              Đăng nhập bằng tài khoản <strong>Gmail</strong> đã được cấp quyền VIP để tự động kích hoạt quyền tải file thiết kế.
            </p>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-stone-50 active:bg-stone-100 border-2 border-stone-300 hover:border-stone-400 rounded-xl text-sm font-bold text-stone-800 shadow-xs hover:shadow transition cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
                  <span>Đang kết nối Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Đăng nhập bằng Gmail (Google)</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-stone-400 text-center leading-normal pt-1">
            Hệ thống đối soát trực tiếp từ cơ sở dữ liệu đã phân quyền của dự án.
          </p>
        </div>
      </div>
    </div>
  );
};
