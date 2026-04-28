'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

const schema = z.object({
    email: z.string().email('Email invalid'),
    password: z.string().min(1, 'Parola este obligatorie'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        setError('');
        try {
            const res = await api.post('/api/auth/login', data);
            login(res.data);

            // Redirecționare după rol
            if (res.data.role === 'USER') router.push('/dashboard/user');
            else if (res.data.role === 'LOCATION') router.push('/dashboard/location');
            else if (res.data.role === 'ADMIN') router.push('/dashboard/admin');
        } catch (err: any) {
            setError(err.response?.data || 'Email sau parolă incorectă');
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

            {/* Container Principal (Glassmorphism) */}
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
                    <h1 className="text-2xl font-serif text-white mb-2 tracking-wide">
                        Bine ai revenit
                    </h1>
                    <p className="text-zinc-400 text-sm font-light">
                        Autentifică-te pentru a continua
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm px-4 py-3 rounded-lg mb-6 backdrop-blur-md text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label className="text-sm font-light text-zinc-300 mb-2 block">
                            Email
                        </label>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="nume@exemplu.ro"
                            className="w-full bg-white/5 border border-white/10 text-white placeholder-zinc-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                        />
                        {errors.email && (
                            <p className="text-red-400 text-xs mt-1.5 ml-1">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-light text-zinc-300 block">
                                Parolă
                            </label>
                            <Link href="/forgot-password" className="text-xs text-[#C5A059] hover:text-white transition-colors">
                                Ai uitat parola?
                            </Link>
                        </div>
                        <input
                            {...register('password')}
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-white/5 border border-white/10 text-white placeholder-zinc-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                        />
                        {errors.password && (
                            <p className="text-red-400 text-xs mt-1.5 ml-1">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#C5A059] hover:bg-[#b08d4a] disabled:opacity-60 text-black py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 mt-2"
                    >
                        {isLoading && <Loader2 size={18} className="animate-spin" />}
                        Autentifică-te
                    </button>
                </form>

                <p className="text-center text-sm text-zinc-400 mt-8 font-light">
                    Nu ai cont?{' '}
                    <Link href="/register" className="text-[#C5A059] hover:text-white transition-colors font-medium">
                        Înregistrează-te
                    </Link>
                </p>
            </div>
        </div>
    );
}