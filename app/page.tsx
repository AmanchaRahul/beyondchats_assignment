'use client';

import { useState } from 'react';
import { ChatInterface } from '@/components/chat-interface';
import { PDFViewerClient } from '@/components/pdf-viewer-client';
import { QuizGenerator } from '@/components/quiz-generator';
import { ProgressDashboard } from '@/components/progress-dashboard';
import { YoutubeRecommendations } from '@/components/youtube-recommendations';
import { SourceSelector } from '@/components/source-selector';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { 
  Menu, 
  X, 
  Plus, 
  MessageSquare, 
  BarChart3,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export default function Home() {
  const [selectedPdf, setSelectedPdf] = useState<{ id: string; url: string } | null>(null);
  const [pdfContent, setPdfContent] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showVideosPanel, setShowVideosPanel] = useState(false);

  const handlePdfSelect = async (pdfId: string, url: string) => {
    setProcessing(true);
    setError(null);
    setSelectedPdf({ id: pdfId, url });
    
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('file', blob, pdfId);
      
      const parseResponse = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });
      
      if (!parseResponse.ok) throw new Error('Failed to parse PDF');
      const { data, success } = await parseResponse.json();
      if (!success || !data) throw new Error('PDF parsing returned no data');
      
      const pageMap = new Map<number, string>();
      data.forEach((element: any) => {
        const pageNum = element.pageNumber || 1;
        const existingText = pageMap.get(pageNum) || '';
        pageMap.set(pageNum, existingText + '\n' + (element.text || ''));
      });
      
      const chunksWithPages: Array<{text: string, pageNumber: number, chunkIndex: number}> = [];
      let globalChunkIndex = 0;
      
      pageMap.forEach((pageText, pageNum) => {
        const cleanText = pageText.trim();
        if (cleanText.length > 0) {
          const chunkSize = 500;
          for (let i = 0; i < cleanText.length; i += chunkSize) {
            const chunkText = cleanText.substring(i, i + chunkSize);
            if (chunkText.trim().length > 50) {
              chunksWithPages.push({
                text: chunkText,
                pageNumber: pageNum,
                chunkIndex: globalChunkIndex++
              });
            }
          }
        }
      });
      
      const content = data
        .map((item: any) => item.text || '')
        .filter((text: string) => text.trim().length > 0)
        .join('\n');
      
      setPdfContent(content);
      
      if (chunksWithPages.length > 0) {
        await fetch('/api/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfId, chunks: chunksWithPages }),
        });
      }
    } catch (error: any) {
      setError(error.message || 'Failed to process PDF');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-100">
      {/* Left Sidebar - Dark */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#171717] border-r border-gray-800 transform transition-transform duration-200",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-white">StudyMate</h1>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-gray-400 hover:text-white"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">
                Recent Chats
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <MessageSquare className="h-4 w-4 mr-3" />
                <span className="truncate">Physics - Motion</span>
              </Button>
            </div>
          </div>

          <div className="p-4 border-t border-gray-800 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={() => setShowProgressModal(!showProgressModal)}
            >
              <BarChart3 className="h-4 w-4 mr-3" />
              Progress
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - REMOVED UPLOAD BUTTON */}
        <header className="h-14 border-b border-gray-800 bg-[#0a0a0a] flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-sm font-medium text-gray-300">
              {selectedPdf ? 'Chat with PDF' : 'Chat'}
            </h2>
          </div>
          
          {selectedPdf && (
            <div className="text-xs text-gray-500 truncate max-w-xs">
              {selectedPdf.id.split('_')[1] || selectedPdf.id}
            </div>
          )}
        </header>

        {error && (
          <Alert variant="destructive" className="m-4 bg-red-900/20 border-red-900">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content Grid */}
        <div className="flex-1 overflow-hidden flex">
          {/* Center - Chat Area */}
          <div className="flex-1 flex flex-col">
            {processing ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-gray-400">Processing PDF...</p>
                </div>
              </div>
            ) : (
              <ChatInterface
                pdfId={selectedPdf?.id || ''}
                onGenerateQuiz={() => setShowQuizModal(true)}
                onShowProgress={() => setShowProgressModal(true)}
                onShowVideos={() => setShowVideosPanel(true)}
                onPdfSelect={handlePdfSelect}
              />
            )}
          </div>

          {/* Right - PDF Viewer (Desktop Only) */}
          {selectedPdf && (
            <aside className="hidden xl:block w-[500px] border-l border-gray-800 bg-[#0a0a0a]">
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-hidden">
                  <PDFViewerClient url={selectedPdf.url} />
                </div>
                
                {showVideosPanel && pdfContent && (
                  <div className="border-t border-gray-800 p-4 max-h-64 overflow-y-auto bg-[#171717]">
                    <YoutubeRecommendations
                      pdfContent={pdfContent}
                      pdfId={selectedPdf.id}
                    />
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Quiz Modal - WITH ACCESSIBILITY */}
      <Sheet open={showQuizModal} onOpenChange={setShowQuizModal}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-[#171717] border-gray-800 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">Quiz Generator</SheetTitle>
            <SheetDescription className="text-gray-400">
              Test your knowledge with AI-generated questions
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedPdf && pdfContent && (
              <QuizGenerator pdfId={selectedPdf.id} content={pdfContent} />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Progress Modal - WITH ACCESSIBILITY */}
      <Sheet open={showProgressModal} onOpenChange={setShowProgressModal}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-[#171717] border-gray-800 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">Your Progress</SheetTitle>
            <SheetDescription className="text-gray-400">
              Track your learning journey and quiz performance
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ProgressDashboard pdfId={selectedPdf?.id} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
