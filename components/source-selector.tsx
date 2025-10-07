'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface SourceSelectorProps {
  onSelect: (pdfId: string, url: string) => void;
}

export function SourceSelector({ onSelect }: SourceSelectorProps) {
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

      const { data, error } = await supabase.storage
        .from('pdfs')
        .upload(fileName, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('pdfs')
        .getPublicUrl(fileName);

      setTimeout(() => {
        onSelect(fileName, publicUrl);
        setUploading(false);
      }, 500);

    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Failed to upload PDF: ' + error.message);
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

  return (
    <Card className="bg-[#1a1a1a] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Select PDF Source</CardTitle>
        <CardDescription className="text-gray-400">
          Choose from preloaded PDFs or upload your own coursebook
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preloaded PDFs */}
        <div className="space-y-3">
          <Label htmlFor="preloaded" className="text-sm font-medium text-gray-300">
            Preloaded PDFs
          </Label>
          <div className="flex gap-2">
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="flex-1 bg-[#0a0a0a] border-gray-700 text-gray-300">
                <SelectValue placeholder="Select a PDF" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-gray-700">
                <SelectItem value="1759778831333_keph1a1.pdf" className="text-gray-300">
                  NCERT Physics Class 11
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handlePreloadedSelect}
              disabled={!selectedSource}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Load PDF
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#1a1a1a] px-2 text-gray-500">Or</span>
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
                <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
                <span className="text-sm text-gray-400">Uploading... {uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
            Max file size: 50MB
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
