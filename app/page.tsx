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
import { YoutubeRecommendations } from '@/components/youtube-recommendations';


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
      
      // Group elements by page and create chunks
      const pageMap = new Map<number, string>();
      
      data.forEach((element: any) => {
        const pageNum = element.pageNumber || 1;
        const existingText = pageMap.get(pageNum) || '';
        pageMap.set(pageNum, existingText + '\n' + (element.text || ''));
      });
      
      // Create chunks with page numbers (500 chars per chunk)
      const chunksWithPages: Array<{text: string, pageNumber: number, chunkIndex: number}> = [];
      let globalChunkIndex = 0;
      
      pageMap.forEach((pageText, pageNum) => {
        const cleanText = pageText.trim();
        if (cleanText.length > 0) {
          // Split page into ~500 character chunks
          const chunkSize = 500;
          for (let i = 0; i < cleanText.length; i += chunkSize) {
            const chunkText = cleanText.substring(i, i + chunkSize);
            if (chunkText.trim().length > 50) { // Only store meaningful chunks
              chunksWithPages.push({
                text: chunkText,
                pageNumber: pageNum,
                chunkIndex: globalChunkIndex++
              });
            }
          }
        }
      });
      
      // Extract full content for quiz generation
      const content = data
        .map((item: any) => item.text || '')
        .filter((text: string) => text.trim().length > 0)
        .join('\n');
      
      console.log('Extracted content length:', content.length);
      console.log('Created chunks with pages:', chunksWithPages.length);
      setPdfContent(content);
      
      // Create embeddings in ChromaDB
      if (chunksWithPages.length > 0) {
        console.log('Creating embeddings for', chunksWithPages.length, 'chunks');
        
        const embedResponse = await fetch('/api/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfId,
            chunks: chunksWithPages,
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="quiz">Quiz</TabsTrigger>
              <TabsTrigger value="pdf">PDF Viewer</TabsTrigger>
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
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

            <TabsContent value="chat" className="h-[calc(100vh-12rem)]">
              <ChatInterface pdfId={selectedPdf.id} />
            </TabsContent>


            <TabsContent value="videos">
              <YoutubeRecommendations 
                pdfContent={pdfContent}
                pdfId={selectedPdf.id}
              />
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
