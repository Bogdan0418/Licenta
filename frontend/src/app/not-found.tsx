import Link from 'next/link';
import { MapPin } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="text-center">
                <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MapPin size={36} className="text-indigo-500" />
                </div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
                <p className="text-gray-400 mb-6">
                    Pagina pe care o cauți nu există
                </p>
                <Link
                    href="/"
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
                >
                    Înapoi acasă
                </Link>
            </div>
        </div>
    );
}