'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Navbar } from '@/components/layout/Navbar';
import { useState } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Calendar, Users, Loader2, Plus } from 'lucide-react';
import api from '@/lib/api';
import { Booking } from '@/types';

export default function LocationDashboardPage() {

    // ── Hooks ─────────────────────────────────────────────────────────────
    const { user, isLoading: authLoading } = useRequireAuth('LOCATION');
    const queryClient = useQueryClient();
    const [selectedDate, setSelectedDate] = useState(
        format(new Date(), 'yyyy-MM-dd')
    );
    const [showCreateZone, setShowCreateZone] = useState(false);
    const [zoneForm, setZoneForm] = useState({
        name: '',
        capacity: 3,
        maxPersons: 20,
        bookingDurationMinutes: 60,
        openTime: '10:00',
        closeTime: '22:00',
    });

    const { data: agenda, isLoading } = useQuery({
        queryKey: ['agenda', selectedDate],
        queryFn: async () => {
            const res = await api.get(
                `/api/location/agenda?date=${selectedDate}`
            );
            return res.data as Booking[];
        },
        enabled: !!user,
    });

    const { mutate: markNoShow } = useMutation({
        mutationFn: async (bookingId: number) =>
            api.post(`/api/location/bookings/${bookingId}/no-show`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agenda'] });
        },
    });

    const { mutate: createZone, isPending: creatingZone } = useMutation({
        mutationFn: async () =>
            api.post('/api/location/zones', zoneForm),
        onSuccess: () => {
            setShowCreateZone(false);
            setZoneForm({
                name: '',
                capacity: 3,
                maxPersons: 20,
                bookingDurationMinutes: 60,
                openTime: '10:00',
                closeTime: '22:00',
            });
        },
    });

    // ── Loading auth ──────────────────────────────────────────────────────
    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-400" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h1 className="text-xl font-bold text-gray-800">
                        Dashboard Locație
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Gestionează rezervările și configurația locației tale
                    </p>
                </div>

                {/* Agendă zilnică */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                            <Calendar size={16} className="text-indigo-600" />
                            Agenda zilei
                        </h2>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-indigo-400" size={24} />
                        </div>
                    ) : agenda?.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">
                            Nu există rezervări pentru această zi
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {agenda?.map((booking) => (
                                <div key={booking.id}
                                    className="border border-gray-100 rounded-lg p-4 flex items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-gray-800 text-sm">
                                                {booking.startTime.substring(0, 5)} –{' '}
                                                {booking.endTime.substring(0, 5)}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {booking.zoneName}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <Users size={12} />
                                            {booking.groupSize} persoane
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            booking.status === 'CONFIRMED'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {booking.status === 'CONFIRMED'
                                                ? 'Confirmată' : booking.status}
                                        </span>
                                        {booking.status === 'CONFIRMED' && (
                                            <button
                                                onClick={() => markNoShow(booking.id)}
                                                className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-2 py-1 rounded-lg"
                                            >
                                                No-show
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Creare zonă */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-800">
                            Zone rezervabile
                        </h2>
                        <button
                            onClick={() => setShowCreateZone(!showCreateZone)}
                            className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm"
                        >
                            <Plus size={14} />
                            Adaugă zonă
                        </button>
                    </div>

                    {showCreateZone && (
                        <div className="border border-indigo-100 bg-indigo-50 rounded-xl p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Nume zonă', key: 'name', type: 'text', placeholder: 'ex: Terasă' },
                                    { label: 'Persoane max/rezervare', key: 'maxPersons', type: 'number' },
                                    { label: 'Rezervări paralele max', key: 'capacity', type: 'number' },
                                    { label: 'Oră deschidere', key: 'openTime', type: 'time' },
                                    { label: 'Oră închidere', key: 'closeTime', type: 'time' },
                                ].map(({ label, key, type, placeholder }) => (
                                    <div key={key}>
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                                            {label}
                                        </label>
                                        <input
                                            type={type}
                                            value={(zoneForm as any)[key]}
                                            placeholder={placeholder}
                                            onChange={(e) => setZoneForm(p => ({
                                                ...p,
                                                [key]: type === 'number'
                                                    ? Number(e.target.value)
                                                    : e.target.value
                                            }))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                                        />
                                    </div>
                                ))}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                                        Durată rezervare
                                    </label>
                                    <select
                                        value={zoneForm.bookingDurationMinutes}
                                        onChange={(e) => setZoneForm(p => ({
                                            ...p,
                                            bookingDurationMinutes: Number(e.target.value)
                                        }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                                    >
                                        <option value={60}>1 oră</option>
                                        <option value={90}>1.5 ore</option>
                                        <option value={120}>2 ore</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                onClick={() => createZone()}
                                disabled={creatingZone || !zoneForm.name}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                            >
                                {creatingZone && (
                                    <Loader2 size={14} className="animate-spin" />
                                )}
                                Creează zona
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}