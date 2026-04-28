import { Star, MapPin, Phone, Clock, Wifi, PawPrint, Car, Check } from 'lucide-react';
import { LocationDetail } from '@/types';
import { facilityLabels } from '@/lib/utils';

const facilityIcons: Record<string, any> = {
    WIFI: Wifi,
    PET_FRIENDLY: PawPrint,
    PARKING: Car,
};

const DAYS_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const dayLabels: Record<string, string> = {
    MON: 'Luni', TUE: 'Marți', WED: 'Miercuri',
    THU: 'Joi', FRI: 'Vineri', SAT: 'Sâmbătă', SUN: 'Duminică',
};

interface Props {
    location: LocationDetail;
}

export function LocationInfo({ location }: Props) {
    const googleMapsLink = (location as any).latitude && (location as any).longitude
        ? `http://maps.google.com/?q=${(location as any).latitude},${(location as any).longitude}`
        : `http://maps.google.com/?q=${encodeURIComponent(location.address)}`;

    return (
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sm:p-8 space-y-8">

            {/* Titlu și rating */}
            <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                    <h1 className="text-3xl font-serif text-white tracking-wide">
                        {location.displayName}
                    </h1>
                    <span className="bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-md whitespace-nowrap">
                        {location.type}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400 font-light">
                    <div className="flex items-center gap-1.5">
                        <Star size={16} className="text-[#C5A059] fill-[#C5A059]" />
                        <span className="font-medium text-white">
                            {location.rating > 0 ? location.rating.toFixed(1) : 'Nou'}
                        </span>
                        {location.ratingCount > 0 && (
                            <span className="text-zinc-500">({location.ratingCount} recenzii)</span>
                        )}
                    </div>
                    <span className="text-white/20">•</span>
                    <a 
                        href={googleMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-[#C5A059] transition-colors cursor-pointer group"
                        title="Deschide locația în Google Maps"
                    >
                        <MapPin size={16} className="text-zinc-500 group-hover:text-[#C5A059] transition-colors" />
                        <span className="underline decoration-dashed decoration-white/30 underline-offset-4">{location.address}</span>
                    </a>
                </div>
            </div>

            {/* Descriere */}
            {location.description && (
                <div className="border-y border-white/5 py-6">
                    <p className="text-zinc-300 text-sm leading-relaxed font-light whitespace-pre-wrap">
                        {location.description}
                    </p>
                </div>
            )}

            {/* Facilități */}
            {location.facilities && location.facilities.length > 0 && (
                <div>
                    <h3 className="text-xs font-serif text-[#C5A059] uppercase tracking-widest mb-4">
                        Facilități disponibile
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                        {location.facilities.map((f) => {
                            const Icon = facilityIcons[f] || Check; 
                            const displayLabel = facilityLabels[f] || f; 

                            return (
                                <span
                                    key={f}
                                    className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-lg bg-white/5 text-zinc-300 border border-white/10"
                                >
                                    <Icon size={14} className="text-zinc-500" />
                                    {displayLabel}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Programul pe fiecare Zonă */}
            {location.zones && location.zones.length > 0 && (
                <div className="pt-2">
                    <h3 className="text-xs font-serif text-[#C5A059] uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Clock size={16} /> Program de funcționare
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {location.zones.map(zone => (
                            <div key={zone.id} className="bg-[#121214] p-5 rounded-xl border border-white/5">
                                <h4 className="text-sm font-bold text-white mb-4 border-b border-white/5 pb-2">{zone.name}</h4>
                                <div className="flex flex-col gap-y-1.5">
                                    {DAYS_ORDER.map((dayKey) => {
                                        const hours = zone.schedule?.[dayKey] || 'Închis';
                                        const isClosed = hours === 'Închis';
                                        
                                        return (
                                            <div key={dayKey} className="flex justify-between text-xs py-1 text-zinc-400">
                                                <span className="font-light w-24">
                                                    {dayLabels[dayKey]}
                                                </span>
                                                <span className={`font-medium ${isClosed ? 'text-red-400/80' : 'text-zinc-200'}`}>
                                                    {hours}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Contact */}
            {location.publicPhone && (
                <div className="flex items-center gap-3 text-sm text-zinc-300 pt-6 border-t border-white/5">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/10">
                        <Phone size={16} className="text-[#C5A059]" />
                    </div>
                    <span className="font-light tracking-wide">{location.publicPhone}</span>
                </div>
            )}
        </div>
    );
}