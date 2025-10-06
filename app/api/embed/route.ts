import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateCollection } from '@/lib/chromadb';
import { openai } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { pdfId, chunks } = await req.json();

    // Get or create collection
    const collection = await getOrCreateCollection('pdf_embeddings');

    // Generate embeddings with OpenAI (we stick with this as you mentioned)
    const embeddings = await Promise.all(
      chunks.map(async (chunk: string) => {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: chunk,
        });
        return response.data[0].embedding;
      })
    );

    // Store in ChromaDB Cloud
    await collection.add({
      ids: chunks.map((_: any, i: number) => `${pdfId}_chunk_${i}`),
      embeddings: embeddings,
      documents: chunks,
      metadatas: chunks.map((_: any, i: number) => ({
        pdfId,
        chunkIndex: i,
      })),
    });

    return NextResponse.json({ success: true, message: 'Embeddings created successfully' });
  } catch (error) {
    console.error('Embedding error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create embeddings' },
      { status: 500 }
    );
  }
}
