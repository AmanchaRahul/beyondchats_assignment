'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Upload, Loader2 } from 'lucide-react';

interface PDFFile {
  name: string;
  id: string;
}

export function SourceSelector({ onSelect }: { onSelect: (pdfId: string, url: string) => void }) {
  const [pdfs, setPdfs] = useState<PDFFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<string>('');

  useEffect(() => {
    fetchPDFs();
  }, []);

  const fetchPDFs = async () => {
    try {
      const { data, error } = await supabase.storage.from('pdfs').list();
      
      if (error) {
        console.error('Error fetching PDFs:', error);
        return;
      }
      
      if (data) {
        const pdfFiles = data
          .filter(file => file.name.endsWith('.pdf'))
          .map(file => ({
            name: file.name,
            id: file.name,
          }));
        setPdfs(pdfFiles);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.includes('pdf')) {
      alert('Please select a PDF file');
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('pdfs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        alert('Failed to upload PDF');
        return;
      }

      // Refresh list
      await fetchPDFs();
      
      // Auto-select the uploaded PDF
      const { data: { publicUrl } } = supabase.storage
        .from('pdfs')
        .getPublicUrl(fileName);
      
      setSelectedPdf(fileName);
      onSelect(fileName, publicUrl);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload PDF');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleSelect = (pdfName: string) => {
    setSelectedPdf(pdfName);
    
    const { data: { publicUrl } } = supabase.storage
      .from('pdfs')
      .getPublicUrl(pdfName);
    
    onSelect(pdfName, publicUrl);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Select value={selectedPdf} onValueChange={handleSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a PDF" />
            </SelectTrigger>
            <SelectContent>
              {pdfs.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">No PDFs uploaded yet</div>
              ) : (
                pdfs.map(pdf => (
                  <SelectItem key={pdf.id} value={pdf.id}>
                    {pdf.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Input
            type="file"
            accept=".pdf"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
            id="pdf-upload"
          />
          <label htmlFor="pdf-upload">
            <Button 
              type="button"
              disabled={uploading}
              onClick={() => document.getElementById('pdf-upload')?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload PDF
                </>
              )}
            </Button>
          </label>
        </div>
      </div>
    </div>
  );
}
