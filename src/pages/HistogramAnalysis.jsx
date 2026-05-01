import React, { useState, useEffect, useMemo } from 'react';
import { useImage } from '@/lib/imageContext';
import { Link } from 'react-router-dom';
import { BarChart3, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function HistogramAnalysis() {
  const { imageData } = useImage();
  const [histData, setHistData] = useState(null);
  const [channel, setChannel] = useState('all');

  useEffect(() => {
    if (!imageData) return;
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageData.imageElement, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    const r = new Array(256).fill(0);
    const g = new Array(256).fill(0);
    const b = new Array(256).fill(0);
    const lum = new Array(256).fill(0);

    for (let i = 0; i < pixels.length; i += 4) {
      r[pixels[i]]++;
      g[pixels[i + 1]]++;
      b[pixels[i + 2]]++;
      const l = Math.round(0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]);
      lum[l]++;
    }

    const data = Array.from({ length: 256 }, (_, i) => ({
      value: i,
      red: r[i],
      green: g[i],
      blue: b[i],
      luminance: lum[i],
    }));

    setHistData(data);
  }, [imageData]);

  const stats = useMemo(() => {
    if (!histData) return null;
    const channels = { red: [], green: [], blue: [], luminance: [] };
    histData.forEach((d) => {
      Object.keys(channels).forEach((ch) => {
        for (let i = 0; i < d[ch]; i++) channels[ch].push(d.value);
      });
    });

    const calcStats = (arr) => {
      if (!arr.length) return { mean: 0, std: 0, min: 0, max: 0 };
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const std = Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length);
      const min = arr.reduce((a, b) => a < b ? a : b, Infinity);
      const max = arr.reduce((a, b) => a > b ? a : b, -Infinity);
      return { mean: mean.toFixed(1), std: std.toFixed(1), min, max };
    };

    return {
      red: calcStats(channels.red),
      green: calcStats(channels.green),
      blue: calcStats(channels.blue),
      luminance: calcStats(channels.luminance),
    };
  }, [histData]);

  if (!imageData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <BarChart3 className="w-12 h-12 opacity-30" />
        <p className="text-sm">No evidence image loaded</p>
        <Link to="/load"><Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-2" />Load Evidence</Button></Link>
      </div>
    );
  }

  const channelConfig = {
    all: [
      { key: 'red', color: '#ef4444', fill: '#ef444430' },
      { key: 'green', color: '#22c55e', fill: '#22c55e30' },
      { key: 'blue', color: '#3b82f6', fill: '#3b82f630' },
    ],
    red: [{ key: 'red', color: '#ef4444', fill: '#ef444440' }],
    green: [{ key: 'green', color: '#22c55e', fill: '#22c55e40' }],
    blue: [{ key: 'blue', color: '#3b82f6', fill: '#3b82f640' }],
    luminance: [{ key: 'luminance', color: '#a3a3a3', fill: '#a3a3a340' }],
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Histogram Analysis
          </h1>
          <p className="text-xs font-mono text-muted-foreground mt-1">{imageData.name}</p>
        </div>
        <Tabs value={channel} onValueChange={setChannel}>
          <TabsList className="bg-secondary">
            <TabsTrigger value="all" className="text-xs">RGB</TabsTrigger>
            <TabsTrigger value="red" className="text-xs">R</TabsTrigger>
            <TabsTrigger value="green" className="text-xs">G</TabsTrigger>
            <TabsTrigger value="blue" className="text-xs">B</TabsTrigger>
            <TabsTrigger value="luminance" className="text-xs">Lum</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="h-72">
          {histData && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={histData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <XAxis dataKey="value" tick={{ fontSize: 10, fill: 'hsl(215, 15%, 50%)' }} tickLine={false} axisLine={{ stroke: 'hsl(220, 15%, 18%)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 15%, 50%)' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(220, 18%, 10%)',
                    border: '1px solid hsl(220, 15%, 18%)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}
                />
                {channelConfig[channel].map((ch) => (
                  <Area
                    key={ch.key}
                    type="monotone"
                    dataKey={ch.key}
                    stroke={ch.color}
                    fill={ch.fill}
                    strokeWidth={1}
                    dot={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['red', 'green', 'blue', 'luminance'].map((ch) => (
            <div key={ch} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-mono uppercase text-muted-foreground mb-2">{ch}</p>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mean:</span>
                  <span>{stats[ch].mean}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Std Dev:</span>
                  <span>{stats[ch].std}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Range:</span>
                  <span>{stats[ch].min}–{stats[ch].max}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}