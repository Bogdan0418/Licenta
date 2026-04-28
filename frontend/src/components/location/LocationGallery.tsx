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
            <div className="h-64 bg-[#121214] border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2">
                <MapPin size={48} className="text-zinc-600" />
                <span className="text-zinc-500 font-light text-sm">Nicio imagine disponibilă</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {/* Imaginea Principală */}
            <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-[#121214] border border-white/10 group">
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
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-md p-2.5 rounded-full disabled:opacity-0 opacity-0 group-hover:opacity-100 hover:bg-[#C5A059] text-white hover:text-black transition-all border border-white/20 hover:border-[#C5A059]"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => setCurrent(p => Math.min(photos.length - 1, p + 1))}
                            disabled={current === photos.length - 1}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-md p-2.5 rounded-full disabled:opacity-0 opacity-0 group-hover:opacity-100 hover:bg-[#C5A059] text-white hover:text-black transition-all border border-white/20 hover:border-[#C5A059]"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </>
                )}
            </div>

            {/* Galeria de Thumbnails */}
            {photos.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    {photos.map((photo, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                                i === current 
                                    ? 'border-[#C5A059] opacity-100 shadow-[0_0_15px_rgba(197,160,89,0.3)]' 
                                    : 'border-transparent opacity-40 hover:opacity-100'
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