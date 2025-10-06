'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Youtube, ExternalLink, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


// Helper to extract meaningful topic from filename
function extractTopicFromFilename(filename: string): string {
  const cleanName = filename
    .replace(/^\d+_/, '') // Remove timestamp prefix
    .replace(/\.pdf$/i, '') // Remove .pdf extension
    .replace(/[_-]/g, ' ') // Replace underscores/dashes with spaces
    .toLowerCase();

  // Common patterns
  if (cleanName.includes('ncert') || cleanName.includes('keph')) {
    return 'NCERT Physics Class 11';
  }
  if (cleanName.includes('chemistry')) {
    return 'Chemistry';
  }
  if (cleanName.includes('math')) {
    return 'Mathematics';
  }
  if (cleanName.includes('biology')) {
    return 'Biology';
  }

  return cleanName;
}


interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  url: string;
  embedUrl: string;
}

interface YoutubeRecommendationsProps {
  pdfContent: string;
  pdfId: string;
}

export function YoutubeRecommendations({ pdfContent, pdfId }: YoutubeRecommendationsProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    // Auto-load recommendations when component mounts
    loadRecommendations();
    }, []);

    const loadRecommendations = async (topic?: string) => {
        setLoading(true);
        try {
            // Try to extract topic from PDF filename if no custom topic
            let searchTopic = topic;

            if (!searchTopic && pdfId) {
            searchTopic = extractTopicFromFilename(pdfId);
            console.log('Extracted topic from filename:', searchTopic);
            }

            const response = await fetch('/api/youtube-search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                topic: searchTopic || undefined,
                pdfContent: !searchTopic ? pdfContent.substring(0, 1000) : undefined,
            }),
            });

            const data = await response.json();

            if (data.success && data.videos) {
            setVideos(data.videos);
            setSearchQuery(data.searchQuery);
            } else {
            console.error('Failed to load videos:', data.error);
            }
        } catch (error) {
            console.error('Error loading YouTube recommendations:', error);
        } finally {
            setLoading(false);
        }
    };



  const handleCustomSearch = () => {
    if (customTopic.trim().length > 0) {
      loadRecommendations(customTopic);
    }
  };

  if (loading && videos.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-red-600 mb-4" />
            <p className="text-gray-600">Finding relevant educational videos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-6 w-6 text-red-600" />
            YouTube Video Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search for specific topic..."
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCustomSearch()}
            />
            <Button onClick={handleCustomSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          {searchQuery && (
            <p className="text-sm text-gray-600 mb-4">
              Showing results for: <span className="font-medium">{searchQuery}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {selectedVideo && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Now Playing</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVideo(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full">
              <iframe
                width="100%"
                height="100%"
                src={selectedVideo.embedUrl}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg"
              ></iframe>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold text-lg mb-2">{selectedVideo.title}</h3>
              <Badge variant="secondary" className="mb-2">
                {selectedVideo.channelTitle}
              </Badge>
              <p className="text-sm text-gray-600 line-clamp-3">
                {selectedVideo.description}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <Card
            key={video.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedVideo(video)}
          >
            <div className="relative">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full aspect-video object-cover rounded-t-lg"
              />
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                <Youtube className="h-3 w-3" />
                Watch
              </div>
            </div>
            <CardContent className="pt-4">
              <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                {video.title}
              </h3>
              <Badge variant="outline" className="text-xs mb-2">
                {video.channelTitle}
              </Badge>
              <p className="text-xs text-gray-600 line-clamp-2">
                {video.description}
              </p>
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2"
                onClick={(e) => e.stopPropagation()}
              >
                Open in YouTube
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && videos.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && videos.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Youtube className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No videos found. Try searching for a specific topic.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
