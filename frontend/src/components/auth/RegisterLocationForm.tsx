'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MapPin, Search } from 'lucide-react';
import api from '@/lib/api';

const schema = z.object({
    companyName: z.string().min(2, 'Obligatoriu'),
    cui: z.string().min(4, 'CUI invalid'),
    legalAddress: z.string().min(5, 'Obligatoriu'),
    contactPhone: z.string().min(10, 'Telefon invalid'),
    displayName: z.string().min(2, 'Obligatoriu'),
    type: z.string().min(1, 'Selectează tipul'),
    address: z.string().min(5, 'Obligatoriu'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    description: z.string().optional(),
    ownerEmail: z.string().email('Email invalid'),
    password: z.string().min(8, 'Minim 8 caractere'),
    confirmPassword: z.string(),
    termsAccepted: z.boolean().refine(v => v, 'Trebuie să accepți termenii'),
}).refine((d) => d.password === d.confirmPassword, {
    message: 'Parolele nu coincid',
    path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

const locationTypes = [
    'RESTAURANT', 'BAR', 'CLUB', 'CAFE', 'WORK_HUB',
    'GARDEN', 'ROOFTOP', 'PUB', 'LOUNGE', 'BISTRO'
];

export function RegisterLocationForm() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.length > 3) {
                setIsSearching(true);
                fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=ro&limit=5`)
                    .then((res) => res.json())
                    .then((data) => {
                        setSuggestions(data);
                        setShowSuggestions(true);
                        setIsSearching(false);
                    })
                    .catch(() => setIsSearching(false));
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 600);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSelectAddress = (place: any) => {
        const fullAddress = place.display_name;
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);

        setSearchQuery(fullAddress);
        setShowSuggestions(false);

        setValue('address', fullAddress, { shouldValidate: true });
        setValue('latitude', lat);
        setValue('longitude', lon);
    };

    const onSubmit = async (data: FormData) => {
        setIsLoading(true);
        setError('');
        try {
            const { confirmPassword, termsAccepted, ...payload } = data;
            await api.post('/api/auth/register/location', payload);
            setSuccess('Cont creat! Așteptați aprobarea administratorului.');
            setTimeout(() => router.push('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data || 'Eroare la înregistrare');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-slide-up">
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm px-4 py-3 rounded-lg backdrop-blur-md text-center">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-[#C5A059]/10 border border-[#C5A059]/50 text-[#C5A059] text-sm px-4 py-3 rounded-lg backdrop-blur-md text-center">
                    {success}
                </div>
            )}

            {/* SECTIUNE: Date Legale */}
            <div className="flex items-center gap-3 py-2">
                <div className="h-px bg-white/10 flex-1"></div>
                <p className="text-xs font-serif text-[#C5A059] uppercase tracking-widest">Date Legale</p>
                <div className="h-px bg-white/10 flex-1"></div>
            </div>

            {[
                { name: 'companyName' as const, label: 'Numele firmei', placeholder: 'SC Exemplu SRL' },
                { name: 'cui' as const, label: 'CUI / CIF', placeholder: 'RO12345678' },
                { name: 'legalAddress' as const, label: 'Adresa sediului social', placeholder: 'Str. ...' },
                { name: 'contactPhone' as const, label: 'Telefon contact', placeholder: '07XXXXXXXX' },
            ].map(({ name, label, placeholder }) => (
                <div key={name}>
                    <label className="text-xs font-light text-zinc-400 mb-1.5 block uppercase tracking-wider">{label}</label>
                    <input
                        {...register(name)}
                        placeholder={placeholder}
                        className="w-full bg-white/5 border border-white/10 text-white placeholder-zinc-600 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                    />
                    {errors[name] && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors[name]?.message}</p>}
                </div>
            ))}

            {/* SECTIUNE: Profil Public */}
            <div className="flex items-center gap-3 py-2 mt-4">
                <div className="h-px bg-white/10 flex-1"></div>
                <p className="text-xs font-serif text-[#C5A059] uppercase tracking-widest">Profil Public</p>
                <div className="h-px bg-white/10 flex-1"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-light text-zinc-400 mb-1.5 block uppercase tracking-wider">Numele locației</label>
                    <input
                        {...register('displayName')}
                        placeholder="Ex: The Grand Lounge"
                        className="w-full bg-white/5 border border-white/10 text-white placeholder-zinc-600 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                    />
                    {errors.displayName && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.displayName.message}</p>}
                </div>

                <div>
                    <label className="text-xs font-light text-zinc-400 mb-1.5 block uppercase tracking-wider">Tip locație</label>
                    <select
                        {...register('type')}
                        className="w-full bg-black/40 border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all appearance-none"
                    >
                        <option value="" className="text-zinc-500">Selectează...</option>
                        {locationTypes.map(t => (
                            <option key={t} value={t} className="bg-[#0a0a0b] text-white">{t}</option>
                        ))}
                    </select>
                    {errors.type && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.type.message}</p>}
                </div>
            </div>

            {/* Căutare Adresă */}
            <div className="relative">
                <label className="text-xs font-light text-zinc-400 mb-1.5 block uppercase tracking-wider">Adresa exactă (hartă)</label>
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setValue('address', e.target.value, { shouldValidate: true });
                        }}
                        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                        placeholder="Ex: Calea Victoriei, București..."
                        className="w-full bg-white/5 border border-white/10 text-white placeholder-zinc-600 px-4 py-2.5 pr-10 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {isSearching ? (
                            <Loader2 className="h-4 w-4 text-[#C5A059] animate-spin" />
                        ) : (
                            <Search className="h-4 w-4 text-zinc-500" />
                        )}
                    </div>
                </div>

                {/* Dropdown Sugestii pe fundal Dark */}
                {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-50 w-full mt-2 bg-[#0a0a0b] border border-white/10 rounded-xl shadow-2xl max-h-60 overflow-auto divide-y divide-white/5">
                        {suggestions.map((place, idx) => (
                            <li
                                key={idx}
                                onClick={() => handleSelectAddress(place)}
                                className="px-4 py-3 hover:bg-white/5 cursor-pointer text-sm text-zinc-300 flex items-start gap-3 transition-colors"
                            >
                                <MapPin className="h-4 w-4 text-[#C5A059] mt-0.5 shrink-0" />
                                <span>{place.display_name}</span>
                            </li>
                        ))}
                    </ul>
                )}

                <input type="hidden" {...register('address')} />
                <input type="hidden" {...register('latitude')} />
                <input type="hidden" {...register('longitude')} />
                {errors.address && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.address.message}</p>}
            </div>

            <div>
                <label className="text-xs font-light text-zinc-400 mb-1.5 block uppercase tracking-wider">Descriere scurtă</label>
                <textarea
                    {...register('description')}
                    placeholder="Despre locația ta..."
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-zinc-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] resize-none transition-all"
                />
            </div>

            {/* SECTIUNE: Date Cont */}
            <div className="flex items-center gap-3 py-2 mt-4">
                <div className="h-px bg-white/10 flex-1"></div>
                <p className="text-xs font-serif text-[#C5A059] uppercase tracking-widest">Date Cont</p>
                <div className="h-px bg-white/10 flex-1"></div>
            </div>

            {[
                { name: 'ownerEmail' as const, label: 'Email', placeholder: 'contact@locatie.ro', type: 'email' },
                { name: 'password' as const, label: 'Parolă', placeholder: '••••••••', type: 'password' },
                { name: 'confirmPassword' as const, label: 'Confirmă parola', placeholder: '••••••••', type: 'password' },
            ].map(({ name, label, placeholder, type = 'text' }) => (
                <div key={name}>
                    <label className="text-xs font-light text-zinc-400 mb-1.5 block uppercase tracking-wider">{label}</label>
                    <input
                        {...register(name)}
                        type={type}
                        placeholder={placeholder}
                        className="w-full bg-white/5 border border-white/10 text-white placeholder-zinc-600 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition-all"
                    />
                    {errors[name] && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors[name]?.message}</p>}
                </div>
            ))}

            <label className="flex items-start gap-3 cursor-pointer mt-4 group">
                <div className="relative flex items-center justify-center">
                    <input
                        {...register('termsAccepted')}
                        type="checkbox"
                        className="peer appearance-none w-5 h-5 border border-white/20 rounded cursor-pointer checked:bg-[#C5A059] checked:border-[#C5A059] transition-all bg-white/5"
                    />
                    <svg className="absolute w-3 h-3 pointer-events-none opacity-0 peer-checked:opacity-100 text-black transition-opacity" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11.6666 3.5L5.24992 9.91667L2.33325 7"/></svg>
                </div>
                <span className="text-sm font-light text-zinc-400 group-hover:text-zinc-200 transition-colors mt-0.5">
                    Accept termenii și condițiile platformei Planify
                </span>
            </label>
            {errors.termsAccepted && <p className="text-red-400 text-xs mt-1 ml-8">{errors.termsAccepted.message}</p>}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#C5A059] hover:bg-[#b08d4a] disabled:opacity-60 text-black py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 mt-6 transition-all duration-300"
            >
                {isLoading && <Loader2 size={18} className="animate-spin" />}
                Înregistrează locația
            </button>
        </form>
    );
}