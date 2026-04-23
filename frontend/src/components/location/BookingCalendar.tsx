'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Calendar, Clock, Users, Loader2, Info } from 'lucide-react';
import api from '@/lib/api';
import { LocationDetail, Slot } from '@/types';

interface Props {
    location: LocationDetail;
}

export function BookingCalendar({ location }: Props) {
    const { user } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [selectedZone, setSelectedZone] = useState(
        location.zones?.[0]?.id || null
    );
    
    const currentZone = location.zones?.find(z => z.id === selectedZone);
    
    const [selectedDate, setSelectedDate] = useState(
        format(addDays(new Date(), 1), 'yyyy-MM-dd')
    );
    
    const dayKey = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const currentDaySchedule = currentZone?.schedule?.[dayKey];
    
    const [selectedDuration, setSelectedDuration] = useState<number>(
        currentZone?.allowedDurations?.[0] || 60
    );
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [groupSize, setGroupSize] = useState(2);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // --- LOGICA NOUĂ: Găsim datele complete ale slotului selectat pentru a avea endTime ---
    const { data: slots, isLoading: slotsLoading } = useQuery({
        queryKey: ['slots', selectedZone, selectedDate, selectedDuration],
        queryFn: async () => {
            if (!selectedZone) return [];
            const res = await api.get(
                `/api/locations/public/zones/${selectedZone}/slots?date=${selectedDate}&duration=${selectedDuration}`
            );
            return res.data as Slot[];
        },
        enabled: !!selectedZone,
    });

    const selectedSlotData = slots?.find(s => s.startTime === selectedSlot);

    useEffect(() => {
        if (currentZone && currentZone.allowedDurations?.length > 0) {
            setSelectedDuration(currentZone.allowedDurations[0]);
        }
    }, [selectedZone, currentZone]);

    const { mutate: createBooking, isPending } = useMutation({
        mutationFn: async () => {
            return api.post('/api/user/bookings', {
                zoneId: selectedZone,
                bookingDate: selectedDate,
                startTime: selectedSlot,
                duration: selectedDuration, 
                groupSize,
            });
        },
        onSuccess: () => {
            setSuccess('Rezervare confirmată! Verifică email-ul pentru detalii.');
            setSelectedSlot(null);
            setError('');
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            queryClient.invalidateQueries({ queryKey: ['slots'] });
        },
        onError: (err: any) => {
            setError(err.response?.data || 'Eroare la rezervare');
        },
    });

    const handleBook = () => {
        if (!user) { router.push('/login'); return; }
        if (user.role !== 'USER') { setError('Doar utilizatorii pot face rezervări'); return; }
        if (!selectedSlot) { setError('Selectează un slot orar'); return; }
        createBooking();
    };

    const availableDates = Array.from({ length: 30 }, (_, i) =>
        format(addDays(new Date(), i + 1), 'yyyy-MM-dd')
    );

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600" />
                Rezervă acum
            </h2>

            {/* Selectare zonă și dată (rămân la fel) */}
            <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Zonă</label>
                <select
                    value={selectedZone || ''}
                    onChange={(e) => { setSelectedZone(Number(e.target.value)); setSelectedSlot(null); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                >
                    {location.zones.map((z) => (
                        <option key={z.id} value={z.id}>{z.name} (max {z.maxPersons} pers.)</option>
                    ))}
                </select>
            </div>

            <div>
                <div className="flex justify-between items-end mb-1">
                    <label className="text-xs font-medium text-gray-600 block">Data</label>
                    {currentDaySchedule && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${currentDaySchedule === 'Închis' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {currentDaySchedule === 'Închis' ? 'Zonă închisă' : `Program: ${currentDaySchedule}`}
                        </span>
                    )}
                </div>
                <select
                    value={selectedDate}
                    onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                >
                    {availableDates.map((date) => (
                        <option key={date} value={date}>{format(new Date(date), 'EEEE, d MMMM', { locale: ro })}</option>
                    ))}
                </select>
            </div>

            {/* Selector Durată */}
            <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block flex items-center gap-1">
                    <Clock size={12} /> Durata vizitei
                </label>
                <div className="flex gap-2">
                    {currentZone?.allowedDurations?.map((dur) => (
                        <button
                            key={dur}
                            onClick={() => { setSelectedDuration(dur); setSelectedSlot(null); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${selectedDuration === dur ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                        >
                            {dur === 90 ? '1.5h' : `${dur/60}h`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sloturi orare */}
            <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block flex items-center gap-1">
                    <Clock size={12} /> Interval orar start
                </label>
                {slotsLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="animate-spin text-indigo-400" size={20} /></div>
                ) : slots?.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-gray-100">Nu există sloturi disponibile.</p>
                ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {slots?.map((slot) => (
                            <button
                                key={slot.startTime}
                                onClick={() => slot.disponibil && setSelectedSlot(slot.startTime)}
                                disabled={!slot.disponibil}
                                className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors ${selectedSlot === slot.startTime ? 'bg-indigo-600 text-white border-indigo-600' : slot.disponibil ? 'border-gray-200 text-gray-700 hover:border-indigo-300' : 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'}`}
                            >
                                {slot.startTime.substring(0, 5)}
                                {slot.disponibil && <span className="block text-[10px] opacity-70 mt-0.5">{slot.locuriLibere} locuri</span>}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* SECTIUNE NOUĂ: REZUMAT INTERVAL REZERVARE */}
            {selectedSlotData && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-1">
                    <div className="bg-white p-2 rounded-full text-indigo-600 shadow-sm">
                        <Clock size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-400">Intervalul selectat</p>
                        <p className="text-sm font-bold text-indigo-900">
                            {selectedSlotData.startTime.substring(0, 5)} — {selectedSlotData.endTime.substring(0, 5)}
                        </p>
                    </div>
                </div>
            )}

            {/* Număr persoane */}
            <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block flex items-center gap-1">
                    <Users size={12} /> Număr persoane
                </label>
                <input
                    type="number" min={1} max={currentZone?.maxPersons || 50}
                    value={groupSize}
                    onChange={(e) => setGroupSize(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                />
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-600 text-xs px-3 py-2 rounded-lg">{success}</div>}

            <button
                onClick={handleBook}
                disabled={isPending || !selectedSlot || (user !== null && user.role !== 'USER')}
                className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${user && user.role !== 'USER' ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white'}`}
            >
                {isPending && <Loader2 size={16} className="animate-spin" />}
                {!user ? 'Autentifică-te pentru a rezerva' : user.role !== 'USER' ? 'Doar clienții pot face rezervări' : 'Rezervă acum'}
            </button>
        </div>
    );
}