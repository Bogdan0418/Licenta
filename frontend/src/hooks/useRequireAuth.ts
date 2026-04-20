'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function useRequireAuth(requiredRole?: 'USER' | 'LOCATION' | 'ADMIN') {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        if (requiredRole && user.role !== requiredRole) {
            // Redirecționează la dashboardul corect
            if (user.role === 'USER') router.push('/dashboard/user');
            else if (user.role === 'LOCATION') router.push('/dashboard/location');
            else if (user.role === 'ADMIN') router.push('/dashboard/admin');
        }
    }, [user, isLoading, requiredRole, router]);

    return { user, isLoading };
}