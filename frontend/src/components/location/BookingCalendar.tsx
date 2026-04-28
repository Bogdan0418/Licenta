'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    const queryClient = useQueryClient();

    const [selectedZone, setSelectedZone] = useState(location.zones?.[0]?.id || null);
    const currentZone = location.zones?.find(z => z.id === selectedZone);
    const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    
    const dayKey = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const currentDaySchedule = currentZone?.schedule?.[dayKey];
    
    const [selectedDuration, setSelectedDuration] = useState<number>(currentZone?.allowedDurations?.[0] || 60);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [groupSize, setGroupSize] = useState(2);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const { data: slots, isLoading: slotsLoading } = useQuery({
        queryKey: ['slots', selectedZone, selectedDate, selectedDuration],
        queryFn: async () => {
            if (!selectedZone) return [];
            const res = await api.get(`/api/locations/public/zones/${selectedZone}/slots?date=${selectedDate}&duration=${selectedDuration}`);
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
            setSuccess('Rezervare confirmată! Verifică email-ul.');
            setSelectedSlot(null);
            setError('');
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            queryClient.invalidateQueries({ queryKey: ['slots'] });
        },
        onError: (err: any) => setError(err.response?.data || 'Eroare la rezervare'),
    });

    const handleBook = () => {
        if (!user) { router.push('/login'); return; }
        if (user.role !== 'USER') { setError('Doar clienții pot rezerva.'); return; }
        if (!selectedSlot) { setError('Selectează un slot orar'); return; }
        createBooking();
    };

    const availableDates = Array.from({ length: 30 }, (_, i) =>
        format(addDays(new Date(), i + 1), 'yyyy-MM-dd')
    );

    return (
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl space-y-6">
            <h2 className="font-serif text-xl text-white flex items-center gap-2 border-b border-white/5 pb-4">
                <Calendar size={20} className="text-[#C5A059]" />
                Rezervă acum
            </h2>

            {/* Selectare zonă */}
            <div>
                <label className="text-[10px] font-light text-zinc-400 mb-1.5 block uppercase tracking-wider">Zonă</label>
                <select
                    value={selectedZone || ''}
                    onChange={(e) => { setSelectedZone(Number(e.target.value)); setSelectedSlot(null); }}
                    className="w-full bg-[#0a0a0b] border border-white/10 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] appearance-none"
                >
                    {location.zones.map((z) => (
                        <option key={z.id} value={z.id} className="bg-[#121214]">{z.name} (max {z.maxPersons} pers.)</option>
                    ))}
                </select>
            </div>

            {/* Dată */}
            <div>
                <div className="flex justify-between items-end mb-1.5">
                    <label className="text-[10px] font-light text-zinc-400 block uppercase tracking-wider">Data</label>
                    {currentDaySchedule && (
                        <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${currentDaySchedule === 'Închis' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                            {currentDaySchedule === 'Închis' ? 'Zonă închisă' : currentDaySchedule}
                        </span>
                    )}
                </div>
                <select
                    value={selectedDate}
                    onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(null); }}
                    className="w-full bg-[#0a0a0b] border border-white/10 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] appearance-none"
                >
                    {availableDates.map((date) => (
                        <option key={date} value={date} className="bg-[#121214]">{format(new Date(date), 'EEEE, d MMMM', { locale: ro })}</option>
                    ))}
                </select>
            </div>

            {/* Durată */}
            <div>
                <label className="text-[10px] font-light text-zinc-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                    <Clock size={12} className="text-[#C5A059]" /> Durata vizitei
                </label>
                <div className="flex gap-2">
                    {currentZone?.allowedDurations?.map((dur) => (
                        <button
                            key={dur}
                            onClick={() => { setSelectedDuration(dur); setSelectedSlot(null); }}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${selectedDuration === dur ? 'bg-[#C5A059] text-black shadow-[0_0_10px_rgba(197,160,89,0.2)]' : 'bg-white/5 border border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'}`}
                        >
                            {dur === 90 ? '1.5h' : `${dur/60}h`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sloturi */}
            <div>
                <label className="text-[10px] font-light text-zinc-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                    <Clock size={12} className="text-[#C5A059]" /> Ora de start
                </label>
                {slotsLoading ? (
                    <div className="flex justify-center py-6"><Loader2 className="animate-spin text-[#C5A059]" size={20} /></div>
                ) : slots?.length === 0 ? (
                    <p className="text-xs text-zinc-500 font-light text-center py-4 bg-white/5 rounded-xl border border-white/5">Niciun slot disponibil.</p>
                ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {slots?.map((slot) => (
                            <button
                                key={slot.startTime}
                                onClick={() => slot.disponibil && setSelectedSlot(slot.startTime)}
                                disabled={!slot.disponibil}
                                className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                                    selectedSlot === slot.startTime 
                                        ? 'bg-[#C5A059] text-black border-[#C5A059] shadow-[0_0_10px_rgba(197,160,89,0.3)]' 
                                        : slot.disponibil 
                                            ? 'bg-[#121214] border-white/10 text-zinc-300 hover:border-[#C5A059]/50' 
                                            : 'bg-white/5 border-white/5 text-zinc-600 cursor-not-allowed'
                                }`}
                            >
                                {slot.startTime.substring(0, 5)}
                                {slot.disponibil && <span className="block text-[9px] font-light opacity-80 mt-0.5">{slot.locuriLibere} locuri</span>}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Rezumat */}
            {selectedSlotData && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 animate-slide-up">
                    <div className="bg-black/50 p-2 rounded-lg border border-white/5">
                        <Clock size={16} className="text-[#C5A059]" />
                    </div>
                    <div>
                        <p className="text-[10px] text-zinc-400 font-light uppercase tracking-wider mb-0.5">Interval selectat</p>
                        <p className="text-sm font-bold text-white tracking-wide">
                            {selectedSlotData.startTime.substring(0, 5)} — {selectedSlotData.endTime.substring(0, 5)}
                        </p>
                    </div>
                </div>
            )}

            {/* Persoane */}
            <div>
                <label className="text-[10px] font-light text-zinc-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                    <Users size={12} className="text-[#C5A059]" /> Număr persoane
                </label>
                <input
                    type="number" min={1} max={currentZone?.maxPersons || 50}
                    value={groupSize}
                    onChange={(e) => setGroupSize(Number(e.target.value))}
                    className="w-full bg-[#0a0a0b] border border-white/10 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                />
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg text-center">{error}</div>}
            {success && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-lg text-center">{success}</div>}

            <button
                onClick={handleBook}
                disabled={isPending || !selectedSlot || (user !== null && user.role !== 'USER')}
                className={`w-full py-4 rounded-xl font-medium tracking-wide flex items-center justify-center gap-2 transition-all duration-300 ${
                    user && user.role !== 'USER' 
                        ? 'bg-white/5 text-zinc-500 cursor-not-allowed border border-white/5' 
                        : 'bg-[#C5A059] hover:bg-[#b08d4a] disabled:opacity-50 text-black shadow-lg'
                }`}
            >
                {isPending && <Loader2 size={18} className="animate-spin" />}
                {!user ? 'Autentifică-te pentru a rezerva' : user.role !== 'USER' ? 'Doar clienții pot rezerva' : 'Confirmă Rezervarea'}
            </button>
        </div>
    );
}