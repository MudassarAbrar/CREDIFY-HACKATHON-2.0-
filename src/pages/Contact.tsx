import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, Mail, MapPin, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      // For now open mailto; replace with API call if you add a contact endpoint
      const mailto = `mailto:hello@skillswap.com?subject=${encodeURIComponent(subject || "Contact from SkillSwap")}&body=${encodeURIComponent(
        `From: ${name} (${email})\n\n${message}`
      )}`;
      window.location.href = mailto;
      toast({ title: "Opening email", description: "Use your email client to send your message." });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      toast({ title: "Error", description: "Could not open email client.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b bg-muted/30 py-16 md:py-20">
          <div className="container max-w-4xl mx-auto text-center px-4">
            <span className="inline-block px-4 py-1.5 rounded-full bg-muted text-muted-foreground text-sm font-medium mb-4">
              CONTACT
            </span>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Get in touch</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Have a question or feedback? We’d love to hear from you.
            </p>
          </div>
        </section>

        <div className="container max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Info cards */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Email</h3>
                      <a href="mailto:hello@skillswap.com" className="text-muted-foreground hover:text-primary transition-colors">
                        hello@skillswap.com
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Support</h3>
                      <p className="text-muted-foreground text-sm">We typically reply within 24 hours.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Office</h3>
                      <p className="text-muted-foreground text-sm">SkillSwap HQ</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="pt-8 pb-8">
                  <h2 className="text-xl font-semibold mb-6">Send a message</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="Your name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="How can we help?"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                        required
                        className="resize-none"
                      />
                    </div>
                    <Button type="submit" disabled={sending} className="gap-2">
                      <Send className="h-4 w-4" />
                      {sending ? "Sending..." : "Send message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-8 mt-auto">
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
