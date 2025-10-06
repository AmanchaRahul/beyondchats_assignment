'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Menu, Bot, User, Loader2 } from 'lucide-react';
import { ChatSidebar } from '@/components/chat-sidebar';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{page: number, quote: string}>;
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
  messages: ChatMessage[];
}

interface ChatInterfaceProps {
  pdfId: string;
}

// Helper function to generate unique IDs
let idCounter = 0;
function generateUniqueId(): string {
  return `${Date.now()}_${++idCounter}_${Math.random().toString(36).substring(2, 9)}`;
}

export function ChatInterface({ pdfId }: ChatInterfaceProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentChat = chats.find(c => c.id === currentChatId);
  const messages = currentChat?.messages || [];

  useEffect(() => {
    // Create initial chat if none exists
    if (chats.length === 0) {
      handleNewChat();
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewChat = () => {
    const newChat: Chat = {
      id: generateUniqueId(),
      title: 'New conversation',
      timestamp: new Date(),
      messages: [],
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setIsMobileSidebarOpen(false);
  };

  const handleDeleteChat = (chatId: string) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (currentChatId === chatId) {
      const remainingChats = chats.filter(c => c.id !== chatId);
      setCurrentChatId(remainingChats[0]?.id || null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !currentChatId) return;

    const userMessage: ChatMessage = {
      id: generateUniqueId(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    // Add user message
    setChats(prev => prev.map(chat =>
      chat.id === currentChatId
        ? { 
            ...chat, 
            messages: [...chat.messages, userMessage], 
            title: chat.messages.length === 0 ? input.substring(0, 30) : chat.title 
          }
        : chat
    ));

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
        timestamp: new Date(),
      };

      setChats(prev => prev.map(chat =>
        chat.id === currentChatId
          ? { ...chat, messages: [...chat.messages, assistantMessage] }
          : chat
      ));

    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full bg-white">
      {/* Sidebar */}
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        isMobileOpen={isMobileSidebarOpen}
        onMobileToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b border-gray-200 flex items-center px-4 bg-white">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-800">
            {currentChat?.title || 'StudyMate AI'}
          </h1>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Bot className="h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                How can I help you today?
              </h2>
              <p className="text-gray-600 max-w-md">
                Ask me anything about your coursebook. I'll provide answers with citations from the source material.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-8">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-4 mb-8",
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  )}

                  <div className={cn(
                    "flex-1 space-y-2",
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  )}>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 max-w-[85%] inline-block",
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white ml-auto'
                          : 'bg-gray-100 text-gray-900'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="space-y-1 mt-2 max-w-[85%]">
                        {msg.citations.map((citation, idx) => (
                          <div
                            key={`citation-${msg.id}-${idx}`}
                            className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-2"
                          >
                            <Badge variant="secondary" className="text-xs mb-1">
                              Page {citation.page}
                            </Badge>
                            <p className="text-gray-700 italic">"{citation.quote}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-4 mb-8">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-white border border-gray-300 rounded-2xl p-2 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Message StudyMate..."
                disabled={loading}
                className="flex-1 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 max-h-32 bg-transparent"
                rows={1}
              />
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                size="icon"
                className="rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
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
    </div>
  );
}
