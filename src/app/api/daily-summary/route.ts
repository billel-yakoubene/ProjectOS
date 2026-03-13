import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Daily Summary API Endpoint
 * Called by n8n cron job at 8 AM.
 */
export async function POST(req: Request) {
    try {
        // Basic Auth Check for n8n
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.INTERNAL_WEBHOOK_TOKEN}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch all active projects and their next tasks
        const { data: projects, error } = await supabase
            .from('projects')
            .select(`
        title,
        tasks(content, status)
      `)
            .eq('status', 'active')
            .eq('tasks.status', 'todo');

        if (error) throw error;

        // 2. Format the "Mission of the Day"
        const summary = projects?.map(p => {
            const nextTask = p.tasks?.[0]?.content || "Aucune tâche planifiée";
            return `🚀 **${p.title}** : ${nextTask}`;
        }).join('\n');

        // 3. Return the payload to n8n for delivery (Email/Discord/Push)
        return NextResponse.json({
            success: true,
            mission_of_the_day: summary || "Aujourd'hui, c'est le moment de définir de nouveaux objectifs !",
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Daily Summary Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
