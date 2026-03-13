'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');
    const description = searchParams.get('description') || searchParams.get('message');

    return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] rounded-full" />
            </div>

            <Card className="w-full max-w-md border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-md bg-white/5 dark:bg-zinc-950/50 shadow-2xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500">
                        <ShieldAlert className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tight text-white">Erreur de Connexion</CardTitle>
                    <CardDescription className="text-zinc-400 font-medium text-balance">
                        {error === 'access_denied' && "L'accès a été refusé. Avez-vous annulé la connexion ?"}
                        {error === 'exchange_error' && `Erreur lors de l'échange du jeton : ${description}`}
                        {error === 'no_code' && "Aucun code d'authentification n'a été reçu."}
                        {!error && "Une erreur est survenue lors de l'authentification. Veuillez réessayer."}
                        {error && error !== 'access_denied' && error !== 'exchange_error' && error !== 'no_code' && `Erreur : ${error}. ${description || ''}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/">
                        <Button variant="outline" className="w-full h-12 border-zinc-800 hover:bg-zinc-900 text-zinc-300 gap-2">
                            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}

export default function AuthCodeError() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-zinc-300 border-t-purple-600 rounded-full animate-spin" />
            </div>
        }>
            <ErrorContent />
        </Suspense>
    );
}
