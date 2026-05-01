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
        const length = view.getUint16(offset + 2);
        offset += 2 + length;
      } else {
        break;
      }
    }
    
    // Scan for quantization tables
    offset = 2;
    let qtCount = 0;
    while (offset < view.byteLength - 1) {
      const marker = view.getUint16(offset);
      if (marker === 0xFFDB) {
        qtCount++;
        const length = view.getUint16(offset + 2);
        offset += 2 + length;
      } else if ((marker & 0xFF00) === 0xFF00) {
        if (marker === 0xFFDA) break;
        const length = view.getUint16(offset + 2);
        offset += 2 + length;
      } else {
        break;
      }
    }
    if (qtCount > 0) metadata['JPEG.QuantizationTables'] = qtCount;
  }
  
  return metadata;
}

function detectFormat(view) {
  const b0 = view.getUint8(0), b1 = view.getUint8(1);
  if (b0 === 0xFF && b1 === 0xD8) return 'JPEG';
  if (b0 === 0x89 && b1 === 0x50) return 'PNG';
  if (b0 === 0x47 && b1 === 0x49) return 'GIF';
  if (b0 === 0x42 && b1 === 0x4D) return 'BMP';
  if (b0 === 0x52 && b1 === 0x49) return 'WEBP';
  return 'Unknown';
}

function parseExifBlock(view, start, length, metadata) {
  // Check for "Exif\0\0"
  const decoder = new TextDecoder('ascii');
  const exifHeader = decoder.decode(new Uint8Array(view.buffer, start, 6));
  if (!exifHeader.startsWith('Exif')) return;
  
  const tiffStart = start + 6;
  const byteOrder = view.getUint16(tiffStart);
  const le = byteOrder === 0x4949; // Little endian
  
  const ifdOffset = view.getUint32(tiffStart + 4, le);
  parseIFD(view, tiffStart, tiffStart + ifdOffset, le, metadata, 'IFD0');
}

function parseIFD(view, tiffStart, ifdStart, le, metadata, prefix) {
  if (ifdStart >= view.byteLength - 2) return;
  const count = view.getUint16(ifdStart, le);
  
  const tagNames = {
    0x010F: 'Make', 0x0110: 'Model', 0x0112: 'Orientation',
    0x011A: 'XResolution', 0x011B: 'YResolution', 0x0128: 'ResolutionUnit',
    0x0131: 'Software', 0x0132: 'DateTime', 0x0213: 'YCbCrPositioning',
    0x8769: 'ExifIFD', 0x8825: 'GPSIFD',
    0x829A: 'ExposureTime', 0x829D: 'FNumber', 0x8827: 'ISO',
    0x9000: 'ExifVersion', 0x9003: 'DateTimeOriginal', 0x9004: 'DateTimeDigitized',
    0x920A: 'FocalLength', 0xA001: 'ColorSpace', 0xA002: 'PixelXDimension',
    0xA003: 'PixelYDimension', 0xA405: 'FocalLengthIn35mm',
    0xA420: 'ImageUniqueID', 0xA430: 'CameraOwnerName', 0xA431: 'BodySerialNumber',
    0xA432: 'LensInfo', 0xA433: 'LensMake', 0xA434: 'LensModel',
  };
  
  for (let i = 0; i < count && (ifdStart + 2 + i * 12 + 12) <= view.byteLength; i++) {
    const entryStart = ifdStart + 2 + i * 12;
    const tag = view.getUint16(entryStart, le);
    const type = view.getUint16(entryStart + 2, le);
    const numValues = view.getUint32(entryStart + 4, le);
    const valueOffset = view.getUint32(entryStart + 8, le);
    
    const tagName = tagNames[tag] || `Tag_0x${tag.toString(16).padStart(4, '0')}`;
    
    // Sub-IFD pointers
    if (tag === 0x8769 || tag === 0x8825) {
      parseIFD(view, tiffStart, tiffStart + valueOffset, le, metadata, tag === 0x8769 ? 'EXIF' : 'GPS');
      continue;
    }
    
    // Read value based on type
    let value;
    if (type === 2) { // ASCII
      const strStart = numValues > 4 ? tiffStart + valueOffset : entryStart + 8;
      if (strStart + numValues <= view.byteLength) {
        const bytes = new Uint8Array(view.buffer, strStart, numValues - 1);
        value = new TextDecoder('ascii').decode(bytes);
      }
    } else if (type === 3) { // SHORT
      value = numValues > 2 ? view.getUint16(tiffStart + valueOffset, le) : view.getUint16(entryStart + 8, le);
    } else if (type === 4) { // LONG
      value = numValues > 1 ? view.getUint32(tiffStart + valueOffset, le) : view.getUint32(entryStart + 8, le);
    } else if (type === 5) { // RATIONAL
      const ratStart = tiffStart + valueOffset;
      if (ratStart + 8 <= view.byteLength) {
        const num = view.getUint32(ratStart, le);
        const den = view.getUint32(ratStart + 4, le);
        value = den ? `${num}/${den} (${(num / den).toFixed(4)})` : num;
      }
    } else if (type === 7) { // UNDEFINED
      if (numValues <= 4) {
        const bytes = [];
        for (let b = 0; b < numValues; b++) bytes.push(view.getUint8(entryStart + 8 + b));
        value = bytes.map(b => String.fromCharCode(b)).join('');
      }
    }
    
    if (value !== undefined) {
      metadata[`${prefix}.${tagName}`] = value;
    }
  }
}

