'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { useState } from 'react';
// Am adăugat noile iconițe pentru statistici
import { Check, X, Search, Shield, Loader2, Clock, Users, MapPin, CalendarCheck, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import api from '@/lib/api';
// Am adăugat AdminStatistics aici
import { AdminLocation, AuditLog, AdminStatistics } from '@/types';
import { useRequireAuth } from '@/hooks/useRequireAuth';

export default function AdminDashboardPage() {
    const { user, isLoading: authLoading } = useRequireAuth('ADMIN');
    const queryClient = useQueryClient();
    const [rejectId, setRejectId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [searchId, setSearchId] = useState('');
    const [searchResult, setSearchResult] = useState<any>(null);
    const [searchError, setSearchError] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'audit'>('pending');

    // Fetch pentru locații pending
    const { data: pending, isLoading: pendingLoading } = useQuery({
        queryKey: ['pending-locations'],
        queryFn: async () => {
            const res = await api.get('/api/admin/locations/pending');
            return res.data as AdminLocation[];
        },
        enabled: !!user,
    });

    // Fetch pentru audit log
    const { data: auditLogs } = useQuery({
        queryKey: ['audit-log'],
        queryFn: async () => {
            const res = await api.get('/api/admin/audit-log');
            return res.data as AuditLog[];
        },
        enabled: !!user,
    });

    // NOU: Fetch pentru statistici
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await api.get('/api/admin/statistics');
            return res.data as AdminStatistics;
        },
        enabled: !!user,
    });

    // Mutații pentru aprobare/respingere
    const { mutate: approve, isPending: approving } = useMutation({
        mutationFn: async (id: number) =>
            api.post(`/api/admin/locations/${id}/approve`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-locations'] });
            queryClient.invalidateQueries({ queryKey: ['audit-log'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] }); // Actualizăm și statisticile
        },
    });

    const { mutate: reject } = useMutation({
        mutationFn: async ({ id, reason }: { id: number; reason: string }) =>
            api.post(`/api/admin/locations/${id}/reject`, { reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-locations'] });
            queryClient.invalidateQueries({ queryKey: ['audit-log'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] }); // Actualizăm și statisticile
            setRejectId(null);
            setRejectReason('');
        },
    });

    const handleSearch = async () => {
        setSearchError('');
        setSearchResult(null);
        try {
            const res = await api.get(`/api/admin/accounts/${searchId.trim()}`);
            setSearchResult(res.data);
        } catch {
            setSearchError('Contul nu a fost găsit');
        }
    };

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
                        <h1 className="text-xl font-bold text-gray-800">
                            Dashboard Admin
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Control tower Planify
                        </p>
                    </div>
                </div>

                {/* --- SECTIUNE NOUA: STATISTICI --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card Utilizatori */}
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
                                        <span className="text-red-500 font-medium">{stats?.blockedUsers || 0}</span> conturi blocate
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Card Locații */}
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

                    {/* Card Rezervări */}
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

                    {/* Card Review-uri Raportate */}
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

                {/* Căutare conturi */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Search size={16} />
                        Caută cont după ID
                    </h2>
                    <div className="flex gap-2">
                        <input
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            placeholder="ex: C2 sau L1"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            onClick={handleSearch}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                        >
                            Caută
                        </button>
                    </div>

                    {searchError && (
                        <p className="text-red-500 text-sm mt-2">{searchError}</p>
                    )}

                    {searchResult && (
                        <div className="mt-4 bg-gray-50 border border-gray-100 rounded-lg p-4 text-sm">
                            <pre className="text-xs text-gray-600 overflow-auto max-h-64">
                                {JSON.stringify(searchResult, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'pending'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Locații PENDING ({pending?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'audit'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Audit Log
                    </button>
                </div>

                {/* Locații PENDING */}
                {activeTab === 'pending' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="font-semibold text-gray-800 mb-4">
                            Cereri de aprobare
                        </h2>

                        {pendingLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-indigo-400" size={24} />
                            </div>
                        ) : pending?.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-8">
                                Nu există cereri în așteptare. Totul este la zi! 🎉
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {pending?.map((loc) => (
                                    <div key={loc.id}
                                        className="border border-gray-100 hover:border-indigo-100 transition-colors rounded-xl p-5 shadow-sm">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-gray-800">
                                                        {loc.displayName}
                                                    </span>
                                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                                                        {loc.publicId}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {loc.companyName} • CUI: {loc.cui}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {loc.legalAddress} • {loc.ownerEmail}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => approve(loc.id)}
                                                    disabled={approving}
                                                    className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                                >
                                                    {approving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                                    Aprobă
                                                </button>
                                                <button
                                                    onClick={() => setRejectId(loc.id)}
                                                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 transition-colors"
                                                >
                                                    <X size={14} />
                                                    Respinge
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            Tip: <span className="font-medium text-gray-600">{loc.type}</span> • Adresă: {loc.address}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Audit Log */}
                {activeTab === 'audit' && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Clock size={16} />
                            Jurnal activitate
                        </h2>
                        <div className="space-y-2">
                            {auditLogs?.map((log) => (
                                <div key={log.id}
                                    className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded-lg">
                                    <div className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded font-mono whitespace-nowrap font-medium">
                                        {log.action}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700">
                                            {log.details}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                            <span>Admin: <span className="font-medium">{log.adminPublicId}</span></span>
                                            <span>•</span>
                                            <span>{format(new Date(log.createdAt), 'd MMM yyyy, HH:mm', { locale: ro })}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal respingere */}
            {rejectId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
                        <h3 className="font-semibold text-gray-800 mb-4 text-lg">
                            Motiv respingere
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Acest motiv va fi vizibil pentru proprietarul locației.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Explică detaliat motivul respingerii..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-5"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setRejectId(null);
                                    setRejectReason('');
                                }}
                                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Anulează
                            </button>
                            <button
                                onClick={() => reject({
                                    id: rejectId,
                                    reason: rejectReason
                                })}
                                disabled={!rejectReason.trim()}
                                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                                Respinge
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}