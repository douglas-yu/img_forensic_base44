import React, { useCallback, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useImage } from '@/lib/imageContext';
import { Upload, Image as ImageIcon, CheckCircle2, FileWarning, Briefcase, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoadEvidence() {
  const { loadImage, imageData, activeCase } = useImage();
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setLoading(true);
    await loadImage(file);
    setLoading(false);
  }, [loadImage]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e) => {
    const file = e.target.files[0];
    handleFile(file);
  }, [handleFile]);

  // Gate: must have an active case
  if (!activeCase) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Load Evidence
          </h1>
        </div>
        <div className="rounded-lg border border-border bg-card p-10 flex flex-col items-center gap-5 text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium text-foreground">No Active Case</p>
            <p className="text-xs text-muted-foreground mt-1">
              You must open a case before loading evidence for examination.
            </p>
          </div>
          <Link to="/cases">
            <Button size="sm" className="gap-2">
              <Briefcase className="w-4 h-4" /> Go to Case Manager
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Load Evidence
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a digital image for forensic examination. Supports JPEG, PNG, TIFF, BMP, WebP.
        </p>
      </div>

      {/* Active Case Banner */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3">
        <Briefcase className="w-4 h-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-mono font-medium text-primary">{activeCase.case_number}</span>
          <span className="text-xs text-muted-foreground ml-2 truncate">{activeCase.title}</span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">ACTIVE CASE</span>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-muted-foreground/30'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-3">
          {loading ? (
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              {loading ? 'Processing image...' : 'Drop image here or click to browse'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Maximum recommended: 20MB</p>
          </div>
        </div>
      </div>

      {/* Loaded Evidence Info */}
      <AnimatePresence>
        {imageData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-primary/20 bg-primary/5 p-5"
          >
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-md border border-border overflow-hidden bg-muted shrink-0">
                <img src={imageData.url} alt="Evidence" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Evidence Loaded Successfully</span>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs font-mono">
                  <div>
                    <span className="text-muted-foreground">File: </span>
                    <span className="text-foreground">{imageData.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type: </span>
                    <span className="text-foreground">{imageData.type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dimensions: </span>
                    <span className="text-foreground">{imageData.width} × {imageData.height}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Size: </span>
                    <span className="text-foreground">{(imageData.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" onClick={() => navigate('/viewer')} className="text-xs">
                    Open in Viewer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate('/metadata')} className="text-xs">
                    View Metadata
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate('/ela')} className="text-xs">
                    ELA Analysis
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate('/histogram')} className="text-xs">
                    Histogram
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate('/report')} className="text-xs gap-1">
                    <ArrowRight className="w-3 h-3" /> Report
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Warnings */}
      <div className="rounded-lg border border-border bg-card p-4 flex items-start gap-3">
        <FileWarning className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground text-sm">Important Notice</p>
          <p>All image analysis is performed locally in your browser. No image data is transmitted to external servers.</p>
          <p>For legal proceedings, ensure chain of custody is maintained for the original evidence file.</p>
        </div>
      </div>
    </div>
  );
}