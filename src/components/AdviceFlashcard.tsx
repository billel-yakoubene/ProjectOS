import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ArrowRight, Brain, Lightbulb } from "lucide-react";
import { Button } from "./ui/button";

interface AdviceCard {
    id: string;
    projectId: string;
    projectTitle: string;
    content: {
        action: string;
        rationale: string;
        tip: string;
    };
}

interface AdviceFlashcardProps {
    advices: AdviceCard[];
    onRemove: (id: string) => void;
    onAction: (projectId: string) => void;
}

export default function AdviceFlashcard({ advices, onRemove, onAction }: AdviceFlashcardProps) {
    return (
        <div className="w-full max-w-2xl mx-auto mb-8">
            <AnimatePresence>
                {advices.map((advice) => (
                    <motion.div
                        key={advice.id}
                        initial={{ opacity: 0, scale: 0.9, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                        className="mb-6"
                    >
                        <div className="relative group overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-[1.5px] shadow-2xl">
                            <div className="bg-white dark:bg-zinc-950 rounded-[22px] p-6 space-y-5">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-purple-500/10 rounded-xl">
                                            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500">Coach Stratégique</p>
                                            <p className="text-xs font-bold text-zinc-400 truncate max-w-[200px]">{advice.projectTitle}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onRemove(advice.id)}
                                        className="p-1 text-zinc-300 hover:text-zinc-500 dark:hover:text-zinc-100 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
                                        "{advice.content.action}"
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 space-y-2">
                                            <div className="flex items-center gap-2 text-purple-500">
                                                <Brain className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Le Pourquoi</span>
                                            </div>
                                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                                {advice.content.rationale}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 space-y-2">
                                            <div className="flex items-center gap-2 text-blue-500">
                                                <Lightbulb className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">L'Astuce Beta</span>
                                            </div>
                                            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                                {advice.content.tip}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        onClick={() => {
                                            onAction(advice.projectId);
                                            onRemove(advice.id);
                                        }}
                                        className="w-full h-14 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 hover:scale-[1.01] active:scale-[0.99] transition-all rounded-2xl text-sm font-black uppercase tracking-widest gap-3 shadow-xl shadow-purple-500/10"
                                    >
                                        Démarrer la micro-action <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Decorative background glow */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/10 to-blue-500/10 blur-2xl opacity-50 pointer-events-none" />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
