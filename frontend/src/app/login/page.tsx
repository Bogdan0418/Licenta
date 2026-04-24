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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-md">

                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="bg-indigo-600 p-1.5 rounded-lg">
                        <MapPin size={20} className="text-white" />
                    </div>
                    <span className="text-2xl font-bold text-indigo-600">Planify</span>
                </div>

                <h1 className="text-xl font-semibold text-gray-800 mb-1">
                    Bine ai revenit!
                </h1>
                <p className="text-gray-400 text-sm mb-6">
                    Autentifică-te pentru a continua
                </p>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">
                            Email
                        </label>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="ion@example.ro"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    <div>
                        {/* Aici am adăugat flexbox pentru a pune "Parolă" în stânga și "Ai uitat parola?" în dreapta */}
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-medium text-gray-700 block">
                                Parolă
                            </label>
                            <Link href="/forgot-password" className="text-xs text-indigo-600 hover:underline">
                                Ai uitat parola?
                            </Link>
                        </div>
                        <input
                            {...register('password')}
                            type="password"
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                        {errors.password && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                        {isLoading && <Loader2 size={16} className="animate-spin" />}
                        Autentifică-te
                    </button>
                </form>

                <p className="text-center text-sm text-gray-400 mt-6">
                    Nu ai cont?{' '}
                    <Link href="/register"
                        className="text-indigo-600 hover:underline font-medium">
                        Înregistrează-te
                    </Link>
                </p>
            </div>
        </div>
    );
}