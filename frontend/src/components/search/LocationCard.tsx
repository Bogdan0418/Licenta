'use client';

import Link from 'next/link';
import { Star, MapPin, Navigation } from 'lucide-react';
import { LocationSummary } from '@/types';
import { FavoriteButton } from '@/components/ui/FavoriteButton';

const typeLabels: Record<string, string> = {
    RESTAURANT: 'Restaurant', BAR: 'Bar', CLUB: 'Club',
    WORK_HUB: 'Work Hub', GARDEN: 'Grădină', ROOFTOP: 'Rooftop',
    CAFE: 'Cafenea', PUB: 'Pub', LOUNGE: 'Lounge',
    BISTRO: 'Bistro', WINE_BAR: 'Wine Bar',
};

interface Props {
    location: LocationSummary;
}

export function LocationCard({ location }: Props) {
    return (
        <Link href={`/location/${location.id}`}>
            <div className="group bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:border-[#C5A059]/50 transition-all duration-500 cursor-pointer flex flex-col h-full relative">

                {/* Poza */}
                <div className="relative h-56 bg-[#0f0f11] flex items-center justify-center overflow-hidden">
                    
                    {/* --- BUTON FAVORITE ABSOLUT PESTE IMAGINE --- */}
                    <div className="absolute top-3 right-3 z-30">
                        <FavoriteButton locationPublicId={location.publicId} />
                    </div>

                    {location.firstPhotoUrl ? (
                        <img
                            src={`http://localhost:8080/${location.firstPhotoUrl.replace(/^\//, '')}`}
                            alt={location.displayName}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 opacity-30">
                            <MapPin size={40} className="text-zinc-500" />
                            <span className="text-xs font-serif text-zinc-500">Fără imagine</span>
                        </div>
                    )}
                    {/* Gradient overlay on image bottom for text contrast if needed */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-transparent to-transparent opacity-80 z-10"></div>
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col flex-1 relative z-20 -mt-8">
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-serif text-white text-xl leading-tight group-hover:text-[#C5A059] transition-colors drop-shadow-md">
                            {location.displayName}
                        </h3>
                        <span className="text-[10px] uppercase tracking-wider bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#C5A059] px-2.5 py-1 rounded-full whitespace-nowrap backdrop-blur-md">
                            {typeLabels[location.type] || location.type}
                        </span>
                    </div>

                    <p className="text-sm font-light text-zinc-400 mb-5 flex items-start gap-1.5 line-clamp-2 mt-2">
                        <MapPin size={16} className="shrink-0 text-zinc-500 mt-0.5" />
                        {location.address}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                        {/* Rating */}
                        <div className="flex items-center gap-1.5">
                            <Star
                                size={16}
                                className="text-[#C5A059] fill-[#C5A059]"
                            />
                            <span className="text-sm font-medium text-white">
                                {location.rating > 0
                                    ? location.rating.toFixed(1)
                                    : 'Nou'}
                            </span>
                            {location.ratingCount > 0 && (
                                <span className="text-xs font-light text-zinc-500">
                                    ({location.ratingCount})
                                </span>
                            )}
                        </div>

                        {/* Distanță */}
                        {location.distanceKm && (
                            <div className="flex items-center gap-1.5 text-xs font-light text-zinc-400 bg-white/5 px-2.5 py-1 rounded-md">
                                <Navigation size={12} className="text-[#C5A059]" />
                                {location.distanceKm} km
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}