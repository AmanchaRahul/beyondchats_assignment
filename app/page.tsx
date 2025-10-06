'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SourceSelector } from '@/components/source-selector';
import { PDFViewer } from '@/components/pdf-viewer';
import { QuizGenerator } from '@/components/quiz-generator';
import { ChatInterface } from '@/components/chat-interface';
import { ProgressDashboard } from '@/components/progress-dashboard';

export default function Home() {
  const [selectedPdf, setSelectedPdf] = useState<{
    id: string;
    url: string;
  } | null>(null);
  const [pdfContent, setPdfContent] = useState<string>('');

  const handlePdfSelect = async (pdfId: string, url: string) => {
    setSelectedPdf({ id: pdfId, url });
    
    // Parse PDF and extract content
    const response = await fetch(url);
    const blob = await response.blob();
    const formData = new FormData();
    formData.append('file', blob);
    
    const parseResponse = await fetch('/api/parse-pdf', {
      method: 'POST',
      body: formData,
    });
    
    const { data } = await parseResponse.json();
    const content = data.map((item: any) => item.text).join('\n');
    setPdfContent(content);

    // Create embeddings
    await fetch('/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfId,
        chunks: content.match(/.{1,500}/g) || [], // Split into 500 char chunks
      }),
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            StudyMate AI
          </h1>
          <p className="text-gray-600">
            Your intelligent study companion for revision
          </p>
        </header>

        <div className="mb-6">
          <SourceSelector onSelect={handlePdfSelect} />
        </div>

        {selectedPdf ? (
          <Tabs defaultValue="quiz" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="quiz">Quiz</TabsTrigger>
              <TabsTrigger value="pdf">PDF Viewer</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
            </TabsList>

            <TabsContent value="quiz" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="h-[600px]">
                  <PDFViewer url={selectedPdf.url} />
                </div>
                <div className="h-[600px] overflow-y-auto">
                  <QuizGenerator
                    pdfId={selectedPdf.id}
                    content={pdfContent}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pdf">
              <div className="h-[700px]">
                <PDFViewer url={selectedPdf.url} />
              </div>
            </TabsContent>

            <TabsContent value="chat">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="h-[600px]">
                  <PDFViewer url={selectedPdf.url} />
                </div>
                <div className="h-[600px]">
                  <ChatInterface pdfId={selectedPdf.id} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="progress">
              <ProgressDashboard pdfId={selectedPdf.id} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              Select or upload a PDF to get started
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
