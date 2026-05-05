'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, Loader2, Star } from 'lucide-react';
import api from '@/lib/api';
import { LocationSummary } from '@/types'; // sau cum se numește tipul tău

export function HeroSearchBar() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedTerm, setDebouncedTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // DEBOUNCE: Așteptăm 300ms după ce utilizatorul se oprește din tastat
    // înainte să facem request-ul la backend, pentru a nu face spam de cereri.
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Query-ul către backend care aduce rezultatele "Live"
    const { data: results, isLoading } = useQuery({
        queryKey: ['live-search', debouncedTerm],
        queryFn: async () => {
            if (!debouncedTerm.trim()) return [];
            
            const res = await api.get(`/api/locations/public/search?searchTerm=${encodeURIComponent(debouncedTerm)}`);
            const allResults = res.data as LocationSummary[];

            // FILTRARE STRICTĂ: Păstrăm doar locațiile care conțin textul căutat direct în nume (displayName)
            return allResults.filter(loc => 
                (loc.displayName || '').toLowerCase().includes(debouncedTerm.toLowerCase())
            );
        },
        enabled: debouncedTerm.length > 0, // Se execută doar dacă avem text
    });

    // Închidem dropdown-ul dacă dăm click în afara lui
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Funcția care se execută când apeși pe butonul "Caută" sau dai Enter
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            setIsDropdownOpen(false);
            router.push(`/search?searchTerm=${encodeURIComponent(searchTerm)}`);
        }
    };

    // Funcția care se execută când dai click direct pe un rezultat din dropdown
    const handleSelectLocation = (locationId: number) => {
        setIsDropdownOpen(false);
        router.push(`/location/${locationId}`); // Mergem direct pe pagina locației
    };

    return (
        <div className="relative w-full max-w-3xl mx-auto" ref={dropdownRef}>
            {/* Formularul principal (Bara de căutare) */}
            <form 
                onSubmit={handleSearchSubmit}
                className="flex items-center bg-[#121214]/80 backdrop-blur-md border border-white/10 rounded-2xl p-2 shadow-2xl transition-all focus-within:border-[#C5A059]/50"
            >
                <div className="flex items-center flex-1 px-4">
                    <Search className="text-zinc-400 mr-3" size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setIsDropdownOpen(true); // Deschidem dropdown-ul când tastăm
                        }}
                        onFocus={() => {
                            if (searchTerm.length > 0) setIsDropdownOpen(true);
                        }}
                        placeholder="Ce cauți? (ex: Restaurant italian, rooftop bar...)"
                        className="w-full bg-transparent border-none outline-none text-white placeholder:text-zinc-500 py-2"
                        autoComplete="off"
                    />
                </div>
                <button 
                    type="submit"
                    className="bg-[#C5A059] hover:bg-[#b08d4a] text-black font-medium px-8 py-3 rounded-xl transition-colors"
                >
                    Caută
                </button>
            </form>

            {/* Dropdown-ul cu Rezultate */}
            {isDropdownOpen && searchTerm.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#121214] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    
                    {/* Stare de Încărcare */}
                    {isLoading && (
                        <div className="flex items-center justify-center p-6">
                            <Loader2 className="animate-spin text-[#C5A059]" size={24} />
                        </div>
                    )}

                    {/* Fără rezultate */}
                    {!isLoading && results?.length === 0 && (
                        <div className="p-6 text-center text-zinc-400 font-light text-sm">
                            Nu există această locație...
                        </div>
                    )}

                    {/* Lista de rezultate */}
                    {!isLoading && results && results.length > 0 && (
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {results.slice(0, 5).map((loc) => ( // Arătăm maxim 5 rezultate rapide
                                <div 
                                    key={loc.id}
                                    onClick={() => handleSelectLocation(loc.id)}
                                    className="flex items-center justify-between p-4 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-[#C5A059]/10 p-2 rounded-lg">
                                            <MapPin size={18} className="text-[#C5A059]" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium text-sm">{loc.displayName}</p>
                                            <p className="text-xs text-zinc-500 font-light capitalize">{loc.type?.toLowerCase() || 'Locație'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
                                        <Star size={12} className="text-[#C5A059] fill-[#C5A059]" />
                                        <span className="text-xs text-zinc-300 font-bold">{loc.rating?.toFixed(1) || '0.0'}</span>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Buton "Vezi toate rezultatele" dacă sunt mai multe */}
                            {results.length > 5 && (
                                <div 
                                    onClick={handleSearchSubmit}
                                    className="p-3 bg-[#C5A059]/5 hover:bg-[#C5A059]/10 text-center text-xs font-medium text-[#C5A059] cursor-pointer transition-colors"
                                >
                                    Vezi toate cele {results.length} rezultate
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}