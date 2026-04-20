'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { MapPin, LogOut, User, Building2, Shield } from 'lucide-react';

export function Navbar() {
    const { user, logout } = useAuth();

    const getDashboardLink = () => {
        if (!user) return null;
        if (user.role === 'USER') return '/dashboard/user';
        if (user.role === 'LOCATION') return '/dashboard/location';
        if (user.role === 'ADMIN') return '/dashboard/admin';
        return null;
    };

    const getDashboardIcon = () => {
        if (user?.role === 'USER') return <User size={16} />;
        if (user?.role === 'LOCATION') return <Building2 size={16} />;
        if (user?.role === 'ADMIN') return <Shield size={16} />;
        return null;
    };

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <MapPin size={20} className="text-white" />
                        </div>
                        <span className="text-xl font-bold text-indigo-600">
                            Planify
                        </span>
                    </Link>

                    {/* Navigație */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <Link
                                    href={getDashboardLink() || '/'}
                                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                                >
                                    {getDashboardIcon()}
                                    Dashboard
                                </Link>
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-500 transition-colors"
                                >
                                    <LogOut size={16} />
                                    Ieși
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-sm text-gray-600 hover:text-indigo-600 transition-colors"
                                >
                                    Autentificare
                                </Link>
                                <Link
                                    href="/register"
                                    className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Înregistrare
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}