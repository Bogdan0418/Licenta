'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, User, Building2 } from 'lucide-react';
import { RegisterUserForm } from '@/components/auth/RegisterUserForm';
import { RegisterLocationForm } from '@/components/auth/RegisterLocationForm';

export default function RegisterPage() {
    const [tab, setTab] = useState<'user' | 'location'>('user');

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-lg">

                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="bg-indigo-600 p-1.5 rounded-lg">
                        <MapPin size={20} className="text-white" />
                    </div>
                    <span className="text-2xl font-bold text-indigo-600">Planify</span>
                </div>

                <h1 className="text-xl font-semibold text-gray-800 mb-6">
                    Creează un cont
                </h1>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setTab('user')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                            tab === 'user'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500'
                        }`}
                    >
                        <User size={16} />
                        Utilizator
                    </button>
                    <button
                        onClick={() => setTab('location')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                            tab === 'location'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-gray-500'
                        }`}
                    >
                        <Building2 size={16} />
                        Locație / Firmă
                    </button>
                </div>

                {tab === 'user' ? <RegisterUserForm /> : <RegisterLocationForm />}

                <p className="text-center text-sm text-gray-400 mt-6">
                    Ai deja cont?{' '}
                    <Link href="/login"
                        className="text-indigo-600 hover:underline font-medium">
                        Autentifică-te
                    </Link>
                </p>
            </div>
        </div>
    );
}