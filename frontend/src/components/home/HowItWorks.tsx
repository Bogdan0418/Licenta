import { Search, CalendarCheck, Star } from 'lucide-react';

const steps = [
    {
        icon: Search,
        title: 'Caută',
        description: 'Folosește filtrele pentru a găsi locația perfectă după tip, facilități și locație',
        color: 'bg-indigo-100 text-indigo-600',
        step: '1',
    },
    {
        icon: CalendarCheck,
        title: 'Rezervă',
        description: 'Alege data, ora și grupul tău. Confirmarea vine instant prin SMS și email',
        color: 'bg-orange-100 text-orange-600',
        step: '2',
    },
    {
        icon: Star,
        title: 'Bucură-te',
        description: 'Du-te la locație și după, lasă un review pentru a ajuta comunitatea',
        color: 'bg-green-100 text-green-600',
        step: '3',
    },
];

export function HowItWorks() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map(({ icon: Icon, title, description, color, step }) => (
                <div key={step} className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                        <div className={`p-5 rounded-full ${color}`}>
                            <Icon size={32} />
                        </div>
                        <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                            {step}
                        </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        {description}
                    </p>
                </div>
            ))}
        </div>
    );
}