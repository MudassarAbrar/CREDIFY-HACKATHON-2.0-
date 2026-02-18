import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { disputesApi, bookingsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function NewDispute() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any | null>(null);
  const [loadingBooking, setLoadingBooking] = useState(!!bookingId);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [proofUrls, setProofUrls] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!bookingId || !user) return;
    bookingsApi
      .getBooking(parseInt(bookingId))
      .then((r) => setBooking(r.booking))
      .catch(() => toast({ title: "Error", description: "Booking not found", variant: "destructive" }))
      .finally(() => setLoadingBooking(false));
  }, [bookingId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bid = bookingId ? parseInt(bookingId) : booking?.id;
    if (!bid) {
      toast({ title: "Error", description: "Select or specify a booking", variant: "destructive" });
      return;
    }
    if (!subject.trim() || !description.trim()) {
      toast({ title: "Error", description: "Subject and description are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const proofArr = proofUrls
        ? proofUrls
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
      await disputesApi.create({
        booking_id: bid,
        subject: subject.trim(),
        description: description.trim(),
        proof_urls: proofArr,
      });
      toast({ title: "Dispute opened", description: "You can track it under My Disputes." });
      navigate("/disputes");
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to open dispute", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container py-8">
          <p className="text-center text-muted-foreground">Please log in to open a dispute.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8 max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold">Open a dispute</h1>
        <Card>
          <CardHeader>
            <CardTitle>Dispute form</CardTitle>
            <p className="text-sm text-muted-foreground">
              Describe the issue and optionally add proof (e.g. links to screenshots). An admin will review and may message you.
            </p>
          </CardHeader>
          <CardContent>
            {bookingId && loadingBooking && <p className="text-muted-foreground">Loading booking...</p>}
            {bookingId && booking && (
              <div className="mb-4 rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium">Booking: {booking.skill_title}</p>
                <p className="text-muted-foreground">
                  {booking.learner_name} / {booking.teacher_name} · {booking.credits_cost} credits
                </p>
              </div>
            )}
            {!bookingId && (
              <div className="mb-4">
                <Label>Booking ID</Label>
                <p className="text-sm text-muted-foreground">Open a dispute from the Bookings page by clicking &quot;Dispute&quot; on a booking card to pre-fill this form.</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Short summary of the issue"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what went wrong and what you expect..."
                  rows={4}
                  required
                />
              </div>
              <div>
                <Label htmlFor="proof">Proof / links (optional)</Label>
                <Textarea
                  id="proof"
                  value={proofUrls}
                  onChange={(e) => setProofUrls(e.target.value)}
                  placeholder="Paste URLs (one per line or comma-separated), e.g. links to screenshots or documents"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting || !bookingId}>
                  {submitting ? "Submitting..." : "Submit dispute"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/disputes">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
