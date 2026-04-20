import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { QueryProvider } from '@/components/providers/QueryProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Planify — Găsește locația perfectă',
    description: 'Platformă pentru rezervări și evenimente sociale',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ro">
            <body className={inter.className}>
                <QueryProvider>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </QueryProvider>
            </body>
        </html>
    );
}