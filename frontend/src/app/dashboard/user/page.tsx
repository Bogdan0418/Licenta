'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Calendar, MapPin, X, Loader2, AlertTriangle, Star, MessageSquare, Check, History, Users, MessageSquare as ChatIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useState } from 'react';
import api from '@/lib/api';
import { Booking, Review } from '@/types';
import { ChatModal } from '@/components/chat/ChatModal';

export default function UserDashboardPage() {
    const { user, isLoading: authLoading } = useRequireAuth('USER');
    const { logout } = useAuth();
    const queryClient = useQueryClient();
    
    const [cancelWarning, setCancelWarning] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [reviewModal, setReviewModal] = useState<number | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const [deleteModal, setDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    
    // State pentru Chat
    const [activeChat, setActiveChat] = useState<Booking | null>(null);

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

    // --- QUERY NOU PENTRU MESAJE NECITITE ---
    const { data: unreadChats } = useQuery({
        queryKey: ['user-unread-chats'],
        queryFn: async () => (await api.get('/api/chat/user/unread')).data as Record<number, number>,
        enabled: !!user,
        refetchInterval: 5000, // Verifică mesaje noi din 5 in 5 secunde
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

    const { mutate: deleteAccount, isPending: deletingAccount } = useMutation({
        mutationFn: async () => api.delete('/api/user/account', { data: { password: deletePassword } }),
        onSuccess: () => {
            alert('Contul a fost șters cu succes!');
            logout();
        },
        onError: (err: any) => {
            setDeleteError(err.response?.data?.message || err.response?.data || 'Eroare! Verifică parola.');
        }
    });

    if (authLoading || !user) {
        return <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center"><Loader2 className="animate-spin text-[#C5A059]" size={40} /></div>;
    }

    const upcoming = bookings?.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING') || [];
    const past = bookings?.filter(b => ['COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED_NO_SHOW', 'REJECTED'].includes(b.status)) || [];

    const statusColors: Record<string, string> = {
        CONFIRMED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        COMPLETED: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
        CANCELLED_BY_USER: 'bg-white/5 text-zinc-400 border border-white/10',
        CANCELLED_NO_SHOW: 'bg-red-500/10 text-red-400 border border-red-500/20',
        PENDING: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
        REJECTED: 'bg-red-500/10 text-red-400 border border-red-500/20',
    };

    const statusLabels: Record<string, string> = {
        CONFIRMED: 'Confirmată',
        COMPLETED: 'Finalizată',
        CANCELLED_BY_USER: 'Anulată',
        CANCELLED_NO_SHOW: 'Neprezentare',
        PENDING: 'În așteptare (Eveniment)',
        REJECTED: 'Cerere Respinsă',
    };

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-zinc-200 pt-24 pb-12">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 space-y-6">
                
                {/* HEADER & RATING */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div>
                        <h1 className="text-2xl font-serif text-white mb-1 tracking-wide">Bună, {user?.email}!</h1>
                        <p className="text-zinc-400 text-sm font-light">Gestionează rezervările tale</p>
                    </div>
                    {profile && (
                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3.5 rounded-xl w-fit">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-light text-zinc-500 uppercase tracking-wider mb-0.5">Rating Client</span>
                                <div className="flex items-center gap-1.5">
                                    <Star size={16} className="text-[#C5A059] fill-[#C5A059]" />
                                    <span className="font-bold text-white text-lg">{profile.rating?.toFixed(1) || '5.0'}</span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-white/10 mx-2"></div>
                            <div className="flex flex-col items-center">
                                <span className="text-white font-bold text-lg">{profile.ratingCount || 0}</span>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Recenzii</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* REZERVĂRI VIITOARE & ÎN AȘTEPTARE */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <h2 className="font-serif text-lg text-white mb-6 border-b border-white/5 pb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-[#C5A059]" />
                        Rezervări viitoare ({upcoming.length})
                    </h2>
                    
                    {bookingsLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#C5A059]" size={32} /></div>
                    ) : upcoming.length === 0 ? (
                        <div className="bg-white/5 rounded-xl border border-white/5 py-10 text-center">
                            <p className="text-zinc-400 text-sm font-light">Nu ai nicio rezervare în viitorul apropiat.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {upcoming.map((booking) => (
                                <div key={booking.id} className="bg-[#121214] border border-white/5 rounded-xl p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:border-white/10 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MapPin size={16} className="text-[#C5A059]" />
                                            <span className="font-bold text-white text-base">{booking.locationName}</span>
                                            <span className="text-xs font-light text-[#C5A059] border border-[#C5A059]/30 px-2 py-0.5 rounded-full ml-2">{booking.zoneName}</span>
                                        </div>
                                        <p className="text-sm font-light text-zinc-400 ml-6 flex items-center flex-wrap gap-1.5">
                                            <span>{format(parseISO(booking.bookingDate), 'd MMM yyyy', { locale: ro })}</span>
                                            {booking.eventEndDate && booking.eventEndDate !== booking.bookingDate && (
                                                <span> - {format(parseISO(booking.eventEndDate), 'd MMM yyyy', { locale: ro })}</span>
                                            )}
                                            <span className="mx-1">•</span>
                                            <span className="text-white font-medium">{booking.startTime.substring(0, 5)} – {booking.endTime.substring(0, 5)}</span> 
                                            <span className="mx-1">•</span>
                                            <span className="flex items-center gap-1"><Users size={12}/> {booking.groupSize} pers</span>
                                        </p>

                                        {/* Detalii Eveniment dacă există */}
                                        {(booking.eventDescription || booking.specialRequests) && (
                                            <div className="ml-6 mt-3 p-3 bg-black/40 border border-white/5 rounded-lg space-y-2 text-xs">
                                                {booking.eventDescription && (
                                                    <div>
                                                        <span className="text-[#C5A059] font-medium">Descrierea Evenimentului:</span>
                                                        <p className="text-zinc-300 mt-0.5">{booking.eventDescription}</p>
                                                    </div>
                                                )}
                                                {booking.specialRequests && (
                                                    <div>
                                                        <span className="text-[#C5A059] font-medium">Cerințe extra:</span>
                                                        <p className="text-zinc-300 mt-0.5">{booking.specialRequests}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 md:mt-0 mt-2">
                                        <span className={`text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-md font-medium ${statusColors[booking.status]}`}>
                                            {statusLabels[booking.status]}
                                        </span>
                                        
                                        {/* --- BUTON CHAT CU BULINĂ --- */}
                                        {(booking.status === 'CONFIRMED' || booking.status === 'PENDING') && (
                                            <button onClick={() => setActiveChat(booking)} className="relative text-xs text-black bg-[#C5A059] hover:bg-[#b08d4a] px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-md">
                                                <ChatIcon size={14} /> Discută
                                                {unreadChats?.[booking.id] && unreadChats[booking.id] > 0 ? (
                                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-[#121214] shadow-lg animate-pulse">
                                                        {unreadChats[booking.id]}
                                                    </span>
                                                ) : null}
                                            </button>
                                        )}

                                        {booking.canCancel && (
                                            <button onClick={() => setCancelWarning(booking.id)} className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 flex items-center gap-1.5 transition-all">
                                                <X size={14} /> Anulează
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* BENTO GRID INFERIOR */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* ISTORIC REZERVĂRI */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-fit max-h-[600px] flex flex-col">
                        <h2 className="font-serif text-lg text-white mb-6 border-b border-white/5 pb-4 flex items-center gap-2">
                            <History size={18} className="text-[#C5A059]" /> Istoric rezervări
                        </h2>
                        {past.length === 0 ? (
                            <p className="text-zinc-500 text-sm font-light italic">Niciun istoric momentan.</p>
                        ) : (
                            <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1">
                                {past.map((booking) => (
                                    <div key={booking.id} className="bg-[#121214] p-4 border border-white/5 rounded-xl flex flex-col gap-3 hover:border-white/10 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <span className="text-sm font-bold text-white block mb-1">{booking.locationName}</span>
                                                <span className="text-xs font-light text-zinc-400">
                                                    {format(parseISO(booking.bookingDate), 'd MMM yyyy', { locale: ro })}
                                                    {booking.eventEndDate && booking.eventEndDate !== booking.bookingDate && ` - ${format(parseISO(booking.eventEndDate), 'd MMM', { locale: ro })}`}
                                                </span>
                                            </div>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider ${statusColors[booking.status]}`}>
                                                {statusLabels[booking.status]}
                                            </span>
                                        </div>
                                        
                                        {booking.canReview && (
                                            givenReviews?.some(r => r.bookingId === booking.id) ? (
                                                <span className="self-start text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-default mt-1">
                                                    <Check size={12} /> Evaluată
                                                </span>
                                            ) : (
                                                <button onClick={() => setReviewModal(booking.id)} className="self-start text-[11px] font-medium text-[#C5A059] hover:text-black hover:bg-[#C5A059] border border-[#C5A059]/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all mt-1">
                                                    <Star size={12} /> Evaluează locația
                                                </button>
                                            )
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-6 flex flex-col">
                        
                        {/* FEEDBACK PRIMIT */}
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <h2 className="font-serif text-lg text-white mb-6 border-b border-white/5 pb-4 flex items-center gap-2">
                                <MessageSquare size={18} className="text-[#C5A059]" /> Feedback primit
                            </h2>
                            {receivedReviews?.length === 0 ? <p className="text-sm text-zinc-500 font-light italic">Nu ai primit nicio recenzie.</p> : (
                                <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                                    {receivedReviews?.map(review => (
                                        <div key={review.id} className="bg-[#121214] p-3.5 rounded-xl border border-white/5">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-bold text-white">{review.reviewerName}</span>
                                                <div className="flex gap-0.5">{[...Array(review.rating)].map((_, i) => <Star key={i} size={10} className="text-[#C5A059] fill-[#C5A059]" />)}</div>
                                            </div>
                                            <p className="text-xs text-zinc-400 italic font-light">"{review.comment}"</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* FEEDBACK OFERIT */}
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <h2 className="font-serif text-lg text-white mb-6 border-b border-white/5 pb-4 flex items-center gap-2">
                                <Star size={18} className="text-[#C5A059]" /> Feedback oferit
                            </h2>
                            {givenReviews?.length === 0 ? <p className="text-sm text-zinc-500 font-light italic">Nu ai evaluat nicio locație.</p> : (
                                <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                                    {givenReviews?.map(review => (
                                        <div key={review.id} className="bg-[#121214] p-3.5 rounded-xl border border-white/5">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Către: <span className="text-white">{review.reviewerName}</span></span>
                                                <div className="flex gap-0.5">{[...Array(review.rating)].map((_, i) => <Star key={i} size={10} className="text-[#C5A059] fill-[#C5A059]" />)}</div>
                                            </div>
                                            <p className="text-xs text-zinc-400 italic font-light">"{review.comment}"</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* DANGER ZONE */}
                        <div className="bg-red-500/5 rounded-2xl border border-red-500/20 p-6">
                            <h2 className="font-serif text-lg text-red-400 mb-2 flex items-center gap-2">
                                <AlertTriangle size={18} /> Pericol
                            </h2>
                            <p className="text-xs text-red-400/70 mb-4 font-light">
                                Ștergerea contului este ireversibilă. Toate datele, rezervările și recenziile vor fi pierdute.
                            </p>
                            <button 
                                onClick={() => setDeleteModal(true)} 
                                className="w-full bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 py-2.5 rounded-xl text-sm font-medium transition-all"
                            >
                                Șterge definitiv contul
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL CHAT CLIENT */}
            {activeChat && (
                <ChatModal 
                    bookingId={activeChat.id} 
                    recipientName={activeChat.locationName} 
                    senderType="USER" 
                    onClose={() => setActiveChat(null)} 
                />
            )}

            {/* MODALELE RĂMÂN IDENTICE CA ÎNAINTE */}
            {cancelWarning && (
                <div className="fixed inset-0 bg-[#0a0a0b]/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-200">
                    <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-red-500/20 p-2 rounded-full border border-red-500/30"><AlertTriangle size={20} className="text-red-400" /></div>
                            <h3 className="font-serif text-white text-lg">Anulezi rezervarea?</h3>
                        </div>
                        <p className="text-sm text-zinc-400 font-light mb-4">Dacă anulezi cu mai puțin de 12h înainte, ratingul tău va scădea cu 0.5 stele.</p>
                        {error && <p className="text-red-400 text-xs mb-4 p-2 bg-red-500/10 rounded-lg">{error}</p>}
                        <div className="flex gap-3">
                            <button onClick={() => { setCancelWarning(null); setError(''); }} className="flex-1 border border-white/20 text-zinc-300 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors">Înapoi</button>
                            <button onClick={() => cancelBooking(cancelWarning)} disabled={cancelling} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                                {cancelling && <Loader2 size={16} className="animate-spin" />} Da, anulează
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {reviewModal && (
                <div className="fixed inset-0 bg-[#0a0a0b]/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-200">
                    <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="font-serif text-white mb-5 text-xl">Evaluează experiența</h3>
                        <div className="mb-5">
                            <label className="text-xs font-light text-zinc-400 mb-2 block uppercase tracking-wider">Câte stele acorzi locației?</label>
                            <div className="flex gap-2 justify-center py-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} size={32} className={`cursor-pointer transition-all hover:scale-110 ${rating >= star ? 'text-[#C5A059] fill-[#C5A059]' : 'text-zinc-600'}`} onClick={() => setRating(star)} />
                                ))}
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="text-xs font-light text-zinc-400 mb-2 block uppercase tracking-wider">Cum a fost experiența ta?</label>
                            <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#C5A059] outline-none resize-none" rows={4} placeholder="Scrie câteva cuvinte despre locație..." />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setReviewModal(null); setRating(5); setComment(''); }} className="flex-1 border border-white/20 text-zinc-300 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors">Renunță</button>
                            <button onClick={() => submitReview()} disabled={submittingReview || comment.trim().length < 3} className="flex-1 bg-[#C5A059] hover:bg-[#b08d4a] disabled:opacity-50 text-black py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                                {submittingReview && <Loader2 size={16} className="animate-spin" />} Trimite
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteModal && (
                <div className="fixed inset-0 bg-[#0a0a0b]/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-200">
                    <div className="bg-[#121214] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="font-serif text-red-400 mb-3 text-xl flex items-center gap-2">
                            <AlertTriangle size={20} /> Confirmare
                        </h3>
                        <p className="text-sm font-light text-zinc-400 mb-5">
                            Pentru a confirma ștergerea definitivă a contului, introdu parola ta mai jos. Acțiunea <b className="text-red-400">NU</b> poate fi anulată!
                        </p>
                        
                        {deleteError && (
                            <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-lg">
                                {deleteError}
                            </div>
                        )}
                        
                        <div className="mb-6">
                            <label className="text-xs font-light text-zinc-400 mb-2 block uppercase tracking-wider">Parola ta</label>
                            <input 
                                type="password" 
                                value={deletePassword} 
                                onChange={(e) => setDeletePassword(e.target.value)} 
                                className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-red-400 outline-none" 
                                placeholder="••••••••" 
                            />
                        </div>
                        
                        <div className="flex gap-3">
                            <button onClick={() => { setDeleteModal(false); setDeletePassword(''); setDeleteError(''); }} className="flex-1 border border-white/20 text-zinc-300 hover:bg-white/5 py-2.5 rounded-xl text-sm transition-colors">Renunță</button>
                            <button onClick={() => deleteAccount()} disabled={deletingAccount || !deletePassword} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                                {deletingAccount && <Loader2 size={16} className="animate-spin" />} Șterge
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}