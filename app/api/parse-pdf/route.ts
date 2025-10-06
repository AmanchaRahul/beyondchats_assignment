import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    // Send to Unstructured.io API
    const unstructuredFormData = new FormData();
    unstructuredFormData.append('files', file);

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
    return NextResponse.json({ success: true, data: parsedData });
  } catch (error) {
    console.error('PDF parsing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to parse PDF' },
      { status: 500 }
    );
  }
}
