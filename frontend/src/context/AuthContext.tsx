'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import Cookies from 'js-cookie';

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Încarcă userul din localStorage la pornire
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        // Salvăm în localStorage pentru Axios și persistența frontend-ului
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userData.token);
        
        // Salvăm în Cookie pentru Middleware-ul Next.js (valabil 7 zile)
        Cookies.set('token', userData.token, { expires: 7, path: '/' });
    };

    const logout = () => {
        setUser(null);
        // Ștergem din localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Ștergem și Cookie-ul
        Cookies.remove('token', { path: '/' });
        
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth trebuie folosit în AuthProvider');
    return context;
}