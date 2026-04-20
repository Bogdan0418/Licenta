import { Star } from 'lucide-react';
import { Review } from '@/types';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface Props {
    reviews: Review[];
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={14}
                    className={star <= rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-200 fill-gray-200'}
                />
            ))}
        </div>
    );
}

export function ReviewsList({ reviews }: Props) {
    if (reviews.length === 0) return null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">
                Recenzii ({reviews.length})
            </h2>
            <div className="space-y-4">
                {reviews.map((review) => (
                    <div key={review.id}
                        className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm text-gray-800">
                                {review.reviewerName}
                            </span>
                            <span className="text-xs text-gray-400">
                                {format(new Date(review.createdAt),
                                    'd MMM yyyy', { locale: ro })}
                            </span>
                        </div>
                        <StarRating rating={review.rating} />
                        {review.comment && (
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                                {review.comment}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}