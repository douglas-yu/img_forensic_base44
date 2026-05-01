import React, { useState, useEffect, useRef } from 'react';
import { useImage } from '@/lib/imageContext';
import { Link } from 'react-router-dom';
import { FileText, Upload, Download, Printer, Shield, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export default function ForensicReport() {
  const { imageData, activeCase } = useImage();
  const [report, setReport] = useState({
    caseNumber: '',
    examiner: '',
    agency: '',
    date: new Date().toISOString().split('T')[0],
    verdict: 'pending',
    findings: '',
    methodology: '',
    conclusion: '',
  });

  // Pre-fill from active case when it changes
  React.useEffect(() => {
    if (activeCase) {
      setReport(prev => ({
        ...prev,
        caseNumber: activeCase.case_number || prev.caseNumber,
        examiner: activeCase.examiner || prev.examiner,
        verdict: activeCase.verdict || prev.verdict,
        findings: activeCase.findings || prev.findings,
      }));
    }
  }, [activeCase?.id]);

  const handleChange = (field, value) => {
    setReport(prev => ({ ...prev, [field]: value }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (!imageData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <FileText className="w-12 h-12 opacity-30" />
        <p className="text-sm">No evidence image loaded</p>
        <Link to="/load"><Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-2" />Load Evidence</Button></Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Forensic Report
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Generate examination report for evidence documentation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5 mr-2" />Print
          </Button>
        </div>
      </div>

      {/* Report Form */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-6 print:border-black print:text-black">
        {/* Header */}
        <div className="text-center border-b border-border pb-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-primary print:text-black" />
            <h2 className="text-lg font-bold tracking-tight">DIGITAL IMAGE FORENSIC EXAMINATION REPORT</h2>
          </div>
          <p className="text-xs text-muted-foreground font-mono">CONFIDENTIAL — LAW ENFORCEMENT SENSITIVE</p>
        </div>

        {/* Case Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Case Number</Label>
            <Input value={report.caseNumber} onChange={(e) => handleChange('caseNumber', e.target.value)} placeholder="CASE-2024-001" className="font-mono text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Date of Examination</Label>
            <Input type="date" value={report.date} onChange={(e) => handleChange('date', e.target.value)} className="font-mono text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Examiner Name</Label>
            <Input value={report.examiner} onChange={(e) => handleChange('examiner', e.target.value)} placeholder="Full name" className="text-sm" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Agency / Organization</Label>
            <Input value={report.agency} onChange={(e) => handleChange('agency', e.target.value)} placeholder="Organization name" className="text-sm" />
          </div>
        </div>

        <Separator />

        {/* Evidence Details */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Evidence Details
          </h3>
          <div className="rounded-md border border-border bg-secondary/30 p-4 font-mono text-xs space-y-1">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              <div><span className="text-muted-foreground">File Name: </span>{imageData.name}</div>
              <div><span className="text-muted-foreground">File Type: </span>{imageData.type}</div>
              <div><span className="text-muted-foreground">Dimensions: </span>{imageData.width} × {imageData.height} pixels</div>
              <div><span className="text-muted-foreground">File Size: </span>{(imageData.size / 1024).toFixed(1)} KB ({imageData.size.toLocaleString()} bytes)</div>
              <div><span className="text-muted-foreground">Last Modified: </span>{new Date(imageData.lastModified).toISOString()}</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Methodology */}
        <div className="space-y-2">
          <Label className="text-xs">Methodology / Tools Used</Label>
          <Textarea
            value={report.methodology}
            onChange={(e) => handleChange('methodology', e.target.value)}
            placeholder="Describe the forensic tools and techniques applied during examination (e.g., ELA, metadata analysis, histogram analysis, luminance gradient inspection, hex analysis)..."
            className="min-h-[80px] text-sm"
          />
        </div>

        {/* Findings */}
        <div className="space-y-2">
          <Label className="text-xs">Findings</Label>
          <Textarea
            value={report.findings}
            onChange={(e) => handleChange('findings', e.target.value)}
            placeholder="Detail all observations and findings from the forensic examination..."
            className="min-h-[120px] text-sm"
          />
        </div>

        {/* Verdict */}
        <div className="space-y-2">
          <Label className="text-xs">Verdict</Label>
          <Select value={report.verdict} onValueChange={(v) => handleChange('verdict', v)}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="authentic">Authentic — No manipulation detected</SelectItem>
              <SelectItem value="manipulated">Manipulated — Evidence of alteration</SelectItem>
              <SelectItem value="inconclusive">Inconclusive — Unable to determine</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conclusion */}
        <div className="space-y-2">
          <Label className="text-xs">Conclusion</Label>
          <Textarea
            value={report.conclusion}
            onChange={(e) => handleChange('conclusion', e.target.value)}
            placeholder="Provide the overall conclusion and professional opinion based on the examination..."
            className="min-h-[100px] text-sm"
          />
        </div>

        <Separator />

        {/* Signature Block */}
        <div className="grid grid-cols-2 gap-8 pt-4">
          <div className="space-y-2">
            <div className="border-b border-muted-foreground/30 h-12" />
            <p className="text-xs text-muted-foreground">Examiner Signature</p>
          </div>
          <div className="space-y-2">
            <div className="border-b border-muted-foreground/30 h-12" />
            <p className="text-xs text-muted-foreground">Date</p>
          </div>
        </div>
      </div>
    </div>
  );
}