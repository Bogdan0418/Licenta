'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { LocationCard } from '@/components/search/LocationCard';
import { SearchFilters } from '@/components/search/SearchFilters';
import { Loader2, MapPin } from 'lucide-react';
import api from '@/lib/api';
import { LocationSummary } from '@/types';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const [filters, setFilters] = useState({
        type: searchParams.get('type') || '',
        searchTerm: searchParams.get('q') || '',
        radiusKm: '8',
        facilities: [] as string[],
    });
    
    const [userLocation, setUserLocation] = useState<{
        lat: number; lng: number
    } | null>(null);

    const { data: rawLocations, isLoading } = useQuery({
        queryKey: ['locations', filters.type, filters.searchTerm, filters.radiusKm, userLocation],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.type) params.set('type', filters.type);
            if (filters.searchTerm) params.set('searchTerm', filters.searchTerm);
            if (userLocation && filters.radiusKm) {
                params.set('lat', userLocation.lat.toString());
                params.set('lng', userLocation.lng.toString());
                params.set('radiusKm', filters.radiusKm);
            }
            const res = await api.get(`/api/locations/public/search?${params}`);
            return res.data as LocationSummary[];
        },
    });

    const locations = rawLocations?.filter(loc => {
        if (!filters.facilities || filters.facilities.length === 0) return true;
        if (!loc.facilities) return false;
        return filters.facilities.every(f => loc.facilities.includes(f));
    });

    const handleGetLocation = () => {
        if (userLocation) {
            setUserLocation(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
            }),
            () => alert('Nu am putut obține locația ta. Te rugăm să permiți accesul în browser.')
        );
    };

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-zinc-200">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-10 md:py-16">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Sidebar filtre */}
                    <aside className="w-full md:w-80 flex-shrink-0 z-10">
                        <SearchFilters
                            filters={filters}
                            onFiltersChange={setFilters}
                            onGetLocation={handleGetLocation}
                            hasLocation={!!userLocation}
                        />
                    </aside>

                    {/* Rezultate */}
                    <main className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                            <h1 className="text-2xl md:text-3xl font-serif text-white tracking-wide">
                                {isLoading ? 'Se caută...' :
                                    `${locations?.length || 0} locații găsite`}
                            </h1>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center items-center py-32">
                                <Loader2 className="animate-spin text-[#C5A059]" size={48} strokeWidth={1.5} />
                            </div>
                        ) : locations?.length === 0 ? (
                            <div className="text-center py-32 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                                <div className="border border-white/10 p-4 rounded-full inline-block mb-6 bg-black/50">
                                    <MapPin size={40} className="text-zinc-500" />
                                </div>
                                <p className="text-xl font-serif text-white mb-2">Nicio locație găsită</p>
                                <p className="text-sm font-light text-zinc-400 max-w-sm mx-auto">
                                    Încearcă să modifici filtrele, să renunți la câteva facilități sau să mărești raza de căutare.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {locations?.map((location) => (
                                    <LocationCard
                                        key={location.id}
                                        location={location}
                                    />
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}