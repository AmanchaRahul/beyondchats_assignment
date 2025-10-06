import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCollection } from '@/lib/chromadb';
import { openai } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { message, pdfId } = await req.json();

    // Generate embedding for user query with OpenAI
    const queryEmbedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: message,
    });

    // Get collection and search ChromaDB Cloud for relevant chunks
    const collection = await getOrCreateCollection('pdf_embeddings');
    
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding.data[0].embedding],
      nResults: 5,
      where: pdfId ? { pdfId } : undefined,
    });

    // Check if we have results
    if (!results.documents[0] || results.documents[0].length === 0) {
      return NextResponse.json({
        success: true,
        response: "I couldn't find relevant information in the uploaded PDFs. Please make sure the PDF has been processed.",
        citations: [],
      });
    }

    const context = results.documents[0].join('\n\n');
    const metadatas = results.metadatas[0];

    // Generate response with GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a helpful tutor. Answer the question based on the following context from the textbook. 
          Always cite information clearly and explain concepts thoroughly.
          
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
      page: meta.pageNumber || meta.chunkIndex || 'Unknown',
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
