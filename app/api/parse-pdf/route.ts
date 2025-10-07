import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface UnstructuredElement {
  text?: string;
  type?: string;
  metadata?: {
    page_number?: number;
    page?: number;
    [key: string]: unknown;
  };
}

interface ParsedElement {
  text: string;
  pageNumber: number;
  elementType: string;
  metadata: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Send to Unstructured.io API
    const unstructuredFormData = new FormData();
    unstructuredFormData.append('files', file);
    unstructuredFormData.append('strategy', 'hi_res'); // High-resolution parsing
    unstructuredFormData.append('coordinates', 'true'); // Get coordinates
    unstructuredFormData.append('output_format', 'application/json');

    const response = await axios.post<UnstructuredElement[]>(
      process.env.UNSTRUCTURED_API_URL!,
      unstructuredFormData,
      {
        headers: {
          'unstructured-api-key': process.env.UNSTRUCTURED_API_KEY!,
        },
      }
    );

    const parsedData = response.data;
    
    // Extract page numbers and text
    const elementsWithPages: ParsedElement[] = parsedData.map((element: UnstructuredElement, index: number) => {
      return {
        text: element.text || '',
        pageNumber: element.metadata?.page_number || 
                   element.metadata?.page || 
                   Math.floor(index / 20) + 1, // Fallback: estimate page
        elementType: element.type || 'unknown',
        metadata: element.metadata || {}
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: elementsWithPages 
    });

  } catch (error: unknown) {
    console.error('PDF parsing error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse PDF';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
