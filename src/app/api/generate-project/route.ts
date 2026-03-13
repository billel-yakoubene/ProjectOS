import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { idea, userId } = await req.json();

        if (!idea) {
            return NextResponse.json({ error: 'L\'idée est requise' }, { status: 400 });
        }

        // Forwarding to n8n webhook
        // Note: Using 'webhook' path, not 'webhook-test' for production-like workflow
        const N8N_WEBHOOK_URL = `${process.env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678'}/webhook/generate-project`;

        console.log('Forwarding idea to n8n:', idea);

        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idea, userId }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = response.statusText;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorJson.error || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            console.error('n8n error:', errorMessage);
            throw new Error(`Erreur n8n: ${errorMessage}`);
        }

        const n8nData = await response.json();

        // Mapping n8n fields to frontend expected fields
        return NextResponse.json({
            success: true,
            projectId: n8nData.project_id,
            title: n8nData.project_title || n8nData.title,
            message: n8nData.message
        });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({
            error: error.message || 'Une erreur est survenue lors de la communication avec le service de capture',
        }, { status: 500 });
    }
}
