'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
    duration?: number;
}

export function Toast({
    message, type, onClose, duration = 3000
}: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm max-w-sm animate-slide-up ${
            type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
        }`}>
            {type === 'success'
                ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                : <XCircle size={18} className="text-red-500 flex-shrink-0" />
            }
            <span>{message}</span>
            <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
                <X size={14} />
            </button>
        </div>
    );
}

// Hook pentru folosire ușoară
export function useToast() {
    const [toast, setToast] = useState<{
        message: string;
        type: 'success' | 'error';
    } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
    };

    const hideToast = () => setToast(null);

    return { toast, showToast, hideToast };
}