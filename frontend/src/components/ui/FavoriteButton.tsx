'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { favoritesApi } from '@/lib/api';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
    locationPublicId: string;
    className?: string;
}

export function FavoriteButton({ locationPublicId, className = "" }: FavoriteButtonProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Verificăm statusul curent doar dacă e logat ca USER
    const { data } = useQuery({
        queryKey: ['favorite-status', locationPublicId],
        queryFn: () => favoritesApi.checkFavorite(locationPublicId),
        enabled: !!user && user.role === 'USER',
    });

    const isFavorite = data?.isFavorite || false;

    // Mutatie pentru toggle
    const { mutate: toggleFavorite, isPending } = useMutation({
        mutationFn: async () => {
            if (isFavorite) {
                return favoritesApi.removeFavorite(locationPublicId);
            } else {
                return favoritesApi.addFavorite(locationPublicId);
            }
        },
        onSuccess: () => {
            // Invalidează query-ul curent pentru a-și da refresh iconița
            queryClient.invalidateQueries({ queryKey: ['favorite-status', locationPublicId] });
            // Invalidează lista generală de favorite din dashboard
            queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
        }
    });

    // Dacă vizitatorul nu e autentificat ca utilizator, nu afișăm nimic
    if (!user || user.role !== 'USER') return null;

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault(); // Previne click-ul pe link dacă e pe un Card
        e.stopPropagation();
        toggleFavorite();
    };

    return (
        <button
            onClick={handleClick}
            disabled={isPending}
            className={`p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg hover:scale-110 transition-all ${isPending ? 'opacity-50' : ''} ${className}`}
            aria-label="Toggle favorite"
        >
            <Heart
                size={18}
                className={`transition-colors duration-300 ${isFavorite ? 'fill-[#C5A059] text-[#C5A059]' : 'text-white hover:text-[#C5A059]'}`}
            />
        </button>
    );
}