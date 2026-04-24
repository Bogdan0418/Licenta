'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/context/AuthContext'; // <-- Import pentru delogare
import { Navbar } from '@/components/layout/Navbar';
import { Calendar, MapPin, X, Loader2, AlertTriangle, Star, MessageSquare, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useState } from 'react';
import api from '@/lib/api';
import { Booking, Review } from '@/types';

export default function UserDashboardPage() {
    const { user, isLoading: authLoading } = useRequireAuth('USER');
    const { logout } = useAuth(); // Extragem funcția de delogare
    const queryClient = useQueryClient();
    
    const [cancelWarning, setCancelWarning] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [reviewModal, setReviewModal] = useState<number | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    // --- STATE ȘTERGERE CONT ---
    const [deleteModal, setDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');

    const { data: bookings, isLoading: bookingsLoading } = useQuery({
        queryKey: ['my-bookings'],
        queryFn: async () => (await api.get('/api/user/bookings')).data as Booking[],
        enabled: !!user,
    });

    const { data: profile } = useQuery({
        queryKey: ['user-profile'],
        queryFn: async () => (await api.get('/api/user/profile')).data,
        enabled: !!user,
    });

    const { data: receivedReviews } = useQuery({
        queryKey: ['user-received-reviews'],
        queryFn: async () => (await api.get('/api/user/reviews/received')).data as Review[],
        enabled: !!user,
    });

    const { data: givenReviews } = useQuery({
        queryKey: ['user-given-reviews'],
        queryFn: async () => (await api.get('/api/user/reviews/given')).data as Review[],
        enabled: !!user,
    });

    const { mutate: cancelBooking, isPending: cancelling } = useMutation({
        mutationFn: async (bookingId: number) => api.delete(`/api/user/bookings/${bookingId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            setCancelWarning(null);
            setError('');
        },
        onError: (err: any) => setError(err.response?.data || 'Eroare la anulare'),
    });

    const { mutate: submitReview, isPending: submittingReview } = useMutation({
        mutationFn: async () => api.post('/api/user/reviews', { bookingId: reviewModal, rating, comment }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            queryClient.invalidateQueries({ queryKey: ['user-given-reviews'] });
            setReviewModal(null);
            setRating(5);
            setComment('');
        }
    });

    // --- MUTATION ȘTERGERE CONT ---
    const { mutate: deleteAccount, isPending: deletingAccount } = useMutation({
        mutationFn: async () => api.delete('/api/user/account', { data: { password: deletePassword } }),
        onSuccess: () => {
            alert('Contul a fost șters cu succes!');
            logout(); // Delogare și redirect la Home
        },
        onError: (err: any) => {
            setDeleteError(err.response?.data?.message || err.response?.data || 'Eroare! Verifică parola.');
        }
    });

    if (authLoading || !user) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-400" size={32} /></div>;
    }

    const upcoming = bookings?.filter(b => b.status === 'CONFIRMED') || [];
    const past = bookings?.filter(b => ['COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED_NO_SHOW'].includes(b.status)) || [];

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
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 mb-1">Bună, {user?.email}!</h1>
                        <p className="text-gray-400 text-sm">Gestionează rezervările tale</p>
                    </div>
                    {profile && (
                        <div className="bg-indigo-50 px-4 py-3 rounded-lg flex items-center gap-3 border border-indigo-100">
                            <div className="flex flex-col">
                                <span className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Rating Client</span>
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

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-indigo-600" />
                        Rezervări viitoare ({upcoming.length})
                    </h2>
                    {bookingsLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-400" size={24} /></div>
                    ) : upcoming.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-8">Nu ai rezervări viitoare</p>
                    ) : (
                        <div className="space-y-3">
                            {upcoming.map((booking) => (
                                <div key={booking.id} className="border border-gray-100 rounded-lg p-4 flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <MapPin size={14} className="text-indigo-500" />
                                            <span className="font-medium text-gray-800 text-sm">{booking.locationName}</span>
                                            <span className="text-xs text-gray-400">— {booking.zoneName}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 ml-5">
                                            {format(new Date(booking.bookingDate), 'EEEE, d MMMM yyyy', { locale: ro })} • {booking.startTime.substring(0, 5)} – {booking.endTime.substring(0, 5)} • {booking.groupSize} pers
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[booking.status]}`}>{statusLabels[booking.status]}</span>
                                        {booking.canCancel && (
                                            <button onClick={() => setCancelWarning(booking.id)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                                                <X size={14} /> Anulează
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {past.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit">
                            <h2 className="font-semibold text-gray-800 mb-4">Istoric rezervări</h2>
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                {past.map((booking) => (
                                    <div key={booking.id} className="flex flex-col py-3 border-b border-gray-50 last:border-0 gap-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-sm font-medium text-gray-700 block">{booking.locationName}</span>
                                                <span className="text-xs text-gray-400">{format(new Date(booking.bookingDate), 'd MMM yyyy', { locale: ro })}</span>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[booking.status]}`}>{statusLabels[booking.status]}</span>
                                        </div>
                                        
                                        {booking.canReview && (
                                            givenReviews?.some(r => r.bookingId === booking.id) ? (
                                                <span className="self-start text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded flex items-center gap-1">
                                                    <Check size={12} /> Evaluată
                                                </span>
                                            ) : (
                                                <button onClick={() => setReviewModal(booking.id)} className="self-start text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded flex items-center gap-1 transition-colors">
                                                    <Star size={12} className="fill-indigo-600" /> Evaluează locația
                                                </button>
                                            )
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <MessageSquare size={16} className="text-indigo-600" /> Feedback primit
                            </h2>
                            {receivedReviews?.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">Nu ai primit nicio recenzie.</p> : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                    {receivedReviews?.map(review => (
                                        <div key={review.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-semibold text-gray-700">{review.reviewerName}</span>
                                                <div className="flex gap-0.5">{[...Array(review.rating)].map((_, i) => <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />)}</div>
                                            </div>
                                            <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="font-semibold text-gray-800 mb-4">Feedback oferit</h2>
                            {givenReviews?.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">Nu ai evaluat nicio locație.</p> : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                    {givenReviews?.map(review => (
                                        <div key={review.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-semibold text-gray-700">Către: {review.reviewerName}</span>
                                                <div className="flex gap-0.5">{[...Array(review.rating)].map((_, i) => <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />)}</div>
                                            </div>
                                            <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* --- DANGER ZONE - ȘTERGERE CONT UTILIZATOR --- */}
                        <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                            <h2 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                                <AlertTriangle size={18} className="text-red-600" /> Zonă Periculoasă (Ștergere Cont)
                            </h2>
                            <p className="text-sm text-red-600 mb-4">
                                Atenție! Ștergerea contului este o acțiune ireversibilă. Toate datele tale, rezervările și recenziile vor fi șterse definitiv din sistem.
                            </p>
                            <button 
                                onClick={() => setDeleteModal(true)} 
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Șterge definitiv contul
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {cancelWarning && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full">
                        <div className="flex items-center gap-3 mb-4"><div className="bg-red-100 p-2 rounded-full"><AlertTriangle size={20} className="text-red-600" /></div><h3 className="font-semibold text-gray-800">Anulezi rezervarea?</h3></div>
                        <p className="text-sm text-gray-500 mb-2">Dacă anulezi cu mai puțin de 12h înainte, ratingul tău va scădea cu 0.5 stele.</p>
                        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => { setCancelWarning(null); setError(''); }} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">Înapoi</button>
                            <button onClick={() => cancelBooking(cancelWarning)} disabled={cancelling} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-1">{cancelling && <Loader2 size={14} className="animate-spin" />} Da, anulează</button>
                        </div>
                    </div>
                </div>
            )}

            {reviewModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full">
                        <h3 className="font-bold text-gray-800 mb-4 text-lg">Evaluează experiența</h3>
                        <div className="mb-4">
                            <label className="text-sm text-gray-600 mb-2 block">Câte stele acorzi locației?</label>
                            <div className="flex gap-1">{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={28} className={`cursor-pointer transition-colors ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} onClick={() => setRating(star)} />)}</div>
                        </div>
                        <div className="mb-6">
                            <label className="text-sm text-gray-600 mb-2 block">Cum a fost experiența ta?</label>
                            <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-300 outline-none resize-none" rows={4} placeholder="Scrie câteva cuvinte despre locație..." />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setReviewModal(null); setRating(5); setComment(''); }} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">Renunță</button>
                            <button onClick={() => submitReview()} disabled={submittingReview || comment.trim().length < 3} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm flex items-center justify-center gap-1">{submittingReview && <Loader2 size={14} className="animate-spin" />} Trimite</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL ȘTERGERE CONT */}
            {deleteModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full border-t-4 border-red-600 shadow-2xl">
                        <h3 className="font-bold text-gray-800 mb-2 text-lg flex items-center gap-2">
                            <AlertTriangle className="text-red-600" /> Confirmare Ștergere
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Pentru a confirma ștergerea definitivă a contului, te rugăm să introduci parola ta mai jos. Această acțiune <b>NU</b> poate fi anulată!
                        </p>
                        
                        {deleteError && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
                                {deleteError}
                            </div>
                        )}
                        
                        <div className="mb-6">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Parola ta</label>
                            <input 
                                type="password" 
                                value={deletePassword} 
                                onChange={(e) => setDeletePassword(e.target.value)} 
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-300 outline-none" 
                                placeholder="Introdu parola..." 
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={() => { setDeleteModal(false); setDeletePassword(''); setDeleteError(''); }} 
                                className="flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50 py-2 rounded-lg text-sm font-medium"
                            >
                                Renunță
                            </button>
                            <button 
                                onClick={() => deleteAccount()} 
                                disabled={deletingAccount || !deletePassword} 
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                            >
                                {deletingAccount && <Loader2 size={14} className="animate-spin" />} Șterge definitiv
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}