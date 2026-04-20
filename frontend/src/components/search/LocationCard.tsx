'use client';

import Link from 'next/link';
import { Star, MapPin, Navigation } from 'lucide-react';
import { LocationSummary } from '@/types';

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
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer">

                {/* Poza */}
                <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    {location.firstPhotoUrl ? (
                        <img
                            src={`http://localhost:8080${location.firstPhotoUrl}`}
                            alt={location.displayName}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <MapPin size={40} className="text-indigo-300" />
                    )}
                </div>

                {/* Info */}
                <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800 text-base leading-tight">
                            {location.displayName}
                        </h3>
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                            {typeLabels[location.type] || location.type}
                        </span>
                    </div>

                    <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                        <MapPin size={12} />
                        {location.address}
                    </p>

                    <div className="flex items-center justify-between">
                        {/* Rating */}
                        <div className="flex items-center gap-1">
                            <Star
                                size={14}
                                className="text-yellow-400 fill-yellow-400"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                {location.rating > 0
                                    ? location.rating.toFixed(1)
                                    : 'Nou'}
                            </span>
                            {location.ratingCount > 0 && (
                                <span className="text-xs text-gray-400">
                                    ({location.ratingCount})
                                </span>
                            )}
                        </div>

                        {/* Distanță */}
                        {location.distanceKm && (
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Navigation size={12} />
                                {location.distanceKm} km
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}