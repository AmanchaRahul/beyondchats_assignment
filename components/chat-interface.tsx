'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { 
  Send, 
  Sparkles, 
  Youtube, 
  BarChart3, 
  Loader2, 
  User, 
  Bot, 
  Plus 
} from 'lucide-react';
import { SourceSelector } from '@/components/source-selector';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{page: number, quote: string}>;
}

interface ChatInterfaceProps {
  pdfId: string;
  onGenerateQuiz?: () => void;
  onShowProgress?: () => void;
  onShowVideos?: () => void;
  onPdfSelect?: (id: string, url: string) => void;
}

let idCounter = 0;
function generateUniqueId(): string {
  return `${Date.now()}_${++idCounter}_${Math.random().toString(36).substring(2, 9)}`;
}

export function ChatInterface({
  pdfId,
  onGenerateQuiz,
  onShowProgress,
  onShowVideos,
  onPdfSelect,  // ADD THIS
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: generateUniqueId(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, pdfId }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: generateUniqueId(),
        role: 'assistant',
        content: data.response || 'Sorry, I encountered an error.',
        citations: data.citations || [],
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-3">
              How can I help you today?
            </h2>
            <p className="text-gray-400 text-center max-w-md">
              Ask me anything about your coursebook. I'll provide answers with citations from the source material.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                <div className={cn(
                  "flex gap-4",
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}>
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                    msg.role === 'user' 
                      ? 'bg-blue-600' 
                      : 'bg-gradient-to-br from-green-500 to-emerald-600'
                  )}>
                    {msg.role === 'user' ? (
                      <User className="h-5 w-5 text-white" />
                    ) : (
                      <Bot className="h-5 w-5 text-white" />
                    )}
                  </div>

                  <div className={cn(
                    "flex-1 space-y-2",
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  )}>
                    <div className={cn(
                      "inline-block rounded-2xl px-4 py-3 max-w-[85%]",
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#1a1a1a] text-gray-100 border border-gray-800'
                    )}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>

                    {msg.role === 'assistant' && (
                      <div className="flex gap-2 mt-2">
                        {onGenerateQuiz && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onGenerateQuiz}
                            className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Generate Quiz
                          </Button>
                        )}
                        {onShowVideos && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onShowVideos}
                            className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                          >
                            <Youtube className="h-3 w-3 mr-1" />
                            Videos
                          </Button>
                        )}
                        {onShowProgress && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onShowProgress}
                            className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                          >
                            <BarChart3 className="h-3 w-3 mr-1" />
                            Progress
                          </Button>
                        )}
                      </div>
                    )}

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="space-y-1 mt-2 max-w-[85%]">
                        <p className="text-xs text-gray-500 font-medium">Sources:</p>
                        {msg.citations.map((citation, idx) => (
                          <div
                            key={`citation-${msg.id}-${idx}`}
                            className="text-xs bg-[#1a1a1a] border border-gray-800 rounded-lg p-2"
                          >
                            <Badge variant="secondary" className="text-xs mb-1 bg-gray-800">
                              Page {citation.page}
                            </Badge>
                            <p className="text-gray-400 italic">"{citation.quote}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl px-4 py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - ChatGPT Style with + Button */}
      <div className="border-t border-gray-800 bg-[#0a0a0a] p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-[#2f2f2f] rounded-3xl px-4 py-3 shadow-lg">
            {/* Plus Button for Upload */}
            
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 h-8 w-8 rounded-full hover:bg-gray-700"
                >
                  <Plus className="h-5 w-5 text-gray-400" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-96 bg-[#171717] border-gray-800">
                <SheetHeader>
                  <SheetTitle className="text-white">Upload Document</SheetTitle>
                  <SheetDescription className="text-gray-400">
                    Select a PDF from your library or upload a new one
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <SourceSelector onSelect={(id, url) => {
                    if (onPdfSelect) {
                      onPdfSelect(id, url);
                    }
                  }} />
                </div>
              </SheetContent>
            </Sheet>


            {/* Text Input */}
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message StudyMate..."
              disabled={loading}
              className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 max-h-32 text-gray-100 placeholder:text-gray-500 min-h-[24px]"
              rows={1}
              style={{ height: 'auto' }}
            />

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              size="icon"
              className="flex-shrink-0 h-8 w-8 rounded-full bg-white hover:bg-gray-200 disabled:bg-gray-700 text-black"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-2">
            StudyMate can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
}
