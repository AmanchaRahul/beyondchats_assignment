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

interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
}

interface ChatInterfaceProps {
  chatId: string;
  chat?: Chat;
  pdfId: string;
  onGenerateQuiz?: () => void;
  onShowProgress?: () => void;
  onShowVideos?: () => void;
  onPdfSelect?: (id: string, url: string) => void;
  onChatUpdate?: (chatId: string, title: string, messages: ChatMessage[]) => void;
}

let idCounter = 0;
function generateUniqueId(): string {
  return `${Date.now()}_${++idCounter}_${Math.random().toString(36).substring(2, 9)}`;
}

export function ChatInterface({
  chatId,
  chat,
  pdfId,
  onGenerateQuiz,
  onShowProgress,
  onShowVideos,
  onPdfSelect,
  onChatUpdate,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(chat?.messages || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chat) {
      setMessages(chat.messages);
    }
  }, [chat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
  if (!input.trim()) return;
  
  // If no chatId, create one automatically
  let activeChatId = chatId;
  if (!activeChatId) {
    activeChatId = Date.now().toString();
    console.warn('No chatId provided, created:', activeChatId);
  }

  const userMessage: ChatMessage = {
    id: generateUniqueId(),
    role: 'user',
    content: input,
  };

  const newMessages = [...messages, userMessage];
  setMessages(newMessages);
  
  // Update chat title if first message
  const title = messages.length === 0 ? input.substring(0, 30) + '...' : (chat?.title || 'New conversation');
  if (onChatUpdate) {
    onChatUpdate(activeChatId, title, newMessages);
  }

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

    const finalMessages = [...newMessages, assistantMessage];
    setMessages(finalMessages);
    
    if (onChatUpdate) {
      onChatUpdate(activeChatId, title, finalMessages);
    }

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
              <h2 className="text-3xl font-semibold text-white mb-3">
                How can I help you today?
              </h2>
              <p className="text-gray-400 text-center max-w-md">
                Ask me anything about your coursebook. I'll provide answers with citations from the source material.
              </p>
            </div>
          ) : (
          <div className="max-w-3xl mx-auto px-4 py-8 w-full">
            {messages.map((msg) => (
              <div key={msg.id} className={cn(
                "mb-8 flex",
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}>
                <div className={cn(
                  "max-w-[80%] space-y-2",
                  msg.role === 'user' ? 'items-end' : 'items-start'
                )}>
                  {/* Message Bubble */}
                  <div className={cn(
                    "rounded-2xl px-5 py-3",
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#2f2f2f] text-gray-100'
                  )}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>

                  {/* Action Buttons (Assistant Only) */}
                  {msg.role === 'assistant' && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {onGenerateQuiz && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onGenerateQuiz}
                          className="bg-[#1a1a1a] border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs"
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
                          className="bg-[#1a1a1a] border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs"
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
                          className="bg-[#1a1a1a] border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs"
                        >
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Progress
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="space-y-1 mt-2">
                      <p className="text-xs text-gray-500 font-medium">Sources:</p>
                      {msg.citations.map((citation, idx) => (
                        <div
                          key={`citation-${msg.id}-${idx}`}
                          className="text-xs bg-[#1a1a1a] border border-gray-800 rounded-lg p-2"
                        >
                          <Badge variant="secondary" className="text-xs mb-1 bg-gray-800 text-gray-300">
                            Page {citation.page}
                          </Badge>
                          <p className="text-gray-400 italic">"{citation.quote}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="mb-8 flex justify-start">
                <div className="bg-[#2f2f2f] rounded-2xl px-5 py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - ChatGPT Style */}
      <div className="border-t border-gray-800 bg-[#0a0a0a] p-4">
        <div className="max-w-3xl mx-auto w-full">
          <div className="relative flex items-end gap-2 bg-[#2f2f2f] rounded-3xl px-4 py-3">
            {/* Plus Button for Upload */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 h-8 w-8 rounded-full hover:bg-gray-700 text-gray-400"
                >
                  <Plus className="h-5 w-5" />
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
