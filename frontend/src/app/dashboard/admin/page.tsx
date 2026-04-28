'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { useState, useMemo } from 'react';
import { Check, X, Search, Shield, Loader2, Clock, Users, MapPin, CalendarCheck, AlertTriangle, Trash2, Ban, Star, Unlock, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import api from '@/lib/api';
import { AdminLocation, AuditLog, AdminStatistics, AdminReportedReview, AdminBlockedAccounts, AdminUser } from '@/types';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function AdminDashboardPage() {
    const { user, isLoading: authLoading } = useRequireAuth('ADMIN');
    const queryClient = useQueryClient();
    
    // Modals states
    const [rejectId, setRejectId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [blockModal, setBlockModal] = useState<{ type: 'USER' | 'LOCATION', id: number, name: string } | null>(null);
    const [blockReason, setBlockReason] = useState('');
    
    // Tab state
    const [activeTab, setActiveTab] = useState<'directory' | 'pending' | 'audit' | 'reviews' | 'blocked' | 'alerts'>('directory');

    // Explorer (Search) states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'USER' | 'LOCATION'>('ALL');

    /* --- QUERIES --- */
    const { data: pending, isLoading: pendingLoading } = useQuery({
        queryKey: ['pending-locations'],
        queryFn: async () => (await api.get('/api/admin/locations/pending')).data as AdminLocation[],
        enabled: !!user,
    });

    const { data: auditLogs } = useQuery({
        queryKey: ['audit-log'],
        queryFn: async () => (await api.get('/api/admin/audit-log')).data as AuditLog[],
        enabled: !!user,
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => (await api.get('/api/admin/statistics')).data as AdminStatistics,
        enabled: !!user,
    });

    const { data: reportedReviews, isLoading: reviewsLoading } = useQuery({
        queryKey: ['reported-reviews'],
        queryFn: async () => (await api.get('/api/admin/reviews/reported')).data as AdminReportedReview[],
        enabled: !!user,
    });

    const { data: blockedData, isLoading: blockedLoading } = useQuery({
        queryKey: ['blocked-accounts'],
        queryFn: async () => (await api.get('/api/admin/accounts/blocked')).data as AdminBlockedAccounts,
        enabled: !!user,
    });

    const { data: allUsers, isLoading: usersLoading } = useQuery({
        queryKey: ['all-users'],
        queryFn: async () => (await api.get('/api/admin/users')).data as AdminUser[],
        enabled: !!user,
    });

    const { data: allLocations, isLoading: locationsLoading } = useQuery({
        queryKey: ['all-locations'],
        queryFn: async () => (await api.get('/api/admin/locations')).data as AdminLocation[],
        enabled: !!user,
    });

    const { data: lowRatingLocations, isLoading: lowLocLoading } = useQuery({
        queryKey: ['low-rating-locations'],
        queryFn: async () => (await api.get('/api/admin/locations/low-rating')).data as AdminLocation[],
        enabled: !!user,
    });

    const { data: lowRatingUsers, isLoading: lowUsrLoading } = useQuery({
        queryKey: ['low-rating-users'],
        queryFn: async () => (await api.get('/api/admin/users/low-rating')).data as AdminUser[],
        enabled: !!user,
    });

    /* --- MUTATIONS --- */
    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['pending-locations'] });
        queryClient.invalidateQueries({ queryKey: ['audit-log'] });
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        queryClient.invalidateQueries({ queryKey: ['reported-reviews'] });
        queryClient.invalidateQueries({ queryKey: ['blocked-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['all-users'] });
        queryClient.invalidateQueries({ queryKey: ['all-locations'] });
        queryClient.invalidateQueries({ queryKey: ['low-rating-locations'] });
        queryClient.invalidateQueries({ queryKey: ['low-rating-users'] });
    };

    const { mutate: approve, isPending: approving } = useMutation({
        mutationFn: async (id: number) => api.post(`/api/admin/locations/${id}/approve`),
        onSuccess: invalidateAll,
    });

    const { mutate: reject } = useMutation({
        mutationFn: async ({ id, reason }: { id: number; reason: string }) =>
            api.post(`/api/admin/locations/${id}/reject`, { reason }),
        onSuccess: () => {
            invalidateAll();
            setRejectId(null);
            setRejectReason('');
        },
    });

    const { mutate: deleteReview } = useMutation({
        mutationFn: async (id: number) => api.delete(`/api/admin/reviews/${id}`),
        onSuccess: invalidateAll
    });

    const { mutate: blockAccount, isPending: blocking } = useMutation({
        mutationFn: async ({ type, id, reason }: { type: 'USER' | 'LOCATION', id: number, reason: string }) => {
            const endpoint = type === 'USER' ? `/api/admin/users/${id}/block` : `/api/admin/locations/${id}/block`;
            return api.post(endpoint, { reason });
        },
        onSuccess: () => {
            invalidateAll();
            setBlockModal(null);
            setBlockReason('');
        }
    });

    const { mutate: unblockUser } = useMutation({
        mutationFn: async (id: number) => api.post(`/api/admin/users/${id}/unblock`),
        onSuccess: invalidateAll
    });

    const { mutate: unblockLocation } = useMutation({
        mutationFn: async (id: number) => api.post(`/api/admin/locations/${id}/unblock`),
        onSuccess: invalidateAll
    });

    /* --- FILTERING LOGIC --- */
    const filteredResults = useMemo(() => {
        const query = searchTerm.toLowerCase().trim();
        let results: Array<{ type: 'USER' | 'LOCATION', data: any }> = [];

        if (filterType === 'ALL' || filterType === 'USER') {
            const u = allUsers?.filter(user => 
                user.role !== 'ADMIN' && 
                (user.publicId.toLowerCase().includes(query) ||
                user.firstName.toLowerCase().includes(query) ||
                user.lastName.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                (user.phone && user.phone.includes(query)))
            ).map(data => ({ type: 'USER' as const, data })) || [];
            results = [...results, ...u];
        }

        if (filterType === 'ALL' || filterType === 'LOCATION') {
            const l = allLocations?.filter(loc => 
                loc.publicId.toLowerCase().includes(query) ||
                loc.displayName.toLowerCase().includes(query) ||
                loc.companyName.toLowerCase().includes(query) ||
                loc.ownerEmail.toLowerCase().includes(query) ||
                loc.cui.toLowerCase().includes(query)
            ).map(data => ({ type: 'LOCATION' as const, data })) || [];
            results = [...results, ...l];
        }

        return results;
    }, [searchTerm, filterType, allUsers, allLocations]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#C5A059]" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-zinc-200 pt-24 pb-12">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 space-y-8">

                {/* Header */}
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center gap-4 shadow-2xl">
                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                        <Shield size={28} className="text-[#C5A059]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-serif text-white tracking-wide">Dashboard Admin</h1>
                        <p className="text-zinc-400 text-sm font-light">Control tower Planify</p>
                    </div>
                </div>

                {/* Statistici */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex items-start gap-4 transition-colors hover:border-white/20">
                        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                            <Users className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-light">Total Utilizatori</p>
                            {statsLoading ? (
                                <div className="h-8 w-16 bg-white/5 animate-pulse rounded mt-1"></div>
                            ) : (
                                <>
                                    <h3 className="text-3xl font-bold text-white leading-none">{stats?.totalUsers || 0}</h3>
                                    <p className="text-[11px] text-zinc-500 mt-2">
                                        <span className="text-red-400 font-medium">{stats?.blockedUsers || 0}</span> blocate
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex items-start gap-4 transition-colors hover:border-white/20">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                            <MapPin className="text-emerald-400" size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-light">Locații Înreg.</p>
                            {statsLoading ? (
                                <div className="h-8 w-16 bg-white/5 animate-pulse rounded mt-1"></div>
                            ) : (
                                <>
                                    <h3 className="text-3xl font-bold text-white leading-none">{stats?.totalLocations || 0}</h3>
                                    <p className="text-[11px] text-zinc-500 mt-2">
                                        <span className="text-emerald-400 font-medium">{stats?.verifiedLocations || 0} active</span> • <span className="text-[#C5A059] font-medium">{stats?.pendingLocations || 0} pending</span>
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex items-start gap-4 transition-colors hover:border-white/20">
                        <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl">
                            <CalendarCheck className="text-purple-400" size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-light">Total Rezervări</p>
                            {statsLoading ? (
                                <div className="h-8 w-16 bg-white/5 animate-pulse rounded mt-1"></div>
                            ) : (
                                <>
                                    <h3 className="text-3xl font-bold text-white leading-none">{stats?.totalBookings || 0}</h3>
                                    <p className="text-[11px] text-zinc-500 mt-2">Procesate în platformă</p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl flex items-start gap-4 transition-colors hover:border-white/20">
                        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                            <AlertTriangle className="text-red-400" size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-light">Review-uri Rap.</p>
                            {statsLoading ? (
                                <div className="h-8 w-16 bg-white/5 animate-pulse rounded mt-1"></div>
                            ) : (
                                <>
                                    <h3 className="text-3xl font-bold text-white leading-none">{stats?.reportedReviews || 0}</h3>
                                    <p className="text-[11px] text-zinc-500 mt-2">Necesită moderare</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex flex-wrap gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10 w-fit">
                    <button
                        onClick={() => setActiveTab('directory')}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                            activeTab === 'directory' ? 'bg-[#C5A059] text-black shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Search size={16} /> Explorator
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            activeTab === 'pending' ? 'bg-[#C5A059] text-black shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Locații PENDING ({pending?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('reviews')}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                            activeTab === 'reviews' ? 'bg-[#C5A059] text-black shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Review-uri Raportate
                        {stats?.reportedReviews ? (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${activeTab === 'reviews' ? 'bg-black text-[#C5A059]' : 'bg-red-500/20 text-red-400'}`}>
                                {stats.reportedReviews}
                            </span>
                        ) : null}
                    </button>
                    <button
                        onClick={() => setActiveTab('blocked')}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                            activeTab === 'blocked' ? 'bg-red-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Conturi Blocate
                        {blockedData && ((blockedData.blockedUsers?.length || 0) + (blockedData.blockedLocations?.length || 0) > 0) && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${activeTab === 'blocked' ? 'bg-white text-red-600' : 'bg-red-500/20 text-red-400'}`}>
                                {(blockedData.blockedUsers?.length || 0) + (blockedData.blockedLocations?.length || 0)}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                            activeTab === 'alerts' ? 'bg-orange-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <AlertTriangle size={16} /> Alerte Rating
                        {((lowRatingLocations?.length || 0) + (lowRatingUsers?.length || 0)) > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${activeTab === 'alerts' ? 'bg-white text-orange-600' : 'bg-orange-500/20 text-orange-400'}`}>
                                {(lowRatingLocations?.length || 0) + (lowRatingUsers?.length || 0)}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            activeTab === 'audit' ? 'bg-[#C5A059] text-black shadow-lg' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        Audit Log
                    </button>
                </div>

                {/* --- TAB: EXPLORATOR (DIRECTORY) --- */}
                {activeTab === 'directory' && (
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-6 animate-slide-up">
                        <div className="flex flex-col md:flex-row gap-4 items-end border-b border-white/5 pb-6">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-light text-zinc-400 mb-2 uppercase tracking-wider">Caută (Nume, Email, CUI, ID, Telefon)</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                    <input 
                                        type="text" 
                                        value={searchTerm} 
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Introdu textul căutat..."
                                        className="w-full pl-12 pr-4 py-3 bg-[#0a0a0b] border border-white/10 text-white placeholder-zinc-600 rounded-xl focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-64">
                                <label className="block text-xs font-light text-zinc-400 mb-2 flex items-center gap-1 uppercase tracking-wider"><Filter size={14}/> Filtrează după tip</label>
                                <select 
                                    value={filterType} 
                                    onChange={(e) => setFilterType(e.target.value as any)}
                                    className="w-full px-4 py-3 bg-[#0a0a0b] border border-white/10 text-white rounded-xl focus:ring-1 focus:ring-[#C5A059] focus:border-[#C5A059] outline-none text-sm appearance-none"
                                >
                                    <option value="ALL" className="bg-[#121214]">Toate conturile</option>
                                    <option value="USER" className="bg-[#121214]">Doar Clienți (Users)</option>
                                    <option value="LOCATION" className="bg-[#121214]">Doar Locații</option>
                                </select>
                            </div>
                        </div>

                        {(usersLoading || locationsLoading) ? (
                            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#C5A059]" size={32} /></div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-white/5">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-[#121214] border-b border-white/5 text-xs text-zinc-400 uppercase tracking-wider font-light">
                                            <th className="py-4 px-5 whitespace-nowrap font-medium">Tip & ID</th>
                                            <th className="py-4 px-5 whitespace-nowrap font-medium">Nume / Denumire</th>
                                            <th className="py-4 px-5 whitespace-nowrap font-medium">Contact</th>
                                            <th className="py-4 px-5 whitespace-nowrap font-medium">Status</th>
                                            <th className="py-4 px-5 text-right whitespace-nowrap font-medium">Acțiuni</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-sm">
                                        {filteredResults.length === 0 ? (
                                            <tr><td colSpan={5} className="py-12 text-center text-zinc-500 font-light">Niciun rezultat găsit.</td></tr>
                                        ) : (
                                            filteredResults.map((item) => {
                                                const isUser = item.type === 'USER';
                                                const data = item.data;
                                                const isBlocked = data.status === 'BLOCKED';

                                                return (
                                                    <tr key={`${item.type}-${data.id}`} className="hover:bg-white/5 transition-colors">
                                                        <td className="py-4 px-5">
                                                            <span className={`inline-block px-2.5 py-1 text-[10px] font-medium rounded-md uppercase tracking-wider border ${isUser ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                                                {isUser ? 'Client' : 'Locație'}
                                                            </span>
                                                            <div className="text-xs text-zinc-500 mt-2 font-mono">{data.publicId}</div>
                                                        </td>
                                                        <td className="py-4 px-5 font-medium text-zinc-200">
                                                            {isUser ? `${data.firstName} ${data.lastName}` : data.displayName}
                                                            {!isUser && <div className="text-[11px] text-zinc-500 font-normal mt-1">CUI: {data.cui}</div>}
                                                        </td>
                                                        <td className="py-4 px-5 text-zinc-400 font-light">
                                                            <span className="text-zinc-300">{isUser ? data.email : data.ownerEmail}</span>
                                                            <div className="text-[11px] text-zinc-500 mt-1">{isUser ? data.phone : data.contactPhone}</div>
                                                        </td>
                                                        <td className="py-4 px-5">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider border ${
                                                                isBlocked ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                                                data.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            }`}>
                                                                {data.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-5 text-right">
                                                            {isBlocked ? (
                                                                <button 
                                                                    onClick={() => isUser ? unblockUser(data.id) : unblockLocation(data.id)}
                                                                    className="inline-flex items-center gap-1.5 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-emerald-500/30 text-xs font-medium"
                                                                >
                                                                    <Unlock size={14} /> Deblochează
                                                                </button>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => setBlockModal({ type: item.type, id: data.id, name: isUser ? `${data.firstName} ${data.lastName}` : data.displayName })}
                                                                    className="inline-flex items-center gap-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-500/30 text-xs font-medium"
                                                                >
                                                                    <Ban size={14} /> Blochează
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* --- TAB: Locații PENDING --- */}
                {activeTab === 'pending' && (
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-slide-up">
                        <h2 className="font-serif text-lg text-white mb-6 border-b border-white/5 pb-4">Cereri de aprobare</h2>
                        {pendingLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-[#C5A059]" size={28} />
                            </div>
                        ) : pending?.length === 0 ? (
                            <div className="py-12 bg-white/5 border border-white/5 rounded-xl text-center">
                                <p className="text-zinc-400 text-sm font-light">Nu există cereri în așteptare. Totul este la zi! ✨</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {pending?.map((loc) => (
                                    <div key={loc.id} className="bg-[#121214] border border-white/5 hover:border-white/20 transition-colors rounded-xl p-5 flex flex-col justify-between">
                                        <div className="mb-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-bold text-white text-lg">{loc.displayName}</span>
                                                <span className="text-[10px] bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] px-2 py-0.5 rounded-md font-medium font-mono">{loc.publicId}</span>
                                            </div>
                                            <div className="space-y-1 mt-3">
                                                <p className="text-xs text-zinc-400"><span className="text-zinc-500">Firmă:</span> {loc.companyName} • <span className="text-zinc-500">CUI:</span> {loc.cui}</p>
                                                <p className="text-xs text-zinc-400"><span className="text-zinc-500">Adresă Leg:</span> {loc.legalAddress}</p>
                                                <p className="text-xs text-zinc-400"><span className="text-zinc-500">Adresă Loc:</span> {loc.address}</p>
                                                <p className="text-xs text-zinc-400"><span className="text-zinc-500">Contact:</span> {loc.ownerEmail} • {loc.contactPhone}</p>
                                                <p className="text-xs text-zinc-400"><span className="text-zinc-500">Tip:</span> <span className="text-white">{loc.type}</span></p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-4 border-t border-white/5 mt-auto">
                                            <button onClick={() => setRejectId(loc.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-transparent border border-red-500/30 hover:bg-red-500/10 text-red-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                                                <X size={16} /> Respinge
                                            </button>
                                            <button onClick={() => approve(loc.id)} disabled={approving} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 disabled:opacity-50 text-emerald-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                                                {approving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                Aprobă
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- TAB: Review-uri Raportate --- */}
                {activeTab === 'reviews' && (
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-slide-up">
                        <h2 className="font-serif text-lg text-white mb-6 border-b border-white/5 pb-4 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-red-400" />
                            Review-uri care necesită moderare
                        </h2>

                        {reviewsLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-[#C5A059]" size={28} />
                            </div>
                        ) : reportedReviews?.length === 0 ? (
                            <div className="py-12 bg-white/5 border border-white/5 rounded-xl text-center">
                                <p className="text-zinc-400 text-sm font-light">Nu există niciun review raportat. Platforma este curată! ✨</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {reportedReviews?.map((review) => (
                                    <div key={review.id} className="border border-red-500/20 bg-red-500/5 rounded-xl p-5 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between gap-4 mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className="font-bold text-white">
                                                            {review.authorName}
                                                        </span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium uppercase tracking-wider border ${
                                                            review.reviewerType === 'USER' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                        }`}>
                                                            {review.reviewerType === 'USER' ? 'Client' : 'Locație'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-zinc-500 font-mono mb-2">ID: {review.authorPublicId}</p>
                                                    <div className="flex items-center gap-1 mb-3">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={12} className={i < review.rating ? 'text-[#C5A059] fill-[#C5A059]' : 'text-zinc-700'} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-zinc-300 bg-[#0a0a0b] p-3.5 rounded-xl border border-white/5 font-light italic">
                                                "{review.comment}"
                                            </p>
                                            <p className="text-[10px] text-zinc-500 mt-3 flex items-center gap-1.5">
                                                <Clock size={12} />
                                                Adăugat: {format(new Date(review.createdAt), 'd MMM yyyy, HH:mm', { locale: ro })} • Booking #{review.bookingId}
                                            </p>
                                        </div>
                                        <div className="flex gap-3 pt-4 border-t border-white/5 mt-4">
                                            <button
                                                onClick={() => deleteReview(review.id)}
                                                className="flex-1 flex items-center justify-center gap-1.5 bg-transparent border border-white/20 hover:bg-white/5 text-zinc-300 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                                            >
                                                <Trash2 size={14} /> Șterge Review
                                            </button>
                                            <button
                                                onClick={() => setBlockModal({ type: review.reviewerType, id: review.authorId, name: review.authorName })}
                                                className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                                            >
                                                <Ban size={14} /> Blochează Autorul
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- TAB: Conturi Blocate --- */}
                {activeTab === 'blocked' && (
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-8 animate-slide-up">
                        {blockedLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-[#C5A059]" size={28} />
                            </div>
                        ) : (
                            <>
                                {/* Users Blocked */}
                                <div>
                                    <h2 className="font-serif text-lg text-white mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
                                        <Users size={18} className="text-red-400" /> Utilizatori Blocați
                                    </h2>
                                    {blockedData?.blockedUsers?.length === 0 ? (
                                        <p className="text-zinc-500 text-sm font-light italic bg-white/5 p-4 rounded-xl border border-white/5">Nu există utilizatori blocați.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {blockedData?.blockedUsers?.map(u => (
                                                <div key={u.id} className="border border-red-500/20 rounded-xl p-4 flex justify-between items-center bg-[#121214]">
                                                    <div>
                                                        <p className="font-bold text-white text-sm">{u.firstName} {u.lastName}</p>
                                                        <p className="text-[10px] text-zinc-500 mt-1">{u.email}</p>
                                                        <p className="text-[10px] text-zinc-600 font-mono mt-0.5">ID: {u.publicId}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => unblockUser(u.id)}
                                                        className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-colors bg-transparent border border-emerald-500/30"
                                                        title="Deblochează utilizator"
                                                    >
                                                        <Unlock size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Locations Blocked */}
                                <div>
                                    <h2 className="font-serif text-lg text-white mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
                                        <MapPin size={18} className="text-red-400" /> Locații Blocate
                                    </h2>
                                    {blockedData?.blockedLocations?.length === 0 ? (
                                        <p className="text-zinc-500 text-sm font-light italic bg-white/5 p-4 rounded-xl border border-white/5">Nu există locații blocate.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {blockedData?.blockedLocations?.map(l => (
                                                <div key={l.id} className="border border-red-500/20 rounded-xl p-4 flex justify-between items-center bg-[#121214]">
                                                    <div>
                                                        <p className="font-bold text-white text-sm">{l.displayName}</p>
                                                        <p className="text-[10px] text-zinc-500 mt-1">Owner: {l.ownerEmail}</p>
                                                        <p className="text-[10px] text-zinc-600 font-mono mt-0.5">ID: {l.publicId}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => unblockLocation(l.id)}
                                                        className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-colors bg-transparent border border-emerald-500/30"
                                                        title="Deblochează locație"
                                                    >
                                                        <Unlock size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* --- TAB: ALERTE RATING (< 2.0) --- */}
                {activeTab === 'alerts' && (
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-8 animate-slide-up">
                        {(lowLocLoading || lowUsrLoading) ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-orange-400" size={28} />
                            </div>
                        ) : (
                            <>
                                {/* Secțiunea Locații */}
                                <div>
                                    <h2 className="font-serif text-lg text-white mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
                                        <MapPin size={18} className="text-orange-400" />
                                        Locații cu Rating Critic (&lt; 2.0)
                                    </h2>
                                    {!lowRatingLocations || lowRatingLocations.length === 0 ? (
                                        <p className="text-zinc-500 text-sm font-light italic bg-white/5 p-4 rounded-xl border border-white/5">Nicio locație cu rating critic momentan.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {lowRatingLocations.map(loc => (
                                                <div key={loc.id} className="border border-orange-500/20 rounded-xl p-4 flex flex-col justify-between bg-orange-500/5">
                                                    <div className="mb-4">
                                                        <p className="font-bold text-white text-sm mb-1">{loc.displayName}</p>
                                                        <div className="text-xs text-zinc-400 flex items-center gap-1.5 mb-1.5">
                                                            <Star size={12} className="text-orange-400 fill-orange-400"/> 
                                                            <span className="font-bold text-orange-400">{Number(loc.rating)?.toFixed(1) || '0.0'}</span>
                                                        </div>
                                                        <p className="text-[10px] text-zinc-500">Contact: {loc.ownerEmail}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => setBlockModal({ type: 'LOCATION', id: loc.id, name: loc.displayName })}
                                                        className="w-full text-xs px-3 py-2 bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
                                                    >
                                                        Blochează Preventiv
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Secțiunea Utilizatori */}
                                <div>
                                    <h2 className="font-serif text-lg text-white mb-4 flex items-center gap-2 border-b border-white/5 pb-3">
                                        <Users size={18} className="text-orange-400" />
                                        Utilizatori cu Rating Critic (&lt; 2.0)
                                    </h2>
                                    {!lowRatingUsers || lowRatingUsers.length === 0 ? (
                                        <p className="text-zinc-500 text-sm font-light italic bg-white/5 p-4 rounded-xl border border-white/5">Niciun utilizator cu rating critic momentan.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {lowRatingUsers.map(u => (
                                                <div key={u.id} className="border border-orange-500/20 rounded-xl p-4 flex flex-col justify-between bg-orange-500/5">
                                                    <div className="mb-4">
                                                        <p className="font-bold text-white text-sm mb-1">{u.firstName} {u.lastName}</p>
                                                        <div className="text-xs text-zinc-400 flex items-center gap-1.5 mb-1.5">
                                                            <Star size={12} className="text-orange-400 fill-orange-400"/> 
                                                            <span className="font-bold text-orange-400">{Number(u.rating)?.toFixed(1) || '0.0'}</span>
                                                        </div>
                                                        <p className="text-[10px] text-zinc-500">Contact: {u.email}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => setBlockModal({ type: 'USER', id: u.id, name: `${u.firstName} ${u.lastName}` })}
                                                        className="w-full text-xs px-3 py-2 bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
                                                    >
                                                        Blochează Preventiv
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* --- TAB: Audit Log --- */}
                {activeTab === 'audit' && (
                    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-slide-up">
                        <h2 className="font-serif text-lg text-white mb-6 border-b border-white/5 pb-4 flex items-center gap-2">
                            <Clock size={18} className="text-[#C5A059]" /> Jurnal Activitate Sistem
                        </h2>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                            {auditLogs?.map((log) => (
                                <div key={log.id} className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 border border-white/5 bg-[#121214] rounded-xl hover:border-white/10 transition-colors">
                                    <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-md font-mono font-medium w-fit whitespace-nowrap">
                                        {log.action}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-light text-zinc-300 mb-2">{log.details}</p>
                                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-zinc-500">
                                            <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">Admin: <span className="text-white font-mono">{log.adminPublicId}</span></span>
                                            <span>•</span>
                                            <span>{format(new Date(log.createdAt), 'd MMM yyyy, HH:mm:ss', { locale: ro })}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODAL RESPINGERE LOCAȚIE --- */}
            {rejectId && (
                <div className="fixed inset-0 bg-[#0a0a0b]/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in">
                    <div className="bg-[#121214] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="font-serif text-white mb-2 text-xl flex items-center gap-2">
                            <AlertTriangle size={20} className="text-red-400" /> Motiv Respingere
                        </h3>
                        <p className="text-xs text-zinc-400 font-light mb-5">Acest mesaj va fi trimis proprietarului pe email.</p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Explică detaliat motivul..."
                            rows={4}
                            className="w-full bg-[#0a0a0b] border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-400 resize-none mb-6"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => { setRejectId(null); setRejectReason(''); }} className="flex-1 border border-white/20 text-zinc-300 hover:bg-white/5 py-2.5 rounded-xl text-sm transition-colors">
                                Anulează
                            </button>
                            <button onClick={() => reject({ id: rejectId, reason: rejectReason })} disabled={!rejectReason.trim()} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors">
                                Respinge
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL BLOCARE CONT --- */}
            {blockModal && (
                <div className="fixed inset-0 bg-[#0a0a0b]/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-in fade-in">
                    <div className="bg-[#121214] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="font-serif text-white mb-3 text-xl flex items-center gap-2">
                            <Ban size={20} className="text-red-400" />
                            Blochează {blockModal.type === 'USER' ? 'Utilizator' : 'Locație'}
                        </h3>
                        <p className="text-sm font-light text-zinc-300 mb-5">
                            Ești sigur că vrei să blochezi contul <strong>{blockModal.name}</strong>? Acesta își va pierde complet accesul la platformă.
                        </p>
                        <label className="text-xs font-light text-zinc-400 mb-2 block uppercase tracking-wider">Motiv blocare (Intern)</label>
                        <textarea
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            placeholder="Ex: Încălcare termeni, fraudă..."
                            rows={3}
                            className="w-full bg-[#0a0a0b] border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-red-400 resize-none mb-6"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setBlockModal(null); setBlockReason(''); }}
                                className="flex-1 border border-white/20 text-zinc-300 hover:bg-white/5 py-2.5 rounded-xl text-sm transition-colors"
                            >
                                Anulează
                            </button>
                            <button
                                onClick={() => blockAccount({ type: blockModal.type, id: blockModal.id, reason: blockReason })}
                                disabled={!blockReason.trim() || blocking}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 flex justify-center items-center gap-2 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                            >
                                {blocking && <Loader2 size={16} className="animate-spin" />} Confirmă
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}