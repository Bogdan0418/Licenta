import { Navbar } from '@/components/layout/Navbar';
import { SearchSection } from '@/components/home/SearchSection';
import { CategoryCards } from '@/components/home/CategoryCards';
import { HowItWorks } from '@/components/home/HowItWorks';

export default function HomePage() {
    return (
        <main className="min-h-screen bg-[#0a0a0b]">
            <Navbar />

            {/* Hero Section Cinematic */}
            <section className="relative flex items-center justify-center min-h-[70vh] px-4 overflow-hidden">
                {/* Background Image cu Overlay */}
                <div 
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1920&auto=format&fit=crop")' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b]/80 via-[#0a0a0b]/60 to-[#0a0a0b]"></div>
                </div>

                <div className="relative z-10 max-w-4xl mx-auto text-center mt-10 animate-slide-up">
                    <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 tracking-tight">
                        Unde ieșim azi?
                    </h1>
                    <p className="text-zinc-300 text-lg md:text-xl font-light mb-12 max-w-2xl mx-auto tracking-wide">
                        Descoperă locația perfectă pentru orice ocazie —
                        restaurant, bar, club sau spațiu de lucru.
                    </p>
                    <SearchSection />
                </div>
            </section>

            {/* Categorii */}
            <section className="max-w-7xl mx-auto px-4 py-24 relative z-10">
                <div className="flex items-center justify-between mb-12 border-b border-white/10 pb-6">
                    <h2 className="text-3xl md:text-4xl font-serif text-white">
                        Explorează după categorie
                    </h2>
                </div>
                <CategoryCards />
            </section>

            {/* Cum funcționează */}
            <section className="border-t border-white/5 bg-gradient-to-b from-[#0a0a0b] to-black py-24 px-4 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-serif text-white mb-16 text-center">
                        Cum funcționează Planify
                    </h2>
                    <HowItWorks />
                </div>
            </section>
        </main>
    );
}