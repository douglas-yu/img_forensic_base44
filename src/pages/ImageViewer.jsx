import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useImage } from '@/lib/imageContext';
import { Link } from 'react-router-dom';
import { Eye, ZoomIn, ZoomOut, RotateCw, Crosshair, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export default function ImageViewer() {
  const { imageData } = useImage();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [pixelInfo, setPixelInfo] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const drawImage = useCallback(() => {
    if (!imageData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const scale = zoom / 100;
    
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(imageData.imageElement, -canvas.width / 2, -canvas.height / 2);
    ctx.restore();
  }, [imageData, zoom, rotation]);

  useEffect(() => {
    drawImage();
  }, [drawImage]);

  const handleMouseMove = useCallback((e) => {
    if (!canvasRef.current || !imageData) return;
    
    if (dragging) {
      setPan({
        x: pan.x + (e.clientX - dragStart.current.x),
        y: pan.y + (e.clientY - dragStart.current.y)
      });
      dragStart.current = { x: e.clientX, y: e.clientY };
      return;
    }
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    
    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
      const ctx = canvas.getContext('2d');
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      setPixelInfo({ x, y, r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] });
    }
  }, [imageData, dragging, pan]);

  if (!imageData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <Eye className="w-12 h-12 opacity-30" />
        <p className="text-sm">No evidence image loaded</p>
        <Link to="/load">
          <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-2" />Load Evidence</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 h-11 border-b border-border bg-card shrink-0">
        <Eye className="w-4 h-4 text-primary" />
        <span className="text-xs font-mono text-muted-foreground">{imageData.name}</span>
        <div className="flex-1" />
        
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.max(10, zoom - 25))}>
          <ZoomOut className="w-3.5 h-3.5" />
        </Button>
        <div className="w-32">
          <Slider value={[zoom]} onValueChange={([v]) => setZoom(v)} min={10} max={500} step={5} />
        </div>
        <span className="text-xs font-mono w-12 text-center text-muted-foreground">{zoom}%</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(Math.min(500, zoom + 25))}>
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        
        <div className="w-px h-4 bg-border" />
        
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRotation((rotation + 90) % 360)}>
          <RotateCw className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setZoom(100); setPan({ x: 0, y: 0 }); setRotation(0); }}>
          <Crosshair className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => { setDragging(true); dragStart.current = { x: e.clientX, y: e.clientY }; }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onMouseMove={handleMouseMove}
      >
        <canvas
          ref={canvasRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
            transformOrigin: 'center',
            imageRendering: zoom > 200 ? 'pixelated' : 'auto',
          }}
          className="max-w-none"
        />
      </div>

      {/* Pixel Info Bar */}
      <div className="h-7 border-t border-border bg-card flex items-center px-4 text-[11px] font-mono text-muted-foreground gap-6 shrink-0">
        {pixelInfo ? (
          <>
            <span>X: {pixelInfo.x} Y: {pixelInfo.y}</span>
            <span>R: {pixelInfo.r} G: {pixelInfo.g} B: {pixelInfo.b}</span>
            <span>A: {pixelInfo.a}</span>
            <div className="flex items-center gap-1.5">
              <span>Color:</span>
              <div
                className="w-4 h-3 rounded-sm border border-border"
                style={{ background: `rgb(${pixelInfo.r},${pixelInfo.g},${pixelInfo.b})` }}
              />
              <span>#{pixelInfo.r.toString(16).padStart(2, '0')}{pixelInfo.g.toString(16).padStart(2, '0')}{pixelInfo.b.toString(16).padStart(2, '0')}</span>
            </div>
          </>
        ) : (
          <span>Hover over image for pixel information</span>
        )}
      </div>
    </div>
  );
}