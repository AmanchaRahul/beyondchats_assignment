import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCollection } from '@/lib/chromadb';
import { openai } from '@/lib/openai';

interface ChunkWithMetadata {
  text: string;
  pageNumber: number;
  chunkIndex: number;
}

export async function POST(req: NextRequest) {
  try {
    const { pdfId, chunks } = await req.json();

    if (!chunks || chunks.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No chunks provided' },
        { status: 400 }
      );
    }


    // Get or create collection
    const collection = await getOrCreateCollection('pdf_embeddings');

    // Generate embeddings with OpenAI
    const embeddings = await Promise.all(
      chunks.map(async (chunk: ChunkWithMetadata) => {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: chunk.text,
        });
        return response.data[0].embedding;
      })
    );


    // Store in ChromaDB Cloud with proper metadata
    await collection.add({
      ids: chunks.map((_: any, i: number) => `${pdfId}_chunk_${i}`),
      embeddings: embeddings,
      documents: chunks.map((chunk: ChunkWithMetadata) => chunk.text),
      metadatas: chunks.map((chunk: ChunkWithMetadata, i: number) => ({
        pdfId,
        chunkIndex: i,
        pageNumber: chunk.pageNumber || 1,
        text: chunk.text.substring(0, 500), // Store first 500 chars in metadata
      })),
    });


    return NextResponse.json({ 
      success: true, 
      message: 'Embeddings created successfully',
      chunksProcessed: chunks.length 
    });

  } catch (error: any) {
    console.error('Embedding error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create embeddings' },
      { status: 500 }
    );
  }
}
