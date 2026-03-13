'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, ArrowRightCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Project {
    id: string;
    title: string;
    nextTask?: {
        id: string;
        content: string;
    };
}

export default function NextActionDashboard({
    projects,
    onTaskStart
}: {
    projects: Project[],
    onTaskStart?: (taskId: string) => void
}) {
    const activeProjects = projects.filter(p => p.nextTask);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto">
            {activeProjects.map((project, index) => (
                <motion.div
                    key={project.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <Card className="border-none bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-950 dark:to-zinc-900 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <PlayCircle className="w-24 h-24" />
                        </div>

                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <Badge variant="outline" className="text-zinc-400 border-zinc-700 uppercase tracking-tighter text-[10px]">
                                    Focus Prioritaire
                                </Badge>
                            </div>
                            <CardTitle className="text-xl font-bold truncate pr-12">{project.title}</CardTitle>
                        </CardHeader>

                        <CardContent className="pt-4">
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
                                    <p className="text-zinc-400 text-xs mb-1 uppercase font-semibold">Prochaine étape</p>
                                    <p className="text-lg font-medium leading-tight">
                                        {project.nextTask?.content}
                                    </p>
                                </div>

                                <button
                                    onClick={() => project.nextTask && onTaskStart?.(project.nextTask.id)}
                                    className="flex items-center gap-2 text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors group/btn"
                                >
                                    Démarrer maintenant
                                    <ArrowRightCircle className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ))}

            {activeProjects.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400">
                    Aucun projet actif. Commencez par capturer une idée !
                </div>
            )}
        </div>
    );
}
