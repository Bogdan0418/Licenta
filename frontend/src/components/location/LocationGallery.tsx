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
        <div className="flex flex-col gap-3">
            {/* Imaginea Principală */}
            <div className="relative h-72 sm:h-96 rounded-xl overflow-hidden bg-gray-200">
                <img
                    src={`http://localhost:8080${photos[current]}`}
                    alt={name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                />

                {photos.length > 1 && (
                    <>
                        <button
                            onClick={() => setCurrent(p => Math.max(0, p - 1))}
                            disabled={current === 0}
                            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full disabled:opacity-30 hover:bg-white transition-all shadow-sm"
                        >
                            <ChevronLeft size={20} className="text-gray-800" />
                        </button>
                        <button
                            onClick={() => setCurrent(p => Math.min(photos.length - 1, p + 1))}
                            disabled={current === photos.length - 1}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full disabled:opacity-30 hover:bg-white transition-all shadow-sm"
                        >
                            <ChevronRight size={20} className="text-gray-800" />
                        </button>
                    </>
                )}
            </div>

            {/* Galeria de Thumbnails */}
            {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {photos.map((photo, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                                i === current 
                                    ? 'border-indigo-600 opacity-100 shadow-sm' 
                                    : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                        >
                            <img
                                src={`http://localhost:8080${photo}`}
                                alt={`${name} thumbnail ${i + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}