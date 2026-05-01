const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useImage } from '@/lib/imageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Briefcase, Plus, Trash2, Pencil, X, Check, Search, FolderOpen } from 'lucide-react';

const EMPTY_FORM = {
  case_number: '',
  title: '',
  examiner: '',
  status: 'open',
  verdict: 'pending',
  description: '',
};

const STATUS_COLORS = {
  open: 'text-blue-400 bg-blue-400/10',
  in_progress: 'text-amber-400 bg-amber-400/10',
  completed: 'text-emerald-400 bg-emerald-400/10',
  archived: 'text-muted-foreground bg-muted',
};

const VERDICT_COLORS = {
  pending: 'text-muted-foreground bg-muted',
  authentic: 'text-emerald-400 bg-emerald-400/10',
  manipulated: 'text-destructive bg-destructive/10',
  inconclusive: 'text-amber-400 bg-amber-400/10',
};

export default function CaseManager() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const { openCase, activeCase } = useImage();
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    db.entities.ForensicCase.list('-created_date').then(data => {
      setCases(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const filtered = cases.filter(c => {
    const q = query.toLowerCase();
    return !q || c.case_number?.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q);
  });

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (c) => {
    setForm({
      case_number: c.case_number || '',
      title: c.title || '',
      examiner: c.examiner || '',
      status: c.status || 'open',
      verdict: c.verdict || 'pending',
      description: c.description || '',
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editingId) {
      await db.entities.ForensicCase.update(editingId, form);
    } else {
      await db.entities.ForensicCase.create(form);
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this case?')) return;
    await db.entities.ForensicCase.delete(id);
    load();
  };

  const handleOpen = (c) => {
    openCase(c);
    navigate('/load');
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Case Manager</h1>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> New Case
        </Button>
      </div>

      {/* Active Case Banner */}
      {activeCase && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 flex items-center gap-3">
          <FolderOpen className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-mono text-primary">{activeCase.case_number}</span>
            <span className="text-xs text-muted-foreground ml-2">— currently active</span>
          </div>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate('/load')}>
            Continue Examination
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by case number or title..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9 font-mono text-sm bg-card border-border"
        />
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-lg border border-primary/30 bg-card p-5 space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-widest text-primary">
            {editingId ? 'Edit Case' : 'New Case'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-muted-foreground">Case Number *</label>
              <Input value={form.case_number} onChange={e => setForm(f => ({ ...f, case_number: e.target.value }))} placeholder="FC-2026-001" className="font-mono text-sm bg-secondary border-border" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono text-muted-foreground">Title *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Case title" className="text-sm bg-secondary border-border" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono text-muted-foreground">Examiner</label>
              <Input value={form.examiner} onChange={e => setForm(f => ({ ...f, examiner: e.target.value }))} placeholder="Examiner name" className="text-sm bg-secondary border-border" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono text-muted-foreground">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full h-9 rounded-md border border-border bg-secondary px-3 text-sm text-foreground">
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono text-muted-foreground">Verdict</label>
              <select value={form.verdict} onChange={e => setForm(f => ({ ...f, verdict: e.target.value }))}
                className="w-full h-9 rounded-md border border-border bg-secondary px-3 text-sm text-foreground">
                <option value="pending">Pending</option>
                <option value="authentic">Authentic</option>
                <option value="manipulated">Manipulated</option>
                <option value="inconclusive">Inconclusive</option>
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-mono text-muted-foreground">Description / Notes</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="Case description or initial observations..."
                className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingId(null); }}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !form.case_number || !form.title}>
              <Check className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save Case'}
            </Button>
          </div>
        </div>
      )}

      {/* Cases Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_2fr_1fr_1fr_1fr_auto] text-xs font-mono uppercase tracking-widest text-muted-foreground bg-muted/50 px-4 py-2 border-b border-border">
          <span>Case #</span>
          <span>Title</span>
          <span>Examiner</span>
          <span>Status</span>
          <span>Verdict</span>
          <span></span>
        </div>
        {loading && (
          <p className="text-xs font-mono text-muted-foreground p-4">Loading cases...</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-xs font-mono text-muted-foreground p-4">No cases found.</p>
        )}
        {!loading && filtered.map(c => {
          const isActive = activeCase?.id === c.id;
          return (
            <div key={c.id} className={`flex flex-col md:grid md:grid-cols-[1fr_2fr_1fr_1fr_1fr_auto] md:items-center px-4 py-3 border-b border-border last:border-0 transition-colors gap-2 md:gap-0 ${isActive ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-secondary/30'}`}>
              <span className="text-xs font-mono text-primary">{c.case_number}</span>
              <span className="text-sm text-foreground md:truncate md:pr-2">{c.title}</span>
              <span className="text-xs text-muted-foreground">{c.examiner || '—'}</span>
              <span className={`text-xs font-mono px-2 py-0.5 rounded w-fit ${STATUS_COLORS[c.status] || 'text-muted-foreground'}`}>
                {c.status?.replace('_', ' ')}
              </span>
              <span className={`text-xs font-mono px-2 py-0.5 rounded w-fit ${VERDICT_COLORS[c.verdict] || 'text-muted-foreground'}`}>
                {c.verdict}
              </span>
              <div className="flex gap-1 justify-end">
                <Button size="sm" variant={isActive ? 'default' : 'outline'} className="text-xs h-7 px-2" onClick={() => handleOpen(c)}>
                  <FolderOpen className="w-3 h-3 mr-1" />
                  {isActive ? 'Active' : 'Open'}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}