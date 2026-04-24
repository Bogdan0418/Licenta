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
    latitude: z.number().optional(), // Adăugat pentru coordonate
    longitude: z.number().optional(), // Adăugat pentru coordonate
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

    // Stări pentru căutarea adresei cu OpenStreetMap
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    // Debounce efect pentru Nominatim API (Gratuit)
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

        // Populăm formularul cu adresa și coordonatele
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-lg">
                    {success}
                </div>
            )}

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Date legale
            </p>

            {[
                { name: 'companyName' as const, label: 'Numele firmei', placeholder: 'SC Test SRL' },
                { name: 'cui' as const, label: 'CUI / CIF', placeholder: 'RO12345678' },
                { name: 'legalAddress' as const, label: 'Adresa sediului social', placeholder: 'Str. ...' },
                { name: 'contactPhone' as const, label: 'Telefon contact', placeholder: '07XXXXXXXX' },
            ].map(({ name, label, placeholder }) => (
                <div key={name}>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
                    <input
                        {...register(name)}
                        placeholder={placeholder}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    {errors[name] && (
                        <p className="text-red-500 text-xs mt-0.5">{errors[name]?.message}</p>
                    )}
                </div>
            ))}

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">
                Profil public
            </p>

            <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Numele locației
                </label>
                <input
                    {...register('displayName')}
                    placeholder="Terasa mea"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                {errors.displayName && (
                    <p className="text-red-500 text-xs mt-0.5">{errors.displayName.message}</p>
                )}
            </div>

            <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Tip locație
                </label>
                <select
                    {...register('type')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                    <option value="">Selectează...</option>
                    {locationTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
                {errors.type && (
                    <p className="text-red-500 text-xs mt-0.5">{errors.type.message}</p>
                )}
            </div>

            {/* CÂMP ADRESĂ MODIFICAT CU AUTOCOMPLETE */}
            <div className="relative">
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Adresa exactă (căutare pe hartă)
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            // Setăm valoarea și în form pentru a menține sincronizarea
                            setValue('address', e.target.value, { shouldValidate: true });
                        }}
                        onFocus={() => {
                            if (suggestions.length > 0) setShowSuggestions(true);
                        }}
                        placeholder="Ex: Strada Republicii 1, Cluj-Napoca"
                        className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        {isSearching ? (
                            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                        ) : (
                            <Search className="h-4 w-4 text-gray-400" />
                        )}
                    </div>
                </div>

                {/* Sugestii Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-auto">
                        {suggestions.map((place, idx) => (
                            <li
                                key={idx}
                                onClick={() => handleSelectAddress(place)}
                                className="px-4 py-3 hover:bg-indigo-50 cursor-pointer text-sm border-b border-gray-50 last:border-0 flex items-start gap-2"
                            >
                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                                <span>{place.display_name}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {/* Câmpuri ascunse pentru a garanta trimiterea lor */}
                <input type="hidden" {...register('address')} />
                <input type="hidden" {...register('latitude')} />
                <input type="hidden" {...register('longitude')} />

                {errors.address && (
                    <p className="text-red-500 text-xs mt-0.5">{errors.address.message}</p>
                )}
            </div>

            <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Descriere scurtă
                </label>
                <textarea
                    {...register('description')}
                    placeholder="Despre locația ta..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />
            </div>

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">
                Date cont
            </p>

            {[
                { name: 'ownerEmail' as const, label: 'Email', placeholder: 'contact@locatie.ro', type: 'email' },
                { name: 'password' as const, label: 'Parolă', placeholder: '••••••••', type: 'password' },
                { name: 'confirmPassword' as const, label: 'Confirmă parola', placeholder: '••••••••', type: 'password' },
            ].map(({ name, label, placeholder, type = 'text' }) => (
                <div key={name}>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
                    <input
                        {...register(name)}
                        type={type}
                        placeholder={placeholder}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    {errors[name] && (
                        <p className="text-red-500 text-xs mt-0.5">{errors[name]?.message}</p>
                    )}
                </div>
            ))}

            <label className="flex items-start gap-2 cursor-pointer">
                <input
                    {...register('termsAccepted')}
                    type="checkbox"
                    className="mt-0.5"
                />
                <span className="text-xs text-gray-500">
                    Accept termenii și condițiile platformei Planify
                </span>
            </label>
            {errors.termsAccepted && (
                <p className="text-red-500 text-xs">{errors.termsAccepted.message}</p>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2"
            >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                Înregistrează locația
            </button>
        </form>
    );
}