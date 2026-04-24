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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-md">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="bg-indigo-600 p-1.5 rounded-lg">
                        <MapPin size={20} className="text-white" />
                    </div>
                    <span className="text-2xl font-bold text-indigo-600">Planify</span>
                </div>

                <h1 className="text-xl font-semibold text-gray-800 mb-1">Recuperare parolă</h1>
                <p className="text-gray-400 text-sm mb-6">Introdu email-ul contului tău pentru a primi un link de resetare.</p>

                {message && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-3 rounded-lg mb-4">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ion@example.ro"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                    </div>
                    <button type="submit" disabled={isLoading || !email} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2">
                        {isLoading && <Loader2 size={16} className="animate-spin" />}
                        Trimite link-ul
                    </button>
                </form>

                <p className="text-center text-sm mt-6">
                    <Link href="/login" className="text-indigo-600 hover:underline font-medium">Înapoi la autentificare</Link>
                </p>
            </div>
        </div>
    );
}