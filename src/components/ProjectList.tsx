'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import ProgressBar from "./ProgressBar";
import { Folder, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import React from 'react';

interface Task {
    id: string;
    status: string;
}

interface Project {
    id: string;
    title: string;
    description: string;
    tasks: Task[];
}

interface ProjectListProps {
    projects: Project[];
    onProjectClick?: (projectId: string) => void;
    onDelete?: (projectId: string) => void;
    activeProjectId?: string;
}

export default function ProjectList({ projects, onProjectClick, onDelete, activeProjectId }: ProjectListProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => {
                const totalTasks = project.tasks?.length || 0;
                const completedTasks = project.tasks?.filter(t => t.status === 'done').length || 0;

                return (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -4 }}
                        className="cursor-pointer group"
                        onClick={() => onProjectClick?.(project.id)}
                    >
                        <Card className={`h-full border-zinc-200/50 dark:border-zinc-800/50 transition-all duration-300 hover:shadow-xl ${activeProjectId === project.id
                            ? 'ring-2 ring-purple-500 bg-purple-50/10 dark:bg-purple-900/5'
                            : 'bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm'
                            }`}>
                            <CardHeader className="space-y-1 relative">
                                <div className="flex justify-between items-start">
                                    <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-500">
                                        <Folder className="w-4 h-4" />
                                    </div>
                                    <div className="flex gap-2">
                                        {onDelete && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-8 h-8 rounded-full text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all"
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    onDelete(project.id);
                                                }}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                        <ChevronRight className={`w-4 h-4 text-zinc-300 transition-transform ${activeProjectId === project.id ? 'translate-x-1' : ''}`} />
                                    </div>
                                </div>
                                <CardTitle className="text-xl font-bold tracking-tight pt-2">{project.title}</CardTitle>
                                <CardDescription className="line-clamp-2 text-xs font-medium min-h-[32px]">
                                    {project.description || "Aucune description fournie."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="pt-2">
                                    <ProgressBar total={totalTasks} completed={completedTasks} />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                );
            })}

            {projects.length === 0 && (
                <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                    <p className="text-zinc-400 font-medium">Aucun projet actif à afficher.</p>
                </div>
            )}
        </div>
    );
}
