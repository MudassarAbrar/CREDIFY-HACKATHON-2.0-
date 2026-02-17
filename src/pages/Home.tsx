import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, ArrowRight, BookOpen, Repeat, Wallet, Users, Zap, Star } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const features = [
  { icon: Coins, title: "Credit System", desc: "Earn credits by teaching, spend them to learn. Students get bonus rates." },
  { icon: Users, title: "Peer Matching", desc: "Find the perfect teacher or student based on skills, rates, and availability." },
  { icon: Wallet, title: "Skill Wallet", desc: "Track your credits, transactions, and badges all in one place." },
];

const steps = [
  { icon: BookOpen, title: "Teach", desc: "List your skills and set your rate per hour." },
  { icon: Coins, title: "Earn", desc: "Get credits for every hour you teach." },
  { icon: Zap, title: "Learn", desc: "Spend credits to learn new skills from peers." },
];

const stats = [
  { value: "2,400+", label: "Active Users" },
  { value: "8,500+", label: "Skills Exchanged" },
  { value: "120K", label: "Credits Circulated" },
];

const testimonials = [
  { name: "Maya J.", type: "Student", quote: "I taught Figma and earned enough credits to learn React. Game changer!" },
  { name: "Sam P.", type: "Professional", quote: "Best platform for sharing music knowledge. The credit system is fair and motivating." },
  { name: "Lena M.", type: "Student", quote: "Learned German and Python in exchange for teaching photography. Love the community!" },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        {/* Hero */}
        <section className="container py-20 text-center md:py-32">
          <div className="mx-auto max-w-3xl animate-fade-in">
            <p className="label-uppercase mb-4">Peer-to-Peer Skill Exchange</p>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              Trade skills,{" "}
              <span className="gradient-text">earn credits</span>
            </h1>
            <p className="mx-auto mb-8 max-w-xl text-lg text-muted-foreground">
              Teach what you know, learn what you need. A credit-based marketplace where every skill has value.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link to="/browse">
                  Browse Skills <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/teach">Start Teaching</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-y bg-muted/30 py-16">
          <div className="container">
            <h2 className="mb-10 text-center text-2xl font-bold">Why SkillSwap?</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((f) => (
                <Card key={f.title} className="card-hover text-center">
                  <CardContent className="pt-8">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <f.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 font-semibold">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="container py-16">
          <h2 className="mb-10 text-center text-2xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="flex flex-col items-center text-center animate-fade-in" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-2xl font-bold text-primary">
                  {i + 1}
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <s.icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{s.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
                {i < steps.length - 1 && (
                  <Repeat className="mt-4 hidden h-5 w-5 rotate-90 text-muted-foreground/40 md:block md:rotate-0" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="border-y bg-foreground py-12 text-background">
          <div className="container grid gap-8 md:grid-cols-3">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-sm opacity-70">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="container py-16">
          <h2 className="mb-10 text-center text-2xl font-bold">What Users Say</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="card-hover">
                <CardContent className="pt-6">
                  <div className="mb-3 flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="mb-4 text-sm italic text-muted-foreground">"{t.quote}"</p>
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.type}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container pb-20 text-center">
          <Card className="border-primary/30 bg-primary/5 p-10">
            <h2 className="mb-3 text-2xl font-bold">Ready to start exchanging skills?</h2>
            <p className="mb-6 text-muted-foreground">Sign up free and get 100 credits to start learning today.</p>
            <Button size="lg" asChild>
              <Link to="/register">Get Started Free <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </Card>
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
