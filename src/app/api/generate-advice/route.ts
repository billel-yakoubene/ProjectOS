import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { projectId, title, description, completedTasks, currentTask } = await req.json();
        const prompt = `
      Tu es un Coach de Productivité d'élite. L'utilisateur est bloqué sur une tâche du projet "${title}".
      Tâche actuelle : "${currentTask}"
      Description du projet : ${description}
      Tâches déjà complétées : ${completedTasks.join(', ') || 'Aucune'}

      Ton but est de briser la procrastination par une approche "Atomic Habits".
      Fournis une réponse UNIQUEMENT en JSON avec le format suivant :
      {
        "action": "La micro-action physique ou digitale de moins de 2 minutes",
        "rationale": "L'explication psychologique ultra-courte de pourquoi ça marche",
        "tip": "Une astuce bonus pour garder le momentum après cette action"
      }

      Sois percutant, empathique et expert.
    `;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: "Tu es un coach de productivité expert en psychologie de l'action." },
                { role: "user", content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 300,
        });

        const adviceJson = JSON.parse(response.choices[0].message.content || '{}');

        return NextResponse.json({ advice: adviceJson });
    } catch (error: any) {
        console.error('Error in advice-api:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
