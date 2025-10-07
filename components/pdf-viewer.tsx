'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const PDFViewerClient = dynamic(
  () => import('./pdf-viewer-client').then((mod) => mod.PDFViewerClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-[#1a1a1a]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading PDF viewer...</p>
        </div>
      </div>
    ),
  }
);

interface PDFViewerProps {
  url: string;
}

export function PDFViewer({ url }: PDFViewerProps) {
  return <PDFViewerClient url={url} />;
}
