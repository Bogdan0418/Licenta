'use client';

import { Navigation, Check } from 'lucide-react';
import { facilityLabels } from '@/lib/utils'; // Folosim label-urile tale din utils

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
        facilities: string[];
    };
    onFiltersChange: (filters: any) => void;
    onGetLocation: () => void;
    hasLocation: boolean;
}

export function SearchFilters({
    filters, onFiltersChange, onGetLocation, hasLocation
}: Props) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-6 sticky top-24">
            <h2 className="font-semibold text-gray-800">Filtre Căutare</h2>

            {/* Căutare text */}
            <div>
                <label className="text-sm font-medium text-gray-600 mb-1.5 block">
                    Caută după nume
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

            {/* Geolocație & Slider Distanță */}
            <div className="pt-4 border-t border-gray-100">
                <label className="text-sm font-medium text-gray-600 mb-2 block">
                    Locații în raza mea
                </label>
                <button
                    onClick={onGetLocation}
                    className={`w-full flex items-center justify-center gap-2 py-2 mb-4 rounded-lg text-sm border transition-all ${
                        hasLocation
                            ? 'bg-green-50 border-green-300 text-green-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 group'
                            : 'border-gray-200 text-gray-600 hover:border-indigo-300 bg-gray-50'
                    }`}
                >
                    <Navigation size={14} className={hasLocation ? 'text-green-600 group-hover:text-red-600 transition-colors' : 'text-gray-500'} />
                    {hasLocation ? (
                        <>
                            <span className="block group-hover:hidden">Locație activată ✓</span>
                            <span className="hidden group-hover:block">Dezactivează locația ✕</span>
                        </>
                    ) : (
                        'Folosește locația mea'
                    )}
                </button>

                {hasLocation && (
                    <div className="space-y-3 bg-indigo-50/50 p-3 rounded-lg border border-indigo-50">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-gray-500">Rază maximă:</span>
                            <span className="text-sm font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">
                                {filters.radiusKm || '8'} km
                            </span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="8"
                            step="0.5"
                            value={filters.radiusKm || 8}
                            onChange={(e) => onFiltersChange({
                                ...filters, radiusKm: e.target.value
                            })}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-medium px-1">
                            <span>1 km</span>
                            <span>8 km</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Checkbox-uri Facilități */}
            <div className="pt-4 border-t border-gray-100">
                <label className="text-sm font-medium text-gray-600 mb-3 block">
                    Facilități
                </label>
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {Object.entries(facilityLabels).map(([key, label]) => {
                        const isSelected = filters.facilities?.includes(key);
                        return (
                            <label key={key} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                                    isSelected 
                                        ? 'bg-indigo-600 border-indigo-600' 
                                        : 'bg-white border-gray-300 group-hover:border-indigo-400'
                                }`}>
                                    {isSelected && <Check size={12} className="text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isSelected}
                                    onChange={(e) => {
                                        const currentFacilities = filters.facilities || [];
                                        const newFacilities = e.target.checked 
                                            ? [...currentFacilities, key]
                                            : currentFacilities.filter((f: string) => f !== key);
                                        onFiltersChange({ ...filters, facilities: newFacilities });
                                    }}
                                />
                                <span className={`text-sm select-none ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                    {label as string}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Reset */}
            <button
                onClick={() => onFiltersChange({
                    type: '', searchTerm: '', radiusKm: '8', facilities: []
                })}
                className="w-full text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 py-2 border border-transparent hover:border-red-100 rounded-lg transition-colors mt-2"
            >
                Resetează toate filtrele
            </button>
        </div>
    );
}