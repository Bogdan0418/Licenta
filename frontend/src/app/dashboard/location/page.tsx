'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { Navbar } from '@/components/layout/Navbar';
import { useState } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Calendar, Users, Loader2, Plus, Star, MessageSquare, History, Check } from 'lucide-react';
import api from '@/lib/api';
import { Booking, Review } from '@/types';

export default function LocationDashboardPage() {
    const { user, isLoading: authLoading } = useRequireAuth('LOCATION');
    const queryClient = useQueryClient();
    
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [showCreateZone, setShowCreateZone] = useState(false);
    const [zoneForm, setZoneForm] = useState({ name: '', capacity: 3, maxPersons: 20, bookingDurationMinutes: 60, openTime: '10:00', closeTime: '22:00' });
    
    const [reviewModal, setReviewModal] = useState<number | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [reviewError, setReviewError] = useState('');

    const { data: profile } = useQuery({
        queryKey: ['location-profile'],
        queryFn: async () => (await api.get('/api/location/profile')).data,
        enabled: !!user,
    });

    const { data: agenda, isLoading: agendaLoading } = useQuery({
        queryKey: ['agenda', selectedDate],
        queryFn: async () => (await api.get(`/api/location/agenda?date=${selectedDate}`)).data as Booking[],
        enabled: !!user,
    });

    const { data: allBookings } = useQuery({
        queryKey: ['location-bookings'],
        queryFn: async () => (await api.get('/api/location/bookings')).data as Booking[],
        enabled: !!user,
    });

    const { data: receivedReviews } = useQuery({
        queryKey: ['location-received-reviews'],
        queryFn: async () => (await api.get('/api/location/reviews/received')).data as Review[],
        enabled: !!user,
    });

    const { data: givenReviews } = useQuery({
        queryKey: ['location-given-reviews'],
        queryFn: async () => (await api.get('/api/location/reviews/given')).data as Review[],
        enabled: !!user,
    });

    const { mutate: markNoShow } = useMutation({
        mutationFn: async (bookingId: number) => api.post(`/api/location/bookings/${bookingId}/no-show`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agenda'] });
            queryClient.invalidateQueries({ queryKey: ['location-bookings'] });
        }
    });

    const { mutate: createZone, isPending: creatingZone } = useMutation({
        mutationFn: async () => api.post('/api/location/zones', zoneForm),
        onSuccess: () => {
            setShowCreateZone(false);
            setZoneForm({ name: '', capacity: 3, maxPersons: 20, bookingDurationMinutes: 60, openTime: '10:00', closeTime: '22:00' });
        },
    });

    const { mutate: submitReview, isPending: submittingReview } = useMutation({
        mutationFn: async () => api.post('/api/location/reviews', { bookingId: reviewModal, rating, comment }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agenda'] });
            queryClient.invalidateQueries({ queryKey: ['location-bookings'] });
            queryClient.invalidateQueries({ queryKey: ['location-given-reviews'] });
            setReviewModal(null);
            setRating(5);
            setComment('');
            setReviewError('');
        },
        onError: (err: any) => {
            setReviewError(err.response?.data || 'Eroare la adăugarea recenziei');
        }
    });

    if (authLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-400" size={32} /></div>;
    }

    const pastBookings = allBookings?.filter(b => ['COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED_NO_SHOW'].includes(b.status)) || [];

    const statusColors: Record<string, string> = {
        CONFIRMED: 'bg-green-100 text-green-700',
        COMPLETED: 'bg-blue-100 text-blue-700',
        CANCELLED_BY_USER: 'bg-gray-100 text-gray-500',
        CANCELLED_NO_SHOW: 'bg-red-100 text-red-600',
    };

    const statusLabels: Record<string, string> = {
        CONFIRMED: 'Confirmată',
        COMPLETED: 'Finalizată',
        CANCELLED_BY_USER: 'Anulată client',
        CANCELLED_NO_SHOW: 'Neprezentare',
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

                <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">{profile?.displayName || 'Dashboard Locație'}</h1>
                        <p className="text-gray-400 text-sm mt-1">Gestionează rezervările și configurația locației tale</p>
                    </div>
                    {profile && (
                        <div className="bg-indigo-50 px-4 py-3 rounded-lg flex items-center gap-3 border border-indigo-100">
                            <div className="flex flex-col">
                                <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Rating Locație</span>
                                <div className="flex items-center gap-1">
                                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                                    <span className="font-bold text-gray-800 text-lg">{profile.rating?.toFixed(1) || '5.0'}</span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-indigo-200 mx-2"></div>
                            <div className="flex flex-col items-center">
                                <span className="text-gray-800 font-bold text-lg">{profile.ratingCount || 0}</span>
                                <span className="text-xs text-gray-500">Recenzii</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                                    <Calendar size={16} className="text-indigo-600" /> Agenda zilei
                                </h2>
                                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                            </div>
                            {agendaLoading ? <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-400" size={24} /></div> : agenda?.length === 0 ? <p className="text-gray-400 text-sm text-center py-8">Nu există rezervări pentru această zi</p> : (
                                <div className="space-y-3">
                                    {agenda?.map((booking) => (
                                        <div key={booking.id} className="border border-gray-100 rounded-lg p-4 flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-gray-800 text-sm">{booking.startTime.substring(0, 5)} – {booking.endTime.substring(0, 5)}</span>
                                                        <span className="text-xs text-gray-400">{booking.zoneName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500"><Users size={12} /> {booking.groupSize} persoane</div>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[booking.status] || 'bg-gray-100 text-gray-500'}`}>
                                                    {statusLabels[booking.status] || booking.status}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                {booking.status === 'CONFIRMED' && <button onClick={() => markNoShow(booking.id)} className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-2 py-1 rounded-lg">No-show</button>}
                                                {booking.canReview && (
                                                    givenReviews?.some(r => r.bookingId === booking.id) ? (
                                                        <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg flex items-center gap-1 font-medium cursor-default">
                                                            <Check size={12} /> Evaluată
                                                        </span>
                                                    ) : (
                                                        <button onClick={() => setReviewModal(booking.id)} className="text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg flex items-center gap-1 font-medium transition-colors border border-indigo-100">
                                                            <Star size={12} className="fill-indigo-600" /> Evaluează clientul
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {pastBookings.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <History size={16} className="text-indigo-600" /> Istoric rezervări
                                </h2>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {pastBookings.map((booking) => (
                                        <div key={booking.id} className="flex flex-col py-3 border-b border-gray-50 last:border-0 gap-2">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-sm font-medium text-gray-700 block">
                                                        {booking.zoneName} • {booking.startTime.substring(0,5)}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {format(new Date(booking.bookingDate), 'd MMM yyyy', { locale: ro })}
                                                    </span>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[booking.status]}`}>
                                                    {statusLabels[booking.status]}
                                                </span>
                                            </div>
                                            {booking.canReview && (
                                                givenReviews?.some(r => r.bookingId === booking.id) ? (
                                                    <span className="self-start text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded flex items-center gap-1 cursor-default">
                                                        <Check size={12} /> Evaluată
                                                    </span>
                                                ) : (
                                                    <button onClick={() => setReviewModal(booking.id)} className="self-start text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                                                        <Star size={12} className="fill-indigo-600" /> Evaluează clientul
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-gray-800">Zone rezervabile</h2>
                                <button onClick={() => setShowCreateZone(!showCreateZone)} className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm"><Plus size={14} /> Adaugă zonă</button>
                            </div>
                            {showCreateZone && (
                                <div className="border border-indigo-100 bg-indigo-50 rounded-xl p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        {[{ label: 'Nume', key: 'name', type: 'text', placeholder: 'ex: Terasă' }, { label: 'Pers max', key: 'maxPersons', type: 'number' }, { label: 'Capacitate', key: 'capacity', type: 'number' }, { label: 'Oră deschidere', key: 'openTime', type: 'time' }, { label: 'Oră închidere', key: 'closeTime', type: 'time' }].map(({ label, key, type, placeholder }) => (
                                            <div key={key}><label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label><input type={type} value={(zoneForm as any)[key]} placeholder={placeholder} onChange={(e) => setZoneForm(p => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" /></div>
                                        ))}
                                        <div>
                                            <label className="text-xs font-medium text-gray-600 mb-1 block">Durată</label>
                                            <select value={zoneForm.bookingDurationMinutes} onChange={(e) => setZoneForm(p => ({ ...p, bookingDurationMinutes: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none">
                                                <option value={60}>1 oră</option><option value={90}>1.5 ore</option><option value={120}>2 ore</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button onClick={() => createZone()} disabled={creatingZone || !zoneForm.name} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-2">{creatingZone && <Loader2 size={14} className="animate-spin" />} Creează zona</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><MessageSquare size={16} className="text-indigo-600" /> Feedback de la clienți</h2>
                            {receivedReviews?.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">Nu ai primit nicio recenzie.</p> : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {receivedReviews?.map(review => (
                                        <div key={review.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <div className="flex justify-between items-start mb-1"><span className="text-xs font-semibold text-gray-700">{review.reviewerName}</span><div className="flex gap-0.5">{[...Array(review.rating)].map((_, i) => <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />)}</div></div>
                                            <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="font-semibold text-gray-800 mb-4">Feedback oferit clienților</h2>
                            {givenReviews?.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">Nu ai evaluat niciun client.</p> : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {givenReviews?.map(review => (
                                        <div key={review.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <div className="flex justify-between items-start mb-1"><span className="text-xs font-semibold text-gray-700">Către client (Rezervare #{review.bookingId})</span><div className="flex gap-0.5">{[...Array(review.rating)].map((_, i) => <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />)}</div></div>
                                            <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {reviewModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full">
                        <h3 className="font-bold text-gray-800 mb-4 text-lg">Evaluează clientul</h3>
                        
                        {reviewError && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
                                {reviewError}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="text-sm text-gray-600 mb-2 block">Cum s-a comportat clientul?</label>
                            <div className="flex gap-1">{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={28} className={`cursor-pointer transition-colors ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} onClick={() => setRating(star)} />)}</div>
                        </div>
                        <div className="mb-6">
                            <label className="text-sm text-gray-600 mb-2 block">Lasă un comentariu</label>
                            <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-300 outline-none resize-none" rows={4} placeholder="Scrie despre conduita clientului..." />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setReviewModal(null); setRating(5); setComment(''); setReviewError(''); }} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">Renunță</button>
                            <button onClick={() => submitReview()} disabled={submittingReview || comment.trim().length < 3} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-1">{submittingReview && <Loader2 size={14} className="animate-spin" />} Trimite</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}