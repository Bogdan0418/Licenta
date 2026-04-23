import { Star, MapPin, Phone, Clock, Wifi, PawPrint, Car, Check } from 'lucide-react';
import { LocationDetail } from '@/types';
import { facilityLabels } from '@/lib/utils';

const facilityIcons: Record<string, any> = {
    WIFI: Wifi,
    PET_FRIENDLY: PawPrint,
    PARKING: Car,
};

// Array fix pentru a forța afișarea zilelor în ordinea corectă
const DAYS_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const dayLabels: Record<string, string> = {
    MON: 'Luni', TUE: 'Marți', WED: 'Miercuri',
    THU: 'Joi', FRI: 'Vineri', SAT: 'Sâmbătă', SUN: 'Duminică',
};

interface Props {
    location: LocationDetail;
}

export function LocationInfo({ location }: Props) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">

            {/* Titlu și rating */}
            <div>
                <div className="flex items-start justify-between gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-gray-800">
                        {location.displayName}
                    </h1>
                    <span className="bg-indigo-50 text-indigo-600 text-sm px-3 py-1 rounded-full whitespace-nowrap">
                        {location.type}
                    </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                        <span className="font-medium text-gray-700">
                            {location.rating > 0 ? location.rating.toFixed(1) : 'Nou'}
                        </span>
                        {location.ratingCount > 0 && (
                            <span>({location.ratingCount} recenzii)</span>
                        )}
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        {location.address}
                    </div>
                </div>
            </div>

            {/* Descriere */}
            {location.description && (
                <p className="text-gray-600 text-sm leading-relaxed">
                    {location.description}
                </p>
            )}

            {/* Facilități */}
            {location.facilities && location.facilities.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        Facilități disponibile
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {location.facilities.map((f) => {
                            const Icon = facilityIcons[f] || Check; 
                            const displayLabel = facilityLabels[f] || f; 

                            return (
                                <span
                                    key={f}
                                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border bg-gray-50 text-gray-700 border-gray-100"
                                >
                                    <Icon size={12} className="text-gray-500" />
                                    {displayLabel}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Programul pe fiecare Zonă */}
            {location.zones && location.zones.length > 0 && (
                <div className="border-t border-gray-100 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                        <Clock size={14} className="text-indigo-600" />
                        Program de funcționare pe zone
                    </h3>
                    
                    <div className="space-y-4">
                        {location.zones.map(zone => (
                            <div key={zone.id} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <h4 className="text-sm font-semibold text-gray-800 mb-3">{zone.name}</h4>
                                <div className="flex flex-col gap-y-2">
                                    {DAYS_ORDER.map((dayKey) => {
                                        // Citim valoarea din schedule. Dacă nu există, punem implicit 'Închis'
                                        const hours = zone.schedule?.[dayKey] || 'Închis';
                                        
                                        return (
                                            <div key={dayKey} className="flex justify-between text-sm py-1 border-b border-gray-200/50 last:border-0">
                                                <span className="text-gray-600 w-24">
                                                    {dayLabels[dayKey]}
                                                </span>
                                                <span className={`font-medium ${hours === 'Închis' ? 'text-red-500' : 'text-gray-800'}`}>
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
                <div className="flex items-center gap-2 text-sm text-gray-600 pt-4 border-t border-gray-100">
                    <Phone size={14} className="text-indigo-600" />
                    <span className="font-medium">Contact:</span> {location.publicPhone}
                </div>
            )}
        </div>
    );
}