export default function MetadataViewer() {
  const { imageData } = useImage();
  const [search, setSearch] = useState('');
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    if (!imageData?.arrayBuffer) return;
    const parsed = parseExifFromBuffer(imageData.arrayBuffer);
    // Add computed fields
    parsed['Image.Width'] = imageData.width;
    parsed['Image.Height'] = imageData.height;
    parsed['Image.MimeType'] = imageData.type;
    parsed['File.Name'] = imageData.name;
    parsed['File.LastModified'] = new Date(imageData.lastModified).toISOString();
    setMetadata(parsed);
  }, [imageData]);

  const filteredEntries = useMemo(() => {
    if (!metadata) return [];
    return Object.entries(metadata).filter(([key, val]) =>
      key.toLowerCase().includes(search.toLowerCase()) ||
      String(val).toLowerCase().includes(search.toLowerCase())
    );
  }, [metadata, search]);

  const anomalies = useMemo(() => {
    if (!metadata) return [];
    const issues = [];
    if (metadata['IFD0.Software']) {
      issues.push({ level: 'warning', msg: `Editing software detected: ${metadata['IFD0.Software']}` });
    }
    if (metadata['EXIF.DateTimeOriginal'] && metadata['IFD0.DateTime'] &&
        metadata['EXIF.DateTimeOriginal'] !== metadata['IFD0.DateTime']) {
      issues.push({ level: 'warning', msg: 'DateTime mismatch between EXIF and IFD0 timestamps' });
    }
    if (!metadata['EXIF.DateTimeOriginal'] && !metadata['IFD0.DateTime']) {
      issues.push({ level: 'info', msg: 'No timestamp metadata found — may have been stripped' });
    }
    if (!metadata['IFD0.Make'] && !metadata['IFD0.Model']) {
      issues.push({ level: 'info', msg: 'No camera make/model — possible screenshot or processed image' });
    }
    return issues;
  }, [metadata]);

  if (!imageData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <FileSearch className="w-12 h-12 opacity-30" />
        <p className="text-sm">No evidence image loaded</p>
        <Link to="/load"><Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-2" />Load Evidence</Button></Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-primary" />
            Metadata / EXIF Analysis
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-1">{imageData.name}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          const text = filteredEntries.map(([k, v]) => `${k}: ${v}`).join('\n');
          navigator.clipboard.writeText(text);
          toast.success('Metadata copied');
        }}>
          <Copy className="w-3.5 h-3.5 mr-2" />
          Copy All
        </Button>
      </div>

      {/* Anomaly Alerts */}
      {anomalies.length > 0 && (
        <div className="space-y-2">
          {anomalies.map((a, i) => (
            <div key={i} className={`flex items-start gap-2 p-3 rounded-md text-xs ${
              a.level === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-secondary border border-border'
            }`}>
              {a.level === 'warning' ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              )}
              <span className={a.level === 'warning' ? 'text-amber-400' : 'text-muted-foreground'}>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search metadata fields..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card"
        />
      </div>

      {/* Metadata Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[minmax(200px,1fr)_2fr] text-xs font-mono">
          <div className="px-4 py-2 bg-secondary text-muted-foreground font-semibold border-b border-border">Field</div>
          <div className="px-4 py-2 bg-secondary text-muted-foreground font-semibold border-b border-border">Value</div>
          {filteredEntries.map(([key, value], i) => (
            <React.Fragment key={key}>
              <div className={`px-4 py-2 text-muted-foreground border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                {key}
              </div>
              <div className={`px-4 py-2 text-foreground border-b border-border/50 break-all ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                {String(value)}
              </div>
            </React.Fragment>
          ))}
        </div>
        {filteredEntries.length === 0 && (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            No metadata fields match your search
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        <Badge variant="outline" className="text-[10px]">{filteredEntries.length} fields</Badge>
      </div>
    </div>
  );
}