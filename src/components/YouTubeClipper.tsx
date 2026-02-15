import React, { useState, useRef } from 'react';
import {
  Scissors, Play, Pause, Copy, Check, Plus, Trash2, Link,
  Download, Edit3, X, Eye, ChevronDown, GripVertical
} from 'lucide-react';
import { Navbar } from './Navbar';
import { SEOHead } from './SEOHead';
import { useToast } from '@/hooks/use-toast';

interface Clip {
  id: string;
  start: number;
  end: number;
  label: string;
  quality: string;
}

const QUALITIES = ['360p', '480p', '720p', '1080p', '1440p', '4K'];

const extractVideoId = (url: string): string | null => {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
};

const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const parseTime = (str: string): number => {
  const parts = str.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
};

interface YouTubeClipperProps {
  initialVideoId?: string;
}

export const YouTubeClipper: React.FC<YouTubeClipperProps> = ({ initialVideoId }) => {
  const [url, setUrl] = useState(initialVideoId ? `https://youtube.com/watch?v=${initialVideoId}` : '');
  const [videoId, setVideoId] = useState<string | null>(initialVideoId || null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [startInput, setStartInput] = useState('0:00');
  const [endInput, setEndInput] = useState('0:30');
  const [labelInput, setLabelInput] = useState('');
  const [quality, setQuality] = useState('720p');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewClipId, setPreviewClipId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editQuality, setEditQuality] = useState('720p');
  const [videoDuration, setVideoDuration] = useState(300); // default 5 min
  const [durationInput, setDurationInput] = useState('5:00');
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const { toast } = useToast();

  const handleLoadVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractVideoId(url);
    if (id) {
      setVideoId(id);
      setClips([]);
      setPreviewClipId(null);
    } else {
      toast({ title: 'Invalid URL', description: 'Please enter a valid YouTube video URL.', variant: 'destructive' });
    }
  };

  const handleSetDuration = () => {
    const d = parseTime(durationInput);
    if (d > 0) setVideoDuration(d);
  };

  const handleAddClip = () => {
    const start = parseTime(startInput);
    const end = parseTime(endInput);
    if (end <= start) {
      toast({ title: 'Invalid range', description: 'End time must be after start time.', variant: 'destructive' });
      return;
    }
    const clip: Clip = {
      id: crypto.randomUUID(),
      start,
      end,
      label: labelInput || `Clip ${clips.length + 1}`,
      quality,
    };
    setClips((prev) => [...prev, clip]);
    setLabelInput('');
    toast({ title: 'Clip added', description: `${formatTime(start)} → ${formatTime(end)}` });
  };

  const handleRemoveClip = (id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
    if (previewClipId === id) setPreviewClipId(null);
  };

  const getClipUrl = (clip: Clip) => `https://youtu.be/${videoId}?t=${clip.start}`;
  const getEmbedUrl = (clip: Clip) =>
    `https://www.youtube.com/embed/${videoId}?start=${clip.start}&end=${clip.end}&autoplay=1`;

  const handleCopyLink = async (clip: Clip) => {
    await navigator.clipboard.writeText(getClipUrl(clip));
    setCopiedId(clip.id);
    toast({ title: 'Link copied!' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = async () => {
    const text = clips.map((c, i) => `${i + 1}. ${c.label} (${formatTime(c.start)} → ${formatTime(c.end)}) [${c.quality}]\n   ${getClipUrl(c)}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    toast({ title: 'All clips copied!' });
  };

  const startEdit = (clip: Clip) => {
    setEditingId(clip.id);
    setEditLabel(clip.label);
    setEditStart(formatTime(clip.start));
    setEditEnd(formatTime(clip.end));
    setEditQuality(clip.quality);
  };

  const saveEdit = (id: string) => {
    setClips((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, label: editLabel, start: parseTime(editStart), end: parseTime(editEnd), quality: editQuality }
          : c
      )
    );
    setEditingId(null);
    toast({ title: 'Clip updated' });
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = Math.round(pct * videoDuration);
    // Set whichever is closer
    const startSec = parseTime(startInput);
    const endSec = parseTime(endInput);
    if (Math.abs(time - startSec) < Math.abs(time - endSec)) {
      setStartInput(formatTime(time));
    } else {
      setEndInput(formatTime(time));
    }
  };

  const handleTimelineDrag = (e: React.MouseEvent) => {
    if (!isDragging || !timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = Math.round(pct * videoDuration);
    if (isDragging === 'start') setStartInput(formatTime(time));
    else setEndInput(formatTime(time));
  };

  const startPct = (parseTime(startInput) / videoDuration) * 100;
  const endPct = (parseTime(endInput) / videoDuration) * 100;

  return (
    <>
      <SEOHead
        title="YouTube Video Clipper"
        description="Clip and bookmark moments from YouTube videos. Generate timestamped links instantly."
        keywords="youtube clipper, video timestamps, youtube bookmarks, clip youtube"
      />
      <link href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <Navbar />

      <main className="min-h-screen bg-background pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          {/* Hero */}
          <div className="mb-12 opacity-0 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <Scissors className="w-6 h-6 text-foreground" />
              <h1 className="text-4xl md:text-5xl font-medium tracking-[-0.03em] text-foreground">Video Clipper</h1>
            </div>
            <p className="text-muted-foreground text-sm uppercase tracking-wide">
              Paste a YouTube link · Mark timestamps · Share clips
            </p>
          </div>

          {/* URL Input */}
          <form onSubmit={handleLoadVideo} className="flex gap-0 mb-10 opacity-0 animate-fade-in [animation-delay:200ms]">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              required
              className="flex-1 h-[48px] px-4 bg-background text-foreground border border-foreground text-sm focus:outline-none placeholder:text-muted-foreground"
            />
            <button type="submit" className="relative overflow-hidden h-[48px] px-6 bg-foreground text-background border border-foreground text-[11px] font-medium uppercase group">
              <span className="relative z-10">Load Video</span>
              <span className="absolute inset-0 bg-[#FA76FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
            </button>
          </form>

          {videoId && (
            <div className="opacity-0 animate-fade-in [animation-delay:400ms]">
              {/* Video + Controls Row */}
              <div className="flex flex-col lg:flex-row gap-8 mb-8">
                {/* Left: Video */}
                <div className="flex-1">
                  <div className="relative w-full aspect-video border border-foreground overflow-hidden animate-[zoom-in_1.2s_ease-out_forwards]">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="YouTube video player"
                    />
                  </div>

                  {/* Timeline */}
                  <div className="mt-4 border border-foreground p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Timeline Selection</h3>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Duration:</label>
                        <input
                          type="text"
                          value={durationInput}
                          onChange={(e) => setDurationInput(e.target.value)}
                          onBlur={handleSetDuration}
                          onKeyDown={(e) => e.key === 'Enter' && handleSetDuration()}
                          className="w-16 h-7 px-2 bg-background text-foreground border border-foreground text-xs focus:outline-none text-center"
                        />
                      </div>
                    </div>

                    {/* Timeline Bar */}
                    <div
                      ref={timelineRef}
                      className="relative h-10 bg-secondary cursor-crosshair select-none"
                      onClick={handleTimelineClick}
                      onMouseMove={handleTimelineDrag}
                      onMouseUp={() => setIsDragging(null)}
                      onMouseLeave={() => setIsDragging(null)}
                    >
                      {/* Clip ranges on timeline */}
                      {clips.map((clip) => (
                        <div
                          key={clip.id}
                          className="absolute top-0 h-full bg-muted-foreground/20 border-x border-muted-foreground/40"
                          style={{
                            left: `${(clip.start / videoDuration) * 100}%`,
                            width: `${((clip.end - clip.start) / videoDuration) * 100}%`,
                          }}
                        />
                      ))}

                      {/* Selected range */}
                      <div
                        className="absolute top-0 h-full bg-[#FA76FF]/30 border-x-2 border-[#FA76FF]"
                        style={{
                          left: `${Math.min(startPct, endPct)}%`,
                          width: `${Math.abs(endPct - startPct)}%`,
                        }}
                      />

                      {/* Start handle */}
                      <div
                        className="absolute top-0 h-full w-3 bg-foreground cursor-ew-resize z-10 flex items-center justify-center"
                        style={{ left: `calc(${startPct}% - 6px)` }}
                        onMouseDown={(e) => { e.stopPropagation(); setIsDragging('start'); }}
                      >
                        <GripVertical className="w-2.5 h-2.5 text-background" />
                      </div>

                      {/* End handle */}
                      <div
                        className="absolute top-0 h-full w-3 bg-foreground cursor-ew-resize z-10 flex items-center justify-center"
                        style={{ left: `calc(${endPct}% - 6px)` }}
                        onMouseDown={(e) => { e.stopPropagation(); setIsDragging('end'); }}
                      >
                        <GripVertical className="w-2.5 h-2.5 text-background" />
                      </div>

                      {/* Time markers */}
                      {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                        <span
                          key={pct}
                          className="absolute bottom-0 text-[9px] text-muted-foreground -translate-x-1/2 pointer-events-none"
                          style={{ left: `${pct * 100}%` }}
                        >
                          {formatTime(Math.round(pct * videoDuration))}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <span>Start: <strong className="text-foreground">{startInput}</strong></span>
                      <span>End: <strong className="text-foreground">{endInput}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right: Add Clip Form */}
                <aside className="w-full lg:w-[340px] flex flex-col gap-6">
                  <div className="border border-foreground p-6">
                    <h2 className="text-sm font-medium uppercase tracking-wide text-foreground mb-4">New Clip</h2>
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1">
                        <label className="block text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Start</label>
                        <input type="text" value={startInput} onChange={(e) => setStartInput(e.target.value)} placeholder="0:00"
                          className="w-full h-[40px] px-3 bg-background text-foreground border border-foreground text-sm focus:outline-none" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] uppercase tracking-wide text-muted-foreground mb-1">End</label>
                        <input type="text" value={endInput} onChange={(e) => setEndInput(e.target.value)} placeholder="0:30"
                          className="w-full h-[40px] px-3 bg-background text-foreground border border-foreground text-sm focus:outline-none" />
                      </div>
                    </div>

                    <input type="text" value={labelInput} onChange={(e) => setLabelInput(e.target.value)} placeholder="Clip label (optional)"
                      className="w-full h-[40px] px-3 bg-background text-foreground border border-foreground text-sm focus:outline-none mb-3" />

                    {/* Quality Selector */}
                    <div className="mb-3">
                      <label className="block text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Quality</label>
                      <div className="flex flex-wrap gap-1">
                        {QUALITIES.map((q) => (
                          <button
                            key={q}
                            onClick={() => setQuality(q)}
                            className={`h-8 px-3 text-[10px] font-medium uppercase border transition-colors ${
                              quality === q
                                ? 'bg-foreground text-background border-foreground'
                                : 'bg-background text-foreground border-foreground hover:bg-secondary'
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button onClick={handleAddClip}
                      className="relative overflow-hidden w-full h-[40px] bg-foreground text-background border border-foreground text-[11px] font-medium uppercase group">
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Plus className="w-3.5 h-3.5" /> Add Clip
                      </span>
                      <span className="absolute inset-0 bg-[#FA76FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
                    </button>
                  </div>

                  {/* Bulk Actions */}
                  {clips.length > 0 && (
                    <div className="flex gap-2">
                      <button onClick={handleCopyAll}
                        className="relative overflow-hidden flex-1 h-[40px] bg-background text-foreground border border-foreground text-[10px] font-medium uppercase group">
                        <span className="relative z-10 flex items-center justify-center gap-1.5">
                          <Download className="w-3.5 h-3.5" /> Export All
                        </span>
                        <span className="absolute inset-0 bg-[#FA76FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
                      </button>
                      <button onClick={() => { setClips([]); setPreviewClipId(null); }}
                        className="relative overflow-hidden h-[40px] px-4 bg-background text-destructive border border-destructive text-[10px] font-medium uppercase group">
                        <span className="relative z-10 flex items-center justify-center gap-1.5">
                          <Trash2 className="w-3.5 h-3.5" /> Clear
                        </span>
                        <span className="absolute inset-0 bg-destructive translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
                      </button>
                    </div>
                  )}
                </aside>
              </div>

              {/* Clips Grid - Below */}
              {clips.length > 0 && (
                <div className="mt-10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-medium tracking-[-0.02em] text-foreground">
                      Your Clips <span className="text-muted-foreground text-lg">({clips.length})</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {clips.map((clip, i) => (
                      <div
                        key={clip.id}
                        className="border border-foreground opacity-0 animate-fade-in"
                        style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
                      >
                        {/* Clip Preview */}
                        {previewClipId === clip.id ? (
                          <div className="relative aspect-video">
                            <iframe
                              src={getEmbedUrl(clip)}
                              className="absolute inset-0 w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={`Preview: ${clip.label}`}
                            />
                          </div>
                        ) : (
                          <div
                            className="relative aspect-video bg-secondary flex items-center justify-center cursor-pointer group"
                            onClick={() => setPreviewClipId(clip.id)}
                          >
                            <img
                              src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                              alt={clip.label}
                              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                            />
                            <div className="relative z-10 flex flex-col items-center gap-1">
                              <div className="w-12 h-12 bg-foreground/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 text-background ml-0.5" />
                              </div>
                              <span className="text-[10px] uppercase tracking-wide text-background font-medium bg-foreground/70 px-2 py-0.5">
                                {formatTime(clip.start)} → {formatTime(clip.end)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Clip Info */}
                        <div className="p-4">
                          {editingId === clip.id ? (
                            /* Edit Mode */
                            <div className="flex flex-col gap-2">
                              <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                                className="w-full h-8 px-2 bg-background text-foreground border border-foreground text-sm focus:outline-none" />
                              <div className="flex gap-2">
                                <input type="text" value={editStart} onChange={(e) => setEditStart(e.target.value)}
                                  className="flex-1 h-8 px-2 bg-background text-foreground border border-foreground text-xs focus:outline-none" placeholder="Start" />
                                <input type="text" value={editEnd} onChange={(e) => setEditEnd(e.target.value)}
                                  className="flex-1 h-8 px-2 bg-background text-foreground border border-foreground text-xs focus:outline-none" placeholder="End" />
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {QUALITIES.map((q) => (
                                  <button key={q} onClick={() => setEditQuality(q)}
                                    className={`h-6 px-2 text-[9px] font-medium uppercase border transition-colors ${
                                      editQuality === q ? 'bg-foreground text-background border-foreground' : 'bg-background text-foreground border-foreground'
                                    }`}>
                                    {q}
                                  </button>
                                ))}
                              </div>
                              <div className="flex gap-2 mt-1">
                                <button onClick={() => saveEdit(clip.id)}
                                  className="flex-1 h-8 bg-foreground text-background border border-foreground text-[10px] font-medium uppercase hover:opacity-80 transition-opacity">
                                  Save
                                </button>
                                <button onClick={() => setEditingId(null)}
                                  className="h-8 px-3 bg-background text-foreground border border-foreground text-[10px] font-medium uppercase hover:bg-secondary transition-colors">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* View Mode */
                            <>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{clip.label}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatTime(clip.start)} → {formatTime(clip.end)} · {clip.quality}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => setPreviewClipId(previewClipId === clip.id ? null : clip.id)}
                                  className="h-8 flex-1 flex items-center justify-center gap-1.5 border border-foreground text-[10px] font-medium uppercase hover:bg-foreground hover:text-background transition-colors">
                                  {previewClipId === clip.id ? <Pause className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  {previewClipId === clip.id ? 'Stop' : 'Preview'}
                                </button>
                                <a href={getClipUrl(clip)} target="_blank" rel="noopener noreferrer"
                                  className="h-8 flex-1 flex items-center justify-center gap-1.5 border border-foreground text-[10px] font-medium uppercase hover:bg-foreground hover:text-background transition-colors">
                                  <Download className="w-3 h-3" /> Open
                                </a>
                                <button onClick={() => handleCopyLink(clip)}
                                  className="h-8 w-8 flex items-center justify-center border border-foreground hover:bg-foreground hover:text-background transition-colors"
                                  title="Copy link">
                                  {copiedId === clip.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                </button>
                                <button onClick={() => startEdit(clip)}
                                  className="h-8 w-8 flex items-center justify-center border border-foreground hover:bg-foreground hover:text-background transition-colors"
                                  title="Edit clip">
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button onClick={() => handleRemoveClip(clip.id)}
                                  className="h-8 w-8 flex items-center justify-center border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                  title="Delete clip">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!videoId && (
            <div className="flex flex-col items-center justify-center py-24 opacity-0 animate-fade-in [animation-delay:400ms]">
              <Link className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-sm uppercase tracking-wide">
                Paste a YouTube URL above to get started
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
};
