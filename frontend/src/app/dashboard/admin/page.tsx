'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { useState } from 'react';
import { Check, X, Search, Shield, Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import api from '@/lib/api';
import { AdminLocation, AuditLog } from '@/types';
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

    const { data: pending, isLoading: pendingLoading } = useQuery({
        queryKey: ['pending-locations'],
        queryFn: async () => {
            const res = await api.get('/api/admin/locations/pending');
            return res.data as AdminLocation[];
        },
        enabled: !!user,
    });

    const { data: auditLogs } = useQuery({
        queryKey: ['audit-log'],
        queryFn: async () => {
            const res = await api.get('/api/admin/audit-log');
            return res.data as AuditLog[];
        },
        enabled: !!user,
    });

    const { mutate: approve, isPending: approving } = useMutation({
        mutationFn: async (id: number) =>
            api.post(`/api/admin/locations/${id}/approve`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-locations'] });
            queryClient.invalidateQueries({ queryKey: ['audit-log'] });
        },
    });

    const { mutate: reject } = useMutation({
        mutationFn: async ({ id, reason }: { id: number; reason: string }) =>
            api.post(`/api/admin/locations/${id}/reject`, { reason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-locations'] });
            queryClient.invalidateQueries({ queryKey: ['audit-log'] });
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
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
                        >
                            Caută
                        </button>
                    </div>

                    {searchError && (
                        <p className="text-red-500 text-sm mt-2">{searchError}</p>
                    )}

                    {searchResult && (
                        <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm">
                            <pre className="text-xs text-gray-600 overflow-auto">
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
                                : 'text-gray-500'
                        }`}
                    >
                        Locații PENDING ({pending?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('audit')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'audit'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500'
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
                                Nu există cereri în așteptare
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {pending?.map((loc) => (
                                    <div key={loc.id}
                                        className="border border-gray-100 rounded-xl p-5">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-gray-800">
                                                        {loc.displayName}
                                                    </span>
                                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
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
                                                    className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                                                >
                                                    <Check size={14} />
                                                    Aprobă
                                                </button>
                                                <button
                                                    onClick={() => setRejectId(loc.id)}
                                                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200"
                                                >
                                                    <X size={14} />
                                                    Respinge
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            Tip: {loc.type} • Adresă: {loc.address}
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
                                    className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                                    <div className="bg-indigo-100 text-indigo-600 text-xs px-2 py-1 rounded font-mono whitespace-nowrap">
                                        {log.action}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700">
                                            {log.details}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Admin {log.adminPublicId} •{' '}
                                            {format(new Date(log.createdAt),
                                                'd MMM yyyy HH:mm', { locale: ro })}
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full">
                        <h3 className="font-semibold text-gray-800 mb-4">
                            Motiv respingere
                        </h3>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Explică motivul respingerii..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setRejectId(null);
                                    setRejectReason('');
                                }}
                                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm"
                            >
                                Anulează
                            </button>
                            <button
                                onClick={() => reject({
                                    id: rejectId,
                                    reason: rejectReason
                                })}
                                disabled={!rejectReason.trim()}
                                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm"
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