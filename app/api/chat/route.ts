import { NextRequest, NextResponse } from 'next/server';
import { getChromaClient } from '@/lib/chromadb';
import { openai } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { message, pdfId } = await req.json();

    // Generate embedding for user query
    const queryEmbedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: message,
    });

    // Search ChromaDB for relevant chunks
    const client = getChromaClient();
    const collection = await client.getCollection({ name: 'pdf_embeddings' });
    
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding.data[0].embedding],
      nResults: 5,
      where: pdfId ? { pdfId } : undefined,
    });

    const context = results.documents[0].join('\n\n');
    const metadatas = results.metadatas[0];

    // Generate response with GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a helpful tutor. Answer the question based on the following context from the textbook. 
          Always cite the page number when referencing information.
          
          Context: ${context}`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;

    // Extract citations from metadata
    const citations = metadatas.map((meta: any, idx: number) => ({
      page: meta.pageNumber || 'Unknown',
      text: results.documents[0][idx].substring(0, 150) + '...',
    }));

    return NextResponse.json({
      success: true,
      response,
      citations,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat' },
      { status: 500 }
    );
  }
}
