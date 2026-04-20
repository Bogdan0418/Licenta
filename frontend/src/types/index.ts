export interface User {
    publicId: string;
    role: 'USER' | 'ADMIN' | 'LOCATION';
    email: string;
    token: string;
}

export interface LocationSummary {
    id: number;
    publicId: string;
    displayName: string;
    type: string;
    address: string;
    latitude: number;
    longitude: number;
    rating: number;
    ratingCount: number;
    firstPhotoUrl: string | null;
    facilities: string[];
    distanceKm: number | null;
}

export interface LocationDetail {
    id: number;
    publicId: string;
    displayName: string;
    type: string;
    address: string;
    latitude: number;
    longitude: number;
    description: string;
    publicPhone: string;
    schedule: Record<string, string>;
    instagramUrl: string | null;
    facebookUrl: string | null;
    tiktokUrl: string | null;
    rating: number;
    ratingCount: number;
    photoUrls: string[];
    facilities: string[];
    zones: Zone[];
    isFavorite: boolean;
}

export interface Zone {
    id: number;
    name: string;
    capacity: number;
    maxPersons: number;
    bookingDurationMinutes: number;
    openTime: string;
    closeTime: string;
}

export interface Slot {
    startTime: string;
    endTime: string;
    locuriLibere: number;
    disponibil: boolean;
}

export interface Booking {
    id: number;
    locationName: string;
    zoneName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    groupSize: number;
    status: 'CONFIRMED' | 'CANCELLED_BY_USER' | 'CANCELLED_NO_SHOW' | 'COMPLETED';
    canCancel: boolean;
    canReview: boolean;
}

export interface Review {
    id: number;
    reviewerType: 'USER' | 'LOCATION';
    rating: number;
    comment: string;
    createdAt: string;
    reviewerName: string;
    bookingId: number;
}

export interface AdminLocation {
    id: number;
    publicId: string;
    displayName: string;
    companyName: string;
    cui: string;
    legalAddress: string;
    contactPhone: string;
    ownerEmail: string;
    type: string;
    address: string;
    status: 'PENDING' | 'VERIFIED' | 'INACTIVE' | 'BLOCKED';
    rejectReason: string | null;
    blockedReason: string | null;
    createdAt: string;
    verifiedAt: string | null;
    photoCount: number;
}

export interface AuditLog {
    id: number;
    adminPublicId: string;
    action: string;
    targetType: string;
    targetId: number;
    details: string;
    createdAt: string;
}