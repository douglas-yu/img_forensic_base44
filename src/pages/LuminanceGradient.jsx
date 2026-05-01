import React, { useRef, useEffect, useState } from 'react';
import { useImage } from '@/lib/imageContext';
import { Link } from 'react-router-dom';
import { Grid3X3, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LuminanceGradient() {
  const { imageData } = useImage();
  const canvasRef = useRef(null);
  const [mode, setMode] = useState('gradient');
  const [sensitivity, setSensitivity] = useState(5);

  useEffect(() => {
    if (!imageData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    // Get original pixel data
    ctx.drawImage(imageData.imageElement, 0, 0);
    const src = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const out = ctx.createImageData(canvas.width, canvas.height);
    const w = canvas.width;

    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;

        if (mode === 'gradient') {
          // Sobel-like gradient
          const getL = (px, py) => {
            const i = (py * w + px) * 4;
            return 0.299 * src.data[i] + 0.587 * src.data[i + 1] + 0.114 * src.data[i + 2];
          };
          const gx = -getL(x - 1, y - 1) - 2 * getL(x - 1, y) - getL(x - 1, y + 1)
                     + getL(x + 1, y - 1) + 2 * getL(x + 1, y) + getL(x + 1, y + 1);
          const gy = -getL(x - 1, y - 1) - 2 * getL(x, y - 1) - getL(x + 1, y - 1)
                     + getL(x - 1, y + 1) + 2 * getL(x, y + 1) + getL(x + 1, y + 1);
          const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy) * sensitivity);
          out.data[idx] = mag;
          out.data[idx + 1] = mag;
          out.data[idx + 2] = mag;
          out.data[idx + 3] = 255;
        } else if (mode === 'noise') {
          // Noise analysis - difference from median of neighbors
          const neighbors = [];
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const ni = ((y + dy) * w + (x + dx)) * 4;
              neighbors.push(src.data[ni]);
            }
          }
          neighbors.sort((a, b) => a - b);
          const median = neighbors[3];
          const diff = Math.abs(src.data[idx] - median) * sensitivity;
          const v = Math.min(255, diff);
          out.data[idx] = v;
          out.data[idx + 1] = v * 0.6;
          out.data[idx + 2] = v * 0.3;
          out.data[idx + 3] = 255;
        } else {
          // Laplacian edge detection
          const getL = (px, py) => {
            const i = (py * w + px) * 4;
            return 0.299 * src.data[i] + 0.587 * src.data[i + 1] + 0.114 * src.data[i + 2];
          };
          const center = getL(x, y);
          const lap = -4 * center + getL(x - 1, y) + getL(x + 1, y) + getL(x, y - 1) + getL(x, y + 1);
          const v = Math.min(255, Math.abs(lap) * sensitivity);
          out.data[idx] = 0;
          out.data[idx + 1] = v;
          out.data[idx + 2] = v * 0.8;
          out.data[idx + 3] = 255;
        }
      }
    }

    ctx.putImageData(out, 0, 0);
  }, [imageData, mode, sensitivity]);

  if (!imageData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <Grid3X3 className="w-12 h-12 opacity-30" />
        <p className="text-sm">No evidence image loaded</p>
        <Link to="/load"><Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-2" />Load Evidence</Button></Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-6 px-4 h-12 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Luminance & Gradient Analysis</span>
        </div>
        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger className="w-36 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gradient">Sobel Gradient</SelectItem>
            <SelectItem value="noise">Noise Analysis</SelectItem>
            <SelectItem value="laplacian">Laplacian Edge</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground">Sensitivity:</Label>
          <Slider value={[sensitivity]} onValueChange={([v]) => setSensitivity(v)} min={1} max={20} step={1} className="w-28" />
          <span className="text-xs font-mono w-6">{sensitivity}×</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center p-4">
        <canvas ref={canvasRef} className="max-w-full max-h-full border border-border rounded" />
      </div>
    </div>
  );
}