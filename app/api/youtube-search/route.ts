import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { openai } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { topic, pdfContent } = await req.json();

    if (!topic && !pdfContent) {
      return NextResponse.json(
        { success: false, error: 'Topic or PDF content is required' },
        { status: 400 }
      );
    }

    let searchQuery = topic;

    // If no manual topic, extract key topics from PDF using GPT
    if (!topic && pdfContent) {
      // Extract a concise topic from the content for searching
      
      try {
        const topicExtraction = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Extract the main subject/topic from this educational content in 3-5 keywords. Be specific and educational.'
            },
            {
              role: 'user',
              content: pdfContent.substring(0, 2000) // First 2000 chars for context
            }
          ],
          temperature: 0.3,
          max_tokens: 50,
        });

        searchQuery = topicExtraction.choices[0].message.content?.trim() || 'physics education';
        
      } catch (extractError) {
        console.error('Topic extraction failed, using fallback');
        // Fallback: Try to find common educational keywords
        const educationalKeywords = [
          'physics', 'chemistry', 'mathematics', 'biology', 
          'science', 'NCERT', 'class', 'chapter'
        ];
        
        const foundKeywords = educationalKeywords.filter(keyword => 
          pdfContent.toLowerCase().includes(keyword)
        );
        
        searchQuery = foundKeywords.length > 0 
          ? foundKeywords.slice(0, 3).join(' ') 
          : 'educational tutorial';
      }
    }

    const enhancedQuery = `${searchQuery} tutorial explanation`;

    // Perform YouTube search

    if (!process.env.YOUTUBE_API_KEY) {
      console.warn('YouTube API key not set; returning mock data');
      return getMockVideos(enhancedQuery);
    }

    try {
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
            videoDuration: 'medium', // 4-20 minutes
            order: 'relevance',
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

      // Return videos found

      return NextResponse.json({ 
        success: true, 
        videos,
        searchQuery: enhancedQuery 
      });

    } catch (apiError: any) {
      console.error('YouTube API error:', apiError.response?.data || apiError.message);
      
      if (apiError.response?.status === 403) {
        console.warn('YouTube API quota exceeded; returning mock data');
        return getMockVideos(enhancedQuery);
      }
      
      throw apiError;
    }

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

function getMockVideos(query: string) {
  const mockVideos = [
    {
      id: 'dQw4w9WgXcQ',
      title: 'NCERT Physics Class 11 Complete Tutorial',
      description: 'A comprehensive guide to understanding NCERT Class 11 Physics including all chapters.',
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      channelTitle: 'Physics Wallah',
      publishedAt: new Date().toISOString(),
      url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query),
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
    {
      id: 'jNQXAC9IVRw',
      title: 'Units and Measurements - Physics Tutorial',
      description: 'Learn SI units, measurements, and dimensional analysis in detail.',
      thumbnail: 'https://i.ytimg.com/vi/jNQXAC9IVRw/mqdefault.jpg',
      channelTitle: 'Vedantu',
      publishedAt: new Date().toISOString(),
      url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query),
      embedUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw',
    },
    {
      id: 'kJQP7kiw5Fk',
      title: 'Motion in a Straight Line Explained',
      description: 'Understanding kinematics and motion concepts with solved examples.',
      thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg',
      channelTitle: 'Unacademy',
      publishedAt: new Date().toISOString(),
      url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query),
      embedUrl: 'https://www.youtube.com/embed/kJQP7kiw5Fk',
    },
    {
      id: '3fumBcKC6RE',
      title: 'Laws of Motion - Newton\'s Laws',
      description: 'Complete explanation of Newton\'s three laws with real-world applications.',
      thumbnail: 'https://i.ytimg.com/vi/3fumBcKC6RE/mqdefault.jpg',
      channelTitle: 'Khan Academy',
      publishedAt: new Date().toISOString(),
      url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query),
      embedUrl: 'https://www.youtube.com/embed/3fumBcKC6RE',
    },
    {
      id: 'MfhjkfocRR0',
      title: 'Work, Energy and Power Tutorial',
      description: 'Understanding energy conservation and power calculations.',
      thumbnail: 'https://i.ytimg.com/vi/MfhjkfocRR0/mqdefault.jpg',
      channelTitle: 'BYJU\'S',
      publishedAt: new Date().toISOString(),
      url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query),
      embedUrl: 'https://www.youtube.com/embed/MfhjkfocRR0',
    },
    {
      id: 'V-_O7nl0Ii0',
      title: 'System of Particles and Rotational Motion',
      description: 'Center of mass, moment of inertia, and rotational dynamics explained.',
      thumbnail: 'https://i.ytimg.com/vi/V-_O7nl0Ii0/mqdefault.jpg',
      channelTitle: 'Physics Wallah',
      publishedAt: new Date().toISOString(),
      url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query),
      embedUrl: 'https://www.youtube.com/embed/V-_O7nl0Ii0',
    },
  ];

  return NextResponse.json({
    success: true,
    videos: mockVideos,
    searchQuery: query,
    note: 'Demo videos - Configure YouTube API for live results',
  });
}
