import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const attemptData = await req.json();
    
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert([attemptData]);

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Save attempt error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save attempt' },
      { status: 500 }
    );
  }
}
