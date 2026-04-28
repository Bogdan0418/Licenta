'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, MapPin } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!token) {
        return (
            <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center px-4">
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                    <h2 className="text-xl font-serif text-red-400 mb-2">Eroare</h2>
                    <p className="text-zinc-400 font-light mb-6">Link-ul de resetare este invalid sau lipsește.</p>
                    <Link href="/login" className="text-[#C5A059] hover:text-white transition-colors">
                        Înapoi la login
                    </Link>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Parolele nu coincid!');
            return;
        }
        if (password.length < 8) {
            setError('Parola trebuie să aibă minim 8 caractere.');
            return;
        }

        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            await api.post('/api/auth/reset-password', { token, newPassword: password });
            setMessage('Parola a fost schimbată cu succes! Te redirecționăm...');
            setTimeout(() => router.push('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data || 'A apărut o eroare la resetarea parolei. Link-ul poate fi expirat.');
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
                    <h1 className="text-2xl font-serif text-white mb-2 tracking-wide">Setează o nouă parolă</h1>
                    <p className="text-zinc-400 text-sm font-light">Asigură-te că introduci o parolă sigură.</p>
                </div>

                {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm px-4 py-3 rounded-lg mb-6 backdrop-blur-md text-center">{error}</div>}
                {message && <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 text-sm px-4 py-3 rounded-lg mb-6 backdrop-blur-md text-center">{message}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="text-sm font-light text-zinc-300 mb-2 block">Parola nouă</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white/5 border border-white/10 text-white placeholder-zinc-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-light text-zinc-300 mb-2 block">Confirmă parola nouă</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-white/5 border border-white/10 text-white placeholder-zinc-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full bg-[#C5A059] hover:bg-[#b08d4a] disabled:opacity-60 text-black py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 mt-2"
                    >
                        {isLoading && <Loader2 size={18} className="animate-spin" />}
                        Schimbă parola
                    </button>
                </form>
            </div>
        </div>
    );
}