import React, { useState, useMemo } from 'react';
import { useImage } from '@/lib/imageContext';
import { Link } from 'react-router-dom';
import { Binary, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const BYTES_PER_LINE = 16;
const LINES_PER_PAGE = 32;
const BYTES_PER_PAGE = BYTES_PER_LINE * LINES_PER_PAGE;

export default function HexViewer() {
  const { imageData } = useImage();
  const [page, setPage] = useState(0);
  const [searchHex, setSearchHex] = useState('');

  const bytes = useMemo(() => {
    if (!imageData?.arrayBuffer) return null;
    return new Uint8Array(imageData.arrayBuffer);
  }, [imageData]);

  const totalPages = bytes ? Math.ceil(bytes.length / BYTES_PER_PAGE) : 0;

  const fileSignature = useMemo(() => {
    if (!bytes || bytes.length < 4) return null;
    const sig = Array.from(bytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    const sigs = {
      'FF D8 FF E0': 'JPEG (JFIF)',
      'FF D8 FF E1': 'JPEG (EXIF)',
      'FF D8 FF DB': 'JPEG',
      '89 50 4E 47': 'PNG',
      '47 49 46 38': 'GIF',
      '42 4D': 'BMP',
      '52 49 46 46': 'RIFF (WebP)',
    };
    const match = Object.entries(sigs).find(([k]) => sig.startsWith(k));
    return { hex: sig, type: match ? match[1] : 'Unknown' };
  }, [bytes]);

  const highlightOffsets = useMemo(() => {
    if (!searchHex || !bytes) return new Set();
    const clean = searchHex.replace(/\s/g, '').toLowerCase();
    if (clean.length < 2 || clean.length % 2 !== 0) return new Set();
    const searchBytes = [];
    for (let i = 0; i < clean.length; i += 2) {
      searchBytes.push(parseInt(clean.substr(i, 2), 16));
    }
    const offsets = new Set();
    for (let i = 0; i <= bytes.length - searchBytes.length; i++) {
      let match = true;
      for (let j = 0; j < searchBytes.length; j++) {
        if (bytes[i + j] !== searchBytes[j]) { match = false; break; }
      }
      if (match) {
        for (let j = 0; j < searchBytes.length; j++) offsets.add(i + j);
      }
    }
    return offsets;
  }, [searchHex, bytes]);

  if (!imageData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <Binary className="w-12 h-12 opacity-30" />
        <p className="text-sm">No evidence image loaded</p>
        <Link to="/load"><Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-2" />Load Evidence</Button></Link>
      </div>
    );
  }

  const startByte = page * BYTES_PER_PAGE;
  const pageBytes = bytes ? bytes.slice(startByte, startByte + BYTES_PER_PAGE) : [];

  const lines = [];
  for (let i = 0; i < pageBytes.length; i += BYTES_PER_LINE) {
    const lineBytes = pageBytes.slice(i, i + BYTES_PER_LINE);
    lines.push({ offset: startByte + i, bytes: lineBytes });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-4 px-4 h-12 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Binary className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Hex Viewer</span>
        </div>
        {fileSignature && (
          <div className="text-xs font-mono text-muted-foreground">
            Signature: <span className="text-primary">{fileSignature.hex}</span> — {fileSignature.type}
          </div>
        )}
        <div className="flex-1" />
        <Input
          placeholder="Search hex (e.g., FF D8 FF)"
          value={searchHex}
          onChange={(e) => setSearchHex(e.target.value)}
          className="w-48 h-7 text-xs font-mono bg-secondary"
        />
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs font-mono text-muted-foreground w-24 text-center">
            {page + 1} / {totalPages}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Hex Content */}
      <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-5">
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="flex text-muted-foreground mb-2 px-1">
            <span className="w-20 shrink-0">Offset</span>
            <span className="flex-1">
              {Array.from({ length: BYTES_PER_LINE }, (_, i) => i.toString(16).toUpperCase().padStart(2, '0')).join(' ')}
            </span>
            <span className="w-40 ml-4">ASCII</span>
          </div>
          <div className="border-t border-border" />

          {/* Lines */}
          {lines.map((line) => (
            <div key={line.offset} className="flex hover:bg-secondary/50 px-1 py-px">
              <span className="w-20 shrink-0 text-primary">
                {line.offset.toString(16).toUpperCase().padStart(8, '0')}
              </span>
              <span className="flex-1">
                {Array.from(line.bytes).map((b, i) => {
                  const globalIdx = line.offset + i;
                  const isHighlighted = highlightOffsets.has(globalIdx);
                  return (
                    <span key={i} className={isHighlighted ? 'bg-amber-500/30 text-amber-300 rounded px-0.5' : 'text-foreground'}>
                      {b.toString(16).toUpperCase().padStart(2, '0')}
                      {i < line.bytes.length - 1 ? ' ' : ''}
                    </span>
                  );
                })}
                {line.bytes.length < BYTES_PER_LINE && (
                  <span>{' '.repeat((BYTES_PER_LINE - line.bytes.length) * 3)}</span>
                )}
              </span>
              <span className="w-40 ml-4 text-muted-foreground">
                {Array.from(line.bytes).map((b) => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="h-7 border-t border-border bg-card flex items-center px-4 text-[11px] font-mono text-muted-foreground gap-6 shrink-0">
        <span>File size: {bytes?.length.toLocaleString()} bytes</span>
        <span>Offset: 0x{startByte.toString(16).toUpperCase()}</span>
        {highlightOffsets.size > 0 && <span className="text-amber-400">{highlightOffsets.size} matches found</span>}
      </div>
    </div>
  );
}