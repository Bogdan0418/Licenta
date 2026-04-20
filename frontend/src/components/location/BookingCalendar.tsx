'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Calendar, Clock, Users, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { LocationDetail, Slot } from '@/types';

interface Props {
    location: LocationDetail;
}

export function BookingCalendar({ location }: Props) {
    const { user } = useAuth();
    const router = useRouter();
    const [selectedZone, setSelectedZone] = useState(
        location.zones?.[0]?.id || null
    );
    const [selectedDate, setSelectedDate] = useState(
        format(addDays(new Date(), 1), 'yyyy-MM-dd')
    );
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [groupSize, setGroupSize] = useState(2);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const { data: slots, isLoading: slotsLoading } = useQuery({
        queryKey: ['slots', selectedZone, selectedDate],
        queryFn: async () => {
            if (!selectedZone) return [];
            const res = await api.get(
                `/api/locations/public/zones/${selectedZone}/slots?date=${selectedDate}`
            );
            return res.data as Slot[];
        },
        enabled: !!selectedZone,
    });

    const { mutate: createBooking, isPending } = useMutation({
        mutationFn: async () => {
            return api.post('/api/user/bookings', {
                zoneId: selectedZone,
                bookingDate: selectedDate,
                startTime: selectedSlot,
                groupSize,
            });
        },
        onSuccess: () => {
            setSuccess('Rezervare confirmată! Verifică email-ul pentru detalii.');
            setSelectedSlot(null);
            setError('');
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Eroare la rezervare');
        },
    });

    const handleBook = () => {
        if (!user) {
            router.push('/login');
            return;
        }
        if (user.role !== 'USER') {
            setError('Doar utilizatorii pot face rezervări');
            return;
        }
        if (!selectedSlot) {
            setError('Selectează un slot orar');
            return;
        }
        createBooking();
    };

    // Generează datele disponibile (azi + 30 zile)
    const availableDates = Array.from({ length: 30 }, (_, i) =>
        format(addDays(new Date(), i + 1), 'yyyy-MM-dd')
    );

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600" />
                Rezervă acum
            </h2>

            {/* Selectare zonă */}
            {location.zones && location.zones.length > 1 && (
                <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                        Zonă
                    </label>
                    <select
                        value={selectedZone || ''}
                        onChange={(e) => {
                            setSelectedZone(Number(e.target.value));
                            setSelectedSlot(null);
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                        {location.zones.map((z) => (
                            <option key={z.id} value={z.id}>
                                {z.name} (max {z.maxPersons} pers.)
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Selectare dată */}
            <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Data
                </label>
                <select
                    value={selectedDate}
                    onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlot(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                    {availableDates.map((date) => (
                        <option key={date} value={date}>
                            {format(new Date(date), 'EEEE, d MMMM', { locale: ro })}
                        </option>
                    ))}
                </select>
            </div>

            {/* Sloturi orare */}
            <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block flex items-center gap-1">
                    <Clock size={12} />
                    Interval orar
                </label>

                {slotsLoading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin text-indigo-400" size={20} />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {slots?.map((slot) => (
                            <button
                                key={slot.startTime}
                                onClick={() => slot.disponibil &&
                                    setSelectedSlot(slot.startTime)}
                                disabled={!slot.disponibil}
                                className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors ${
                                    selectedSlot === slot.startTime
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : slot.disponibil
                                        ? 'border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
                                        : 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                                }`}
                            >
                                {slot.startTime.substring(0, 5)}
                                {slot.disponibil && (
                                    <span className="block text-xs opacity-70">
                                        {slot.locuriLibere} loc.
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Număr persoane */}
            <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block flex items-center gap-1">
                    <Users size={12} />
                    Număr persoane
                </label>
                <input
                    type="number"
                    min={1}
                    max={location.zones?.find(z => z.id === selectedZone)?.maxPersons || 50}
                    value={groupSize}
                    onChange={(e) => setGroupSize(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
            </div>

            {/* Mesaje */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 text-xs px-3 py-2 rounded-lg">
                    {success}
                </div>
            )}

            {/* Buton rezervă */}
            <button
                onClick={handleBook}
                disabled={isPending || !selectedSlot}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
                {isPending && <Loader2 size={16} className="animate-spin" />}
                {user ? 'Rezervă acum' : 'Autentifică-te pentru a rezerva'}
            </button>
        </div>
    );
}