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
    const [activeTab, setActiveTab] = useState<'directory' | 'pending' | 'audit' | 'reviews' | 'blocked'>('directory');

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

    /* --- MUTATIONS --- */
    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['pending-locations'] });
        queryClient.invalidateQueries({ queryKey: ['audit-log'] });
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        queryClient.invalidateQueries({ queryKey: ['reported-reviews'] });
        queryClient.invalidateQueries({ queryKey: ['blocked-accounts'] });
        queryClient.invalidateQueries({ queryKey: ['all-users'] });
        queryClient.invalidateQueries({ queryKey: ['all-locations'] });
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
                user.role !== 'ADMIN' && // <--- ADAUGĂ ACEASTĂ LINIE PENTRU A ASCUNDE ADMINUL
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

                {/* Header */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-full">
                        <Shield size={24} className="text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Dashboard Admin</h1>
                        <p className="text-gray-400 text-sm">Control tower Planify</p>
                    </div>
                </div>

                {/* Statistici */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-start gap-4 shadow-sm">
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <Users className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Total Utilizatori</p>
                            {statsLoading ? (
                                <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-bold text-gray-800">{stats?.totalUsers || 0}</h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        <span className="text-red-500 font-medium">{stats?.blockedUsers || 0}</span> blocate
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-start gap-4 shadow-sm">
                        <div className="bg-green-50 p-3 rounded-lg">
                            <MapPin className="text-green-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Locații Înregistrate</p>
                            {statsLoading ? (
                                <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-bold text-gray-800">{stats?.totalLocations || 0}</h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        <span className="text-green-600 font-medium">{stats?.verifiedLocations || 0} active</span> • <span className="text-yellow-600 font-medium">{stats?.pendingLocations || 0} pending</span>
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-start gap-4 shadow-sm">
                        <div className="bg-purple-50 p-3 rounded-lg">
                            <CalendarCheck className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Total Rezervări</p>
                            {statsLoading ? (
                                <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-bold text-gray-800">{stats?.totalBookings || 0}</h3>
                                    <p className="text-xs text-gray-400 mt-1">Procesate în platformă</p>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-start gap-4 shadow-sm">
                        <div className="bg-red-50 p-3 rounded-lg">
                            <AlertTriangle className="text-red-600" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Review-uri Raportate</p>
                            {statsLoading ? (
                                <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-bold text-gray-800">{stats?.reportedReviews || 0}</h3>
                                    <p className="text-xs text-gray-400 mt-1">Necesită moderare</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex flex-wrap gap-2 bg-gray-100 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('directory')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                            activeTab === 'directory' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Search size={16} /> Explorator
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'pending' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Locații PENDING ({pending?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('reviews')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                            activeTab === 'reviews' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Review-uri Raportate
                        {stats?.reportedReviews ? (
                            <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">{stats.reportedReviews}</span>
                        ) : null}
                    </button>
                    <button
                        onClick={() => setActiveTab('blocked')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                            activeTab === 'blocked' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Conturi Blocate
                        {blockedData && ((blockedData.blockedUsers?.length || 0) + (blockedData.blockedLocations?.length || 0) > 0) && (
                            <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">
                                {(blockedData.blockedUsers?.length || 0) + (blockedData.blockedLocations?.length || 0)}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'audit' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Audit Log
                    </button>
                </div>

                {/* --- TAB: EXPLORATOR (DIRECTORY) --- */}
                {activeTab === 'directory' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Caută orice (Nume, Email, CUI, ID, Telefon)</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input 
                                        type="text" 
                                        value={searchTerm} 
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Introdu textul căutat..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-64">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Filter size={14}/> Filtrează după tip</label>
                                <select 
                                    value={filterType} 
                                    onChange={(e) => setFilterType(e.target.value as any)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                                >
                                    <option value="ALL">Toate conturile</option>
                                    <option value="USER">Doar Clienți (Users)</option>
                                    <option value="LOCATION">Doar Locații</option>
                                </select>
                            </div>
                        </div>

                        {(usersLoading || locationsLoading) ? (
                            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                                            <th className="py-3 px-4 font-semibold whitespace-nowrap">Tip & ID</th>
                                            <th className="py-3 px-4 font-semibold whitespace-nowrap">Nume / Denumire</th>
                                            <th className="py-3 px-4 font-semibold whitespace-nowrap">Contact</th>
                                            <th className="py-3 px-4 font-semibold whitespace-nowrap">Status</th>
                                            <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">Acțiuni</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {filteredResults.length === 0 ? (
                                            <tr><td colSpan={5} className="py-8 text-center text-gray-500">Niciun rezultat găsit.</td></tr>
                                        ) : (
                                            filteredResults.map((item) => {
                                                const isUser = item.type === 'USER';
                                                const data = item.data;
                                                const isBlocked = data.status === 'BLOCKED';

                                                return (
                                                    <tr key={`${item.type}-${data.id}`} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="py-3 px-4">
                                                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-md ${isUser ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                                                {isUser ? 'Client' : 'Locație'}
                                                            </span>
                                                            <div className="text-xs text-gray-400 mt-1 font-mono">{data.publicId}</div>
                                                        </td>
                                                        <td className="py-3 px-4 font-medium text-gray-800">
                                                            {isUser ? `${data.firstName} ${data.lastName}` : data.displayName}
                                                            {!isUser && <div className="text-xs text-gray-500 font-normal mt-0.5">CUI: {data.cui}</div>}
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-600">
                                                            {isUser ? data.email : data.ownerEmail}
                                                            <div className="text-xs text-gray-400 mt-0.5">{isUser ? data.phone : data.contactPhone}</div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                isBlocked ? 'bg-red-100 text-red-700' : 
                                                                data.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                                            }`}>
                                                                {data.status}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            {isBlocked ? (
                                                                <button 
                                                                    onClick={() => isUser ? unblockUser(data.id) : unblockLocation(data.id)}
                                                                    className="inline-flex items-center gap-1 text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors border border-green-200"
                                                                >
                                                                    <Unlock size={14} /> Deblochează
                                                                </button>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => setBlockModal({ type: item.type, id: data.id, name: isUser ? `${data.firstName} ${data.lastName}` : data.displayName })}
                                                                    className="inline-flex items-center gap-1 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-200"
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

                {/* --- TAB: Review-uri Raportate --- */}
                {activeTab === 'reviews' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-red-500" />
                            Review-uri care necesită moderare
                        </h2>

                        {reviewsLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-indigo-400" size={24} />
                            </div>
                        ) : reportedReviews?.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">
                                Nu există niciun review raportat. Platforma este curată! ✨
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {reportedReviews?.map((review) => (
                                    <div key={review.id} className="border border-red-100 bg-red-50/20 rounded-xl p-5 shadow-sm">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-gray-800">
                                                        {review.authorName}
                                                    </span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                        review.reviewerType === 'USER' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                                    }`}>
                                                        {review.reviewerType === 'USER' ? 'Client' : 'Locație'} ({review.authorPublicId})
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 mb-2">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={14} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                                                    ))}
                                                </div>
                                                <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-red-50">
                                                    "{review.comment}"
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    Adăugat: {format(new Date(review.createdAt), 'd MMM yyyy, HH:mm', { locale: ro })} • Booking #{review.bookingId}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => deleteReview(review.id)}
                                                    className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                                >
                                                    <Trash2 size={14} className="text-gray-500" />
                                                    Șterge Review
                                                </button>
                                                <button
                                                    onClick={() => setBlockModal({ type: review.reviewerType, id: review.authorId, name: review.authorName })}
                                                    className="flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-colors"
                                                >
                                                    <Ban size={14} />
                                                    Blochează Autorul
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- TAB: Conturi Blocate --- */}
                {activeTab === 'blocked' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-8">
                        {blockedLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-indigo-400" size={24} />
                            </div>
                        ) : (
                            <>
                                <div>
                                    <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <Users size={18} className="text-red-500" />
                                        Utilizatori Blocați
                                    </h2>
                                    {blockedData?.blockedUsers?.length === 0 ? (
                                        <p className="text-gray-400 text-sm italic">Nu există utilizatori blocați.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {blockedData?.blockedUsers?.map(u => (
                                                <div key={u.id} className="border border-red-100 rounded-lg p-4 flex justify-between items-center bg-red-50/10">
                                                    <div>
                                                        <p className="font-medium text-gray-800">{u.firstName} {u.lastName}</p>
                                                        <p className="text-xs text-gray-500">{u.email} • {u.publicId}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => unblockUser(u.id)}
                                                        className="p-2 hover:bg-green-100 text-green-600 rounded-full transition-colors bg-white border border-green-200 shadow-sm"
                                                        title="Deblochează utilizator"
                                                    >
                                                        <Unlock size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                        <MapPin size={18} className="text-red-500" />
                                        Locații Blocate
                                    </h2>
                                    {blockedData?.blockedLocations?.length === 0 ? (
                                        <p className="text-gray-400 text-sm italic">Nu există locații blocate.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {blockedData?.blockedLocations?.map(l => (
                                                <div key={l.id} className="border border-red-100 rounded-lg p-4 flex justify-between items-center bg-red-50/10">
                                                    <div>
                                                        <p className="font-medium text-gray-800">{l.displayName}</p>
                                                        <p className="text-xs text-gray-500">Owner: {l.ownerEmail} • {l.publicId}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => unblockLocation(l.id)}
                                                        className="p-2 hover:bg-green-100 text-green-600 rounded-full transition-colors bg-white border border-green-200 shadow-sm"
                                                        title="Deblochează locație"
                                                    >
                                                        <Unlock size={18} />
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

                {/* TAB Locații PENDING */}
                {activeTab === 'pending' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="font-semibold text-gray-800 mb-4">Cereri de aprobare</h2>
                        {pendingLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-indigo-400" size={24} />
                            </div>
                        ) : pending?.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">Nu există cereri în așteptare. 🎉</p>
                        ) : (
                            <div className="space-y-4">
                                {pending?.map((loc) => (
                                    <div key={loc.id} className="border border-gray-100 hover:border-indigo-100 transition-colors rounded-xl p-5 shadow-sm">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-gray-800">{loc.displayName}</span>
                                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">{loc.publicId}</span>
                                                </div>
                                                <p className="text-xs text-gray-500">{loc.companyName} • CUI: {loc.cui}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{loc.legalAddress} • {loc.ownerEmail}</p>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <button onClick={() => approve(loc.id)} disabled={approving} className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                                                    {approving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                                    Aprobă
                                                </button>
                                                <button onClick={() => setRejectId(loc.id)} className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 transition-colors">
                                                    <X size={14} /> Respinge
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400">Tip: <span className="font-medium text-gray-600">{loc.type}</span> • Adresă: {loc.address}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB Audit Log */}
                {activeTab === 'audit' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Clock size={16} />Jurnal activitate</h2>
                        <div className="space-y-2">
                            {auditLogs?.map((log) => (
                                <div key={log.id} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded-lg">
                                    <div className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded font-mono whitespace-nowrap font-medium">{log.action}</div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700">{log.details}</p>
                                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                            <span>Admin: <span className="font-medium">{log.adminPublicId}</span></span><span>•</span>
                                            <span>{format(new Date(log.createdAt), 'd MMM yyyy, HH:mm', { locale: ro })}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Respingere Locație */}
            {rejectId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
                        <h3 className="font-semibold text-gray-800 mb-4 text-lg">Motiv respingere</h3>
                        <p className="text-sm text-gray-500 mb-4">Acest motiv va fi vizibil pentru proprietarul locației.</p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Explică detaliat motivul..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-5"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => { setRejectId(null); setRejectReason(''); }} className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2 rounded-lg text-sm font-medium transition-colors">
                                Anulează
                            </button>
                            <button onClick={() => reject({ id: rejectId, reason: rejectReason })} disabled={!rejectReason.trim()} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                                Respinge
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Blocare Cont */}
            {blockModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-red-100 p-2 rounded-full text-red-600">
                                <Ban size={20} />
                            </div>
                            <h3 className="font-semibold text-gray-800 text-lg">
                                Blochează {blockModal.type === 'USER' ? 'Utilizatorul' : 'Locația'}
                            </h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Ești sigur că vrei să blochezi contul pentru <strong>{blockModal.name}</strong>? Acesta își va pierde complet accesul la platformă.
                        </p>
                        <textarea
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            placeholder="Ex: Limbaj vulgar, fraudă..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-5"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setBlockModal(null); setBlockReason(''); }}
                                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Anulează
                            </button>
                            <button
                                onClick={() => blockAccount({ type: blockModal.type, id: blockModal.id, reason: blockReason })}
                                disabled={!blockReason.trim() || blocking}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 flex justify-center items-center gap-2 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                {blocking ? <Loader2 size={16} className="animate-spin" /> : 'Confirmă Blocarea'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}