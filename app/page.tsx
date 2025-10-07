'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/chat-interface';
import { PDFViewerClient } from '@/components/pdf-viewer-client';
import { QuizGenerator } from '@/components/quiz-generator';
import { ProgressDashboard } from '@/components/progress-dashboard';
import { YoutubeRecommendations } from '@/components/youtube-recommendations';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { 
  Menu, 
  X, 
  Plus, 
  MessageSquare, 
  BarChart3,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface Chat {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: Array<{page: number, quote: string}>;
  }>;
}
type ChatMessageLocal = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ page: number; quote: string }>;
};

// Types for parsed PDF elements and chunk metadata
interface ParsedElement {
  text?: string;
  pageNumber?: number;
}

interface ChunkWithPageMeta {
  text: string;
  pageNumber: number;
  chunkIndex: number;
}

export default function Home() {
  const [selectedPdf, setSelectedPdf] = useState<{ id: string; url: string } | null>(null);
  const [pdfContent, setPdfContent] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showVideosPanel, setShowVideosPanel] = useState(false);
  
  // Chat management
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // AUTO-CREATE INITIAL CHAT ON MOUNT
  useEffect(() => {
    if (chats.length === 0) {
      const initialChat: Chat = {
        id: Date.now().toString(),
        title: 'New conversation',
        messages: [],
      };
      setChats([initialChat]);
      setCurrentChatId(initialChat.id);
    }
  }, [chats.length]);

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New conversation',
      messages: [],
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

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
      (data as ParsedElement[]).forEach((element) => {
        const pageNum = element.pageNumber || 1;
        const existingText = pageMap.get(pageNum) || '';
        pageMap.set(pageNum, existingText + '\n' + (element.text || ''));
      });
      
      const chunksWithPages: Array<ChunkWithPageMeta> = [];
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
      
      const content = (data as ParsedElement[])
        .map((item) => item.text || '')
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process PDF';
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleChatUpdate = (chatId: string, title: string, messages: ChatMessageLocal[]) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, title, messages } : chat
    ));
  };

  // HANDLERS WITH DEBUG LOGS
  const handleOpenQuiz = () => {
    setShowQuizModal(true);
  };

  const handleOpenVideos = () => {
    setShowVideosPanel(true);
  };

  const handleOpenProgress = () => {
    setShowProgressModal(true);
  };

  const currentChat = chats.find(c => c.id === currentChatId);

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-100">
      {/* Left Sidebar - Collapsible */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 bg-[#171717] border-r border-gray-800 transform transition-all duration-200 flex",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isSidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex flex-col h-full flex-1">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-4">
              {!isSidebarCollapsed && (
                <>
                  <h1 className="text-xl font-semibold text-white">StudyMate</h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden text-gray-400 hover:text-white"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
            <Button 
              onClick={handleNewChat}
              className={cn(
                "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700",
                isSidebarCollapsed ? "w-full p-2" : "w-full"
              )}
            >
              <Plus className="h-4 w-4" />
              {!isSidebarCollapsed && <span className="ml-2">New Chat</span>}
            </Button>
          </div>

          {!isSidebarCollapsed && (
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs text-gray-500 uppercase tracking-wider">
                  Recent Chats
                </div>
                {chats.map(chat => (
                  <Button
                    key={chat.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800",
                      currentChatId === chat.id && "bg-gray-800 text-white"
                    )}
                    onClick={() => setCurrentChatId(chat.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-3 flex-shrink-0" />
                    <span className="truncate">{chat.title}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t border-gray-800 space-y-2">
            {!isSidebarCollapsed && (
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
                onClick={handleOpenProgress}
              >
                <BarChart3 className="h-4 w-4 mr-3" />
                Progress
              </Button>
            )}
          </div>
        </div>

        {/* Collapse Button */}
        <div className="border-l border-gray-800 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="h-full rounded-none text-gray-500 hover:text-white hover:bg-gray-800"
          >
            {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && !isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
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
        <div className="flex-1 overflow-hidden flex min-w-0">
          {/* Center - Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {processing ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-emerald-500" />
                  <p className="text-gray-400">Processing PDF...</p>
                </div>
              </div>
            ) : (
              <ChatInterface
                chatId={currentChatId || ''}
                chat={currentChat}
                pdfId={selectedPdf?.id || ''}
                onGenerateQuiz={handleOpenQuiz}
                onShowProgress={handleOpenProgress}
                onShowVideos={handleOpenVideos}
                onPdfSelect={handlePdfSelect}
                onChatUpdate={handleChatUpdate}
              />
            )}
          </div>

          {/* Right - PDF Viewer (Desktop Only) */}
          {selectedPdf && !processing && (
            <aside className="hidden xl:block w-[500px] border-l border-gray-800 bg-[#0a0a0a] relative min-w-0">
              
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-hidden">
                  <PDFViewerClient url={selectedPdf.url} />
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Quiz Modal */}
      <Sheet open={showQuizModal} onOpenChange={setShowQuizModal}>
        <SheetContent side="right" className="w-full sm:max-w-2xl bg-[#171717] border-gray-800 overflow-y-auto">
          <SheetHeader className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowQuizModal(false)}
              className="absolute -top-2 -right-2 bg-[#2f2f2f] hover:bg-gray-700 text-gray-300 hover:text-white h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
            <SheetTitle className="text-white">Quiz Generator</SheetTitle>
            <SheetDescription className="text-gray-400">
              Test your knowledge with AI-generated questions
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedPdf && pdfContent ? (
              <QuizGenerator pdfId={selectedPdf.id} content={pdfContent} />
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-400">Please upload a PDF first</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Videos Panel as Sheet */}
      <Sheet open={showVideosPanel} onOpenChange={setShowVideosPanel}>
        <SheetContent side="right" className="w-full sm:max-w-4xl bg-[#171717] border-gray-800 overflow-y-auto">
          <SheetHeader className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowVideosPanel(false)}
              className="absolute -top-2 -right-2 bg-[#2f2f2f] hover:bg-gray-700 text-gray-300 hover:text-white h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
            <SheetTitle className="text-white">Video Recommendations</SheetTitle>
            <SheetDescription className="text-gray-400">
              Educational videos related to your coursebook
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedPdf && pdfContent ? (
              <YoutubeRecommendations pdfContent={pdfContent} pdfId={selectedPdf.id} />
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-400">Please upload a PDF first</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Progress Modal */}
      <Sheet open={showProgressModal} onOpenChange={setShowProgressModal}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-3xl bg-[#171717] border-gray-800 overflow-y-auto"
        >
          <SheetHeader className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowProgressModal(false)}
              className="absolute -top-2 -right-2 bg-[#2f2f2f] hover:bg-gray-700 text-gray-300 hover:text-white h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
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
