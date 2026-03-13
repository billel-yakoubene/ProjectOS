'use client';

import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Info, AlertTriangle, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    created_at: string;
}

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || '00000000-0000-0000-0000-000000000000';

        const { data, error } = await (supabase
            .from('notifications' as any)
            .select('*')
            .eq('user_id', userId)
            .eq('is_read', false)
            .order('created_at', { ascending: false }) as any);

        if (!error && data) setNotifications(data as any);
    };

    useEffect(() => {
        fetchNotifications();

        const channel = supabase
            .channel('notifications-live')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const markAsRead = async (id: string) => {
        const { error } = await (supabase
            .from('notifications' as any)
            .update({ is_read: true } as any)
            .eq('id', id) as any);

        if (!error) {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
            case 'stagnation': return <Zap className="w-4 h-4 text-purple-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
                <Bell className="w-5 h-5 text-zinc-500" />
                {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 z-50 overflow-hidden"
                    >
                        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-400">Notifications</h3>
                            <button onClick={() => setIsOpen(false)}><X className="w-4 h-4 text-zinc-400" /></button>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-zinc-400 text-sm">
                                    Aucune notification.
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.id} className="p-4 border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                                        <div className="flex gap-3">
                                            <div className="mt-1">{getIcon(n.type)}</div>
                                            <div className="flex-1 space-y-1">
                                                <p className="font-bold text-sm leading-none">{n.title}</p>
                                                <p className="text-xs text-zinc-500 leading-relaxed">{n.message}</p>
                                                <p className="text-[10px] text-zinc-400 font-mono">
                                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => markAsRead(n.id)}
                                                className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-zinc-500 transition-all font-bold text-xs"
                                            >
                                                OK
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
