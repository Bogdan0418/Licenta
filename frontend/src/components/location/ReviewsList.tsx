'use client';

import { Star, Flag, Loader2 } from 'lucide-react';
import { Review } from '@/types';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext'; 

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
            queryClient.invalidateQueries({ queryKey: ['location'] });
            alert('Review-ul a fost raportat administratorului.');
        },
        onError: () => alert('Eroare la raportare.')
    });

    if (reviews.length === 0) return null;

    return (
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 sm:p-8">
            <h2 className="text-xl font-serif text-white mb-6 border-b border-white/5 pb-4">
                Recenzii ({reviews.length})
            </h2>
            <div className="space-y-6">
                {reviews.map((review) => (
                    <div key={review.id} className="border-b border-white/5 last:border-0 pb-6 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm text-white">{review.reviewerName}</span>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-zinc-500 font-light">
                                    {format(new Date(review.createdAt), 'd MMM yyyy', { locale: ro })}
                                </span>
                                {user && !review.isReported && (
                                    <button 
                                        onClick={() => report(review.id)}
                                        disabled={isPending}
                                        className="text-zinc-600 hover:text-red-400 transition-colors bg-white/5 p-1.5 rounded-md hover:bg-red-500/10"
                                        title="Raportează review"
                                    >
                                        <Flag size={14} />
                                    </button>
                                )}
                                {review.isReported && (
                                    <span className="text-[9px] uppercase tracking-wider bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-medium">
                                        Raportat
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} size={12} className={star <= review.rating ? 'text-[#C5A059] fill-[#C5A059]' : 'text-zinc-700 fill-zinc-800'} />
                            ))}
                        </div>
                        {review.comment && (
                            <p className="text-sm text-zinc-300 leading-relaxed font-light italic bg-[#121214] p-4 rounded-xl border border-white/5">
                                "{review.comment}"
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}