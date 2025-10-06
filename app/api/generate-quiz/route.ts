import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { content, questionCount = 30 } = await req.json();

    const prompt = `Generate exactly ${questionCount} questions from the following content:
    - 10 Multiple Choice Questions (MCQs) with 4 options each
    - 10 Short Answer Questions (SAQs)
    - 10 Long Answer Questions (LAQs)
    
    Content: ${content}
    
    Return ONLY a valid JSON array with this structure:
    [
      {
        "type": "mcq",
        "question": "...",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "A",
        "explanation": "..."
      },
      {
        "type": "saq",
        "question": "...",
        "correctAnswer": "...",
        "explanation": "..."
      },
      {
        "type": "laq",
        "question": "...",
        "correctAnswer": "...",
        "explanation": "..."
      }
    ]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const questions = JSON.parse(response.choices[0].message.content!);
    return NextResponse.json({ success: true, questions });
  } catch (error) {
    console.error('Quiz generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}
