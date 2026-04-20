'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Star, Calendar, MapPin, X, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useState } from 'react';
import api from '@/lib/api';
import { Booking } from '@/types';

export default function UserDashboardPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [cancelWarning, setCancelWarning] = useState<number | null>(null);
    const [error, setError] = useState('');

    const { data: bookings, isLoading } = useQuery({
        queryKey: ['my-bookings'],
        queryFn: async () => {
            const res = await api.get('/api/user/bookings');
            return res.data as Booking[];
        },
    });

    const { mutate: cancelBooking, isPending: cancelling } = useMutation({
        mutationFn: async (bookingId: number) => {
            return api.delete(`/api/user/bookings/${bookingId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            setCancelWarning(null);
            setError('');
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Eroare la anulare');
        },
    });

    const upcoming = bookings?.filter(b => b.status === 'CONFIRMED') || [];
    const past = bookings?.filter(b =>
        b.status === 'COMPLETED' ||
        b.status === 'CANCELLED_BY_USER' ||
        b.status === 'CANCELLED_NO_SHOW'
    ) || [];

    const statusColors: Record<string, string> = {
        CONFIRMED: 'bg-green-100 text-green-700',
        COMPLETED: 'bg-blue-100 text-blue-700',
        CANCELLED_BY_USER: 'bg-gray-100 text-gray-500',
        CANCELLED_NO_SHOW: 'bg-red-100 text-red-600',
    };

    const statusLabels: Record<string, string> = {
        CONFIRMED: 'Confirmată',
        COMPLETED: 'Finalizată',
        CANCELLED_BY_USER: 'Anulată',
        CANCELLED_NO_SHOW: 'Neprezentare',
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

                {/* Header */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h1 className="text-xl font-bold text-gray-800 mb-1">
                        Bună, {user?.email}!
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Gestionează rezervările tale
                    </p>
                </div>

                {/* Rezervări viitoare */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-indigo-600" />
                        Rezervări viitoare ({upcoming.length})
                    </h2>

                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-indigo-400" size={24} />
                        </div>
                    ) : upcoming.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">
                            Nu ai rezervări viitoare
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {upcoming.map((booking) => (
                                <div key={booking.id}
                                    className="border border-gray-100 rounded-lg p-4 flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <MapPin size={14} className="text-indigo-500" />
                                            <span className="font-medium text-gray-800 text-sm">
                                                {booking.locationName}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                — {booking.zoneName}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 ml-5">
                                            {format(new Date(booking.bookingDate),
                                                'EEEE, d MMMM yyyy', { locale: ro })}
                                            {' '}•{' '}
                                            {booking.startTime.substring(0, 5)} –{' '}
                                            {booking.endTime.substring(0, 5)}
                                            {' '}•{' '}
                                            {booking.groupSize} persoane
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[booking.status]}`}>
                                            {statusLabels[booking.status]}
                                        </span>
                                        {booking.canCancel && (
                                            <button
                                                onClick={() => setCancelWarning(booking.id)}
                                                className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
                                            >
                                                <X size={14} />
                                                Anulează
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Istoric */}
                {past.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="font-semibold text-gray-800 mb-4">
                            Istoric rezervări
                        </h2>
                        <div className="space-y-2">
                            {past.map((booking) => (
                                <div key={booking.id}
                                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">
                                            {booking.locationName}
                                        </span>
                                        <span className="text-xs text-gray-400 ml-2">
                                            {format(new Date(booking.bookingDate),
                                                'd MMM yyyy', { locale: ro })}
                                        </span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[booking.status]}`}>
                                        {statusLabels[booking.status]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal confirmare anulare */}
            {cancelWarning && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-red-100 p-2 rounded-full">
                                <AlertTriangle size={20} className="text-red-600" />
                            </div>
                            <h3 className="font-semibold text-gray-800">
                                Anulezi rezervarea?
                            </h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                            Dacă anulezi cu mai puțin de 12h înainte,
                            ratingul tău va scădea cu 0.5 stele.
                        </p>
                        {error && (
                            <p className="text-red-500 text-xs mb-3">{error}</p>
                        )}
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setCancelWarning(null);
                                    setError('');
                                }}
                                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm"
                            >
                                Înapoi
                            </button>
                            <button
                                onClick={() => cancelBooking(cancelWarning)}
                                disabled={cancelling}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-1"
                            >
                                {cancelling && (
                                    <Loader2 size={14} className="animate-spin" />
                                )}
                                Da, anulează
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}