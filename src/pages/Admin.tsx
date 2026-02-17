import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Coins, AlertTriangle } from "lucide-react";

const stats = [
  { icon: Users, label: "Total Users", value: "2,412" },
  { icon: BookOpen, label: "Active Skills", value: "847" },
  { icon: Coins, label: "Credits Circulated", value: "120,340" },
  { icon: AlertTriangle, label: "Open Disputes", value: "3" },
];

export default function Admin() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8">
        <h1 className="mb-2 text-3xl font-bold">Admin Dashboard</h1>
        <p className="mb-8 text-muted-foreground">Platform overview — full admin features coming in v1.1</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
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

        <Card className="mt-8">
          <CardHeader><CardTitle>Dispute Resolution</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">Dispute resolution and credit arbitration tools are planned for v1.1.</p></CardContent>
        </Card>
      </main>
    </div>
  );
}
