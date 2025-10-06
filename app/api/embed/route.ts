import { NextRequest, NextResponse } from 'next/server';
import { getChromaClient } from '@/lib/chromadb';
import { openai } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { pdfId, chunks } = await req.json();

    const client = getChromaClient();
    const collection = await client.getOrCreateCollection({
      name: 'pdf_embeddings',
    });

    // Generate embeddings with OpenAI
    const embeddings = await Promise.all(
      chunks.map(async (chunk: string) => {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: chunk,
        });
        return response.data[0].embedding;
      })
    );

    // Store in ChromaDB
    await collection.add({
      ids: chunks.map((_: any, i: number) => `${pdfId}_chunk_${i}`),
      embeddings: embeddings,
      documents: chunks,
      metadatas: chunks.map((_: any, i: number) => ({
        pdfId,
        chunkIndex: i,
      })),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Embedding error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create embeddings' },
      { status: 500 }
    );
  }
}
