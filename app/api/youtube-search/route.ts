import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();

    const response = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part: 'snippet',
          q: topic + ' educational tutorial',
          type: 'video',
          maxResults: 5,
          key: process.env.YOUTUBE_API_KEY,
        },
      }
    );

    const videos = response.data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

    return NextResponse.json({ success: true, videos });
  } catch (error) {
    console.error('YouTube search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search YouTube' },
      { status: 500 }
    );
  }
}
