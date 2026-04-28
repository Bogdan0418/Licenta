'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, User, Building2 } from 'lucide-react';
import { RegisterUserForm } from '@/components/auth/RegisterUserForm';
import { RegisterLocationForm } from '@/components/auth/RegisterLocationForm';

export default function RegisterPage() {
    const [tab, setTab] = useState<'user' | 'location'>('user');

    return (
        <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden">
            {/* Background Cinematic */}
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center fixed"
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1920&auto=format&fit=crop")' }}
            />
            {/* Overlay întunecat cu blur subtil */}
            <div className="absolute inset-0 z-0 bg-[#0a0a0b]/85 backdrop-blur-sm fixed" />

            {/* Container Principal (Glassmorphism) - Mai lat pentru formulare mai mari */}
            <div className="relative z-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-10 w-full max-w-xl shadow-2xl animate-slide-up my-auto">
                
                {/* Logo Premium */}
                <Link href="/" className="flex items-center justify-center gap-3 mb-8 group w-fit mx-auto">
                    <div className="border border-[#C5A059]/30 p-2 rounded-lg group-hover:border-[#C5A059] transition-colors">
                        <MapPin size={22} className="text-[#C5A059]" />
                    </div>
                    <span className="text-3xl font-serif text-white tracking-wide">
                        Planify<span className="text-[#C5A059]">.</span>
                    </span>
                </Link>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-serif text-white mb-2 tracking-wide">
                        Creează un cont
                    </h1>
                    <p className="text-zinc-400 text-sm font-light">
                        Alătură-te comunității și descoperă orașul
                    </p>
                </div>

                {/* Tabs Premium */}
                <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-xl border border-white/10">
                    <button
                        onClick={() => setTab('user')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                            tab === 'user'
                                ? 'bg-[#C5A059] text-black shadow-lg'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <User size={16} />
                        Utilizator
                    </button>
                    <button
                        onClick={() => setTab('location')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                            tab === 'location'
                                ? 'bg-[#C5A059] text-black shadow-lg'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <Building2 size={16} />
                        Locație / Firmă
                    </button>
                </div>

                {/* Container pentru formulare cu înălțime fluidă */}
                <div className="transition-all duration-300">
                    {tab === 'user' ? <RegisterUserForm /> : <RegisterLocationForm />}
                </div>

                <p className="text-center text-sm text-zinc-400 mt-8 font-light border-t border-white/10 pt-6">
                    Ai deja cont?{' '}
                    <Link href="/login" className="text-[#C5A059] hover:text-white transition-colors font-medium">
                        Autentifică-te
                    </Link>
                </p>
            </div>
        </div>
    );
}