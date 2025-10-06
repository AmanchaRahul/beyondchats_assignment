import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pdfId = searchParams.get('pdfId');

    let query = supabase
      .from('quiz_attempts')
      .select('*')
      .order('timestamp', { ascending: false });

    if (pdfId) {
      query = query.eq('pdfId', pdfId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, attempts: data });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}
