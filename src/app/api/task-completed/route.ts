import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { taskId, userId, actionType } = body;

        if (!taskId || !userId) {
            return NextResponse.json({ error: 'taskId and userId are required' }, { status: 400 });
        }

        // Forwarding to n8n webhook
        const N8N_WEBHOOK_URL = `${process.env.N8N_WEBHOOK_BASE_URL || 'http://localhost:5678'}/webhook/task-completed`;

        console.log('Forwarding task completion to n8n:', { taskId, userId });

        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task_id: taskId,
                user_id: userId,
                action_type: actionType || 'task_completed',
                metadata: { timestamp: new Date().toISOString() }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('n8n error:', errorText);
            throw new Error(`n8n error: ${errorText}`);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('API Error (task-completed):', error);
        return NextResponse.json({
            error: error.message || 'Error communicating with n8n',
        }, { status: 500 });
    }
}
