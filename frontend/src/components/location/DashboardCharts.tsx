'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

// Tipurile de date care vin din backend-ul nostru Java
interface DailyStats {
  date: string;
  rezervari: number;
  clienti: number;
}

interface HourlyStats {
  ora: string;
  trafic: number;
}

interface ChartsResponse {
  evolution: DailyStats[];
  peakHours: HourlyStats[];
}

interface Props {
  locationId: number;
}

export function DashboardCharts({ locationId }: Props) {
  // Preluăm datele de la noul tău endpoint
  const { data, isLoading, isError } = useQuery<ChartsResponse>({
    queryKey: ['location-charts', locationId],
    queryFn: async () => {
      const res = await api.get(`/api/location/${locationId}/charts`);
      return res.data;
    },
    enabled: !!locationId // Se execută doar dacă avem id-ul
  });

  // Stare de încărcare frumoasă
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-[#0a0a0b] border border-white/10 rounded-2xl shadow-xl w-full mb-6">
        <Loader2 className="animate-spin text-[#C5A059] mb-4" size={32} />
        <p className="text-sm text-zinc-400 font-light tracking-wide">Se prelucrează statisticile locației...</p>
      </div>
    );
  }

  // Tratarea erorilor
  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-400 w-full mb-6">
        <AlertCircle size={32} className="mb-2" />
        <p className="text-sm font-light">Eroare la încărcarea graficelor.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* 1. Grafic Evoluție Rezervări și Clienți */}
      <div className="bg-[#0a0a0b] border border-white/10 rounded-2xl p-6 shadow-xl transition-all hover:border-white/20">
        <div className="mb-6">
          <h3 className="font-serif text-lg text-white tracking-wide">Evoluție Trafic</h3>
          <p className="text-xs text-zinc-400 font-light mt-1">Rezervări și clienți în ultimele 7 zile</p>
        </div>
        <div className="w-full min-w-0">
            <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.evolution} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis dataKey="date" stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#121214', borderColor: '#ffffff10', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                itemStyle={{ color: '#fff', fontSize: '13px' }}
                labelStyle={{ color: '#C5A059', marginBottom: '8px', fontWeight: 'bold' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
              <Line 
                type="monotone" 
                dataKey="rezervari" 
                name="Rezervări" 
                stroke="#C5A059" 
                strokeWidth={3} 
                dot={{ fill: '#0a0a0b', stroke: '#C5A059', strokeWidth: 2, r: 4 }} 
                activeDot={{ r: 6, fill: '#C5A059', stroke: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="clienti" 
                name="Clienți" 
                stroke="#4ade80" 
                strokeWidth={3} 
                dot={{ fill: '#0a0a0b', stroke: '#4ade80', strokeWidth: 2, r: 4 }} 
                activeDot={{ r: 6, fill: '#4ade80', stroke: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Grafic Ore de Vârf */}
      <div className="bg-[#0a0a0b] border border-white/10 rounded-2xl p-6 shadow-xl transition-all hover:border-white/20">
        <div className="mb-6">
          <h3 className="font-serif text-lg text-white tracking-wide">Ore de Vârf</h3>
          <p className="text-xs text-zinc-400 font-light mt-1">Clienți pe intervale orare (ultimele 30 zile)</p>
        </div>
        <div className="w-full min-w-0">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.peakHours} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis dataKey="ora" stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                cursor={{ fill: '#ffffff05' }}
                contentStyle={{ backgroundColor: '#121214', borderColor: '#ffffff10', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                labelStyle={{ color: '#C5A059', marginBottom: '4px', fontWeight: 'bold' }}
              />
              <Bar 
                dataKey="trafic" 
                name="Total persoane" 
                fill="#C5A059" 
                radius={[4, 4, 0, 0]} 
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}