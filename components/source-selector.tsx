'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload, FileText, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SourceSelectorProps {
  onSelect: (pdfId: string, url: string) => void;
}

interface StoredPDF {
  name: string;
  id: string;
  created_at: string;
}

export function SourceSelector({ onSelect }: SourceSelectorProps) {
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [storedPdfs, setStoredPdfs] = useState<StoredPDF[]>([]);
  const [loadingPdfs, setLoadingPdfs] = useState(true);

  // Fetch all PDFs from Supabase on component mount
  useEffect(() => {
    fetchStoredPdfs();
  }, []);

  const fetchStoredPdfs = async () => {
    setLoadingPdfs(true);
    try {
      const response = await fetch('/api/list-pdfs');
      const data = await response.json();

      if (data.success) {
        setStoredPdfs(data.pdfs);
      }
    } catch (error) {
      console.error('Failed to fetch stored PDFs:', error);
    } finally {
      setLoadingPdfs(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileName = `${Date.now()}_${file.name}`;
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { error } = await supabase.storage
        .from('pdfs')
        .upload(fileName, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('pdfs')
        .getPublicUrl(fileName);

      // Refresh the list after upload
      await fetchStoredPdfs();

      setTimeout(() => {
        onSelect(fileName, publicUrl);
        setUploading(false);
      }, 500);

    } catch (error: unknown) {
      console.error('Upload error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert('Failed to upload PDF: ' + message);
      setUploading(false);
    }
  };

  const handlePreloadedSelect = () => {
    if (!selectedSource) return;
    
    const { data: { publicUrl } } = supabase.storage
      .from('pdfs')
      .getPublicUrl(selectedSource);

    onSelect(selectedSource, publicUrl);
  };

  // Helper to get clean display name
  const getDisplayName = (filename: string) => {
    // Remove timestamp prefix (e.g., "1728123456_filename.pdf" -> "filename.pdf")
    const withoutTimestamp = filename.replace(/^\d+_/, '');
    // Remove .pdf extension for display
    return withoutTimestamp.replace(/\.pdf$/i, '');
  };

  return (
    <Card className="bg-[#1a1a1a] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Select PDF Source</CardTitle>
        <CardDescription className="text-gray-400">
          Choose from your uploaded PDFs or upload a new coursebook
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stored PDFs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="preloaded" className="text-sm font-medium text-gray-300">
              Your PDFs ({storedPdfs.length})
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchStoredPdfs}
              disabled={loadingPdfs}
              className="h-7 px-2 text-gray-400 hover:text-white"
            >
              <RefreshCw className={`h-3 w-3 ${loadingPdfs ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {loadingPdfs ? (
            <div className="flex items-center justify-center h-10 bg-[#0a0a0a] border border-gray-700 rounded-md">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-500 mr-2" />
              <span className="text-sm text-gray-400">Loading PDFs...</span>
            </div>
          ) : storedPdfs.length === 0 ? (
            <div className="flex items-center justify-center h-10 bg-[#0a0a0a] border border-gray-700 rounded-md">
              <span className="text-sm text-gray-500">No PDFs found. Upload one below.</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="flex-1 bg-[#0a0a0a] border-gray-700 text-gray-300">
                  <SelectValue placeholder="Select a PDF" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-gray-700 max-h-80">
                  {storedPdfs.map((pdf) => (
                    <SelectItem 
                      key={pdf.name} 
                      value={pdf.name} 
                      className="text-gray-300"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3 text-gray-500" />
                        <span className="truncate max-w-xs">
                          {getDisplayName(pdf.name)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handlePreloadedSelect}
                disabled={!selectedSource}
                className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-gray-800 text-xs px-3 py-1 h-8"
              >
                Load PDF
              </Button>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#1a1a1a] px-2 text-gray-500">Or Upload New</span>
          </div>
        </div>

        {/* Upload */}
        <div className="space-y-3">
          <Label htmlFor="upload" className="text-sm font-medium text-gray-300">
            Upload Your PDF
          </Label>
          {uploading ? (
            <div className="space-y-2">
              <div className="h-10 flex items-center justify-center bg-[#0a0a0a] border border-gray-700 rounded-md">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-500 mr-2" />
                <span className="text-sm text-gray-400">Uploading... {uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="relative">
              <Input
                id="upload"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="sr-only"
              />
              <label
                htmlFor="upload"
                className="flex items-center justify-center gap-2 h-10 px-4 bg-[#0a0a0a] border border-gray-700 rounded-md cursor-pointer hover:bg-gray-900 transition-colors"
              >
                <Upload className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-300">Choose PDF file</span>
              </label>
            </div>
          )}
          <p className="text-xs text-gray-500">
            Max file size: 50MB • Uploaded files will appear in the list above
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
