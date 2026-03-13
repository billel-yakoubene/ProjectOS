import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

interface SmartCaptureProps {
    onProjectCreated?: () => void;
}

export default function SmartCapture({ onProjectCreated }: SmartCaptureProps) {
    const [idea, setIdea] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize Web Speech API
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'fr-FR';

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    setIdea(prev => (prev ? prev + ' ' : '') + finalTranscript);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
                toast.error("Erreur lors de la capture vocale");
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }
    }, []);

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            toast.error("La reconnaissance vocale n'est pas supportée par votre navigateur.");
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            setIsRecording(true);
            recognitionRef.current.start();
            toast.info("Je vous écoute... Décrivez votre projet.");
        }
    };

    const handleGenerate = async () => {
        if (!idea.trim()) {
            toast.error("Veuillez saisir une idée avant de continuer");
            return;
        }

        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || '00000000-0000-0000-0000-000000000000';

            const response = await fetch('/api/generate-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idea, userId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Une erreur est survenue lors de la génération");
            }

            const data = await response.json();

            toast.success(`Projet "${data.title}" créé avec succès !`);
            setIdea('');

            if (onProjectCreated) {
                onProjectCreated();
            }

        } catch (error: any) {
            console.error('Capture Error:', error);
            toast.error(error.message || "Impossible de transformer l'idée en projet");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-md bg-white/50 dark:bg-zinc-950/50 shadow-2xl relative overflow-hidden group">
            {/* Animating gradient border effect */}
            <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${isRecording ? 'from-red-500 via-orange-500 to-red-500' : 'from-purple-500 via-blue-500 to-purple-500'} bg-[length:200%_auto] animate-gradient-x`} />

            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${isRecording ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-purple-500/10 text-purple-500'}`}>
                        {isRecording ? <Mic className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                    </div>
                    {isRecording ? 'Capture Vocale en cours...' : 'Moteur de Capture'}
                </CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400 font-medium">
                    Parlez ou écrivez, l'IA s'occupe de la structure.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="relative group/textarea">
                    <Textarea
                        placeholder="Quelle est votre idée ? Décrivez-la ou cliquez sur le micro..."
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        className={`min-h-[160px] text-lg leading-relaxed resize-none border-zinc-200 dark:border-zinc-800 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/5 transition-all duration-300 bg-white/50 dark:bg-zinc-900/50 ${isRecording ? 'border-red-500/30 ring-4 ring-red-500/5' : ''}`}
                        disabled={isLoading}
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-4">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={toggleRecording}
                            className={`h-12 w-12 rounded-full transition-all duration-500 ${isRecording ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/40' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                        >
                            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </Button>
                        <div className="text-xs text-zinc-400 font-mono">
                            {idea.length} chars
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleGenerate}
                    disabled={isLoading || !idea.trim() || isRecording}
                    className="w-full h-14 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-purple-500/10 text-base font-bold"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                            Analyse en cours par l'IA...
                        </>
                    ) : (
                        <>
                            Transformer en Projet
                            <Sparkles className="ml-2 w-5 h-5 opacity-50" />
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
