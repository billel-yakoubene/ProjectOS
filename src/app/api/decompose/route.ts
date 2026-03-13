import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

// Initialize OpenAI only if the key exists to avoid module evaluation errors
const getOpenAIClient = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'votre_cle_ici') {
        throw new Error('OpenAI API Key is missing or invalid. Please check your .env.local file.');
    }
    return new OpenAI({ apiKey });
};


const DecomposeSchema = z.object({
    steps: z.array(z.object({
        content: z.string(),
        description: z.string().optional(),
        order: z.number(),
    })).max(5),
});

export async function POST(req: Request) {
    try {
        const { idea } = await req.json();

        if (!idea) {
            return NextResponse.json({ error: 'Idea is required' }, { status: 400 });
        }

        let openai;
        try {
            openai = getOpenAIClient();
        } catch (e: any) {
            console.warn('OpenAI Key missing, using mock data');
            // Mock fallback for demonstration
            return NextResponse.json({
                steps: [
                    { content: `Étape 1 pour : ${idea}`, order: 1 },
                    { content: "Analyse des besoins", order: 2 },
                    { content: "Planification des tâches", order: 3 },
                    { content: "Mise en œuvre initiale", order: 4 },
                    { content: "Révision et finalisation", order: 5 },
                ]
            });
        }

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a task decomposer. Break the user\'s idea into a maximum of 5 logical, actionable steps. Respond ONLY with a JSON object containing a "steps" array. Each step should have "content", "description" (rich text with explanations, expert tips, and 2-3 useful web links starting with https://), and "order" (starting from 1).'
                },
                {
                    role: 'user',
                    content: idea
                }
            ],
            response_format: { type: 'json_object' },
        });

        const rawData = JSON.parse(response.choices[0].message.content || '{}');
        const validatedData = DecomposeSchema.parse(rawData);

        return NextResponse.json(validatedData);
    } catch (error: any) {
        console.error('Decomposer Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to decompose idea',
            details: error.stack
        }, { status: 500 });
    }
}
