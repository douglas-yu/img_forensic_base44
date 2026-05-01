const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useImage } from '@/lib/imageContext';

import {
  Shield, Upload, FileSearch, Layers, BarChart3,
  Binary, Eye, FileText, Grid3X3, ArrowRight, Image as ImageIcon, Search, FolderOpen, Briefcase, XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const tools = [
  { icon: Upload, label: 'Load Evidence', desc: 'Upload image for examination', path: '/load', color: 'text-primary' },
  { icon: Eye, label: 'Image Viewer', desc: 'Zoom, pan & inspect pixels', path: '/viewer', color: 'text-blue-400' },
  { icon: FileSearch, label: 'Metadata / EXIF', desc: 'Extract embedded metadata', path: '/metadata', color: 'text-emerald-400' },
  { icon: Layers, label: 'ELA Analysis', desc: 'Error Level Analysis', path: '/ela', color: 'text-amber-400' },
  { icon: BarChart3, label: 'Histogram', desc: 'Color channel distribution', path: '/histogram', color: 'text-violet-400' },
  { icon: Grid3X3, label: 'Luminance Gradient', desc: 'Surface plot analysis', path: '/luminance', color: 'text-rose-400' },
  { icon: Binary, label: 'Hex Viewer', desc: 'Raw file byte inspector', path: '/hex', color: 'text-cyan-400' },
  { icon: FileText, label: 'Report', desc: 'Generate forensic report', path: '/report', color: 'text-orange-400' },
];

export default function Dashboard() {
  const { imageData, activeCase, closeCase } = useImage();
  const [query, setQuery] = useState('');
  const [cases, setCases] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setCases([]); return; }
    setSearching(true);
    db.entities.ForensicCase.list().then((all) => {
      const q = query.toLowerCase();
      setCases(all.filter(c =>
        c.case_number?.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q)
      ));
      setSearching(false);
    });
  }, [query]);

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">Forensic Authenticate</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg">
            Digital image forensic examination suite. Load an evidence image to begin analysis using multiple forensic tools.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search cases by number or title..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9 font-mono text-sm bg-card border-border"
        />
        {query.trim() && (
          <div className="absolute z-10 w-full mt-1 rounded-lg border border-border bg-card shadow-xl overflow-hidden">
            {searching && (
              <p className="text-xs font-mono text-muted-foreground p-3">Searching...</p>
            )}
            {!searching && cases.length === 0 && (
              <p className="text-xs font-mono text-muted-foreground p-3">No cases found.</p>
            )}
            {!searching && cases.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 border-b border-border last:border-0 cursor-default">
                <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-mono text-primary">{c.case_number}</p>
                  <p className="text-sm text-foreground truncate">{c.title}</p>
                </div>
                <span className={`ml-auto text-xs font-mono px-2 py-0.5 rounded shrink-0 ${
                  c.verdict === 'manipulated' ? 'bg-destructive/20 text-destructive' :
                  c.verdict === 'authentic' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-muted text-muted-foreground'
                }`}>{c.verdict}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Case */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Active Case</h2>
        {activeCase ? (
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-primary">{activeCase.case_number}</p>
              <p className="text-sm font-medium text-foreground truncate">{activeCase.title}</p>
              {activeCase.examiner && <p className="text-xs text-muted-foreground">Examiner: {activeCase.examiner}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <Link to="/load">
                <Button size="sm" variant="outline" className="text-xs gap-1">
                  <Upload className="w-3 h-3" /> Load Evidence
                </Button>
              </Link>
              <button onClick={closeCase} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Close case">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-md border border-dashed border-border bg-muted/50 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">No case selected</p>
              <Link to="/cases" className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
                Open a case <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Current Evidence */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Current Evidence</h2>
        {imageData ? (
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-md border border-border overflow-hidden bg-muted flex items-center justify-center">
              <img src={imageData.url} alt="Evidence" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground font-mono">{imageData.name}</p>
              <p className="text-muted-foreground">{imageData.width} × {imageData.height} px</p>
              <p className="text-muted-foreground">{(imageData.size / 1024).toFixed(1)} KB · {imageData.type}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-md border border-dashed border-border bg-muted/50 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">No evidence loaded</p>
              <Link to="/load" className="text-sm text-primary hover:underline flex items-center gap-1 mt-1">
                Load an image <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Tool Grid */}
      <div>
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">Forensic Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.path}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={tool.path}
                className="group block rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-secondary/50 transition-all duration-200 p-4"
              >
                <tool.icon className={`w-5 h-5 ${tool.color} mb-3`} />
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {tool.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}