'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, AlertCircle, RefreshCw } from 'lucide-react';

import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs`;

interface PDFViewerClientProps {
  url: string;
}

export function PDFViewerClient({ url }: PDFViewerClientProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF load error:', error);
    setError('Failed to load PDF. Please check CORS settings.');
    setLoading(false);
  }

  function handleRetry() {
    setError(null);
    setLoading(true);
  }

  const pdfFile = {
    url: url,
    httpHeaders: {},
    withCredentials: false,
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* PDF Controls - Dark Theme */}
      <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-[#171717]">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
            disabled={pageNumber <= 1 || loading || !!error}
            className="h-8 w-8 p-0 bg-[#2f2f2f] border-0 text-gray-300 hover:bg-gray-700 hover:text-white disabled:bg-gray-800 disabled:text-gray-600"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-gray-300 min-w-[80px] text-center">
            {loading ? 'Loading...' : error ? 'Error' : `${pageNumber} / ${numPages}`}
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
            disabled={pageNumber >= numPages || loading || !!error}
            className="h-8 w-8 p-0 bg-[#2f2f2f] border-0 text-gray-300 hover:bg-gray-700 hover:text-white disabled:bg-gray-800 disabled:text-gray-600"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
            disabled={loading || !!error}
            className="h-8 w-8 p-0 bg-[#2f2f2f] border-0 text-gray-300 hover:bg-gray-700 hover:text-white disabled:bg-gray-800 disabled:text-gray-600"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-gray-300 min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setScale(prev => Math.min(2.0, prev + 0.1))}
            disabled={loading || !!error}
            className="h-8 w-8 p-0 bg-[#2f2f2f] border-0 text-gray-300 hover:bg-gray-700 hover:text-white disabled:bg-gray-800 disabled:text-gray-600"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Display Area */}
      <div className="flex-1 overflow-auto bg-[#1a1a1a] flex items-center justify-center p-4">
        {error ? (
          <div className="text-center max-w-md">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="font-semibold mb-2 text-red-400">PDF Load Error</p>
            <p className="text-sm text-gray-400 mb-4">{error}</p>
            <p className="text-xs text-gray-500 mb-4">
              Make sure your Supabase storage bucket has public access enabled.
            </p>
            <Button 
              onClick={handleRetry}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : (
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading PDF...</p>
              </div>
            }
            className="flex justify-center"
          >
            <Page 
              pageNumber={pageNumber} 
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-2xl"
              scale={scale}
            />
          </Document>
        )}
      </div>
    </div>
  );
}
