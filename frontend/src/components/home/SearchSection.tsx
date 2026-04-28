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
        <form onSubmit={handleSearch} className="flex gap-3 max-w-3xl mx-auto bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="flex-1 flex items-center px-4">
                <Search size={20} className="text-zinc-400 mr-3" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ce cauți? (ex: Restaurant italian, rooftop bar...)"
                    className="w-full bg-transparent text-white placeholder-zinc-500 font-light text-base focus:outline-none"
                />
            </div>
            <button
                type="submit"
                className="bg-[#C5A059] hover:bg-[#b08d4a] text-black px-8 py-3.5 rounded-xl flex items-center gap-2 font-medium transition-all duration-300"
            >
                Caută
            </button>
        </form>
    );
}