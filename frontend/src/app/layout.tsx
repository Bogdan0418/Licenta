import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { QueryProvider } from '@/components/providers/QueryProvider';

// Configurăm fonturile nativ în Next.js
const inter = Inter({ 
    subsets: ['latin'],
    variable: '--font-inter',
});

const playfair = Playfair_Display({ 
    subsets: ['latin'],
    variable: '--font-playfair',
});

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
        <html lang="ro" className={`${inter.variable} ${playfair.variable}`}>
            <body className="font-sans antialiased bg-[#0a0a0b] text-zinc-200">
                <QueryProvider>
                    <AuthProvider>
                        {/* Aici adaugi clasa pt-24 (sau pt-28) pentru a lăsa spațiu sus */}
                        <div className="pt-15 min-h-screen"> 
                            {children}
                        </div>
                    </AuthProvider>
                </QueryProvider>
            </body>
        </html>
    );
}