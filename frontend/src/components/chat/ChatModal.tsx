'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Send, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { format, parseISO } from 'date-fns';

interface Props {
    bookingId: number;
    recipientName: string; // Numele clientului sau al locatiei
    senderType: 'USER' | 'LOCATION';
    onClose: () => void;
}

interface Message {
    id: number;
    senderType: string;
    content: string;
    createdAt: string;
}

export function ChatModal({ bookingId, recipientName, senderType, onClose }: Props) {
    const queryClient = useQueryClient();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch mesaje cu polling la fiecare 3 secunde
    const { data: messages, isLoading } = useQuery({
        queryKey: ['chat', bookingId],
        queryFn: async () => (await api.get(`/api/chat/${bookingId}`)).data as Message[],
        refetchInterval: 3000, 
    });

    // Marcam mesajele ca citite imediat cum deschidem
    useEffect(() => {
        api.put(`/api/chat/${bookingId}/read`).then(() => {
            if (senderType === 'LOCATION') queryClient.invalidateQueries({ queryKey: ['location-chats'] });
            if (senderType === 'USER') queryClient.invalidateQueries({ queryKey: ['user-unread-chats'] }); // <--- LINIE NOUĂ ADĂUGATĂ AICI
        });
    }, [bookingId]);

    // Auto-scroll la ultimul mesaj
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const { mutate: sendMessage, isPending } = useMutation({
        mutationFn: async () => api.post(`/api/chat/${bookingId}`, { content: newMessage }),
        onSuccess: () => {
            setNewMessage('');
            queryClient.invalidateQueries({ queryKey: ['chat', bookingId] });
            if (senderType === 'LOCATION') queryClient.invalidateQueries({ queryKey: ['location-chats'] });
        }
    });

    return (
        <div className="fixed inset-0 bg-[#0a0a0b]/80 backdrop-blur-sm flex justify-center sm:items-center z-[100] p-0 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-[#121214] sm:border border-white/10 sm:rounded-2xl w-full sm:max-w-md h-full sm:h-[600px] flex flex-col shadow-2xl flex-shrink-0">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/40 sm:rounded-t-2xl">
                    <div>
                        <h3 className="font-serif text-white text-lg">{recipientName}</h3>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Discuție rezervare #{bookingId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
                        <X size={18} />
                    </button>
                </div>

                {/* Zona de Mesaje */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0a0a0b]/50">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-[#C5A059]" size={24}/></div>
                    ) : messages?.length === 0 ? (
                        <div className="flex justify-center items-center h-full text-zinc-500 text-xs italic">Nu există mesaje. Începe conversația!</div>
                    ) : (
                        messages?.map((msg) => {
                            const isMe = msg.senderType === senderType;
                            return (
                                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                                        isMe 
                                            ? 'bg-[#C5A059] text-black rounded-tr-sm' 
                                            : 'bg-white/10 text-white rounded-tl-sm border border-white/5'
                                    }`}>
                                        {msg.content}
                                    </div>
                                    <span className="text-[9px] text-zinc-500 mt-1 font-light px-1">
                                        {format(parseISO(msg.createdAt), 'HH:mm')}
                                    </span>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/40 border-t border-white/5 sm:rounded-b-2xl flex gap-2 items-end">
                    <textarea 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        placeholder="Scrie un mesaj..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white resize-none outline-none focus:border-[#C5A059] max-h-32 min-h-[44px] custom-scrollbar"
                        rows={1}
                    />
                    <button 
                        onClick={() => sendMessage()}
                        disabled={!newMessage.trim() || isPending}
                        className="p-3.5 bg-[#C5A059] hover:bg-[#b08d4a] disabled:opacity-50 text-black rounded-xl transition-all shadow-md shrink-0"
                    >
                        {isPending ? <Loader2 size={16} className="animate-spin"/> : <Send size={16} />}
                    </button>
                </div>

            </div>
        </div>
    );
}