import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Coins, AlertTriangle, Scale } from "lucide-react";
import { adminApi } from "@/lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<{ totalUsers: number; activeSkills: number; totalBookings: number; openDisputes: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getStats()
      .then((r) => setStats(r.stats))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? [...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    <div className="h-6 w-12 animate-pulse rounded bg-muted" />
                  </div>
                </CardContent>
              </Card>
            ))
          : stats &&
            [
              { icon: Users, label: "Total Users", value: String(stats.totalUsers) },
              { icon: BookOpen, label: "Active Skills", value: String(stats.activeSkills) },
              { icon: Coins, label: "Total Bookings", value: String(stats.totalBookings) },
              { icon: AlertTriangle, label: "Open Disputes", value: String(stats.openDisputes) },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              to="/admin/disputes"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Scale className="h-4 w-4" />
              View & resolve disputes
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
