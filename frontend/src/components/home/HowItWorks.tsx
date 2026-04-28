import { Search, CalendarCheck, Star } from 'lucide-react';

const steps = [
    {
        icon: Search,
        title: 'Explorează',
        description: 'O selecție riguroasă a celor mai exclusiviste locații, filtrată exact după preferințele tale.',
        step: '01',
    },
    {
        icon: CalendarCheck,
        title: 'Rezervă',
        description: 'Acces instant, fără bătăi de cap. Confirmarea ajunge direct pe dispozitivul tău în câteva secunde.',
        step: '02',
    },
    {
        icon: Star,
        title: 'Experimentează',
        description: 'Bucură-te de atmosfera locației și împărtășește experiența ta cu restul comunității.',
        step: '03',
    },
];

export function HowItWorks() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* O linie subtilă care unește pașii pe desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />

            {steps.map(({ icon: Icon, title, description, step }) => (
                <div key={step} className="flex flex-col items-center text-center relative z-10 group">
                    {/* Numărul de background (urilaj) */}
                    <div className="absolute -top-10 text-8xl font-serif font-bold text-white/[0.03] select-none transition-all duration-500 group-hover:text-white/[0.08] group-hover:-translate-y-2">
                        {step}
                    </div>

                    <div className="mb-8 p-4 rounded-full border border-white/5 bg-[#0a0a0b] shadow-2xl transition-all duration-300 group-hover:border-[#C5A059]/30">
                        <Icon size={28} className="text-[#C5A059] opacity-80 group-hover:opacity-100" />
                    </div>
                    
                    <h3 className="text-xl font-serif text-white mb-4 tracking-wide">
                        {title}
                    </h3>
                    
                    <p className="text-zinc-400 font-light text-sm leading-relaxed max-w-[250px]">
                        {description}
                    </p>
                </div>
            ))}
        </div>
    );
}