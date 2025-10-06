import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCollection } from '@/lib/chromadb';
import { openai } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { message, pdfId } = await req.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('Processing chat message:', message);
    console.log('PDF ID:', pdfId);

    // Generate embedding for user query with OpenAI
    const queryEmbedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: message,
    });

    console.log('Query embedding generated');

    // Get collection and search ChromaDB Cloud for relevant chunks
    const collection = await getOrCreateCollection('pdf_embeddings');
    
    console.log('Searching ChromaDB...');
    
    // Build where filter only if pdfId is provided and valid
    const whereFilter = pdfId && pdfId !== 'undefined' ? { pdfId } : undefined;
    
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding.data[0].embedding],
      nResults: 5,
      ...(whereFilter && { where: whereFilter }),
    });

    console.log('ChromaDB search results:', results.documents[0]?.length || 0, 'chunks found');

    // Check if we have results
    if (!results.documents || !results.documents[0] || results.documents[0].length === 0) {
      return NextResponse.json({
        success: true,
        response: "I couldn't find relevant information in the uploaded PDFs. The content might not have been processed yet, or your question might be outside the scope of the document. Please try rephrasing your question or make sure the PDF has been fully processed.",
        citations: [],
      });
    }

    const context = results.documents[0]
      .filter((doc: string) => doc && doc.trim().length > 0)
      .join('\n\n');
    
    const metadatas = results.metadatas[0] || [];

    console.log('Generating response with GPT-4...');

    // Generate response with GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful tutor assistant. Answer questions based on the following context from the textbook. 
          Provide clear, accurate, and educational answers. 
          If the context doesn't contain enough information, say so politely.
          
          Context from textbook:
          ${context}`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const response = completion.choices[0].message.content || "I couldn't generate a response. Please try again.";

    console.log('Response generated successfully');

    // Extract citations from metadata
    const citations = metadatas
      .map((meta: any, idx: number) => {
        const doc = results.documents[0][idx];
        if (!doc || doc.trim().length === 0) return null;
        
        return {
          page: meta?.pageNumber || meta?.chunkIndex || 'Unknown',
          text: doc.substring(0, 150) + (doc.length > 150 ? '...' : ''),
        };
      })
      .filter((citation: any) => citation !== null);

    return NextResponse.json({
      success: true,
      response,
      citations,
    });

  } catch (error: any) {
    console.error('Chat error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to process chat',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
