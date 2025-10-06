'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

export function SourceSelector({ onSelect }: { onSelect: (pdfId: string, url: string) => void }) {
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPDFs();
  }, []);

  const fetchPDFs = async () => {
    const { data } = await supabase.storage.from('pdfs').list();
    if (data) setPdfs(data);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileName = `${Date.now()}_${file.name}`;
    
    await supabase.storage.from('pdfs').upload(fileName, file);
    await fetchPDFs();
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <Select onValueChange={(value) => {
        const pdf = pdfs.find(p => p.name === value);
        if (pdf) onSelect(pdf.name, pdf.publicUrl);
      }}>
        <SelectTrigger>
          <SelectValue placeholder="Select a PDF" />
        </SelectTrigger>
        <SelectContent>
          {pdfs.map(pdf => (
            <SelectItem key={pdf.name} value={pdf.name}>
              {pdf.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <input type="file" accept=".pdf" onChange={handleUpload} disabled={uploading} />
    </div>
  );
}
