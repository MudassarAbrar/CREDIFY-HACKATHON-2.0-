import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { disputesApi } from "@/lib/api";
import { format, parseISO, isValid } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "destructive",
  in_review: "secondary",
  resolved: "default",
  closed: "outline",
};

export default function Disputes() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    disputesApi
      .getMyDisputes()
      .then((r) => setDisputes(r.disputes || []))
      .catch(() => setDisputes([]))
      .finally(() => setLoading(false));
  }, []);

  const safeDate = (d: string | undefined) => {
    if (!d) return "—";
    const parsed = parseISO(d);
    return isValid(parsed) ? format(parsed, "MMM d, yyyy") : "—";
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container py-8">
          <p className="text-center text-muted-foreground">Please log in to view your disputes.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8">
        <h1 className="mb-6 text-2xl font-bold">My Disputes</h1>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Disputes</CardTitle>
            <Link to="/disputes/new" className="text-sm font-medium text-primary hover:underline">
              Open a dispute
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : disputes.length === 0 ? (
              <p className="text-muted-foreground">You have no disputes. Open one from a booking (Bookings page → Dispute on a booking card).</p>
            ) : (
              <div className="space-y-3">
                {disputes.map((d) => (
                  <Link
                    key={d.id}
                    to={`/disputes/${d.id}`}
                    className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{d.subject}</span>
                      <Badge variant={statusVariant[d.status] || "outline"}>{d.status}</Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {d.skill_title} · {safeDate(d.created_at)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
