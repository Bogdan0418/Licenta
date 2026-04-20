'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

const schema = z.object({
    firstName: z.string().min(2, 'Minim 2 caractere'),
    lastName: z.string().min(2, 'Minim 2 caractere'),
    username: z.string().min(3, 'Minim 3 caractere'),
    email: z.string().email('Email invalid'),
    phone: z.string().min(10, 'Telefon invalid'),
    cnp: z.string().length(13, 'CNP-ul trebuie să aibă 13 cifre'),
    password: z.string().min(8, 'Minim 8 caractere'),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: 'Parolele nu coincid',
    path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export function RegisterUserForm() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        setError('');
        try {
            const { confirmPassword, ...payload } = data;
            await api.post('/api/auth/register/user', payload);
            setSuccess('Cont creat cu succes! Te poți autentifica acum.');
            setTimeout(() => router.push('/login'), 2000);
        } catch (err: any) {
            setError(err.response?.data || 'Eroare la înregistrare');
        } finally {
            setIsLoading(false);
        }
    };

    const fields = [
        { name: 'firstName' as const, label: 'Prenume', placeholder: 'Ion' },
        { name: 'lastName' as const, label: 'Nume', placeholder: 'Popescu' },
        { name: 'username' as const, label: 'Username', placeholder: 'ion.popescu' },
        { name: 'email' as const, label: 'Email', placeholder: 'ion@example.ro', type: 'email' },
        { name: 'phone' as const, label: 'Telefon', placeholder: '07XXXXXXXX' },
        { name: 'cnp' as const, label: 'CNP', placeholder: '1YYMMDDXXXXX' },
        { name: 'password' as const, label: 'Parolă', placeholder: '••••••••', type: 'password' },
        { name: 'confirmPassword' as const, label: 'Confirmă parola', placeholder: '••••••••', type: 'password' },
    ];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-lg">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                {fields.slice(0, 2).map(({ name, label, placeholder }) => (
                    <div key={name}>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">
                            {label}
                        </label>
                        <input
                            {...register(name)}
                            placeholder={placeholder}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                        {errors[name] && (
                            <p className="text-red-500 text-xs mt-0.5">
                                {errors[name]?.message}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {fields.slice(2).map(({ name, label, placeholder, type = 'text' }) => (
                <div key={name}>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                        {label}
                    </label>
                    <input
                        {...register(name)}
                        type={type}
                        placeholder={placeholder}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    {errors[name] && (
                        <p className="text-red-500 text-xs mt-0.5">
                            {errors[name]?.message}
                        </p>
                    )}
                </div>
            ))}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 mt-2"
            >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                Creează cont
            </button>
        </form>
    );
}