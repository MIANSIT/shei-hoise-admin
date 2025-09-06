'use client';

import { toast, Toaster } from 'sonner';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';
import { ReactNode } from 'react';
import { Button } from 'antd';

type ToastType = 'success' | 'warning' | 'error' | 'info';

type SheiNotificationOptions = {
  duration?: number;
  content?: ReactNode;
};

export function useSheiNotification() {
  const notify = (type: ToastType, content: ReactNode, options?: SheiNotificationOptions) => {
    const bgColors: Record<ToastType, string> = {
      success: '#22c55e',
      warning: '#facc15',
      error: '#dc2626',
      info: '#2563eb',
    };
    const textColors: Record<ToastType, string> = {
      success: '#f9fafb',
      warning: '#1f2937',
      error: '#fef2f2',
      info: '#f9fafb',
    };
    const closeBgColors: Record<ToastType, string> = {
      success: '#16a34a',
      warning: '#eab308',
      error: '#b91c1c',
      info: '#1d4ed8',
    };
    const icons: Record<ToastType, ReactNode> = {
      success: <CheckCircle2 className="h-5 w-5 text-white" />,
      warning: <AlertTriangle className="h-5 w-5 text-yellow-700" />,
      error: <XCircle className="h-5 w-5 text-white" />,
      info: <CheckCircle2 className="h-5 w-5 text-blue-200" />,
    };

    toast(
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          maxWidth: '90vw',
          width: 'fit-content',
        }}
      >
        <div>{icons[type]}</div>
        <div style={{ minWidth: 0, wordBreak: 'break-word' }}>{content}</div>
        {/* Close button inside the toast */}
        <Button
          size="small"
          type="default"
          style={{
            backgroundColor: closeBgColors[type],
            height: 24,
            width: 24,
            padding: 0,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => toast.dismiss()}
        >
          <X className="h-3 w-3 text-white" />
        </Button>
      </div>,
      {
        style: {
          backgroundColor: bgColors[type],
          color: textColors[type],
          padding: '0.5rem 0.75rem',
          borderRadius: '0.75rem',
          boxShadow: '0 6px 14px rgba(0,0,0,0.15)',
          fontWeight: 500,
        },
        duration: options?.duration ?? 4000,
      }
    );
  };

  return {
    success: (content: ReactNode, options?: SheiNotificationOptions) =>
      notify('success', content, options),
    warning: (content: ReactNode, options?: SheiNotificationOptions) =>
      notify('warning', content, options),
    error: (content: ReactNode, options?: SheiNotificationOptions) =>
      notify('error', content, options),
    info: (content: ReactNode, options?: SheiNotificationOptions) =>
      notify('info', content, options),
  };
}

// Toaster component, place once in your app (e.g., root layout)
export function SheiToaster() {
  return <Toaster position="top-right" />;
}
