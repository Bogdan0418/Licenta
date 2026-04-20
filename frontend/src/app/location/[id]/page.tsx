'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { LocationGallery } from '@/components/location/LocationGallery';
import { LocationInfo } from '@/components/location/LocationInfo';
import { BookingCalendar } from '@/components/location/BookingCalendar';
import { ReviewsList } from '@/components/location/ReviewsList';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { LocationDetail } from '@/types';

export default function LocationPage() {
    const { id } = useParams();

    const { data: location, isLoading } = useQuery({
        queryKey: ['location', id],
        queryFn: async () => {
            const res = await api.get(`/api/locations/public/${id}`);
            return res.data as LocationDetail;
        },
    });

    const { data: reviews } = useQuery({
        queryKey: ['reviews', id],
        queryFn: async () => {
            const res = await api.get(`/api/locations/public/${id}/reviews`);
            return res.data;
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-indigo-600" size={40} />
                </div>
            </div>
        );
    }

    if (!location) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Coloana stânga — info + galerie */}
                    <div className="lg:col-span-2 space-y-6">
                        <LocationGallery
                            photos={location.photoUrls}
                            name={location.displayName}
                        />
                        <LocationInfo location={location} />
                        <ReviewsList reviews={reviews || []} />
                    </div>

                    {/* Coloana dreapta — calendar rezervare */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <BookingCalendar
                                location={location}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}