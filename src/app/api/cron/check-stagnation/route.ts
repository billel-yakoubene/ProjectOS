import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Security check
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    try {
        const fortyEightHoursAgo = new Date();
        fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

        // Find projects with no activity for 48h
        const { data: stagnantProjects, error } = await supabase
            .from('projects')
            .select(`
                id,
                title,
                user_id,
                last_activity_at,
                tasks (id, content, status, "order")
            `)
            .lt('last_activity_at', fortyEightHoursAgo.toISOString())
            .eq('status', 'active');

        if (error) throw error;

        const results = stagnantProjects.map(project => {
            const nextTask = project.tasks
                .filter((t: any) => t.status === 'todo')
                .sort((a: any, b: any) => a.order - b.order)[0];

            return {
                projectId: project.id,
                title: project.title,
                userId: project.user_id,
                lastActivity: project.last_activity_at,
                nextAction: nextTask ? nextTask.content : 'Aucune tâche pendante'
            };
        });

        return NextResponse.json({
            count: results.length,
            projects: results
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
