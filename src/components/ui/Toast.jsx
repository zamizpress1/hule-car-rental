import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Toast = () => {
  const { toast } = useApp();

  if (!toast.visible) return null;

  return (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[70] slide-up">
      <div className="bg-content text-white px-5 py-3 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-brand" />
        <span>{toast.message}</span>
      </div>
    </div>
  );
};
