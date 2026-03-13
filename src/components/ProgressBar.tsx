'use client';

import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface ProgressBarProps {
    total: number;
    completed: number;
}

export default function ProgressBar({ total, completed }: ProgressBarProps) {
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    return (
        <div className="w-full space-y-3">
            <div className="flex justify-between items-baseline">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Productivité Globale</span>
                    <span className="text-xs text-zinc-500 font-medium">
                        {completed} / {total} tâches complétées
                    </span>
                </div>
                <motion.div
                    key={percentage}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-baseline gap-1"
                >
                    <span className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500">
                        {percentage}
                    </span>
                    <span className="text-sm font-bold text-zinc-400">%</span>
                </motion.div>
            </div>

            <div className="relative h-3 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "circOut" }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                />

                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            </div>
        </div>
    );
}
