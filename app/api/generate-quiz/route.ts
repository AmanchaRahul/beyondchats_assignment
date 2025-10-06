import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { content, questionCount = 30 } = await req.json();

    if (!content || content.length < 100) {
      return NextResponse.json(
        { success: false, error: 'Content is too short to generate questions' },
        { status: 400 }
      );
    }

    // Limit content to avoid token limits (use first 8000 characters)
    const limitedContent = content.substring(0, 8000);

    const prompt = `Generate exactly 30 questions from the following content:
- 10 Multiple Choice Questions (MCQs) with 4 options each
- 10 Short Answer Questions (SAQs) 
- 10 Long Answer Questions (LAQs)

Content: ${limitedContent}

IMPORTANT: Return ONLY valid JSON. No markdown, no explanations, just the JSON array.

Format:
[
  {
    "id": "mcq_1",
    "type": "mcq",
    "question": "What is...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "This is correct because..."
  },
  {
    "id": "saq_1",
    "type": "saq",
    "question": "Explain...",
    "correctAnswer": "The answer is...",
    "explanation": "This is the explanation..."
  },
  {
    "id": "laq_1",
    "type": "laq",
    "question": "Describe in detail...",
    "correctAnswer": "The detailed answer is...",
    "explanation": "This is the explanation..."
  }
]`;

    console.log('Generating quiz with OpenAI...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a quiz generator. Return ONLY valid JSON array. No markdown formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content_response = response.choices[0].message.content;
    
    if (!content_response) {
      throw new Error('OpenAI returned empty response');
    }

    // Clean up response (remove markdown if present)
    let cleanedResponse = content_response.trim();
    
    // Remove markdown code blocks if present
    const jsonCodeBlockPattern = /``````/;
    const codeBlockPattern = /``````/;
    
    if (jsonCodeBlockPattern.test(cleanedResponse)) {
      const match = cleanedResponse.match(jsonCodeBlockPattern);
      if (match && match[1]) {
        cleanedResponse = match[1].trim();
      }
    } else if (codeBlockPattern.test(cleanedResponse)) {
      const match = cleanedResponse.match(codeBlockPattern);
      if (match && match[1]) {
        cleanedResponse = match[1].trim();
      }
    }

    console.log('Parsing quiz response...');
    const questions = JSON.parse(cleanedResponse);

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid questions format');
    }

    console.log(`Generated ${questions.length} questions successfully`);

    return NextResponse.json({ 
      success: true, 
      questions,
      count: questions.length 
    });

  } catch (error: any) {
    console.error('Quiz generation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to generate quiz',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
