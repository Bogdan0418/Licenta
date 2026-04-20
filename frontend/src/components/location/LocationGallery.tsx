'use client';

import { useState } from 'react';
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
    photos: string[];
    name: string;
}

export function LocationGallery({ photos, name }: Props) {
    const [current, setCurrent] = useState(0);

    if (!photos || photos.length === 0) {
        return (
            <div className="h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                <MapPin size={48} className="text-indigo-300" />
            </div>
        );
    }

    return (
        <div className="relative h-72 rounded-xl overflow-hidden bg-gray-200">
            <img
                src={`http://localhost:8080${photos[current]}`}
                alt={name}
                className="w-full h-full object-cover"
            />

            {photos.length > 1 && (
                <>
                    <button
                        onClick={() => setCurrent(p => Math.max(0, p - 1))}
                        disabled={current === 0}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full disabled:opacity-30"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <button
                        onClick={() => setCurrent(p => Math.min(photos.length - 1, p + 1))}
                        disabled={current === photos.length - 1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full disabled:opacity-30"
                    >
                        <ChevronRight size={18} />
                    </button>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {photos.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                    i === current ? 'bg-white' : 'bg-white/50'
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}