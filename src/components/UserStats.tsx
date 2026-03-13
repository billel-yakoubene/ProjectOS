'use client';

import { motion } from "framer-motion";
import { Trophy, Star, TrendingUp } from "lucide-react";

interface UserStatsProps {
    xp: number;
    level: number;
    streak: number;
}

export default function UserStats({ xp, level, streak }: UserStatsProps) {
    const xpForNextLevel = level * 500;
    const progress = (xp % 500) / 500 * 100;

    return (
        <div className="flex items-center gap-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm">
            {/* Level Badge */}
            <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <span className="text-white font-black text-xl">{level}</span>
                </div>
                <div className="absolute -top-1 -right-1">
                    <Trophy className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                </div>
            </div>

            {/* XP Info */}
            <div className="flex-1 space-y-1.5 min-w-[120px]">
                <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Niveau {level}</p>
                    <p className="text-[10px] font-mono text-zinc-400">{xp % 500} / 500 XP</p>
                </div>
                <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-orange-500 to-yellow-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    />
                </div>
            </div>

            {/* Streak Info */}
            <div className="hidden sm:flex items-center gap-3 pl-6 border-l border-zinc-200 dark:border-zinc-800">
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Série</p>
                    <p className="text-lg font-black text-orange-500">{streak} 🔥</p>
                </div>
            </div>
        </div>
    );
}
