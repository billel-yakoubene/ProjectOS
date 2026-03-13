'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, ArrowRight, CheckCircle2, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Task {
    content: string;
    order: number;
}

export default function SmartInput({ onProjectCreated }: { onProjectCreated?: () => void }) {
    const [idea, setIdea] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleGenerate = async () => {
        if (!idea.trim()) return;

        setIsGenerating(true);
        setTasks([]);
        setError(null);
        setIsSaved(false);

        try {
            const response = await fetch('/api/decompose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idea }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.error || 'Server error');
                } catch {
                    throw new Error(`Server returned ${response.status}: ${errorText.substring(0, 100)}...`);
                }
            }

            const data = await response.json();
            if (data.steps) {
                setTasks(data.steps);
            }
        } catch (error: any) {
            console.error('Generation failed:', error);
            setError(error.message || 'Une erreur est survenue lors de la génération.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveProject = async () => {
        setIsSaving(true);
        setError(null);

        try {
            // Get current user (or fallback to a dummy ID for now if not logged in)
            const { data: { user } } = await supabase.auth.getUser();

            // For now, if no auth, we'll assume a dummy user_id for development or show error
            // In a real app, we'd redirect to login
            const userId = user?.id || '00000000-0000-0000-0000-000000000000';

            // 1. Create Project
            const { data: project, error: pError } = await supabase
                .from('projects')
                .insert({
                    title: idea,
                    user_id: userId,
                    status: 'active'
                })
                .select()
                .single();

            if (pError) throw pError;

            // 2. Create Tasks
            const tasksToInsert = tasks.map(t => ({
                project_id: project.id,
                content: t.content,
                order: t.order,
                status: 'todo'
            }));

            const { error: tError } = await supabase
                .from('tasks')
                .insert(tasksToInsert as any);

            if (tError) throw tError;

            setIsSaved(true);
            onProjectCreated?.();

            setTimeout(() => {
                setIdea('');
                setTasks([]);
                setIsSaved(false);
            }, 2000);

        } catch (err: any) {
            console.error('Save failed:', err);
            setError(`Échec de la sauvegarde : ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex gap-2 p-1 bg-white dark:bg-zinc-950 rounded-lg border shadow-xl">
                    <Input
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        placeholder="Quelle est votre idée géniale ?"
                        className="border-none shadow-none focus-visible:ring-0 bg-transparent text-lg h-12"
                        disabled={isGenerating}
                    />
                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating || !idea.trim()}
                        className="h-12 px-6 bg-zinc-900 dark:bg-zinc-100 hover:scale-105 transition-transform"
                    >
                        {isGenerating ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            >
                                <Sparkles className="w-5 h-5" />
                            </motion.div>
                        ) : (
                            <ArrowRight className="w-5 h-5" />
                        )}
                    </Button>
                </div>
            </div>

            <AnimatePresence>
                {(isGenerating || tasks.length > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        {isGenerating ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <Card key={i} className="border-dashed">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <Skeleton className="w-6 h-6 rounded-full" />
                                            <Skeleton className="h-4 w-[80%]" />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            tasks.sort((a, b) => a.order - b.order).map((task, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="hover:border-purple-500/50 transition-colors group cursor-pointer overflow-hidden border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm bg-white/50 dark:bg-zinc-950/50">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm">
                                                {task.order}
                                            </div>
                                            <p className="flex-1 text-zinc-700 dark:text-zinc-300 font-medium">
                                                {task.content}
                                            </p>
                                            <CheckCircle2 className="w-5 h-5 text-zinc-300 dark:text-zinc-700 group-hover:text-green-500 transition-colors" />
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))
                        )}

                        {tasks.length > 0 && !isGenerating && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex justify-center pt-4"
                            >
                                <Button
                                    onClick={handleSaveProject}
                                    disabled={isSaving || isSaved}
                                    className={`h-14 px-8 rounded-full shadow-lg transition-all duration-500 ${isSaved
                                        ? 'bg-green-500 hover:bg-green-600 w-full'
                                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-purple-500/20'
                                        }`}
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    ) : isSaved ? (
                                        <CheckCircle2 className="w-5 h-5 mr-2" />
                                    ) : (
                                        <Save className="w-5 h-5 mr-2" />
                                    )}
                                    {isSaved ? 'Projet Ajouté !' : 'Lancer ce Projet'}
                                </Button>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-3"
                >
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    {error.includes('Key') ? (
                        <span>
                            Clé API OpenAI manquante ou invalide. Ajoutez <code>OPENAI_API_KEY</code> à votre fichier <code>.env.local</code>.
                        </span>
                    ) : error}
                </motion.div>
            )}
        </div>
    );
}
