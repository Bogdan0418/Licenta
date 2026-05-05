'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Calendar, Clock, Users, Loader2, AlertCircle } from 'lucide-react';
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
    const currentZone = location.zones?.find((z) => z.id === selectedZone);
    const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));

    const dayKey = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const currentDaySchedule = currentZone?.schedule?.[dayKey];

    // States pentru Rezervare Normală
    const [selectedDuration, setSelectedDuration] = useState<number>(currentZone?.allowedDurations?.[0] || 60);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    // States pentru Evenimente
    const [isEvent, setIsEvent] = useState(location.onlyEvents || false);
    const [eventStart, setEventStart] = useState('');
    const [eventEnd, setEventEnd] = useState('');
    const [eventEndDate, setEventEndDate] = useState(selectedDate);
    const [eventDescription, setEventDescription] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');

    // State pentru erori temporare de validare a orelor pe frontend
    const [timeError, setTimeError] = useState('');

    // Extragere orar deschidere și închidere pentru ziua selectată
    const getScheduleLimits = (dateString: string) => {
        const day = new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        const schedule = currentZone?.schedule?.[day];
        if (!schedule || schedule === 'Închis') return null;

        const [openTime, closeTime] = schedule.split('-');
        return { openTime, closeTime };
    };

    const startScheduleLimits = getScheduleLimits(selectedDate);
    const endScheduleLimits = getScheduleLimits(eventEndDate);

    // Resetăm eventEndDate dacă selectedDate este schimbată
    useEffect(() => {
        if (new Date(eventEndDate) < new Date(selectedDate)) {
            setEventEndDate(selectedDate);
        }
    }, [selectedDate, eventEndDate]);

    // Resetează erorile de timp și orele atunci când se schimbă zilele sau tipul rezervării
    useEffect(() => {
        setTimeError('');
        setEventStart('');
        setEventEnd('');
    }, [selectedDate, eventEndDate, isEvent]);

    const [groupSize, setGroupSize] = useState(2);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const { data: slots, isLoading: slotsLoading } = useQuery({
        queryKey: ['slots', selectedZone, selectedDate, selectedDuration],
        queryFn: async () => {
            if (!selectedZone || isEvent) return [];
            const res = await api.get(`/api/locations/public/zones/${selectedZone}/slots?date=${selectedDate}&duration=${selectedDuration}`);
            return res.data as Slot[];
        },
        enabled: !!selectedZone && !isEvent,
    });

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
                groupSize,
                isEvent: isEvent,
                ...(isEvent
                    ? {
                          startTime: eventStart + ':00',
                          endTime: eventEnd + ':00',
                          duration: 1, // Valoare dummy, duration nu contează la evenimente în BE
                          eventEndDate: eventEndDate,
                          eventDescription: eventDescription,
                          specialRequests: specialRequests,
                      }
                    : {
                          startTime: selectedSlot,
                          duration: selectedDuration,
                      }),
            });
        },
        onSuccess: () => {
            setSuccess(isEvent ? 'Cerere trimisă cu succes. Așteaptă confirmarea locației!' : 'Rezervare confirmată! Verifică email-ul.');
            setSelectedSlot(null);
            setEventStart('');
            setEventEnd('');
            setEventDescription('');
            setSpecialRequests('');
            setError('');
            setTimeError('');
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            queryClient.invalidateQueries({ queryKey: ['slots'] });
        },
        onError: (err: any) => {
            const errorData = err.response?.data;
            const errorMessage = typeof errorData === 'string'
                ? errorData
                : errorData?.message || 'A apărut o eroare la salvarea rezervării.';
            setError(errorMessage);
        },
    });

    const handleBook = () => {
        if (!user) {
            router.push('/login');
            return;
        }
        if (user.role !== 'USER') {
            setError('Doar clienții pot rezerva.');
            return;
        }

        if (isEvent) {
            if (!eventStart || !eventEnd) {
                setError('Completează ambele ore pentru eveniment');
                return;
            }

            if (new Date(eventEndDate) < new Date(selectedDate)) {
                setError('Data de final nu poate fi înaintea datei de început');
                return;
            }

            // Validări Frontend pentru program
            if (startScheduleLimits && eventStart < startScheduleLimits.openTime) {
                setTimeError(`Ora de început trebuie să fie după deschiderea locației (${startScheduleLimits.openTime})`);
                return;
            }

            if (selectedDate === eventEndDate) {
                if (eventStart >= eventEnd) {
                    setTimeError('Ora de început trebuie să fie înaintea orei de sfârșit.');
                    return;
                }
                if (endScheduleLimits && eventEnd > endScheduleLimits.closeTime) {
                    setTimeError(`Ora de final trebuie să fie înainte de închiderea locației (${endScheduleLimits.closeTime})`);
                    return;
                }
            } else {
                if (endScheduleLimits && eventEnd > endScheduleLimits.closeTime) {
                    setTimeError(`Ora de final trebuie să fie înainte de închiderea locației (${endScheduleLimits.closeTime})`);
                    return;
                }
                if (endScheduleLimits && eventEnd < endScheduleLimits.openTime) {
                     setTimeError(`Ora de final trebuie să fie după deschiderea locației (${endScheduleLimits.openTime})`);
                     return;
                }
            }

            setTimeError('');
        } else {
            if (!selectedSlot) {
                setError('Selectează un slot orar');
                return;
            }
        }
        createBooking();
    };

    const getEndTime = (startTime: string, durationMinutes: number) => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + durationMinutes;
        const endH = Math.floor(totalMinutes / 60) % 24;
        const endM = totalMinutes % 60;
        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    };

    const availableDates = Array.from({ length: 30 }, (_, i) => format(addDays(new Date(), i + 1), 'yyyy-MM-dd'));

    // Verificare dacă intervalul conține zile închise
    const hasClosedDaysInRange = () => {
        if (!isEvent || selectedDate === eventEndDate) return false;

        let current = new Date(selectedDate);
        const end = new Date(eventEndDate);

        while (current <= end) {
            const currentDayKey = current.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
            if (!currentZone?.schedule?.[currentDayKey] || currentZone.schedule[currentDayKey] === 'Închis') {
                return true;
            }
            current.setDate(current.getDate() + 1);
        }
        return false;
    };

    return (
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl space-y-6">
            <h2 className="font-serif text-xl text-white flex items-center justify-between border-b border-white/5 pb-4">
                <span className="flex items-center gap-2">
                    <Calendar size={20} className="text-[#C5A059]" /> Rezervă acum
                </span>
            </h2>

            {/* Toggle Standard / Eveniment */}
            {location.allowsEvents && !location.onlyEvents && (
                <div className="flex bg-[#0a0a0b] border border-white/10 rounded-xl p-1 mb-4">
                    <button
                        onClick={() => {
                            setIsEvent(false);
                            setError('');
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                            !isEvent ? 'bg-[#C5A059] text-black shadow-md' : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        Rezervare Standard
                    </button>
                    <button
                        onClick={() => {
                            setIsEvent(true);
                            setError('');
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                            isEvent ? 'bg-[#C5A059] text-black shadow-md' : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                        Cerere Eveniment
                    </button>
                </div>
            )}

            {location.onlyEvents && (
                <div className="bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-xl p-3 mb-4 flex items-center justify-center">
                    <p className="text-xs text-[#C5A059] font-medium uppercase tracking-wider">Locație destinată exclusiv evenimentelor</p>
                </div>
            )}

            {/* Selectare zonă */}
            <div>
                <label className="text-[10px] font-light text-zinc-400 mb-1.5 block uppercase tracking-wider">Zonă</label>
                <select
                    value={selectedZone || ''}
                    onChange={(e) => {
                        setSelectedZone(Number(e.target.value));
                        setSelectedSlot(null);
                    }}
                    className="w-full bg-[#0a0a0b] border border-white/10 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] appearance-none"
                >
                    {location.zones.map((z) => (
                        <option key={z.id} value={z.id} className="bg-[#121214]">
                            {z.name} (max {z.maxPersons} pers.)
                        </option>
                    ))}
                </select>
            </div>

            {/* Dată */}
            <div>
                <div className="flex justify-between items-end mb-1.5">
                    <label className="text-[10px] font-light text-zinc-400 block uppercase tracking-wider">{isEvent ? 'Data Început' : 'Data'}</label>
                    {currentDaySchedule && (
                        <span
                            className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${
                                currentDaySchedule === 'Închis'
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                        >
                            {currentDaySchedule === 'Închis' ? 'Zonă închisă' : currentDaySchedule}
                        </span>
                    )}
                </div>
                <select
                    value={selectedDate}
                    onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlot(null);
                    }}
                    className="w-full bg-[#0a0a0b] border border-white/10 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] appearance-none"
                >
                    {availableDates.map((date) => (
                        <option key={date} value={date} className="bg-[#121214]">
                            {format(new Date(date), 'EEEE, d MMMM', { locale: ro })}
                        </option>
                    ))}
                </select>
            </div>

            {/* LOGICĂ RAMIFICATĂ */}
            {!isEvent ? (
                <>
                    {/* Durată Standard */}
                    <div>
                        <label className="text-[10px] font-light text-zinc-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                            <Clock size={12} className="text-[#C5A059]" /> Durata vizitei
                        </label>
                        <div className="flex gap-2">
                            {currentZone?.allowedDurations?.map((dur) => (
                                <button
                                    key={dur}
                                    onClick={() => {
                                        setSelectedDuration(dur);
                                        setSelectedSlot(null);
                                    }}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                                        selectedDuration === dur
                                            ? 'bg-[#C5A059] text-black shadow-[0_0_10px_rgba(197,160,89,0.2)]'
                                            : 'bg-white/5 border border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'
                                    }`}
                                >
                                    {dur === 90 ? '1.5h' : `${dur / 60}h`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sloturi Standard */}
                    <div>
                        <label className="text-[10px] font-light text-zinc-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                            <Clock size={12} className="text-[#C5A059]" /> Ora de start
                        </label>
                        {slotsLoading ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="animate-spin text-[#C5A059]" size={20} />
                            </div>
                        ) : slots?.length === 0 ? (
                            <p className="text-xs text-zinc-500 font-light text-center py-4 bg-white/5 rounded-xl border border-white/5">Niciun slot disponibil.</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                {slots?.map((slot) => (
                                    <button
                                        key={slot.startTime}
                                        onClick={() => slot.disponibil && setSelectedSlot(slot.startTime)}
                                        disabled={!slot.disponibil}
                                        className={`py-2 px-1 rounded-lg text-xs font-medium border transition-all ${
                                            selectedSlot === slot.startTime
                                                ? 'bg-[#C5A059] text-black border-[#C5A059] shadow-[0_0_10px_rgba(197,160,89,0.3)]'
                                                : slot.disponibil
                                                ? 'bg-[#121214] border-white/10 text-zinc-300 hover:border-[#C5A059]/50'
                                                : 'bg-white/5 border-white/5 text-zinc-600 cursor-not-allowed'
                                        }`}
                                    >
                                        {/* AICI AFIȘĂM INTERVALUL COMPLET */}
                                        {slot.startTime.substring(0, 5)} - {getEndTime(slot.startTime, selectedDuration)}
                                        {slot.disponibil && <span className="block text-[9px] font-light opacity-80 mt-0.5">{slot.locuriLibere} locuri</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* Evenimente */
                <div className="bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-xl p-4 space-y-4 animate-slide-up">
                    <p className="text-xs text-[#C5A059] font-medium leading-relaxed">Nu uitați! Aceasta este o cerere care trebuie trimisă pentru a o aproba locația.</p>

                    {/* Avertisment Zile Închise */}
                    {hasClosedDaysInRange() && (
                        <div className="flex items-center gap-2 bg-red-500/10 text-red-400 p-2 rounded-lg border border-red-500/20 text-xs">
                            <AlertCircle size={14} />
                            <span>Atenție: Intervalul selectat include zile în care locația este închisă. Rezervarea nu va fi acceptată.</span>
                        </div>
                    )}

                    {/* Selector Data Final */}
                    <div>
                        <div className="flex justify-between items-end mb-1.5">
                            <label className="text-[10px] font-light text-[#C5A059] block uppercase tracking-wider">Data de Final</label>
                            {endScheduleLimits && (
                                <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>
                                    Program: {endScheduleLimits.openTime} - {endScheduleLimits.closeTime}
                                </span>
                            )}
                             {!endScheduleLimits && (
                                <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/20`}>
                                    Zonă Închisă
                                </span>
                             )}
                        </div>

                        <select
                            value={eventEndDate}
                            onChange={(e) => setEventEndDate(e.target.value)}
                            className="w-full bg-[#0a0a0b] border border-white/10 text-white px-3 py-2.5 rounded-xl text-sm focus:border-[#C5A059] focus:outline-none appearance-none"
                        >
                            {availableDates
                                .filter((d) => new Date(d) >= new Date(selectedDate))
                                .map((date) => (
                                    <option key={date} value={date} className="bg-[#121214]">
                                        {format(new Date(date), 'EEEE, d MMMM', { locale: ro })}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-light text-[#C5A059] mb-1.5 uppercase tracking-wider">Ora Început</label>
                            <input
                                type="time"
                                min={startScheduleLimits?.openTime}
                                max={startScheduleLimits?.closeTime}
                                value={eventStart}
                                onChange={(e) => {
                                    setEventStart(e.target.value);
                                    setTimeError(''); // Resetăm eroarea la schimbare
                                }}
                                className="w-full bg-[#0a0a0b] border border-white/10 text-white px-3 py-2.5 rounded-xl text-sm focus:border-[#C5A059] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-light text-[#C5A059] mb-1.5 uppercase tracking-wider">Ora Sfârșit</label>
                            <input
                                type="time"
                                min={endScheduleLimits?.openTime}
                                max={endScheduleLimits?.closeTime}
                                value={eventEnd}
                                onChange={(e) => {
                                    setEventEnd(e.target.value);
                                    setTimeError(''); // Resetăm eroarea la schimbare
                                }}
                                className="w-full bg-[#0a0a0b] border border-white/10 text-white px-3 py-2.5 rounded-xl text-sm focus:border-[#C5A059] focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Afișare erori de timp */}
                    {timeError && <div className="text-red-400 text-xs text-center font-medium">{timeError}</div>}

                    {/* Descriere și Cerințe Speciale */}
                    <div className="space-y-3 pt-2">
                        <div>
                            <label className="text-[10px] font-light text-[#C5A059] mb-1.5 block uppercase tracking-wider">Descrierea Evenimentului</label>
                            <textarea
                                value={eventDescription}
                                onChange={(e) => setEventDescription(e.target.value)}
                                placeholder="Ex: Nuntă cu 150 invitați, tematică florală..."
                                rows={2}
                                className="w-full bg-[#0a0a0b] border border-white/10 text-white px-3 py-2.5 rounded-xl text-sm focus:border-[#C5A059] focus:outline-none resize-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-light text-[#C5A059] mb-1.5 block uppercase tracking-wider">Cerințe Suplimentare (Opțional)</label>
                            <textarea
                                value={specialRequests}
                                onChange={(e) => setSpecialRequests(e.target.value)}
                                placeholder="Ex: Avem nevoie de un videoproiector, meniu vegan..."
                                rows={2}
                                className="w-full bg-[#0a0a0b] border border-white/10 text-white px-3 py-2.5 rounded-xl text-sm focus:border-[#C5A059] focus:outline-none resize-none"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Persoane */}
            <div>
                <label className="text-[10px] font-light text-zinc-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                    <Users size={12} className="text-[#C5A059]" /> Număr persoane
                </label>
                <input
                    type="number"
                    min={1}
                    max={isEvent ? 1000 : currentZone?.maxPersons || 50}
                    value={groupSize}
                    onChange={(e) => setGroupSize(Number(e.target.value))}
                    className="w-full bg-[#0a0a0b] border border-white/10 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]"
                />
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg text-center">{error}</div>}
            {success && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-lg text-center">{success}</div>}

            <button
                onClick={handleBook}
                disabled={isPending || (!isEvent && !selectedSlot) || (user !== null && user.role !== 'USER')}
                className={`w-full py-4 rounded-xl font-medium tracking-wide flex items-center justify-center gap-2 transition-all duration-300 ${
                    user && user.role !== 'USER'
                        ? 'bg-white/5 text-zinc-500 cursor-not-allowed border border-white/5'
                        : 'bg-[#C5A059] hover:bg-[#b08d4a] disabled:opacity-50 text-black shadow-lg'
                }`}
            >
                {isPending && <Loader2 size={18} className="animate-spin" />}
                {!user ? 'Autentifică-te pentru a rezerva' : user.role !== 'USER' ? 'Doar clienții pot rezerva' : isEvent ? 'Trimite Cererea' : 'Confirmă Rezervarea'}
            </button>
        </div>
    );
}