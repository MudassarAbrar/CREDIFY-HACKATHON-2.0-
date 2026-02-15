import React, { useState, useRef, useCallback } from 'react';
import { Scissors, Play, Copy, Check, Plus, Trash2, Link } from 'lucide-react';
import { Navbar } from './Navbar';
import { SEOHead } from './SEOHead';
import { useToast } from '@/hooks/use-toast';

interface Clip {
  id: string;
  start: number;
  end: number;
  label: string;
}

const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
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

export const YouTubeClipper: React.FC = () => {
  const [url, setUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [startInput, setStartInput] = useState('0:00');
  const [endInput, setEndInput] = useState('0:30');
  const [labelInput, setLabelInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLoadVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractVideoId(url);
    if (id) {
      setVideoId(id);
      setClips([]);
    } else {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid YouTube video URL.',
        variant: 'destructive',
      });
    }
  };

  const handleAddClip = () => {
    const start = parseTime(startInput);
    const end = parseTime(endInput);
    if (end <= start) {
      toast({
        title: 'Invalid range',
        description: 'End time must be after start time.',
        variant: 'destructive',
      });
      return;
    }
    const clip: Clip = {
      id: crypto.randomUUID(),
      start,
      end,
      label: labelInput || `Clip ${clips.length + 1}`,
    };
    setClips((prev) => [...prev, clip]);
    setLabelInput('');
    toast({ title: 'Clip added', description: `${formatTime(start)} → ${formatTime(end)}` });
  };

  const handleRemoveClip = (id: string) => {
    setClips((prev) => prev.filter((c) => c.id !== id));
  };

  const getClipUrl = (clip: Clip) => {
    return `https://youtu.be/${videoId}?t=${clip.start}`;
  };

  const getEmbedUrl = (clip: Clip) => {
    return `https://www.youtube.com/embed/${videoId}?start=${clip.start}&end=${clip.end}&autoplay=1`;
  };

  const handleCopyLink = async (clip: Clip) => {
    await navigator.clipboard.writeText(getClipUrl(clip));
    setCopiedId(clip.id);
    toast({ title: 'Link copied!' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <SEOHead
        title="YouTube Video Clipper"
        description="Clip and bookmark moments from YouTube videos. Generate timestamped links instantly."
        keywords="youtube clipper, video timestamps, youtube bookmarks, clip youtube"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <Navbar />

      <main className="min-h-screen bg-background pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          {/* Hero */}
          <div className="mb-12 opacity-0 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <Scissors className="w-6 h-6 text-foreground" />
              <h1 className="text-4xl md:text-5xl font-medium tracking-[-0.03em] text-foreground">
                Video Clipper
              </h1>
            </div>
            <p className="text-muted-foreground text-sm uppercase tracking-wide">
              Paste a YouTube link · Mark timestamps · Share clips
            </p>
          </div>

          {/* URL Input */}
          <form
            onSubmit={handleLoadVideo}
            className="flex gap-0 mb-10 opacity-0 animate-fade-in [animation-delay:200ms]"
          >
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              required
              className="flex-1 h-[48px] px-4 bg-background text-foreground border border-foreground text-sm focus:outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="relative overflow-hidden h-[48px] px-6 bg-foreground text-background border border-foreground text-[11px] font-medium uppercase group"
            >
              <span className="relative z-10">Load Video</span>
              <span className="absolute inset-0 bg-[#FA76FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
            </button>
          </form>

          {/* Video Player + Controls */}
          {videoId && (
            <div className="flex flex-col lg:flex-row gap-8 opacity-0 animate-fade-in [animation-delay:400ms]">
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
              </div>

              {/* Right: Clip Controls */}
              <aside className="w-full lg:w-[340px] flex flex-col gap-6">
                {/* Add Clip Form */}
                <div className="border border-foreground p-6">
                  <h2 className="text-sm font-medium uppercase tracking-wide text-foreground mb-4">
                    New Clip
                  </h2>
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                        Start
                      </label>
                      <input
                        type="text"
                        value={startInput}
                        onChange={(e) => setStartInput(e.target.value)}
                        placeholder="0:00"
                        className="w-full h-[40px] px-3 bg-background text-foreground border border-foreground text-sm focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                        End
                      </label>
                      <input
                        type="text"
                        value={endInput}
                        onChange={(e) => setEndInput(e.target.value)}
                        placeholder="0:30"
                        className="w-full h-[40px] px-3 bg-background text-foreground border border-foreground text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    placeholder="Clip label (optional)"
                    className="w-full h-[40px] px-3 bg-background text-foreground border border-foreground text-sm focus:outline-none mb-3"
                  />
                  <button
                    onClick={handleAddClip}
                    className="relative overflow-hidden w-full h-[40px] bg-foreground text-background border border-foreground text-[11px] font-medium uppercase group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Plus className="w-3.5 h-3.5" />
                      Add Clip
                    </span>
                    <span className="absolute inset-0 bg-[#FA76FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
                  </button>
                </div>

                {/* Clip List */}
                {clips.length > 0 && (
                  <div className="border border-foreground">
                    <div className="px-6 py-3 border-b border-foreground">
                      <h2 className="text-sm font-medium uppercase tracking-wide text-foreground">
                        Clips ({clips.length})
                      </h2>
                    </div>
                    <div className="divide-y divide-border">
                      {clips.map((clip, i) => (
                        <div
                          key={clip.id}
                          className="px-6 py-4 flex items-center justify-between gap-3 opacity-0 animate-fade-in"
                          style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {clip.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(clip.start)} → {formatTime(clip.end)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <a
                              href={getClipUrl(clip)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 w-8 flex items-center justify-center border border-foreground hover:bg-foreground hover:text-background transition-colors"
                              title="Play clip"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleCopyLink(clip)}
                              className="h-8 w-8 flex items-center justify-center border border-foreground hover:bg-foreground hover:text-background transition-colors"
                              title="Copy link"
                            >
                              {copiedId === clip.id ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleRemoveClip(clip.id)}
                              className="h-8 w-8 flex items-center justify-center border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                              title="Remove clip"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
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
