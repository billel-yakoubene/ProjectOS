'use client';

import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap } from "lucide-react";

interface MomentumChartProps {
    data: { day: string; count: number }[];
}

export default function MomentumChart({ data }: MomentumChartProps) {
    const totalCount = data.reduce((acc, curr) => acc + curr.count, 0);

    return (
        <Card className="border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Zap className="w-5 h-5 text-purple-500 fill-purple-500" />
                            Élan Hebdomadaire
                        </CardTitle>
                        <CardDescription>
                            Tâches complétées ces 7 derniers jours
                        </CardDescription>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-black tracking-tighter text-purple-600 dark:text-purple-400">
                            {totalCount}
                        </span>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 pt-4">
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#888' }}
                                dy={10}
                            />
                            <YAxis hide />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-zinc-900 text-white p-2 rounded-lg text-xs font-bold shadow-xl border border-white/10">
                                                {payload[0].value} tâches
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#a855f7"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorCount)"
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
