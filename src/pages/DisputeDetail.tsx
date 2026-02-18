import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { disputesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Send } from "lucide-react";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "destructive",
  in_review: "secondary",
  resolved: "default",
  closed: "outline",
};

export default function DisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [dispute, setDispute] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    disputesApi
      .getDispute(parseInt(id))
      .then((r) => {
        setDispute(r.dispute);
        setMessages(r.messages || []);
      })
      .catch(() => toast({ title: "Error", description: "Failed to load dispute", variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const safeDate = (d: string | undefined) => {
    if (!d) return "—";
    const parsed = parseISO(d);
    return isValid(parsed) ? format(parsed, "MMM d, yyyy HH:mm") : "—";
  };

  const handleSend = async () => {
    if (!id || !reply.trim()) return;
    setSending(true);
    try {
      await disputesApi.postMessage(parseInt(id), reply.trim());
      setReply("");
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to send", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container py-8">
          <p className="text-center text-muted-foreground">Please log in to view this dispute.</p>
        </main>
      </div>
    );
  }

  if (loading || !dispute) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container py-8">
          <p className="text-muted-foreground">{loading ? "Loading..." : "Dispute not found."}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8 max-w-2xl">
        <Link to="/disputes" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← My disputes
        </Link>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {dispute.subject}
                <Badge variant={statusVariant[dispute.status] || "outline"}>{dispute.status}</Badge>
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Booking: {dispute.skill_title} · {safeDate(dispute.created_at)}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="mt-1 whitespace-pre-wrap">{dispute.description}</p>
            </div>
            {dispute.proof_urls && (() => {
              try {
                const urls = typeof dispute.proof_urls === "string" ? JSON.parse(dispute.proof_urls) : dispute.proof_urls;
                if (Array.isArray(urls) && urls.length > 0) {
                  return (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Proof / links</p>
                      <ul className="mt-1 list-inside list-disc text-sm">
                        {urls.map((u: string, i: number) => (
                          <li key={i}>
                            <a href={u} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              {u}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }
              } catch (_) {}
              return null;
            })()}
            {dispute.resolution_notes && (dispute.status === "resolved" || dispute.status === "closed") && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-sm font-medium text-muted-foreground">Resolution notes</p>
                <p className="mt-1 whitespace-pre-wrap">{dispute.resolution_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader><CardTitle>Messages</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {messages.map((m) => (
                <li key={m.id} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{m.sender_name}</span>
                    <span>{safeDate(m.created_at)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
                </li>
              ))}
            </ul>
            {(dispute.status === "open" || dispute.status === "in_review") && (
              <div className="space-y-2">
                <Label>Reply</Label>
                <Textarea
                  placeholder="Type your message..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={2}
                />
                <Button onClick={handleSend} disabled={sending || !reply.trim()}>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
