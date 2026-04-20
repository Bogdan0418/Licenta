'use client';

import { useRouter } from 'next/navigation';
import { Utensils, Wine, Music, Briefcase, Trees, Building } from 'lucide-react';

const categories = [
    { type: 'RESTAURANT', label: 'Restaurant', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
    { type: 'BAR', label: 'Bar', icon: Wine, color: 'bg-purple-100 text-purple-600' },
    { type: 'CLUB', label: 'Club', icon: Music, color: 'bg-pink-100 text-pink-600' },
    { type: 'WORK_HUB', label: 'Work Hub', icon: Briefcase, color: 'bg-blue-100 text-blue-600' },
    { type: 'GARDEN', label: 'Grădină', icon: Trees, color: 'bg-green-100 text-green-600' },
    { type: 'ROOFTOP', label: 'Rooftop', icon: Building, color: 'bg-indigo-100 text-indigo-600' },
];

export function CategoryCards() {
    const router = useRouter();

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map(({ type, label, icon: Icon, color }) => (
                <button
                    key={type}
                    onClick={() => router.push(`/search?type=${type}`)}
                    className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
                >
                    <div className={`p-3 rounded-full ${color}`}>
                        <Icon size={24} />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                        {label}
                    </span>
                </button>
            ))}
        </div>
    );
}