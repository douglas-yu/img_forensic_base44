import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useImage } from '@/lib/imageContext';
import { Link } from 'react-router-dom';
import { Layers, Upload, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export default function ELAAnalysis() {
  const { imageData } = useImage();
  const canvasRef = useRef(null);
  const [quality, setQuality] = useState(75);
  const [scale, setScale] = useState(15);
  const [processing, setProcessing] = useState(false);

  const runELA = useCallback(() => {
    if (!imageData || !canvasRef.current) return;
    setProcessing(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    // Draw original
    ctx.drawImage(imageData.imageElement, 0, 0);
    const originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Re-compress at specified quality
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(imageData.imageElement, 0, 0);

    const dataUrl = tempCanvas.toDataURL('image/jpeg', quality / 100);
    const img = new Image();
    img.onload = () => {
      tempCtx.drawImage(img, 0, 0);
      const recompressedData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);

      // Compute difference and scale
      const elaData = ctx.createImageData(canvas.width, canvas.height);
      for (let i = 0; i < originalData.data.length; i += 4) {
        const diffR = Math.abs(originalData.data[i] - recompressedData.data[i]) * scale;
        const diffG = Math.abs(originalData.data[i + 1] - recompressedData.data[i + 1]) * scale;
        const diffB = Math.abs(originalData.data[i + 2] - recompressedData.data[i + 2]) * scale;
        elaData.data[i] = Math.min(255, diffR);
        elaData.data[i + 1] = Math.min(255, diffG);
        elaData.data[i + 2] = Math.min(255, diffB);
        elaData.data[i + 3] = 255;
      }

      ctx.putImageData(elaData, 0, 0);
      setProcessing(false);
    };
    img.src = dataUrl;
  }, [imageData, quality, scale]);

  useEffect(() => {
    runELA();
  }, [runELA]);

  if (!imageData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <Layers className="w-12 h-12 opacity-30" />
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
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Error Level Analysis</span>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">JPEG Quality:</Label>
          <Slider value={[quality]} onValueChange={([v]) => setQuality(v)} min={1} max={99} step={1} className="w-28" />
          <span className="text-xs font-mono w-8">{quality}%</span>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">Scale:</Label>
          <Slider value={[scale]} onValueChange={([v]) => setScale(v)} min={1} max={50} step={1} className="w-28" />
          <span className="text-xs font-mono w-6">{scale}×</span>
        </div>
        {processing && (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center p-4">
        <canvas ref={canvasRef} className="max-w-full max-h-full border border-border rounded" />
      </div>

      {/* Info Panel */}
      <div className="border-t border-border bg-card px-4 py-3 shrink-0">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong className="text-foreground">How to interpret:</strong> ELA highlights regions with different compression levels. In an unmodified JPEG, all regions should show similar error levels. Bright spots may indicate areas that were modified after the original compression.</p>
            <p>Adjust quality and scale parameters to reveal different manipulation artifacts.</p>
          </div>
        </div>
      </div>
    </div>
  );
}