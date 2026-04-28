'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, MapPin } from 'lucide-react';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/api/auth/forgot-password', { email });
            setMessage('Dacă email-ul există în sistem, vei primi un link de resetare.');
        } catch (err) {
            setMessage('A apărut o eroare. Încearcă din nou.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
            {/* Background Cinematic */}
            <div 
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1920&auto=format&fit=crop")' }}
            />
            {/* Overlay întunecat cu blur subtil */}
            <div className="absolute inset-0 z-0 bg-[#0a0a0b]/85 backdrop-blur-sm" />

            <div className="relative z-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 sm:p-10 w-full max-w-md shadow-2xl animate-slide-up">
                
                {/* Logo Premium */}
                <Link href="/" className="flex items-center justify-center gap-3 mb-10 group w-fit mx-auto">
                    <div className="border border-[#C5A059]/30 p-2 rounded-lg group-hover:border-[#C5A059] transition-colors">
                        <MapPin size={22} className="text-[#C5A059]" />
                    </div>
                    <span className="text-3xl font-serif text-white tracking-wide">
                        Planify<span className="text-[#C5A059]">.</span>
                    </span>
                </Link>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-serif text-white mb-2 tracking-wide">Recuperare parolă</h1>
                    <p className="text-zinc-400 text-sm font-light">Introdu email-ul contului tău pentru a primi un link de resetare.</p>
                </div>

                {message && (
                    <div className={`text-sm px-4 py-3 rounded-lg mb-6 backdrop-blur-md text-center ${message.includes('eroare') ? 'bg-red-500/10 border border-red-500/50 text-red-400' : 'bg-[#C5A059]/10 border border-[#C5A059]/50 text-[#C5A059]'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="text-sm font-light text-zinc-300 mb-2 block">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nume@exemplu.ro"
                            className="w-full bg-white/5 border border-white/10 text-white placeholder-zinc-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading || !email} 
                        className="w-full bg-[#C5A059] hover:bg-[#b08d4a] disabled:opacity-60 text-black py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 mt-2"
                    >
                        {isLoading && <Loader2 size={18} className="animate-spin" />}
                        Trimite link-ul
                    </button>
                </form>

                <p className="text-center text-sm text-zinc-400 mt-8 font-light">
                    <Link href="/login" className="text-[#C5A059] hover:text-white transition-colors font-medium">
                        Înapoi la autentificare
                    </Link>
                </p>
            </div>
        </div>
    );
}