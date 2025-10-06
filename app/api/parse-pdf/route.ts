import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

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

    console.log('Parsing PDF with Unstructured.io...');

    // Send to Unstructured.io API
    const unstructuredFormData = new FormData();
    unstructuredFormData.append('files', file);
    unstructuredFormData.append('strategy', 'hi_res'); // High-resolution parsing
    unstructuredFormData.append('coordinates', 'true'); // Get coordinates
    unstructuredFormData.append('output_format', 'application/json');

    const response = await axios.post(
      process.env.UNSTRUCTURED_API_URL!,
      unstructuredFormData,
      {
        headers: {
          'unstructured-api-key': process.env.UNSTRUCTURED_API_KEY!,
        },
      }
    );

    const parsedData = response.data;
    
    console.log('PDF parsed successfully. Elements:', parsedData.length);

    // Extract page numbers and text
    const elementsWithPages = parsedData.map((element: any, index: number) => {
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

  } catch (error: any) {
    console.error('PDF parsing error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}
