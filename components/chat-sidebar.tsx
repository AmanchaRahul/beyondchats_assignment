'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, MessageSquare, Trash2, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Chat {
  id: string;
  title: string;
  timestamp: Date;
}

interface ChatSidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

export function ChatSidebar({
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  isMobileOpen,
  onMobileToggle,
}: ChatSidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 text-gray-100 flex flex-col transform transition-transform duration-200 ease-in-out",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">StudyMate AI</h2>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={onMobileToggle}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <Button
            onClick={onNewChat}
            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Chat History */}
        <ScrollArea className="flex-1 px-2 py-4">
          <div className="space-y-1">
            {chats.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No chats yet
              </p>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={cn(
                    "group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors",
                    currentChatId === chat.id
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                  )}
                  onClick={() => onSelectChat(chat.id)}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-sm truncate">{chat.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-red-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChat(chat.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            Powered by OpenAI & ChromaDB
          </p>
        </div>
      </aside>
    </>
  );
}
