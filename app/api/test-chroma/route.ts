import { NextRequest, NextResponse } from 'next/server';
import { chromaClient } from '@/lib/chromadb';

export async function GET(req: NextRequest) {
  try {
    console.log('Testing ChromaDB connection...');
    
    const collections = await chromaClient.listCollections();
    
    console.log('Collections:', collections);
    
    return NextResponse.json({
      success: true,
      collections: collections,
      message: 'ChromaDB connection successful',
    });
  } catch (error: any) {
    console.error('ChromaDB test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
