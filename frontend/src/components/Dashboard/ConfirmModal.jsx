import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative bg-white border-4 border-black rounded-[40px] p-10 max-w-md w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in duration-200">
        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 bg-[#FEE2E2] rounded-full flex items-center justify-center text-4xl border-2 border-black">
            🗑️
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-black uppercase tracking-tight">
              {title || "Ви впевнені?"}
            </h3>
            <p className="text-gray-500 font-bold leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex gap-4 w-full mt-4">
            <button 
              onClick={onClose}
              className="flex-grow py-4 bg-gray-100 border-2 border-black rounded-2xl font-black text-black hover:bg-gray-200 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
            >
              СКАСУВАТИ
            </button>
            <button 
              onClick={onConfirm}
              className="flex-grow py-4 bg-[#ff5e5e] border-2 border-black rounded-2xl font-black text-white hover:bg-red-600 transition active:translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
            >
              ВИДАЛИТИ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;