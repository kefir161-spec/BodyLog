'use client';

import React, { useCallback, useState } from 'react';
import {
  ToastProvider as RadixToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  toastVariants,
} from '@/components/ui/toast';

export type ToastData = {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  action?: { label: string; onClick: () => void };
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback(
    (t: Omit<ToastData, 'id'>) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...t, id }]);
      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      <RadixToastProvider>
        {children}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            onOpenChange={(open) => !open && removeToast(toast.id)}
          >
            <div className="grid gap-1">
              <ToastTitle>{toast.title}</ToastTitle>
              {toast.description && (
                <ToastDescription>{toast.description}</ToastDescription>
              )}
            </div>
            {toast.action ? (
              <ToastAction
                altText={toast.action.label}
                onClick={toast.action.onClick}
              >
                {toast.action.label}
              </ToastAction>
            ) : (
              <ToastClose />
            )}
          </Toast>
        ))}
        <ToastViewport />
      </RadixToastProvider>
    </ToastContext.Provider>
  );
}

const ToastContext = React.createContext<{
  addToast: (t: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
} | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
