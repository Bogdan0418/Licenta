'use client';

import { useRouter } from 'next/navigation';

// Am adăugat doar un background image (din Unsplash) pentru designul cardurilor
const categories = [
    { type: 'RESTAURANT', label: 'Restaurant', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop' },
    { type: 'BAR', label: 'Bar', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=600&auto=format&fit=crop' },
    { type: 'CLUB', label: 'Club', image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=600&auto=format&fit=crop' },
    { type: 'WORK_HUB', label: 'Work Hub', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop' },
    { type: 'GARDEN', label: 'Grădină', image: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?q=80&w=600&auto=format&fit=crop' },
    { type: 'ROOFTOP', label: 'Rooftop', image: 'https://images.unsplash.com/photo-1485872299829-c673f5194813?q=80&w=600&auto=format&fit=crop' },
];

export function CategoryCards() {
    const router = useRouter();

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map(({ type, label, image }) => (
                <button
                    key={type}
                    onClick={() => router.push(`/search?type=${type}`)}
                    className="group relative flex flex-col justify-end aspect-[3/4] overflow-hidden rounded-xl border border-white/10 hover:border-[#C5A059]/50 transition-all duration-500 text-left"
                >
                    {/* Imaginea de Fundal */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                        style={{ backgroundImage: `url(${image})` }}
                    />
                    
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                    
                    {/* Text Categorie */}
                    <div className="relative z-10 p-5 w-full">
                        <span className="text-lg font-serif text-white group-hover:text-[#C5A059] transition-colors">
                            {label}
                        </span>
                        <div className="h-px w-0 bg-[#C5A059] mt-3 transition-all duration-500 group-hover:w-full opacity-50" />
                    </div>
                </button>
            ))}
        </div>
    );
}