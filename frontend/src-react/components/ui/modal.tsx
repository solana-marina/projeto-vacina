import React, { useEffect } from 'react';
import { X } from 'lucide-react';

import { cn } from '../../lib/cn';
import { Button } from './core';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-2xl' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className={cn('w-full rounded-xl bg-white shadow-xl flex max-h-[92vh] flex-col', maxWidth)}>
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold font-poppins text-[#0B5D7A]">{title}</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-y-auto p-6">{children}</div>

        {footer ? <div className="flex justify-end gap-2 border-t bg-gray-50 p-4">{footer}</div> : null}
      </div>
    </div>
  );
}
