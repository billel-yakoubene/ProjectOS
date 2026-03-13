'use client';

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Zap, ArrowRight, Trophy, Lightbulb, ArrowLeft, Clock, Play, Pause, RotateCcw, Volume2, VolumeX, Maximize2, Minimize2, Waves, Wind, Flame, Coffee, Info, BookOpen, ExternalLink } from "lucide-react";
import confetti from "canvas-confetti";
import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";

interface NextActionProps {
    task?: {
        id: string;
        content: string;
        projectTitle: string;
        duration_minutes?: number | null;
        description?: string | null;
    } | null;
    onComplete: (taskId: string) => Promise<void>;
    onRequestAdvice?: () => void;
    isGettingAdvice?: boolean;
    onBackToProjects?: () => void;
}

const AMBIANCE_MODES = [
    { id: 'deep', name: 'Concentration Profonde', icon: Waves, color: 'text-blue-400', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { id: 'flow', name: 'Flux Créatif', icon: Wind, color: 'text-emerald-400', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { id: 'energy', name: 'Énergie Pure', icon: Flame, color: 'text-orange-400', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
];

type TimerMode = 'work' | 'short' | 'long';

const TIMER_CONFIG = {
    work: { label: 'Focus', minutes: 25, color: 'from-purple-600/20 to-blue-600/20', accent: 'text-purple-400', border: 'border-purple-500/30' },
    short: { label: 'Petite Pause', minutes: 5, color: 'from-emerald-600/20 to-teal-600/20', accent: 'text-emerald-400', border: 'border-emerald-500/30' },
    long: { label: 'Grande Pause', minutes: 15, color: 'from-blue-600/20 to-indigo-600/20', accent: 'text-blue-400', border: 'border-blue-500/30' }
};

export default function NextAction({ task, onComplete, onRequestAdvice, isGettingAdvice, onBackToProjects }: NextActionProps) {
    const [isCompleting, setIsCompleting] = useState(false);
    const [mode, setMode] = useState<TimerMode>('work');
    const [timeLeft, setTimeLeft] = useState(TIMER_CONFIG.work.minutes * 60);
    const [isActive, setIsActive] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [ambiance, setAmbiance] = useState<string | null>(null);
    const [volume, setVolume] = useState(0.4);
    const [showDocs, setShowDocs] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

    // Helper to format description with links and line breaks
    const formattedDescription = useMemo(() => {
        if (!task?.description) return null;

        let content = task.description;

        const urlRegex = /(https?:\/\/[^\s]+)/g;
        content = content.replace(urlRegex, (url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-purple-400 underline hover:text-purple-300 inline-flex items-center gap-1">${url}</a>`;
        });

        const sectionRegex = /([A-Z][^:!?\n]{2,30}:)/g;
        content = content.replace(sectionRegex, (match) => {
            return `<div class="mt-6 mb-2 text-zinc-100 font-black uppercase tracking-widest text-[11px] flex items-center gap-2 border-b border-white/5 pb-1">${match}</div>`;
        });

        content = content.replace(/\n\n/g, '</div><div class="mt-4">');
        content = content.replace(/\n/g, '<br />');

        return `<div>${content}</div>`;
    }, [task?.description]);

    // Audio Control & Cleanup
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        };
    }, []);

    // Pomodoro Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            playNotification();
            toast.success(
                mode === 'work' ? "Session de travail terminée ! C'est l'heure d'une pause." :
                    "Pause terminée ! Prêt à repartir ?"
            );

            if (mode === 'work') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode]);

    const playNotification = () => {
        if (notificationAudioRef.current) {
            notificationAudioRef.current.play().catch(() => { });
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTimer = () => setIsActive(!isActive);

    const changeMode = (newMode: TimerMode) => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(TIMER_CONFIG[newMode].minutes * 60);
        if (newMode !== 'work') setShowDocs(false);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(TIMER_CONFIG[mode].minutes * 60);
    };

    const handleComplete = async () => {
        if (!task || isCompleting) return;

        setIsCompleting(true);

        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        try {
            await onComplete(task.id);
            changeMode('short');
        } finally {
            setIsCompleting(false);
            clearInterval(interval);
        }
    };

    const toggleAmbiance = (modeId: string) => {
        if (!audioRef.current) return;

        if (ambiance === modeId) {
            setAmbiance(null);
            audioRef.current.pause();
        } else {
            const modeItem = AMBIANCE_MODES.find(m => m.id === modeId);
            if (modeItem) {
                setAmbiance(modeId);
                audioRef.current.src = modeItem.url;
                audioRef.current.loop = true;
                audioRef.current.play().catch(() => {
                    console.log("Audio play blocked. Interact with the page first.");
                });
            }
        }
    };

    const totalTime = TIMER_CONFIG[mode].minutes * 60;
    const progress = (timeLeft / totalTime) * 100;

    return (
        <div className={`w-full transition-all duration-700 ${isFullScreen ? 'fixed inset-0 z-[100] bg-black overflow-y-auto flex items-start md:items-center justify-center p-4 md:p-12' : 'max-w-4xl mx-auto'}`}>
            <audio ref={audioRef} />
            <audio ref={notificationAudioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />

            <AnimatePresence mode="wait">
                {task ? (
                    <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="w-full"
                    >
                        <Card className={`relative overflow-hidden border-none bg-zinc-950 text-white shadow-2xl transition-all duration-700 ${isFullScreen ? 'w-full max-w-5xl my-auto' : ''}`}>
                            {/* Dynamic Background Gradient based on mode */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${TIMER_CONFIG[mode].color} transition-all duration-1000 pointer-events-none`} />

                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Zap className="w-64 h-64 text-white" />
                            </div>

                            <CardHeader className="relative z-10 pt-8 pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`px-2 py-0.5 rounded bg-white/10 border ${TIMER_CONFIG[mode].border} text-[10px] uppercase font-black tracking-widest ${TIMER_CONFIG[mode].accent}`}>
                                            {TIMER_CONFIG[mode].label}
                                        </div>
                                        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">•</div>
                                        <div className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest truncate">
                                            {task.projectTitle}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {mode === 'work' && (
                                            <button
                                                onClick={() => setShowDocs(!showDocs)}
                                                className={`p-2 rounded-full transition-colors ${showDocs ? 'bg-purple-500 text-white' : 'hover:bg-white/5 text-zinc-500 hover:text-white'}`}
                                                title="Documentation"
                                            >
                                                <BookOpen className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setIsFullScreen(!isFullScreen)}
                                            className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
                                        >
                                            {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <CardTitle className="text-4xl font-black tracking-tight leading-tight mb-8">
                                    {task.content}
                                </CardTitle>

                                <div className="space-y-8">
                                    <div className="flex flex-wrap items-center gap-3">
                                        {(['work', 'short', 'long'] as TimerMode[]).map((m) => (
                                            <button
                                                key={m}
                                                onClick={() => changeMode(m)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${mode === m ? 'bg-white text-zinc-950 shadow-xl scale-105' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}
                                            >
                                                {TIMER_CONFIG[m].label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="flex items-center gap-8 bg-zinc-900/40 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 group transition-all hover:bg-zinc-900/60 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]">
                                            <div className="relative">
                                                <svg className="w-28 h-28 transform -rotate-90">
                                                    <circle cx="56" cy="56" r="52" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                                                    <motion.circle
                                                        cx="56"
                                                        cy="56"
                                                        r="52"
                                                        stroke="currentColor"
                                                        strokeWidth="6"
                                                        fill="transparent"
                                                        strokeDasharray="326.7"
                                                        initial={{ strokeDashoffset: 0 }}
                                                        animate={{ strokeDashoffset: 326.7 * (1 - progress / 100) }}
                                                        className={TIMER_CONFIG[mode].accent}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center font-mono text-3xl font-black">
                                                    {formatTime(timeLeft)}
                                                </div>
                                            </div>

                                            <div className="flex-1 flex flex-col justify-center gap-4">
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        size="lg"
                                                        onClick={toggleTimer}
                                                        className={`h-16 w-16 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${isActive ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-white hover:bg-zinc-100 text-zinc-950'}`}
                                                    >
                                                        {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={resetTimer} className="h-12 w-12 rounded-full text-zinc-500 hover:text-white">
                                                        <RotateCcw className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {AMBIANCE_MODES.map((am) => (
                                                        <button
                                                            key={am.id}
                                                            onClick={() => toggleAmbiance(am.id)}
                                                            className={`p-3 rounded-2xl transition-all ${ambiance === am.id ? 'bg-white/20 shadow-lg' : 'hover:bg-white/5 opacity-40 hover:opacity-100'}`}
                                                        >
                                                            <am.icon className={`w-5 h-5 ${ambiance === am.id ? am.color : 'text-zinc-400'}`} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {!showDocs && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex flex-col items-center justify-center bg-zinc-900/20 rounded-[40px] p-8 border border-white/5 opacity-50"
                                                >
                                                    <Coffee className="w-12 h-12 text-zinc-700 mb-4" />
                                                    <p className="text-zinc-600 text-xs font-black uppercase tracking-widest text-center">
                                                        {mode === 'work' ? "Focalisez toute votre énergie sur la tâche" : "Prenez le temps de vous déconnecter"}
                                                    </p>
                                                </motion.div>
                                            )}

                                            {showDocs && (
                                                <motion.div
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="max-h-[220px] overflow-y-auto bg-zinc-900/60 border border-white/10 rounded-[40px] p-6 text-zinc-300 text-xs custom-scrollbar"
                                                >
                                                    <div className="flex items-center gap-2 mb-4 text-purple-400 font-bold uppercase tracking-widest text-[9px]">
                                                        <Info className="w-3 h-3" /> Guide Expert
                                                    </div>
                                                    <div className="description-content space-y-4" dangerouslySetInnerHTML={{ __html: formattedDescription || '' }} />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="relative z-10 space-y-6 pb-12 pt-6">
                                <div className="space-y-4">
                                    <Button
                                        onClick={handleComplete}
                                        disabled={isCompleting}
                                        className="w-full h-24 bg-white/5 hover:bg-white text-white hover:text-zinc-950 text-2xl font-black rounded-[40px] transition-all duration-500 transform hover:scale-[1.01] active:scale-[0.99] shadow-2xl group border border-white/10 hover:border-transparent"
                                    >
                                        {isCompleting ? (
                                            <Trophy className="w-10 h-10 animate-bounce text-purple-500" />
                                        ) : (
                                            <div className="flex items-center justify-center gap-4">
                                                MISSION ACCOMPLIE
                                                <div className="p-2 rounded-full bg-purple-500/20 group-hover:bg-purple-500 transition-colors">
                                                    <CheckCircle2 className="w-8 h-8 text-purple-400 group-hover:text-white transition-transform group-hover:scale-110" />
                                                </div>
                                            </div>
                                        )}
                                    </Button>

                                    <div className="grid grid-cols-2 gap-4">
                                        {onRequestAdvice && (
                                            <Button onClick={onRequestAdvice} disabled={isGettingAdvice || isCompleting} variant="ghost" className="bg-white/5 text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 gap-3 h-16 rounded-2xl border border-white/5 transition-all font-black text-xs uppercase">
                                                <Lightbulb className={`w-5 h-5 ${isGettingAdvice ? 'animate-pulse' : ''}`} />
                                                Conseil IA
                                            </Button>
                                        )}
                                        {onBackToProjects && (
                                            <Button onClick={onBackToProjects} variant="ghost" className="bg-white/5 text-zinc-500 hover:text-white hover:bg-white/5 gap-3 h-16 rounded-2xl border border-white/5 transition-all font-black text-xs uppercase">
                                                <ArrowLeft className="w-5 h-5" />
                                                Projets
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>

                            <div className="absolute bottom-0 left-0 h-1.5 bg-zinc-900 w-full">
                                <motion.div
                                    className={`h-full bg-current ${TIMER_CONFIG[mode].accent}`}
                                    initial={{ width: "100%" }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, ease: "linear" }}
                                />
                            </div>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="py-24 text-center space-y-8 bg-zinc-950 rounded-[48px] border border-white/5 shadow-2xl">
                        <div className="mx-auto w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center border border-white/5">
                            <Trophy className="w-16 h-16 text-purple-500" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-4xl font-black tracking-tight text-white">Esprit Libre.</h3>
                            <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-xs">Toutes les tâches sont terminées</p>
                        </div>
                        <Button onClick={onBackToProjects} className="bg-white text-zinc-950 hover:bg-zinc-200 rounded-full px-12 h-14 font-black text-lg transition-transform hover:scale-105 active:scale-95">Nouveau Projet</Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
            `}</style>
        </div>
    );
}
