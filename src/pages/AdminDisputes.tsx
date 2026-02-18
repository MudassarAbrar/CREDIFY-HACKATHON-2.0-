import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/api";
import { format, parseISO, isValid } from "date-fns";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "destructive",
  in_review: "secondary",
  resolved: "default",
  closed: "outline",
};

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    adminApi
      .getDisputes(statusFilter ? { status: statusFilter } : {})
      .then((r) => setDisputes(r.disputes || []))
      .catch(() => setDisputes([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const safeDate = (d: string | undefined) => {
    if (!d) return "—";
    const parsed = parseISO(d);
    return isValid(parsed) ? format(parsed, "MMM d, yyyy HH:mm") : "—";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Disputes</CardTitle>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_review">In review</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : disputes.length === 0 ? (
          <p className="text-muted-foreground">No disputes found.</p>
        ) : (
          <div className="space-y-3">
            {disputes.map((d) => (
              <Link
                key={d.id}
                to={`/admin/disputes/${d.id}`}
                className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-medium">#{d.id}</span>
                    <span className="ml-2 text-muted-foreground">— {d.subject}</span>
                  </div>
                  <Badge variant={statusVariant[d.status] || "outline"}>{d.status}</Badge>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Booking: {d.skill_title} · Raised by {d.raised_by_name} · {safeDate(d.created_at)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
