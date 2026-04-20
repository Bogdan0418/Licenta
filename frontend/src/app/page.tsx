import { Navbar } from '@/components/layout/Navbar';
import { SearchSection } from '@/components/home/SearchSection';
import { CategoryCards } from '@/components/home/CategoryCards';
import { HowItWorks } from '@/components/home/HowItWorks';

export default function HomePage() {
    return (
        <main>
            <Navbar />

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white py-20 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Unde ieșim azi?
                    </h1>
                    <p className="text-indigo-200 text-lg mb-10">
                        Găsește locația perfectă pentru orice ocazie —
                        restaurant, bar, club sau spațiu de lucru
                    </p>
                    <SearchSection />
                </div>
            </section>

            {/* Categorii */}
            <section className="max-w-7xl mx-auto px-4 py-16">
                <h2 className="text-2xl font-bold text-gray-800 mb-8">
                    Explorează după categorie
                </h2>
                <CategoryCards />
            </section>

            {/* Cum funcționează */}
            <section className="bg-white py-16 px-4">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-800 mb-12 text-center">
                        Cum funcționează Planify
                    </h2>
                    <HowItWorks />
                </div>
            </section>
        </main>
    );
}