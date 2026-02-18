import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from "date-fns";
import { MessageSquare, ChevronDown, ChevronUp, Send, User } from "lucide-react";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "destructive",
  in_review: "secondary",
  resolved: "default",
  closed: "outline",
};

export default function AdminDisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [dispute, setDispute] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<{ messages: any[] } | null>(null);
  const [conversationOpen, setConversationOpen] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [sending, setSending] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  const loadDispute = () => {
    if (!id) return;
    setLoading(true);
    adminApi
      .getDispute(parseInt(id))
      .then((r) => {
        setDispute(r.dispute);
        setMessages(r.messages || []);
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to load dispute", variant: "destructive" });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDispute();
  }, [id]);

  const loadBookingConversation = () => {
    if (!dispute?.booking_id) return;
    setLoadingConv(true);
    adminApi
      .getBookingConversation(dispute.booking_id)
      .then((r) => setConversation({ messages: r.messages || [] }))
      .catch(() => toast({ title: "Error", description: "Failed to load conversation", variant: "destructive" }))
      .finally(() => setLoadingConv(false));
  };

  const safeDate = (d: string | undefined) => {
    if (!d) return "—";
    const parsed = parseISO(d);
    return isValid(parsed) ? format(parsed, "MMM d, yyyy HH:mm") : "—";
  };

  const handleSendReply = async () => {
    if (!id || (!reply.trim() && !internalNote.trim())) return;
    setSending(true);
    try {
      if (reply.trim()) {
        await adminApi.postDisputeMessage(parseInt(id), reply.trim(), false);
        setReply("");
      }
      if (internalNote.trim()) {
        await adminApi.postDisputeMessage(parseInt(id), internalNote.trim(), true);
        setInternalNote("");
      }
      loadDispute();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to send", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!id) return;
    setResolving(true);
    try {
      await adminApi.updateDispute(parseInt(id), { status: "resolved", resolution_notes: resolutionNotes });
      toast({ title: "Resolved", description: "Dispute marked as resolved." });
      setResolveOpen(false);
      setResolutionNotes("");
      loadDispute();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to resolve", variant: "destructive" });
    } finally {
      setResolving(false);
    }
  };

  const handleClose = async () => {
    if (!id) return;
    setResolving(true);
    try {
      await adminApi.updateDispute(parseInt(id), { status: "closed" });
      toast({ title: "Closed", description: "Dispute closed." });
      loadDispute();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to close", variant: "destructive" });
    } finally {
      setResolving(false);
    }
  };

  if (loading || !dispute) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {loading ? "Loading..." : "Dispute not found."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/admin/disputes" className="text-sm text-muted-foreground hover:text-foreground">
          ← Disputes
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              #{dispute.id} {dispute.subject}
              <Badge variant={statusVariant[dispute.status] || "outline"}>{dispute.status}</Badge>
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Raised by {dispute.raised_by_name} · {safeDate(dispute.created_at)}
            </p>
          </div>
          {dispute.status === "open" && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => adminApi.updateDispute(parseInt(id!), { status: "in_review" }).then(loadDispute)}>
                Mark in review
              </Button>
              <Button size="sm" onClick={() => setResolveOpen(true)}>Resolve</Button>
              <Button variant="outline" size="sm" onClick={handleClose}>Close</Button>
            </div>
          )}
          {(dispute.status === "in_review") && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setResolveOpen(true)}>Resolve</Button>
              <Button variant="outline" size="sm" onClick={handleClose}>Close</Button>
            </div>
          )}
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
                          <a href={u} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{u}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
            } catch (_) {}
            return null;
          })()}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Booking</p>
            <p className="mt-1">
              {dispute.skill_title} · {dispute.credits_cost} credits · {safeDate(dispute.scheduled_at)}
            </p>
            <p className="text-sm">
              Learner: <Link to={`/profile/${dispute.learner_id}`} className="text-primary hover:underline">{dispute.learner_name}</Link>
              {" · "}
              Teacher: <Link to={`/profile/${dispute.teacher_id}`} className="text-primary hover:underline">{dispute.teacher_name}</Link>
            </p>
          </div>

          {/* Disputees' chat (read-only) */}
          <div>
            <button
              type="button"
              onClick={() => {
                setConversationOpen(!conversationOpen);
                if (!conversationOpen && !conversation) loadBookingConversation();
              }}
              className="flex w-full items-center justify-between rounded-lg border p-3 text-left"
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                View disputees' chat
              </span>
              {conversationOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {conversationOpen && (
              <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border bg-muted/30 p-3">
                {loadingConv ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : !conversation?.messages?.length ? (
                  <p className="text-sm text-muted-foreground">No messages in this booking conversation.</p>
                ) : (
                  <ul className="space-y-2">
                    {conversation.messages.map((m: any) => (
                      <li key={m.id} className="flex gap-2 text-sm">
                        <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium">{m.sender_name}:</span>
                        <span>{m.content}</span>
                        <span className="text-muted-foreground">{safeDate(m.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {dispute.resolution_notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resolution notes</p>
              <p className="mt-1 whitespace-pre-wrap">{dispute.resolution_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispute thread */}
      <Card>
        <CardHeader><CardTitle>Dispute thread</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {messages.map((m) => (
              <li key={m.id} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{m.sender_name}</span>
                  {m.is_internal && <Badge variant="outline">Internal</Badge>}
                  <span className="text-muted-foreground">{safeDate(m.created_at)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <Label>Reply to parties</Label>
            <Textarea
              placeholder="Message visible to both parties..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={2}
            />
            <Label>Internal note (admin only)</Label>
            <Textarea
              placeholder="Note only visible to admins..."
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              rows={1}
            />
            <Button onClick={handleSendReply} disabled={sending || (!reply.trim() && !internalNote.trim())}>
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      {resolveOpen && (
        <Card>
          <CardHeader><CardTitle>Resolve dispute</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Label>Resolution notes</Label>
            <Textarea
              placeholder="Optional notes for the resolution..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={handleResolve} disabled={resolving}>Confirm resolve</Button>
              <Button variant="outline" onClick={() => setResolveOpen(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
