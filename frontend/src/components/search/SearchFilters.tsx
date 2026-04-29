'use client';

import { Navigation, Check } from 'lucide-react';
import { facilityLabels } from '@/lib/utils'; 

// --- LISTA ACTUALIZATĂ CU TOATE TIPURILE ---
const locationTypes = [
    { value: '', label: 'Toate tipurile' },
    { value: 'RESTAURANT', label: 'Restaurant' },
    { value: 'BAR', label: 'Bar' },
    { value: 'CLUB', label: 'Club' },
    { value: 'WORK_HUB', label: 'Work Hub' },
    { value: 'GARDEN', label: 'Grădină' },
    { value: 'ROOFTOP', label: 'Rooftop' },
    { value: 'CAFE', label: 'Cafenea' },
    { value: 'BISTRO', label: 'Bistro' },
    { value: 'TEA_HOUSE', label: 'Ceainărie' },
    { value: 'PUB', label: 'Pub' },
    { value: 'LOUNGE', label: 'Lounge' },
    { value: 'WINE_BAR', label: 'Wine Bar' },
    { value: 'SPEAKEASY', label: 'Speakeasy' },
    { value: 'PIZZERIA', label: 'Pizzerie' },
    { value: 'FAST_FOOD', label: 'Fast Food' },
    { value: 'DINER', label: 'Diner' },
    { value: 'EVENT_VENUE', label: 'Spațiu Evenimente' },
    { value: 'FOOD_HALL', label: 'Food Hall' },
    { value: 'EVENT_HALL', label: 'Sală de evenimente' },
    { value: 'CONFERENCE_CENTER', label: 'Centru de conferințe' },
    { value: 'WAREHOUSE', label: 'Hală' }
];

interface Props {
    filters: {
        type: string;
        searchTerm: string;
        radiusKm: string;
        facilities: string[];
        allowsEvents: boolean;
    };
    onFiltersChange: (filters: any) => void;
    onGetLocation: () => void;
    hasLocation: boolean;
}

export function SearchFilters({
    filters, onFiltersChange, onGetLocation, hasLocation
}: Props) {
    return (
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-8 sticky top-28 shadow-2xl">
            <h2 className="font-serif text-xl text-white tracking-wide flex items-center gap-3">
                Filtre Căutare
                <div className="h-px bg-white/10 flex-1"></div>
            </h2>

            {/* Căutare text */}
            <div>
                <label className="text-xs font-light text-zinc-400 mb-2 block uppercase tracking-wider">
                    Caută după nume
                </label>
                <input
                    type="text"
                    value={filters.searchTerm}
                    onChange={(e) => onFiltersChange({
                        ...filters, searchTerm: e.target.value
                    })}
                    placeholder="Ex: The Grand Lounge..."
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-zinc-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                />
            </div>

            {/* Tip locație */}
            <div>
                <label className="text-xs font-light text-zinc-400 mb-2 block uppercase tracking-wider">
                    Tip locație
                </label>
                <select
                    value={filters.type}
                    onChange={(e) => onFiltersChange({
                        ...filters, type: e.target.value
                    })}
                    className="w-full bg-[#0a0a0b] border border-white/10 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all appearance-none"
                >
                    {locationTypes.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>

            {/* Filtru Evenimente (Toggle) */}
            <div className="pt-6 border-t border-white/5">
                <label className="flex items-center gap-4 cursor-pointer group">
                    <div className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${filters.allowsEvents ? 'bg-[#C5A059]' : 'bg-white/10 group-hover:bg-white/20'}`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm ${filters.allowsEvents ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <input
                        type="checkbox"
                        className="hidden"
                        checked={filters.allowsEvents}
                        onChange={(e) => onFiltersChange({ ...filters, allowsEvents: e.target.checked })}
                    />
                    <div className="flex flex-col">
                        <span className={`text-sm font-medium transition-colors ${filters.allowsEvents ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                            Organizare evenimente
                        </span>
                        <span className="text-[10px] text-zinc-500 font-light">Doar locații care găzduiesc evenimente</span>
                    </div>
                </label>
            </div>

            {/* Geolocație & Slider Distanță */}
            <div className="pt-6 border-t border-white/5">
                <label className="text-xs font-light text-zinc-400 mb-3 block uppercase tracking-wider">
                    Locații în raza mea
                </label>
                <button
                    onClick={onGetLocation}
                    className={`w-full flex items-center justify-center gap-2 py-3 mb-5 rounded-xl text-sm font-medium transition-all duration-300 border ${
                        hasLocation
                            ? 'bg-[#C5A059]/10 border-[#C5A059]/50 text-[#C5A059] hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 group'
                            : 'border-white/10 text-zinc-400 hover:border-[#C5A059]/50 hover:text-white bg-white/5'
                    }`}
                >
                    <Navigation size={16} className={hasLocation ? 'text-[#C5A059] group-hover:text-red-400 transition-colors' : 'text-zinc-500'} />
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
                    <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-light text-zinc-400">Rază maximă:</span>
                            <span className="text-sm font-medium text-[#C5A059] bg-[#C5A059]/10 border border-[#C5A059]/20 px-2.5 py-1 rounded-md">
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
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#C5A059]"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-500 font-medium px-1">
                            <span>1 km</span>
                            <span>8 km</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Checkbox-uri Facilități */}
            <div className="pt-6 border-t border-white/5">
                <label className="text-xs font-light text-zinc-400 mb-4 block uppercase tracking-wider">
                    Facilități
                </label>
                <div className="space-y-3.5 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                    {Object.entries(facilityLabels).map(([key, label]) => {
                        const isSelected = filters.facilities?.includes(key);
                        return (
                            <label key={key} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                                    isSelected 
                                        ? 'bg-[#C5A059] border-[#C5A059]' 
                                        : 'bg-transparent border-white/20 group-hover:border-[#C5A059]/70'
                                }`}>
                                    {isSelected && <Check size={12} className="text-black stroke-[3]" />}
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
                                <span className={`text-sm select-none font-light transition-colors ${isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
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
                    type: '', searchTerm: '', radiusKm: '8', facilities: [], allowsEvents: false
                })}
                className="w-full text-sm font-light text-red-400 hover:text-red-300 hover:bg-red-500/10 py-3 border border-transparent hover:border-red-500/20 rounded-xl transition-all mt-2"
            >
                Resetează toate filtrele
            </button>
        </div>
    );
}