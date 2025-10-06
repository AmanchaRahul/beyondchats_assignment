'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import PDFViewerClient with SSR disabled
const PDFViewerClient = dynamic(
  () => import('./pdf-viewer-client').then((mod) => mod.PDFViewerClient),
  {
    ssr: false, // Disable server-side rendering
    loading: () => (
      <div className="flex items-center justify-center h-full border rounded-lg bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading PDF viewer...</p>
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
