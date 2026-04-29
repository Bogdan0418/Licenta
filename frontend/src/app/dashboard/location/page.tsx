'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { useState, useEffect } from 'react';
import { format, isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { ro } from 'date-fns/locale';
import { 
    Calendar, Users, Loader2, Plus, Star, MessageSquare, 
    History, Check, Edit2, Trash2, Upload, Image as ImageIcon,
    BarChart3, TrendingUp, Clock, AlertTriangle, MapPin
} from 'lucide-react';
import api from '@/lib/api';
import { Booking, Review, Zone } from '@/types';
import { facilityLabels } from '@/lib/utils';
import { MessageCircle } from 'lucide-react'; // adauga asta la importurile de la lucide-react
import { ChatModal } from '@/components/chat/ChatModal';

const DAYS = [
    { key: 'MON', label: 'Luni' }, { key: 'TUE', label: 'Marți' },
    { key: 'WED', label: 'Miercuri' }, { key: 'THU', label: 'Joi' },
    { key: 'FRI', label: 'Vineri' }, { key: 'SAT', label: 'Sâmbătă' },
    { key: 'SUN', label: 'Duminică' }
];

const defaultSchedule = DAYS.reduce((acc, day) => ({ ...acc, [day.key]: '10:00-22:00' }), {} as Record<string, string>);

export default function LocationDashboardPage() {
    const { user, isLoading: authLoading } = useRequireAuth('LOCATION');
    const { logout } = useAuth();
    const queryClient = useQueryClient();
    
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [showCreateZone, setShowCreateZone] = useState(false);
    const [editingZoneId, setEditingZoneId] = useState<number | null>(null);
    
    const [zoneForm, setZoneForm] = useState({ 
        name: '', 
        capacity: 3, 
        maxPersons: 20, 
        allowedDurations: [60], 
        schedule: defaultSchedule
    });
    
    const [reviewModal, setReviewModal] = useState<number | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [reviewError, setReviewError] = useState('');

    const [description, setDescription] = useState('');
    const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
    const [customFacilityInput, setCustomFacilityInput] = useState('');
    const [uploading, setUploading] = useState(false);

    const [deleteModal, setDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');

    // --- QUERIES ---
    const { data: profile } = useQuery({
        queryKey: ['location-profile'],
        queryFn: async () => (await api.get('/api/location/profile')).data,
        enabled: !!user,
    });

    useEffect(() => {
        if (profile) {
            setDescription(profile.description || '');
            setSelectedFacilities(profile.facilities || []);
        }
    }, [profile]);

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

    const { data: zones, isLoading: zonesLoading } = useQuery({
        queryKey: ['location-zones'],
        queryFn: async () => (await api.get('/api/location/zones')).data as Zone[],
        enabled: !!user,
    });

    const [activeChat, setActiveChat] = useState<{id: number, name: string} | null>(null);

    const { data: activeChats } = useQuery({
        queryKey: ['location-chats'],
        queryFn: async () => (await api.get('/api/chat/location/active')).data as any[],
        enabled: !!user,
        refetchInterval: 5000, // Verifică mesaje noi din 5 in 5 secunde
    });

    const handleAddCustomFacility = () => {
        const value = customFacilityInput.trim();
        if (value && !selectedFacilities.includes(value)) {
            setSelectedFacilities(prev => [...prev, value]);
            setCustomFacilityInput('');
        }
    };

    // --- MUTATIONS ---
    const { mutate: markNoShow } = useMutation({
        mutationFn: async (bookingId: number) => api.post(`/api/location/bookings/${bookingId}/no-show`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agenda'] });
            queryClient.invalidateQueries({ queryKey: ['location-bookings'] });
        }
    });

    // MUTAȚII NOI PENTRU EVENIMENTE
    const { mutate: approveEvent } = useMutation({
        mutationFn: async (id: number) => api.post(`/api/location/bookings/${id}/approve`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agenda'] });
            queryClient.invalidateQueries({ queryKey: ['location-bookings'] });
        }
    });

    const { mutate: rejectEvent } = useMutation({
        mutationFn: async (id: number) => api.post(`/api/location/bookings/${id}/reject`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agenda'] });
            queryClient.invalidateQueries({ queryKey: ['location-bookings'] });
        }
    });

    const { mutate: saveZone, isPending: savingZone } = useMutation({
        mutationFn: async () => {
            if (editingZoneId) return api.put(`/api/location/zones/${editingZoneId}`, zoneForm);
            return api.post('/api/location/zones', zoneForm);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['location-zones'] });
            setShowCreateZone(false);
            setEditingZoneId(null);
            setZoneForm({ name: '', capacity: 3, maxPersons: 20, allowedDurations: [60], schedule: defaultSchedule });
        },
    });

    const { mutate: deleteZone } = useMutation({
        mutationFn: async (id: number) => api.delete(`/api/location/zones/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['location-zones'] }),
    });

    const handleEditZone = (zone: Zone) => {
        setEditingZoneId(zone.id);
        setZoneForm({
            name: zone.name,
            capacity: zone.capacity,
            maxPersons: zone.maxPersons,
            allowedDurations: zone.allowedDurations || [60],
            schedule: zone.schedule || defaultSchedule
        });
        setShowCreateZone(true);
    };

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
        onError: (err: any) => setReviewError(err.response?.data || 'Eroare la adăugarea recenziei')
    });

    const { mutate: updateProfile, isPending: updatingProfile } = useMutation({
        mutationFn: async () => api.put('/api/location/profile', { 
            description, 
            facilities: selectedFacilities
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['location-profile'] });
            alert('Profilul a fost salvat cu succes!');
        },
        onError: () => alert('A apărut o eroare la salvarea profilului.')
    });

    const { mutate: deletePhoto } = useMutation({
        mutationFn: async (photoId: number) => api.delete(`/api/location/photos/${photoId}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['location-profile'] })
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const formData = new FormData();
        formData.append('file', e.target.files[0]);
        setUploading(true);
        try {
            await api.post('/api/location/photos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            queryClient.invalidateQueries({ queryKey: ['location-profile'] });
        } catch (err) {
            alert('Eroare la încărcarea pozei.');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const { mutate: deleteAccount, isPending: deletingAccount } = useMutation({
        mutationFn: async () => api.delete('/api/location/account', { data: { password: deletePassword } }),
        onSuccess: () => {
            alert('Locația și contul tău au fost șterse cu succes!');
            logout();
        },
        onError: (err: any) => {
            setDeleteError(err.response?.data?.message || err.response?.data || 'Eroare! Verifică parola.');
        }
    });

    if (authLoading || !user) {
        return <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center"><Loader2 className="animate-spin text-[#C5A059]" size={40} /></div>;
    }

    const pastBookings = allBookings?.filter(b => ['COMPLETED', 'CANCELLED_BY_USER', 'CANCELLED_NO_SHOW'].includes(b.status)) || [];
    const validBookings = allBookings?.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED') || [];
    const pendingBookings = allBookings?.filter(b => b.status === 'PENDING') || [];

    const bookingsToday = validBookings.filter(b => isToday(parseISO(b.bookingDate))).length;
    const bookingsThisWeek = validBookings.filter(b => isThisWeek(parseISO(b.bookingDate), { weekStartsOn: 1 })).length;
    const bookingsThisMonth = validBookings.filter(b => isThisMonth(parseISO(b.bookingDate))).length;
    
    const totalGuests = validBookings.reduce((sum, b) => sum + b.groupSize, 0);

    const hourCounts: Record<string, number> = {};
    const dayCounts: Record<string, number> = {};

    validBookings.forEach(b => {
        const hour = b.startTime.substring(0, 5);
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        const dayName = format(parseISO(b.bookingDate), 'EEEE', { locale: ro });
        dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    });

    const topHour = Object.keys(hourCounts).length > 0 ? Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0][0] : 'N/A';
    const topDay = Object.keys(dayCounts).length > 0 ? Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0][0] : 'N/A';

    const statusColors: Record<string, string> = {
        CONFIRMED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        COMPLETED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        CANCELLED_BY_USER: 'bg-white/5 text-zinc-400 border-white/10',
        CANCELLED_NO_SHOW: 'bg-red-500/10 text-red-400 border-red-500/20',
        PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
    };

    const statusLabels: Record<string, string> = {
        CONFIRMED: 'Confirmată',
        COMPLETED: 'Finalizată',
        CANCELLED_BY_USER: 'Anulată client',
        CANCELLED_NO_SHOW: 'Neprezentare',
        PENDING: 'Cerere Eveniment',
        REJECTED: 'Respinsă',
    };

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-zinc-200 pt-24 pb-12">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 space-y-6">

                {/* --- HEADER & KPIs --- */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Header Info */}
                    <div className="md:col-span-12 lg:col-span-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                        <div>
                            <h1 className="text-2xl font-serif text-white mb-1">{profile?.name || 'Dashboard Locație'}</h1>
                            <p className="text-zinc-400 text-sm font-light">Control Center</p>
                        </div>
                        {profile && (
                            <div className="mt-6 flex items-center gap-4 bg-white/5 border border-white/10 p-3.5 rounded-xl w-fit">
                                <div className="flex items-center gap-2">
                                    <Star size={18} className="text-[#C5A059] fill-[#C5A059]" />
                                    <span className="text-xl font-bold text-white">{profile.rating?.toFixed(1) || 'N/A'}</span>
                                </div>
                                <div className="w-px h-6 bg-white/10"></div>
                                <div className="flex items-baseline gap-1 text-sm text-zinc-400">
                                    <span className="text-white font-medium">{profile.ratingCount || 0}</span> recenzii
                                </div>
                            </div>
                        )}
                    </div>

                    {/* KPI Cards */}
                    <div className="md:col-span-12 lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <BarChart3 size={20} className="text-[#C5A059]" />
                                <span className="text-[10px] font-light text-zinc-500 uppercase tracking-wider">Rezervări</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{bookingsToday}</p>
                                <p className="text-xs text-zinc-500 mt-1">Azi <span className="text-zinc-400">/ {bookingsThisWeek} săpt</span></p>
                            </div>
                        </div>

                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <Users size={20} className="text-[#C5A059]" />
                                <span className="text-[10px] font-light text-zinc-500 uppercase tracking-wider">Clienți</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{totalGuests}</p>
                                <p className="text-xs text-zinc-500 mt-1">Total onorați</p>
                            </div>
                        </div>

                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <TrendingUp size={20} className="text-[#C5A059]" />
                                <span className="text-[10px] font-light text-zinc-500 uppercase tracking-wider">Top Zi</span>
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white capitalize truncate">{topDay}</p>
                                <p className="text-xs text-zinc-500 mt-1">Cea mai aglomerată</p>
                            </div>
                        </div>

                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <Clock size={20} className="text-[#C5A059]" />
                                <span className="text-[10px] font-light text-zinc-500 uppercase tracking-wider">Top Oră</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{topHour}</p>
                                <p className="text-xs text-zinc-500 mt-1">Vârf de trafic</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- BENTO GRID LAYOUT --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* COLOANA STÂNGA (Operațional - 65%) */}
                    <div className="lg:col-span-8 space-y-6 flex flex-col">
                        {/* --- NOU: CERERI EVENIMENTE ÎN AȘTEPTARE --- */}
                        {pendingBookings.length > 0 && (
                            <div className="bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-2xl p-6 flex flex-col h-fit animate-slide-up shadow-[0_0_20px_rgba(197,160,89,0.1)]">
                                <h2 className="font-serif text-lg text-[#C5A059] mb-4 flex items-center gap-2">
                                    <AlertTriangle size={18} /> Cereri Evenimente Noi ({pendingBookings.length})
                                </h2>
                                <div className="space-y-4">
                                    {pendingBookings.map((booking) => (
                                        <div key={booking.id} className="bg-[#121214] border border-[#C5A059]/20 rounded-xl p-5 flex flex-col gap-4">
                                            
                                            {/* Rândul 1: Header cu Data, Zona și Butoane */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <span className="font-bold text-white text-sm bg-white/10 px-2 py-1 rounded-md">
                                                            {format(parseISO(booking.bookingDate), 'd MMM', { locale: ro })} 
                                                            {booking.eventEndDate && booking.eventEndDate !== booking.bookingDate && ` - ${format(parseISO(booking.eventEndDate), 'd MMM yyyy', { locale: ro })}`}
                                                            {' '}| {booking.startTime.substring(0, 5)} – {booking.endTime.substring(0, 5)}
                                                        </span>
                                                        <span className="text-xs font-light text-[#C5A059] border border-[#C5A059]/30 px-2 py-0.5 rounded-full">{booking.zoneName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-2">
                                                        <Users size={12} className="text-zinc-500"/> <span className="text-white font-medium">{booking.groupSize}</span> persoane
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    <button onClick={() => approveEvent(booking.id)} className="text-xs font-medium text-black bg-emerald-500 hover:bg-emerald-400 px-4 py-2 rounded-lg transition-all shadow-md">
                                                        Acceptă
                                                    </button>
                                                    <button onClick={() => rejectEvent(booking.id)} className="text-xs font-medium text-black bg-red-500 hover:bg-red-400 px-4 py-2 rounded-lg transition-all shadow-md">
                                                        Respinge
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Rândul 2: Detaliile trimise de client */}
                                            {(booking.eventDescription || booking.specialRequests) && (
                                                <div className="p-3.5 bg-black/40 border border-white/5 rounded-lg space-y-3">
                                                    {booking.eventDescription && (
                                                        <div>
                                                            <span className="text-[10px] uppercase tracking-wider text-[#C5A059] font-medium block mb-1">Descrierea Evenimentului</span>
                                                            <p className="text-sm text-zinc-300 font-light leading-relaxed">{booking.eventDescription}</p>
                                                        </div>
                                                    )}
                                                    {booking.specialRequests && (
                                                        <div>
                                                            <span className="text-[10px] uppercase tracking-wider text-[#C5A059] font-medium block mb-1">Cerințe Extra</span>
                                                            <p className="text-sm text-zinc-300 font-light leading-relaxed">{booking.specialRequests}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* --- NOU: MESAJE ȘI CONVERSAȚII ACTIVE --- */}
                        {activeChats && activeChats.length > 0 && (
                            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col h-fit">
                                <h2 className="font-serif text-lg text-white mb-4 flex items-center gap-2 border-b border-white/5 pb-4">
                                    <MessageCircle size={18} className="text-[#C5A059]" /> Mesaje Clienți
                                </h2>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                    {activeChats.map((chat) => (
                                        <div 
                                            key={chat.bookingId} 
                                            onClick={() => setActiveChat({ id: chat.bookingId, name: chat.clientName })}
                                            className="bg-[#121214] border border-white/5 hover:border-[#C5A059]/50 cursor-pointer rounded-xl p-4 flex items-center justify-between transition-all group relative overflow-hidden"
                                        >
                                            {/* Glow dacă sunt mesaje necitite */}
                                            {chat.unreadCount > 0 && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C5A059]"></div>}
                                            
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`font-bold text-sm ${chat.unreadCount > 0 ? 'text-[#C5A059]' : 'text-white'}`}>{chat.clientName}</span>
                                                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-zinc-400">Rezervarea #{chat.bookingId}</span>
                                                </div>
                                                <p className={`text-xs truncate ${chat.unreadCount > 0 ? 'text-white font-medium' : 'text-zinc-500 font-light'}`}>
                                                    {chat.lastMessage}
                                                </p>
                                            </div>
                                            
                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                <span className="text-[9px] text-zinc-500">{format(parseISO(chat.lastMessageTime), 'HH:mm', { locale: ro })}</span>
                                                {chat.unreadCount > 0 && (
                                                    <span className="bg-[#C5A059] text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(197,160,89,0.4)]">
                                                        {chat.unreadCount} nouă
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* AGENDA ZILEI */}
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col h-fit">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
                                <h2 className="font-serif text-lg text-white flex items-center gap-2">
                                    <Calendar size={18} className="text-[#C5A059]" /> Agenda Zilei
                                </h2>
                                <input 
                                    type="date" 
                                    value={selectedDate} 
                                    onChange={(e) => setSelectedDate(e.target.value)} 
                                    className="bg-white/5 border border-white/10 text-white px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]" 
                                />
                            </div>
                            
                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-2 flex-1">
                                {agendaLoading ? (
                                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#C5A059]" size={24} /></div>
                                ) : agenda?.length === 0 ? (
                                    <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-zinc-400 text-sm font-light">Nu există rezervări pentru această dată.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {agenda?.map((booking) => (
                                            <div key={booking.id} className="bg-[#121214] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:border-white/10 transition-colors">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <span className="font-bold text-white text-sm bg-white/10 px-2 py-1 rounded-md">
                                                            {format(parseISO(booking.bookingDate), 'd MMM', { locale: ro })} 
                                                            {booking.eventEndDate && booking.eventEndDate !== booking.bookingDate && ` - ${format(parseISO(booking.eventEndDate), 'd MMM yyyy', { locale: ro })}`}
                                                            {' '}| {booking.startTime.substring(0, 5)} – {booking.endTime.substring(0, 5)}
                                                        </span>
                                                        <span className="text-xs font-light text-[#C5A059] border border-[#C5A059]/30 px-2 py-0.5 rounded-full">{booking.zoneName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-2">
                                                        <Users size={12} className="text-zinc-500"/> {booking.groupSize} persoane
                                                    </div>

                                                    {/* AFISARE DETALII EVENIMENT DACA E CONFIRMAT IN AGENDA */}
                                                    {(booking.eventDescription || booking.specialRequests) && (
                                                        <div className="mt-3 p-3 bg-black/40 border border-white/5 rounded-lg space-y-2 text-xs">
                                                            {booking.eventDescription && (
                                                                <div>
                                                                    <span className="text-[#C5A059] font-medium block mb-0.5">Descriere eveniment:</span>
                                                                    <p className="text-zinc-300">{booking.eventDescription}</p>
                                                                </div>
                                                            )}
                                                            {booking.specialRequests && (
                                                                <div>
                                                                    <span className="text-[#C5A059] font-medium block mb-0.5">Cerințe extra:</span>
                                                                    <p className="text-zinc-300">{booking.specialRequests}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col sm:items-end gap-2 mt-2 md:mt-0">
                                                    <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md border font-medium w-fit ${statusColors[booking.status] || 'bg-white/5 text-zinc-400 border-white/10'}`}>
                                                        {statusLabels[booking.status] || booking.status}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        {booking.status === 'CONFIRMED' && (
                                                            <button onClick={() => markNoShow(booking.id)} className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 transition-all">No-show</button>
                                                        )}
                                                        {booking.canReview && (
                                                            givenReviews?.some(r => r.bookingId === booking.id) ? (
                                                                <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-default">
                                                                    <Check size={12} /> Evaluată
                                                                </span>
                                                            ) : (
                                                                <button onClick={() => setReviewModal(booking.id)} className="text-xs text-[#C5A059] hover:text-black hover:bg-[#C5A059] border border-[#C5A059]/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all">
                                                                    <Star size={12} /> Evaluează
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CONFIGURARE ZONE */}
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                                <h2 className="font-serif text-lg text-white flex items-center gap-2">
                                    <MapPin size={18} className="text-[#C5A059]" /> Zone Rezervabile
                                </h2>
                                <button 
                                    onClick={() => {
                                        setEditingZoneId(null);
                                        setZoneForm({ name: '', capacity: 3, maxPersons: 20, allowedDurations: [60], schedule: defaultSchedule });
                                        setShowCreateZone(!showCreateZone);
                                    }} 
                                    className="flex items-center gap-1.5 bg-[#C5A059] hover:bg-[#b08d4a] text-black px-4 py-2 rounded-xl text-xs font-medium transition-colors"
                                >
                                    <Plus size={14} /> Adaugă zonă
                                </button>
                            </div>

                            {!zonesLoading && zones && zones.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                    {zones.map((zone) => (
                                        <div key={zone.id} className="bg-[#121214] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="text-sm font-bold text-white">{zone.name}</p>
                                                    <div className="flex gap-1.5">
                                                        <button onClick={() => handleEditZone(zone)} className="text-zinc-400 hover:text-white p-1 bg-white/5 rounded-md transition-colors"><Edit2 size={12} /></button>
                                                        <button onClick={() => { if (window.confirm('Ștergeți zona?')) deleteZone(zone.id); }} className="text-red-400 hover:text-red-300 p-1 bg-red-500/10 rounded-md transition-colors"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                                <div className="text-xs font-light text-zinc-400 space-y-1">
                                                    <p>Capacitate sloturi: <span className="text-white">{zone.capacity}</span></p>
                                                    <p>Pers. max/rezervare: <span className="text-white">{zone.maxPersons}</span></p>
                                                    <p className="mt-2 text-[#C5A059]">Durate: {zone.allowedDurations?.map(d => d === 90 ? '1.5h' : `${d/60}h`).join(', ') || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {showCreateZone && (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-5 mt-4 animate-slide-up">
                                    <h3 className="text-sm font-serif text-[#C5A059] mb-4">
                                        {editingZoneId ? 'Editează zona' : 'Creează o zonă nouă'}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                        {[{ label: 'Nume Zonă', key: 'name', type: 'text', placeholder: 'ex: Terasă' }, 
                                          { label: 'Pers max/rezervare', key: 'maxPersons', type: 'number' }, 
                                          { label: 'Capacitate sloturi', key: 'capacity', type: 'number' }].map(({ label, key, type, placeholder }) => (
                                            <div key={key}>
                                                <label className="text-xs font-light text-zinc-400 mb-1.5 block">{label}</label>
                                                <input 
                                                    type={type} 
                                                    value={(zoneForm as any)[key]} 
                                                    placeholder={placeholder} 
                                                    onChange={(e) => setZoneForm(p => ({ ...p, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))} 
                                                    className="w-full bg-[#0a0a0b] border border-white/10 text-white placeholder-zinc-600 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]" 
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-white/5 pt-4">
                                        {/* Program */}
                                        <div>
                                            <label className="text-xs font-light text-[#C5A059] mb-3 block uppercase tracking-wider">Program Funcționare</label>
                                            <div className="space-y-2.5 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                                {DAYS.map(day => {
                                                    const currentVal = zoneForm.schedule[day.key] || 'Închis';
                                                    const isClosed = currentVal === 'Închis';
                                                    const [open, close] = isClosed ? ['', ''] : currentVal.split('-');

                                                    return (
                                                        <div key={day.key} className="flex items-center gap-3 bg-[#0a0a0b] p-2 rounded-lg border border-white/5">
                                                            <span className="text-xs font-medium text-zinc-300 w-16">{day.label}</span>
                                                            <label className="relative flex items-center cursor-pointer">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={!isClosed} 
                                                                    onChange={(e) => {
                                                                        const val = e.target.checked ? '10:00-22:00' : 'Închis';
                                                                        setZoneForm(p => ({ ...p, schedule: { ...p.schedule, [day.key]: val }}));
                                                                    }}
                                                                    className="sr-only peer"
                                                                />
                                                                <div className="w-8 h-4 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#C5A059]"></div>
                                                            </label>
                                                            {!isClosed && (
                                                                <div className="flex gap-1 items-center ml-auto">
                                                                    <input 
                                                                        type="time" value={open} 
                                                                        onChange={(e) => setZoneForm(p => ({ ...p, schedule: { ...p.schedule, [day.key]: `${e.target.value}-${close}` } }))}
                                                                        className="bg-transparent border border-white/10 rounded px-1.5 py-1 text-[10px] text-white outline-none focus:border-[#C5A059]"
                                                                    />
                                                                    <span className="text-zinc-500">-</span>
                                                                    <input 
                                                                        type="time" value={close} 
                                                                        onChange={(e) => setZoneForm(p => ({ ...p, schedule: { ...p.schedule, [day.key]: `${open}-${e.target.value}` } }))}
                                                                        className="bg-transparent border border-white/10 rounded px-1.5 py-1 text-[10px] text-white outline-none focus:border-[#C5A059]"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Durate & Submit */}
                                        <div className="flex flex-col justify-between">
                                            <div>
                                                <label className="text-xs font-light text-[#C5A059] mb-3 block uppercase tracking-wider">Durate Permise</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {[60, 90, 120].map((mins) => (
                                                        <label key={mins} className={`flex items-center gap-2 cursor-pointer border px-3 py-2 rounded-lg text-xs transition-colors ${zoneForm.allowedDurations.includes(mins) ? 'bg-[#C5A059]/10 border-[#C5A059] text-[#C5A059]' : 'bg-[#0a0a0b] border-white/10 text-zinc-400 hover:border-white/30'}`}>
                                                            <input 
                                                                type="checkbox" 
                                                                className="hidden"
                                                                checked={zoneForm.allowedDurations.includes(mins)}
                                                                onChange={(e) => {
                                                                    const newDurations = e.target.checked 
                                                                        ? [...zoneForm.allowedDurations, mins]
                                                                        : zoneForm.allowedDurations.filter((d: number) => d !== mins);
                                                                    if (newDurations.length > 0) setZoneForm(p => ({ ...p, allowedDurations: newDurations }));
                                                                }}
                                                            />
                                                            {mins === 90 ? '1.5h' : `${mins/60}h`}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex gap-3 mt-6">
                                                <button onClick={() => { setShowCreateZone(false); setEditingZoneId(null); }} className="flex-1 bg-transparent border border-white/20 text-zinc-300 py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors">Anulează</button>
                                                <button onClick={() => saveZone()} disabled={savingZone || !zoneForm.name || zoneForm.allowedDurations.length === 0} className="flex-1 bg-[#C5A059] hover:bg-[#b08d4a] disabled:opacity-50 text-black py-2.5 rounded-xl text-sm font-medium flex justify-center gap-2 transition-colors">
                                                    {savingZone && <Loader2 size={16} className="animate-spin" />} {editingZoneId ? 'Salvează' : 'Creează'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* GALERIE FOTO */}
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <h2 className="font-serif text-lg text-white mb-6 border-b border-white/5 pb-4 flex items-center gap-2">
                                <ImageIcon size={18} className="text-[#C5A059]" /> Galeria Foto
                            </h2>
                            {profile?.photos && profile.photos.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                    {profile.photos.map((photo: any) => (
                                        <div key={photo.id} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10">
                                            <img src={`http://localhost:8080${photo.url}`} alt="Locatie" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button onClick={() => { if(window.confirm('Ștergi poza?')) deletePhoto(photo.id); }} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="border border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 hover:border-[#C5A059]/50 transition-all relative cursor-pointer">
                                <Upload size={28} className="text-zinc-500 mb-3" />
                                <p className="text-sm text-zinc-300 font-medium">Click sau Drag & Drop pentru imagine</p>
                                <p className="text-xs text-zinc-500 mt-1 font-light">PNG, JPG (Max 5MB)</p>
                                <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" />
                                {uploading && <div className="absolute inset-0 bg-[#0a0a0b]/80 backdrop-blur-sm flex items-center justify-center rounded-xl"><Loader2 className="animate-spin text-[#C5A059]" size={28} /></div>}
                            </div>
                        </div>

                    </div>

                    {/* COLOANA DREAPTA (Informații & Setări - 35%) */}
                    <div className="lg:col-span-4 space-y-6 flex flex-col">
                        
                        {/* PREZENTARE LOCAȚIE */}
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <h2 className="font-serif text-lg text-white mb-6 border-b border-white/5 pb-4">Setări Profil</h2>
                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-light text-zinc-400 mb-2 block uppercase tracking-wider">Descriere</label>
                                    <textarea 
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] outline-none resize-none custom-scrollbar"
                                        rows={4}
                                        placeholder="Povestea locației tale..."
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-light text-zinc-400 mb-2 block uppercase tracking-wider">Facilități</label>
                                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar p-3 border border-white/5 rounded-xl bg-[#0a0a0b] mb-3">
                                        {Object.entries(facilityLabels).map(([key, label]) => {
                                            const isSelected = selectedFacilities.includes(key);
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => setSelectedFacilities(prev => isSelected ? prev.filter(f => f !== key) : [...prev, key])}
                                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all flex items-center gap-1.5 ${isSelected ? 'bg-[#C5A059]/10 border-[#C5A059]/50 text-[#C5A059]' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                                                >
                                                    {isSelected && <Check size={12} />} {label}
                                                </button>
                                            );
                                        })}
                                        {selectedFacilities.filter(f => !facilityLabels[f as keyof typeof facilityLabels]).map(customF => (
                                            <button
                                                key={customF}
                                                onClick={() => setSelectedFacilities(prev => prev.filter(f => f !== customF))}
                                                className="px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all flex items-center gap-1.5 bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                                            >
                                                <Check size={12} /> {customF}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text"
                                            value={customFacilityInput}
                                            onChange={(e) => setCustomFacilityInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomFacility())}
                                            placeholder="Adaugă facilitate custom..."
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-[#C5A059] outline-none"
                                        />
                                        <button onClick={handleAddCustomFacility} className="bg-white/10 text-white px-3 py-2 rounded-xl hover:bg-[#C5A059] hover:text-black transition-colors">
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>

                                <button onClick={() => updateProfile()} disabled={updatingProfile} className="w-full bg-[#C5A059] text-black py-3 rounded-xl text-sm font-medium hover:bg-[#b08d4a] transition-colors flex items-center justify-center gap-2 mt-4">
                                    {updatingProfile && <Loader2 size={16} className="animate-spin" />} Salvează Profilul
                                </button>
                            </div>
                        </div>

                        {/* ISTORIC & RECENZII */}
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col flex-1">
                            <h2 className="font-serif text-lg text-white mb-4 border-b border-white/5 pb-4 flex items-center gap-2">
                                <History size={18} className="text-[#C5A059]" /> Activitate
                            </h2>
                            <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[500px]">
                                
                                {/* Recenzii Primite */}
                                <div>
                                    <h3 className="text-xs font-light text-zinc-500 uppercase tracking-wider mb-3">Feedback Primit</h3>
                                    {!receivedReviews || receivedReviews.length === 0 ? <p className="text-xs text-zinc-600 italic">Nicio recenzie.</p> : (
                                        <div className="space-y-3">
                                            {receivedReviews.slice(0, 3).map(review => (
                                                <div key={review.id} className="bg-[#121214] p-3 rounded-xl border border-white/5">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-bold text-white">{review.reviewerName}</span>
                                                        <div className="flex gap-0.5">{[...Array(review.rating)].map((_, i) => <Star key={i} size={10} className="text-[#C5A059] fill-[#C5A059]" />)}</div>
                                                    </div>
                                                    <p className="text-[11px] text-zinc-400 italic">"{review.comment}"</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Istoric Rezervări (Complet cu Evaluare) */}
                                <div className="mt-6 border-t border-white/5 pt-6">
                                    <h3 className="text-xs font-light text-zinc-500 uppercase tracking-wider mb-4">Istoric Rezervări</h3>
                                    {pastBookings.length === 0 ? <p className="text-xs text-zinc-600 italic">Niciun istoric.</p> : (
                                        <div className="space-y-3">
                                            {pastBookings.map((booking) => (
                                                <div key={booking.id} className="flex flex-col xl:flex-row justify-between xl:items-center gap-3 bg-[#121214] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <p className="text-sm font-bold text-white">{booking.zoneName}</p>
                                                            <span className={`text-[9px] px-2 py-0.5 rounded-md uppercase tracking-wider border ${statusColors[booking.status]}`}>
                                                                {statusLabels[booking.status]}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-zinc-400 font-light">
                                                            {format(new Date(booking.bookingDate), 'd MMMM yyyy', { locale: ro })} • {booking.startTime.substring(0,5)}
                                                        </p>
                                                    </div>
                                                    
                                                    {/* Buton Evaluare */}
                                                    {booking.canReview && (
                                                        givenReviews?.some(r => r.bookingId === booking.id) ? (
                                                            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 w-fit cursor-default">
                                                                <Check size={12} /> Evaluată
                                                            </span>
                                                        ) : (
                                                            <button 
                                                                onClick={() => setReviewModal(booking.id)} 
                                                                className="text-[11px] font-medium text-[#C5A059] hover:text-black hover:bg-[#C5A059] border border-[#C5A059]/50 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 w-fit transition-all"
                                                            >
                                                                <Star size={12} /> Evaluează clientul
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* DANGER ZONE */}
                        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                            <h2 className="font-serif text-lg text-red-400 mb-2 flex items-center gap-2">
                                <AlertTriangle size={18} /> Pericol
                            </h2>
                            <p className="text-xs text-red-400/70 mb-4 font-light">Ștergerea contului este ireversibilă. Toate datele vor fi pierdute.</p>
                            <button onClick={() => setDeleteModal(true)} className="w-full bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 py-2.5 rounded-xl text-sm font-medium transition-all">
                                Șterge definitiv locația
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {/* --- MODAL RECENZII --- */}
            {reviewModal && (
                <div className="fixed inset-0 bg-[#0a0a0b]/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in duration-200">
                    <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="font-serif text-white mb-4 text-xl">Evaluează clientul</h3>
                        {reviewError && <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-lg">{reviewError}</div>}
                        <div className="mb-5">
                            <label className="text-xs font-light text-zinc-400 mb-2 block uppercase tracking-wider">Cum s-a comportat?</label>
                            <div className="flex gap-2 justify-center py-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} size={32} className={`cursor-pointer transition-all hover:scale-110 ${rating >= star ? 'text-[#C5A059] fill-[#C5A059]' : 'text-zinc-600'}`} onClick={() => setRating(star)} />
                                ))}
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="text-xs font-light text-zinc-400 mb-2 block uppercase tracking-wider">Comentariu</label>
                            <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#C5A059] outline-none resize-none" rows={3} placeholder="Scrie despre conduita clientului..." />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setReviewModal(null); setRating(5); setComment(''); setReviewError(''); }} className="flex-1 border border-white/20 text-zinc-300 hover:bg-white/5 py-2.5 rounded-xl text-sm transition-colors">Renunță</button>
                            <button onClick={() => submitReview()} disabled={submittingReview || comment.trim().length < 3} className="flex-1 bg-[#C5A059] hover:bg-[#b08d4a] disabled:opacity-50 text-black py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                                {submittingReview && <Loader2 size={16} className="animate-spin" />} Trimite
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL ȘTERGERE CONT --- */}
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
            {/* Modal Chat Locație */}
            {activeChat && (
                <ChatModal 
                    bookingId={activeChat.id} 
                    recipientName={activeChat.name} 
                    senderType="LOCATION" 
                    onClose={() => setActiveChat(null)} 
                />
            )}
        </div>
    );
}