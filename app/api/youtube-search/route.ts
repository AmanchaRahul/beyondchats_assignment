import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const { topic, pdfContent } = await req.json();

    if (!topic && !pdfContent) {
      return NextResponse.json(
        { success: false, error: 'Topic or PDF content is required' },
        { status: 400 }
      );
    }

    // Extract key topics from PDF content (first 500 chars for context)
    const searchQuery = topic || pdfContent.substring(0, 500);
    
    // Create a better search query
    const enhancedQuery = `${searchQuery} tutorial educational explanation`;

    console.log('Searching YouTube for:', enhancedQuery);

    const response = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part: 'snippet',
          q: enhancedQuery,
          type: 'video',
          maxResults: 6,
          videoEmbeddable: 'true',
          videoSyndicated: 'true',
          relevanceLanguage: 'en',
          safeSearch: 'strict',
          key: process.env.YOUTUBE_API_KEY,
        },
      }
    );

    const videos = response.data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
    }));

    console.log('Found', videos.length, 'YouTube videos');

    return NextResponse.json({ 
      success: true, 
      videos,
      searchQuery: enhancedQuery 
    });

  } catch (error: any) {
    console.error('YouTube search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to search YouTube',
        details: error.response?.data || error.toString()
      },
      { status: 500 }
    );
  }
}
