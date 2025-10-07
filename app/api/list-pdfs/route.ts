import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase.storage
      .from('pdfs')
      .list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const pdfFiles = data
      ?.filter(file => file.name.toLowerCase().endsWith('.pdf'))
      .map(file => ({
        name: file.name,
        id: file.id,
        created_at: file.created_at,
        size: file.metadata?.size || 0,
      })) || [];

    return NextResponse.json({ success: true, pdfs: pdfFiles });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
