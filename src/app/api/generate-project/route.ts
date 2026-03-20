import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Force Node.js runtime (not Edge)
export const maxDuration = 60; // Vercel: allow up to 60 seconds for this API route

export async function POST(req: Request) {
    try {
        const { idea, userId } = await req.json();

        if (!idea) {
            return NextResponse.json({ error: "L'idée est requise" }, { status: 400 });
        }

        const N8N_WEBHOOK_URL = 'https://n8n-production-e94f.up.railway.app/webhook/generate-project';

        console.log('[generate-project] Forwarding idea to n8n:', idea);
        console.log('[generate-project] Webhook URL:', N8N_WEBHOOK_URL);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 55000); // 55s timeout

        try {
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idea, userId }),
                signal: controller.signal,
            });

            clearTimeout(timeout);

            console.log('[generate-project] n8n response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[generate-project] n8n error response:', errorText);
                let errorMessage = response.statusText;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorJson.error || errorMessage;
                } catch (e) {
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(`Erreur n8n: ${errorMessage}`);
            }

            const n8nData = await response.json();
            console.log('[generate-project] n8n success data:', JSON.stringify(n8nData));

            return NextResponse.json({
                success: true,
                projectId: n8nData.project_id,
                title: n8nData.project_title || n8nData.title,
                message: n8nData.message
            });

        } catch (fetchError: any) {
            clearTimeout(timeout);
            if (fetchError.name === 'AbortError') {
                console.error('[generate-project] Request timed out after 55s');
                return NextResponse.json({ error: 'Le serveur n8n met trop de temps à répondre (timeout 55s)' }, { status: 504 });
            }
            throw fetchError;
        }

    } catch (error: any) {
        console.error('[generate-project] API Error:', error.message);
        console.error('[generate-project] Error type:', error.name);
        console.error('[generate-project] Full error:', error);
        return NextResponse.json({
            error: error.message || 'Une erreur est survenue lors de la communication avec le service de capture',
        }, { status: 500 });
    }
}
