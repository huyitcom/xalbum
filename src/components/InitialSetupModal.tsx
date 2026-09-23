import React, { useState } from 'react';
import { AspectRatioType } from '../types';

interface InitialSetupModalProps {
  onComplete: (aspectRatio: AspectRatioType, pageCount: number) => void;
}

export const InitialSetupModal: React.FC<InitialSetupModalProps> = ({ onComplete }) => {
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('50:20');
  const [pageCount, setPageCount] = useState<number>(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(aspectRatio, pageCount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md my-auto flex flex-col max-h-[90vh]">
        <div className="p-6 overflow-y-auto flex-1">
          <h2 className="text-xl font-bold text-stone-800 mb-6 text-center">Tạo Album Mới</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-4">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                KÍCH THƯỚC
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
                      type="button"
                      key={ratio.id}
                      onClick={() => setAspectRatio(ratio.id as AspectRatioType)}
                      className={`py-2 px-3 text-sm rounded-2xl border text-center transition ${
                        aspectRatio === ratio.id
                          ? 'border-sky-500 bg-sky-50 font-bold text-sky-700 shadow-sm'
                          : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
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
                      type="button"
                      key={ratio.id}
                      onClick={() => setAspectRatio(ratio.id as AspectRatioType)}
                      className={`py-2 px-3 text-sm rounded-2xl border text-center transition ${
                        aspectRatio === ratio.id
                          ? 'border-sky-500 bg-sky-50 font-bold text-sky-700 shadow-sm'
                          : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
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
                      type="button"
                      key={ratio.id}
                      onClick={() => setAspectRatio(ratio.id as AspectRatioType)}
                      className={`py-2 px-3 text-sm rounded-2xl border text-center transition ${
                        aspectRatio === ratio.id
                          ? 'border-sky-500 bg-sky-50 font-bold text-sky-700 shadow-sm'
                          : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-stone-100">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                SỐ LƯỢNG TRANG (TRANG ĐÔI)
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={pageCount}
                  onChange={(e) => setPageCount(parseInt(e.target.value) || 1)}
                  className="w-24 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-800 font-bold text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-sm text-stone-500">trang đôi ({(pageCount || 0) * 2} trang đơn)</span>
              </div>
            </div>
            
          </form>
        </div>
        <div className="p-4 border-t border-stone-100 bg-stone-50 rounded-b-3xl">
          <button
            onClick={handleSubmit}
            className="w-full py-3.5 bg-stone-900 hover:bg-black text-white font-bold rounded-xl transition"
          >
            Bắt đầu thiết kế
          </button>
        </div>
      </div>
    </div>
  );
};
