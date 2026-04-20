'use client';

import { useState, useEffect } from 'react';
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
        radiusKm: '',
    });
    const [userLocation, setUserLocation] = useState<{
        lat: number; lng: number
    } | null>(null);

    const { data: locations, isLoading } = useQuery({
        queryKey: ['locations', filters, userLocation],
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

    const handleGetLocation = () => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
            }),
            () => alert('Nu am putut obține locația ta')
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex gap-8">

                    {/* Sidebar filtre */}
                    <aside className="w-72 flex-shrink-0">
                        <SearchFilters
                            filters={filters}
                            onFiltersChange={setFilters}
                            onGetLocation={handleGetLocation}
                            hasLocation={!!userLocation}
                        />
                    </aside>

                    {/* Rezultate */}
                    <main className="flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-xl font-semibold text-gray-800">
                                {isLoading ? 'Se caută...' :
                                    `${locations?.length || 0} locații găsite`}
                            </h1>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="animate-spin text-indigo-600" size={40} />
                            </div>
                        ) : locations?.length === 0 ? (
                            <div className="text-center py-20 text-gray-400">
                                <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                                <p className="text-lg">Nicio locație găsită</p>
                                <p className="text-sm mt-1">
                                    Încearcă să modifici filtrele
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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