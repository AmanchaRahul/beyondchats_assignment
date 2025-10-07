'use client';

import { useCallback, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Youtube, ExternalLink, Search, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function extractTopicFromFilename(filename: string): string {
  const cleanName = filename
    .replace(/^\d+_/, '')
    .replace(/\.pdf$/i, '')
    .replace(/[_-]/g, ' ')
    .toLowerCase();

  if (cleanName.includes('ncert') || cleanName.includes('keph')) {
    return 'NCERT Physics Class 11';
  }
  if (cleanName.includes('chemistry')) return 'Chemistry';
  if (cleanName.includes('math')) return 'Mathematics';
  if (cleanName.includes('biology')) return 'Biology';

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
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadRecommendations = useCallback(async (topic?: string) => {
    setLoading(true);
    try {
      let searchTopic = topic;

      if (!searchTopic && pdfId) {
        searchTopic = extractTopicFromFilename(pdfId);
      }

      const response = await fetch('/api/youtube-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: searchTopic || undefined,
          pdfContent: !searchTopic ? pdfContent.substring(0, 1000) : undefined,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      if (data.success && data.videos) {
        setVideos(data.videos);
        setSearchQuery(data.searchQuery);
      } else {
        setVideos([]);
      }
    } catch (error: unknown) {
      console.error('Error loading YouTube recommendations:', error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [pdfContent, pdfId]);

  useEffect(() => {
    if (!hasLoaded && pdfContent && pdfContent.length > 100) {
      loadRecommendations();
      setHasLoaded(true);
    }
  }, [pdfContent, hasLoaded, loadRecommendations]);

  const handleCustomSearch = () => {
    if (customTopic.trim().length > 0) {
      loadRecommendations(customTopic);
    }
  };

  if (loading && videos.length === 0) {
    return (
      <Card className="bg-[#1a1a1a] border-gray-800">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-red-600 mb-4" />
            <p className="text-gray-400">Finding relevant educational videos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#1a1a1a] border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Youtube className="h-6 w-6 text-red-600" />
            Video Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search for specific topic..."
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomSearch()}
              className="bg-[#0a0a0a] border-gray-700 text-gray-200 placeholder:text-gray-500"
            />
            <Button 
              onClick={handleCustomSearch} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          {searchQuery && (
            <p className="text-sm text-gray-400 mb-4">
              Showing results for: <span className="font-medium text-gray-300">{searchQuery}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {selectedVideo && (
        <Card className="bg-[#1a1a1a] border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white">Now Playing</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVideo(null)}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={selectedVideo.embedUrl}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="mt-4">
              <h3 className="font-semibold text-lg text-white mb-2">{selectedVideo.title}</h3>
              <Badge variant="secondary" className="mb-2 bg-gray-800 text-gray-300">
                {selectedVideo.channelTitle}
              </Badge>
              <p className="text-sm text-gray-400 line-clamp-3">
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
            className="cursor-pointer hover:border-gray-600 transition-all bg-[#1a1a1a] border-gray-800 hover:shadow-lg"
            onClick={() => setSelectedVideo(video)}
          >
            <div className="relative group">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full aspect-video object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute bottom-2 right-2 bg-black/90 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                <Youtube className="h-3 w-3 text-red-600" />
                Watch
              </div>
            </div>
            <CardContent className="pt-4">
              <h3 className="font-semibold text-sm line-clamp-2 mb-2 text-gray-200">
                {video.title}
              </h3>
              <Badge variant="outline" className="text-xs mb-2 border-gray-700 text-gray-400">
                {video.channelTitle}
              </Badge>
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                {video.description}
              </p>
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
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
        <Card className="bg-[#1a1a1a] border-gray-800">
          <CardContent className="pt-6">
            <div className="text-center text-gray-500 py-12">
              <Youtube className="h-12 w-12 mx-auto mb-4 text-gray-700" />
              <p>No videos found. Try searching for a specific topic.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
