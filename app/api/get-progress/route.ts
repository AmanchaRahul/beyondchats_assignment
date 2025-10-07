import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pdfId = searchParams.get('pdfId');

    // Check if table exists first
    let query = supabase
      .from('quiz_attempts')
      .select('*')
      .order('timestamp', { ascending: false });

    if (pdfId && pdfId !== 'undefined') {
      query = query.eq('pdf_id', pdfId);
    }

    const { data, error } = await query;

    // If table doesn't exist, return empty array instead of error
    if (error) {
      console.error('Supabase error:', error);
      
      // Return empty data if table doesn't exist yet
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return NextResponse.json({ 
          success: true, 
          attempts: [],
          message: 'No quiz attempts found yet' 
        });
      }
      
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      attempts: data || [] 
    });
  } catch (error: unknown) {
    console.error('Get progress error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch progress';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        attempts: [] // Return empty array on error
      },
      { status: 200 } // Return 200 to prevent app crash
    );
  }
}
