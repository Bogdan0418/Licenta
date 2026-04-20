'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export function SearchSection() {
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (searchTerm) params.set('q', searchTerm);
        router.push(`/search?${params.toString()}`);
    };

    return (
        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Caută restaurante, baruri, cluburi..."
                className="flex-1 px-5 py-3 rounded-xl text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium"
            >
                <Search size={18} />
                Caută
            </button>
        </form>
    );
}