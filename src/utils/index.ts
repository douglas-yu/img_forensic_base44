import React, { useState, useEffect, useMemo } from 'react';
import { useImage } from '@/lib/imageContext';
import { Link } from 'react-router-dom';
import { FileSearch, Upload, AlertTriangle, CheckCircle2, Copy, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

function parseExifFromBuffer(buffer) {
  const view = new DataView(buffer);
  const metadata = {};
  
  // Basic file info
  metadata['File.Format'] = detectFormat(view);
  metadata['File.Size'] = buffer.byteLength;
  
  // JPEG EXIF parsing
  if (view.getUint16(0) === 0xFFD8) {
    let offset = 2;
    while (offset < view.byteLength - 1) {
      const marker = view.getUint16(offset);
      if (marker === 0xFFE1) {
        // APP1 - EXIF data
        const length = view.getUint16(offset + 2);
        parseExifBlock(view, offset + 4, length - 2, metadata);
        break;
      } else if (marker === 0xFFE0) {
        // APP0 - JFIF
        const length = view.getUint16(offset + 2);
        metadata['JFIF.Version'] = `${view.getUint8(offset + 11)}.${view.getUint8(offset + 12)}`;
        offset += 2 + length;
      } else if ((marker & 0xFF00) === 0xFF00) {