import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Coins, ArrowRight, ChevronRight, Mail } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ArcGalleryHero } from "@/components/ui/arc-gallery-hero-component";
import Testimonials from "@/components/ui/testimonials";
import CurvedLoop from "@/components/ui/CurvedLoop";
import CountUp from "@/components/ui/CountUp";
import { FeaturesSectionWithHoverEffects } from "@/components/ui/feature-section-with-hover-effects";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const steps = [
  { phase: "Phase 1", title: "Teach", desc: "List your skills and set your rate per hour. Create an offer and get discovered by learners who need what you know." },
  { phase: "Phase 2", title: "Earn", desc: "Get credits for every hour you teach. Students get bonus rates—everyone wins. Your time turns into currency." },
  { phase: "Phase 3", title: "Learn", desc: "Spend credits to learn new skills from peers. Book sessions and grow your skill set on your schedule." },
];

const stats = [
  { to: 2400, plus: true, label: "Active Users" },
  { to: 8500, plus: true, label: "Skills Exchanged" },
  { to: 120, suffix: "K", label: "Credits Circulated" },
];

// An array of Unsplash image URLs related to skills and learning
const skillImages = [
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=400&auto=format&fit=crop',
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        {/* Hero with Arc Gallery */}
        <div className="relative">
          <ArcGalleryHero images={skillImages} />
        </div>

        {/* Curved marquee - grey band sized to fit the curve */}
        <section className="border-y bg-muted/30 overflow-visible py-2">
          <CurvedLoop
            marqueeText="Teach ✦ Earn ✦ Learn ✦ SkillSwap ✦ Trade Skills ✦"
            speed={1.5}
            curveAmount={200}
            direction="left"
            interactive
            wrapperClassName="min-h-[100px] flex items-end justify-center w-full"
          />
        </section>

        {/* Features - Why SkillSwap? (same layout as How it works) */}
        <section className="container pt-20 pb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-muted text-muted-foreground text-sm font-medium mb-4">
                FEATURES
              </span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Why SkillSwap?</h2>
            </div>
          </div>
          <div className="max-w-6xl mx-auto">
            <FeaturesSectionWithHoverEffects />
          </div>
        </section>

        {/* How it works - roadmap style */}
        <section className="container pt-12 pb-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-muted text-muted-foreground text-sm font-medium mb-4">
                ROADMAP
              </span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How SkillSwap works</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-x-6 gap-y-8 max-w-6xl mx-auto items-start">
            {steps.map((s, i) => (
              <div key={s.title} className="contents">
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold mb-2">{s.phase}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex items-center justify-center pt-8 text-muted-foreground/50">
                    <ChevronRight className="h-7 w-7" aria-hidden />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Stats - count-up animation, larger text */}
        <section className="border-y bg-foreground py-16 text-background">
          <div className="container max-w-6xl mx-auto grid gap-10 md:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl md:text-5xl font-bold tabular-nums">
                  {s.suffix === "K" ? (
                    <>
                      <CountUp from={0} to={s.to} duration={1.4} delay={0.15} separator="" className="tabular-nums" />
                      {s.suffix}
                    </>
                  ) : (
                    <>
                      <CountUp from={0} to={s.to} duration={1.2} delay={0.1} separator="," className="tabular-nums" />
                      {s.plus ? "+" : ""}
                    </>
                  )}
                </p>
                <p className="text-base md:text-lg opacity-90 mt-2 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="container pt-20 pb-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-muted text-muted-foreground text-sm font-medium mb-4">
                FAQ
              </span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently asked questions</h2>
            </div>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full [&>[data-state]]:border-b">
              <AccordionItem value="credits" className="border-b-0 py-1">
                <AccordionTrigger className="text-base md:text-lg font-semibold py-3 hover:no-underline">How do credits work?</AccordionTrigger>
                <AccordionContent>
                  You earn credits by teaching others and spend them to learn. New users get 100 free credits. Students receive bonus rates when booking sessions.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="teach" className="border-b-0 py-1">
                <AccordionTrigger className="text-base md:text-lg font-semibold py-3 hover:no-underline">How do I list a skill to teach?</AccordionTrigger>
                <AccordionContent>
                  Go to Teach, create an offer with your skill, hourly rate in credits, and availability. Learners can find you on Browse and request a session.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="learn" className="border-b-0 py-1">
                <AccordionTrigger className="text-base md:text-lg font-semibold py-3 hover:no-underline">How do I book a learning session?</AccordionTrigger>
                <AccordionContent>
                  Browse skills or create a skill request. When you find a match, book a session. Credits are held and released to the teacher after the session is completed.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="safety" className="border-b-0 py-1">
                <AccordionTrigger className="text-base md:text-lg font-semibold py-3 hover:no-underline">Is SkillSwap secure?</AccordionTrigger>
                <AccordionContent>
                  Yes. All transactions use in-app credits. We use authentication and reviews to build trust. For disputes, contact support through the Bookings page.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Testimonials */}
        <Testimonials />

        {/* CTA - dark background */}
        <section className="bg-foreground text-background py-20 px-6">
          <div className="container max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Ready to start exchanging skills?</h2>
            <p className="text-background/80 mb-8 text-lg">Sign up free and get 100 credits. Teach what you know, learn what you need.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" asChild className="bg-background text-foreground hover:bg-background/90">
                <Link to="/register">Get Started Free <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white bg-transparent hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link to="/contact">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact us
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Coins className="h-4 w-4 text-primary" />
            SkillSwap
          </div>
          <p>© 2026 SkillSwap. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
