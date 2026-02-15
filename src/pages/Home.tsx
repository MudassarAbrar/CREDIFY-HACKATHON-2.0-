import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, Play, Zap, Share2, Clock, Star, ArrowRight, Check } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SEOHead } from '@/components/SEOHead';

const extractVideoId = (url: string): string | null => {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
};

const FEATURES = [
  { icon: Scissors, title: 'Precise Trimming', desc: 'Set exact start and end points with our visual timeline or manual input.' },
  { icon: Zap, title: 'Quality Selection', desc: 'Choose from 360p to 4K quality for every clip you create.' },
  { icon: Share2, title: 'Instant Sharing', desc: 'Generate timestamped links and export all clips in one click.' },
  { icon: Clock, title: 'Timeline Scrubber', desc: 'Drag handles on a visual timeline to quickly select clip ranges.' },
];

const STEPS = [
  { num: '01', title: 'Paste URL', desc: 'Drop any YouTube video link into the input field.' },
  { num: '02', title: 'Mark Segments', desc: 'Use the timeline or type start/end times to define clips.' },
  { num: '03', title: 'Share & Export', desc: 'Preview, copy links, or export all your clips at once.' },
];

const TESTIMONIALS = [
  { name: 'Alex R.', role: 'Content Creator', text: 'This tool saves me hours every week. I can clip lecture highlights in seconds and share them with my audience.' },
  { name: 'Maria K.', role: 'Video Editor', text: 'The timeline scrubber is incredibly intuitive. Best free clipper I\'ve found — no sign-up hassle.' },
  { name: 'James T.', role: 'Podcaster', text: 'I use it to bookmark key moments from interviews. The bulk export feature is a game-changer.' },
];

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['Unlimited clips', 'Timeline selection', 'Copy & share links', 'Quality selection'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    features: ['Everything in Free', 'Cloud-saved clips', 'AI auto-highlights', 'Priority support', 'Team sharing'],
    cta: 'Coming Soon',
    highlight: true,
  },
  {
    name: 'Team',
    price: '$29',
    period: '/month',
    features: ['Everything in Pro', 'Unlimited members', 'Shared clip libraries', 'Analytics dashboard', 'API access'],
    cta: 'Coming Soon',
    highlight: false,
  },
];

