'use client';

import { MapPin, Navigation } from 'lucide-react';

const locationTypes = [
    { value: '', label: 'Toate tipurile' },
    { value: 'RESTAURANT', label: 'Restaurant' },
    { value: 'BAR', label: 'Bar' },
    { value: 'CLUB', label: 'Club' },
    { value: 'CAFE', label: 'Cafenea' },
    { value: 'WORK_HUB', label: 'Work Hub' },
    { value: 'GARDEN', label: 'Grădină' },
    { value: 'ROOFTOP', label: 'Rooftop' },
    { value: 'PUB', label: 'Pub' },
    { value: 'LOUNGE', label: 'Lounge' },
];

interface Props {
    filters: {
        type: string;
        searchTerm: string;
        radiusKm: string;
    };
    onFiltersChange: (filters: any) => void;
    onGetLocation: () => void;
    hasLocation: boolean;
}

export function SearchFilters({
    filters, onFiltersChange, onGetLocation, hasLocation
}: Props) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
            <h2 className="font-semibold text-gray-800">Filtre</h2>

            {/* Căutare text */}
            <div>
                <label className="text-sm font-medium text-gray-600 mb-1.5 block">
                    Caută
                </label>
                <input
                    type="text"
                    value={filters.searchTerm}
                    onChange={(e) => onFiltersChange({
                        ...filters, searchTerm: e.target.value
                    })}
                    placeholder="Nume locație..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
            </div>

            {/* Tip locație */}
            <div>
                <label className="text-sm font-medium text-gray-600 mb-1.5 block">
                    Tip locație
                </label>
                <select
                    value={filters.type}
                    onChange={(e) => onFiltersChange({
                        ...filters, type: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                    {locationTypes.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>

            {/* Geolocație */}
            <div>
                <label className="text-sm font-medium text-gray-600 mb-1.5 block">
                    Locații în raza mea
                </label>
                <button
                    onClick={onGetLocation}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm border transition-colors ${
                        hasLocation
                            ? 'bg-green-50 border-green-300 text-green-700'
                            : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                    }`}
                >
                    <Navigation size={14} />
                    {hasLocation ? 'Locație activată ✓' : 'Folosește locația mea'}
                </button>

                {hasLocation && (
                    <div className="mt-2">
                        <select
                            value={filters.radiusKm}
                            onChange={(e) => onFiltersChange({
                                ...filters, radiusKm: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        >
                            <option value="">Selectează raza</option>
                            <option value="2">2 km</option>
                            <option value="5">5 km</option>
                            <option value="10">10 km</option>
                            <option value="20">20 km</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Reset */}
            <button
                onClick={() => onFiltersChange({
                    type: '', searchTerm: '', radiusKm: ''
                })}
                className="w-full text-sm text-gray-400 hover:text-gray-600 py-1"
            >
                Resetează filtrele
            </button>
        </div>
    );
}