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
        <nav className="bg-black/40 backdrop-blur-md border-b border-white/10 fixed w-full top-0 z-50 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">

                    {/* Logo Premium */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="border border-[#C5A059]/30 p-2 rounded-lg group-hover:border-[#C5A059] transition-colors">
                            <MapPin size={22} className="text-[#C5A059]" />
                        </div>
                        <span className="text-2xl font-serif text-white tracking-wide">
                            Planify<span className="text-[#C5A059]">.</span>
                        </span>
                    </Link>

                    {/* Navigație */}
                    <div className="flex items-center gap-6">
                        {user ? (
                            <>
                                <Link
                                    href={getDashboardLink() || '/'}
                                    className="flex items-center gap-2 text-sm font-light text-zinc-300 hover:text-white transition-colors"
                                >
                                    <span className="text-[#C5A059]">{getDashboardIcon()}</span>
                                    Dashboard
                                </Link>
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 text-sm font-light text-zinc-400 hover:text-red-400 transition-colors"
                                >
                                    <LogOut size={16} />
                                    Ieși
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-sm font-light text-zinc-300 hover:text-white transition-colors"
                                >
                                    Autentificare
                                </Link>
                                <Link
                                    href="/register"
                                    className="bg-transparent border border-[#C5A059] text-[#C5A059] text-sm font-light px-6 py-2.5 rounded-none hover:bg-[#C5A059] hover:text-black transition-all"
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