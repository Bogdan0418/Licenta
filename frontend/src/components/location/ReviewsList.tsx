'use client';

import { Star, Flag, Loader2 } from 'lucide-react';
import { Review } from '@/types';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext'; // Presupunem că ai acces la user în context

interface Props {
    reviews: Review[];
}

export function ReviewsList({ reviews }: Props) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { mutate: report, isPending } = useMutation({
        mutationFn: async (reviewId: number) => {
            const rolePath = user?.role === 'USER' ? 'user' : 'location';
            return api.post(`/api/${rolePath}/reviews/${reviewId}/report`);
        },
        onSuccess: () => {
            // Reîmprospătăm datele locației pentru a vedea statusul de raportat
            queryClient.invalidateQueries({ queryKey: ['location'] });
            alert('Review-ul a fost raportat administratorului.');
        },
        onError: () => alert('Eroare la raportare.')
    });

    if (reviews.length === 0) return null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Recenzii ({reviews.length})</h2>
            <div className="space-y-4">
                {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-gray-800">{review.reviewerName}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400">
                                    {format(new Date(review.createdAt), 'd MMM yyyy', { locale: ro })}
                                </span>
                                {/* Buton Raportare */}
                                {user && !review.isReported && (
                                    <button 
                                        onClick={() => report(review.id)}
                                        disabled={isPending}
                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                        title="Raportează review"
                                    >
                                        <Flag size={14} />
                                    </button>
                                )}
                                {review.isReported && (
                                    <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded border border-red-100 font-medium">
                                        Raportat
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} size={14} className={star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                            ))}
                        </div>
                        {review.comment && (
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed italic">
                                "{review.comment}"
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}