const Home = () => {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();

  const handleLoadVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractVideoId(url);
    if (id) {
      navigate(`/clip?v=${id}`);
    }
  };

  return (
    <>
      <SEOHead
        title="Clipper — YouTube Video Clipper"
        description="Clip, bookmark, and share moments from any YouTube video. Free, fast, no sign-up required."
        keywords="youtube clipper, video timestamps, clip youtube videos, youtube bookmarks"
      />
      <link href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <Navbar />

      <main className="min-h-screen bg-background">
        {/* ── HERO ── */}
        <section className="relative pt-32 pb-24 px-4 md:px-8 overflow-hidden">
          {/* Decorative grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />

          <div className="max-w-5xl mx-auto relative">
            <div className="opacity-0 animate-fade-in">
              <div className="inline-flex items-center gap-2 border border-foreground px-3 py-1.5 mb-8">
                <span className="w-2 h-2 bg-[#FA76FF] animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-foreground font-medium">Free · No Sign-up Required</span>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-[-0.04em] text-foreground leading-[0.95] mb-6">
                Clip YouTube<br />
                <span className="text-muted-foreground">moments</span> instantly
              </h1>

              <p className="text-muted-foreground text-sm md:text-base max-w-lg mb-10 leading-relaxed">
                Paste any YouTube URL, mark start & end timestamps, and generate shareable clips in seconds. No downloads, no accounts needed.
              </p>
            </div>

            {/* URL Input */}
            <form onSubmit={handleLoadVideo} className="flex gap-0 max-w-2xl opacity-0 animate-fade-in [animation-delay:200ms]">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                required
                className="flex-1 h-[52px] px-5 bg-background text-foreground border border-foreground text-sm focus:outline-none placeholder:text-muted-foreground"
              />
              <button type="submit" className="relative overflow-hidden h-[52px] px-8 bg-foreground text-background border border-foreground text-[11px] font-medium uppercase group">
                <span className="relative z-10 flex items-center gap-2">Load Video <ArrowRight className="w-3.5 h-3.5" /></span>
                <span className="absolute inset-0 bg-[#FA76FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              </button>
            </form>

            {/* Stats */}
            <div className="flex gap-10 mt-14 opacity-0 animate-fade-in [animation-delay:400ms]">
              {[
                ['100%', 'Free'],
                ['No', 'Sign-up'],
                ['Instant', 'Clips'],
              ].map(([big, small]) => (
                <div key={small}>
                  <p className="text-2xl md:text-3xl font-medium text-foreground tracking-tight">{big}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{small}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="py-24 px-4 md:px-8 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <div className="mb-14 opacity-0 animate-fade-in">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Features</p>
              <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-foreground">
                Everything you need to clip
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-foreground">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className={`p-8 md:p-10 opacity-0 animate-fade-in group hover:bg-foreground transition-colors duration-300 ${
                    i < 2 ? 'border-b border-foreground' : ''
                  } ${i % 2 === 0 ? 'md:border-r border-foreground' : ''}`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <f.icon className="w-5 h-5 text-foreground group-hover:text-background mb-4 transition-colors" />
                  <h3 className="text-lg font-medium text-foreground group-hover:text-background mb-2 transition-colors">{f.title}</h3>
                  <p className="text-sm text-muted-foreground group-hover:text-background/70 leading-relaxed transition-colors">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-24 px-4 md:px-8 bg-foreground text-background">
          <div className="max-w-5xl mx-auto">
            <div className="mb-14">
              <p className="text-[10px] uppercase tracking-widest text-background/50 mb-2">How It Works</p>
              <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em]">
                Three simple steps
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-background/20">
              {STEPS.map((s, i) => (
                <div
                  key={s.num}
                  className={`p-8 md:p-10 opacity-0 animate-fade-in ${i < 2 ? 'md:border-r border-background/20' : ''}`}
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <span className="text-5xl font-medium text-[#FA76FF] mb-4 block">{s.num}</span>
                  <h3 className="text-lg font-medium mb-2">{s.title}</h3>
                  <p className="text-sm text-background/60 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="py-24 px-4 md:px-8 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <div className="mb-14 opacity-0 animate-fade-in">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Testimonials</p>
              <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-foreground">
                Loved by creators
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={t.name}
                  className="border border-foreground p-8 opacity-0 animate-fade-in hover:bg-foreground hover:text-background transition-colors duration-300 group"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-[#FA76FF] text-[#FA76FF]" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-6 text-muted-foreground group-hover:text-background/70 transition-colors">"{t.text}"</p>
                  <div>
                    <p className="text-sm font-medium text-foreground group-hover:text-background transition-colors">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground group-hover:text-background/50 transition-colors">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className="py-24 px-4 md:px-8 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <div className="mb-14 text-center opacity-0 animate-fade-in">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Pricing</p>
              <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-foreground">
                Start free, upgrade when ready
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((plan, i) => (
                <div
                  key={plan.name}
                  className={`border p-8 opacity-0 animate-fade-in flex flex-col ${
                    plan.highlight
                      ? 'border-[#FA76FF] bg-foreground text-background'
                      : 'border-foreground'
                  }`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {plan.highlight && (
                    <span className="inline-block self-start text-[9px] uppercase tracking-widest bg-[#FA76FF] text-black px-2 py-1 font-medium mb-4">Popular</span>
                  )}
                  <h3 className="text-lg font-medium mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-medium">{plan.price}</span>
                    <span className={`text-sm ${plan.highlight ? 'text-background/50' : 'text-muted-foreground'}`}>{plan.period}</span>
                  </div>
                  <ul className="flex-1 space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className={`w-3.5 h-3.5 ${plan.highlight ? 'text-[#FA76FF]' : 'text-foreground'}`} />
                        <span className={plan.highlight ? 'text-background/80' : 'text-muted-foreground'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => plan.name === 'Free' ? navigate('/clip') : null}
                    className={`relative overflow-hidden w-full h-[44px] text-[11px] font-medium uppercase border group ${
                      plan.highlight
                        ? 'bg-[#FA76FF] text-black border-[#FA76FF] hover:opacity-90'
                        : 'bg-foreground text-background border-foreground'
                    }`}
                    disabled={plan.name !== 'Free'}
                  >
                    <span className="relative z-10">{plan.cta}</span>
                    {plan.name === 'Free' && (
                      <span className="absolute inset-0 bg-[#FA76FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER CTA ── */}
        <section className="py-20 px-4 md:px-8 border-t border-border">
          <div className="max-w-3xl mx-auto text-center opacity-0 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-medium tracking-[-0.03em] text-foreground mb-4">
              Ready to start clipping?
            </h2>
            <p className="text-sm text-muted-foreground mb-8">No sign-up required. Just paste a link and go.</p>
            <button
              onClick={() => navigate('/clip')}
              className="relative overflow-hidden h-[48px] px-10 bg-foreground text-background border border-foreground text-[11px] font-medium uppercase group"
            >
              <span className="relative z-10 flex items-center gap-2">Open Clipper <ArrowRight className="w-3.5 h-3.5" /></span>
              <span className="absolute inset-0 bg-[#FA76FF] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 px-4 md:px-8">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-foreground" />
              <span className="text-[11px] uppercase tracking-wide font-medium text-foreground">Clipper</span>
            </div>
            <p className="text-[11px] text-muted-foreground">© 2026 Clipper. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </>
  );
};

export default Home;
