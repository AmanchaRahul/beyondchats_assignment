'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SourceSelector } from '@/components/source-selector';
import { PDFViewer } from '@/components/pdf-viewer';
import { QuizGenerator } from '@/components/quiz-generator';
import { ChatInterface } from '@/components/chat-interface';
import { ProgressDashboard } from '@/components/progress-dashboard';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Home() {
  const [selectedPdf, setSelectedPdf] = useState<{
    id: string;
    url: string;
  } | null>(null);
  const [pdfContent, setPdfContent] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePdfSelect = async (pdfId: string, url: string) => {
    setProcessing(true);
    setError(null);
    setSelectedPdf({ id: pdfId, url });
    
    try {
      console.log('Fetching PDF from:', url);
      
      // Fetch the PDF file
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('PDF blob size:', blob.size);
      
      // Parse PDF with Unstructured.io
      const formData = new FormData();
      formData.append('file', blob, pdfId);
      
      console.log('Parsing PDF with Unstructured.io...');
      const parseResponse = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });
      
      if (!parseResponse.ok) {
        throw new Error('Failed to parse PDF');
      }
      
      const { data, success } = await parseResponse.json();
      
      if (!success || !data) {
        throw new Error('PDF parsing returned no data');
      }
      
      console.log('PDF parsed successfully, items:', data.length);
      
      // Extract text content
      const content = data
        .map((item: any) => item.text || '')
        .filter((text: string) => text.trim().length > 0)
        .join('\n');
      
      console.log('Extracted content length:', content.length);
      setPdfContent(content);
      
      // Create embeddings in ChromaDB
      if (content.length > 100) {
        const chunks = content.match(/.{1,1000}/g) || [];
        console.log('Creating embeddings for', chunks.length, 'chunks');
        
        const embedResponse = await fetch('/api/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfId,
            chunks,
          }),
        });
        
        const embedResult = await embedResponse.json();
        console.log('Embeddings created:', embedResult.success);
      }
      
      console.log('PDF processing complete!');
    } catch (error: any) {
      console.error('Error processing PDF:', error);
      setError(error.message || 'Failed to process PDF. Please try again.');
    } finally {
      setProcessing(false);
    }
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

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {processing && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Processing PDF...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a minute</p>
            </div>
          </div>
        )}

        {!processing && selectedPdf && pdfContent && (
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
        )}

        {!processing && !selectedPdf && (
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
