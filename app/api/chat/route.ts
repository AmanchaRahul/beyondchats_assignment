import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCollection } from '@/lib/chromadb';
import { openai } from '@/lib/openai';

// Define interface for ChromaDB metadata
interface ChromaMetadata {
  pageNumber?: number;
  pdfId?: string;
  [key: string]: unknown;
}

// Define interface for citation
interface Citation {
  page: number;
  quote: string;
}

export async function POST(req: NextRequest) {
  try {
    const { message, pdfId } = await req.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Generate embedding for user query
    const queryEmbedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: message,
    });

    // Get collection and search
    const collection = await getOrCreateCollection('pdf_embeddings');
    
    const whereFilter = pdfId && pdfId !== 'undefined' ? { pdfId } : undefined;
    
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding.data[0].embedding],
      nResults: 5,
      ...(whereFilter && { where: whereFilter }),
    });

    // Check if we have results
    if (!results.documents || !results.documents[0] || results.documents[0].length === 0) {
      return NextResponse.json({
        success: true,
        response: "I couldn't find relevant information in the PDF. Please try rephrasing your question.",
        citations: [],
      });
    }

    // Build context with citations
    const contextParts: string[] = [];
    const citations: Citation[] = [];
    
    results.documents[0].forEach((doc, idx) => {
      // Filter out null documents
      if (doc === null) return;
      
      const metadata = results.metadatas[0][idx] as ChromaMetadata;
      const pageNum = metadata?.pageNumber || idx + 1;
      
      // Get 2-3 lines (first 150 chars as a quote)
      const quote = doc.substring(0, 150).trim() + (doc.length > 150 ? '...' : '');
      
      contextParts.push(`[Page ${pageNum}]: ${doc}`);
      citations.push({
        page: pageNum,
        quote: quote
      });
    });

    const context = contextParts.join('\n\n');

    // Generate response with citation instructions
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful tutor assistant. Answer questions based ONLY on the provided context from the textbook.

IMPORTANT CITATION RULES:
- ALWAYS cite page numbers when making factual claims
- Format citations as: "According to page X: 'quoted text'"
- Include 1-2 direct quotes per major point
- Never make claims without citing the specific page
- If information isn't in the context, state: "This information is not available in the provided pages"

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

    const response = completion.choices[0].message.content || "No response generated.";

    return NextResponse.json({
      success: true,
      response,
      citations: citations.slice(0, 3), // Top 3 most relevant
    });

  } catch (error: unknown) {
    console.error('Chat error:', error);
    
    // Type guard for error handling
    const errorMessage = error instanceof Error ? error.message : 'Failed to process chat';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
