import { Star, MapPin, Phone, Clock, Wifi, PawPrint, Car, Check } from 'lucide-react';
import { LocationDetail } from '@/types';
import { facilityLabels } from '@/lib/utils';

const facilityIcons: Record<string, any> = {
    WIFI: Wifi,
    PET_FRIENDLY: PawPrint,
    PARKING: Car,
};

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
                            // Căutăm un icon specific. Dacă nu găsim, folosim o bifă standard
                            const Icon = facilityIcons[f] || Check; 
                            
                            // Dacă există în facilityLabels, punem traducerea, altfel lăsăm textul custom
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

            {/* Program */}
            {location.schedule && Object.keys(location.schedule).length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <Clock size={14} />
                        Program
                    </h3>
                    <div className="grid grid-cols-2 gap-1">
                        {Object.entries(location.schedule).map(([day, hours]) => (
                            <div key={day} className="flex justify-between text-xs text-gray-600 py-0.5">
                                <span className="font-medium">
                                    {dayLabels[day] || day}
                                </span>
                                <span>{hours}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Contact */}
            {location.publicPhone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} />
                    {location.publicPhone}
                </div>
            )}
        </div>
    );
}