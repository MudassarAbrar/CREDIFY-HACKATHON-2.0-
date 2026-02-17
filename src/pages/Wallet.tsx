import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { CreditBalance } from "@/components/CreditBalance";
import { TransactionHistory } from "@/components/TransactionHistory";
import { transactionsApi, usersApi, getCurrentUser } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";
import { Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function WalletPage() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "earn" | "spend">("all");
  const { toast } = useToast();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    loadTransactions();
  }, [filter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      const response = await transactionsApi.getTransactions(filter === "all" ? undefined : filter);
      const currentUserId = currentUser?.id != null ? String(currentUser.id) : null;
      const converted: Transaction[] = (response.transactions || []).map((t: any) => {
        const isEarn = t.type === "earn";
        const otherName = isEarn ? (t.learner_name || t.learner_email?.split?.('@')[0]) : (t.teacher_name || t.teacher_email?.split?.('@')[0]);
        return {
          id: String(t.id),
          userId: String(t.user_id),
          type: t.type === "earn" ? "earn" : "spend",
          amount: parseFloat(t.amount || 0),
          bookingId: t.booking_id ? String(t.booking_id) : undefined,
          description: t.description || "",
          createdAt: t.created_at || new Date().toISOString(),
          otherPartyName: otherName || undefined,
          skillTitle: t.skill_title || undefined,
          scheduledAt: t.scheduled_at || undefined,
          duration: t.duration != null ? Number(t.duration) : undefined,
        };
      });
      setTransactions(converted);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const balance = user?.creditBalance ?? 0;
  const totalEarned = transactions.filter((t) => t.type === "earn").reduce((s, t) => s + t.amount, 0);
  const totalSpent = transactions.filter((t) => t.type === "spend").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8">
        <h1 className="mb-6 text-3xl font-bold">Skill Wallet</h1>

        <CreditBalance balance={balance} totalEarned={totalEarned} totalSpent={totalSpent} />

        <div className="mt-8">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "earn" | "spend")}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="earn">Earned</TabsTrigger>
              <TabsTrigger value="spend">Spent</TabsTrigger>
            </TabsList>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Loading transactions...</div>
            ) : (
              <>
                <TabsContent value="all"><TransactionHistory transactions={transactions} /></TabsContent>
                <TabsContent value="earn"><TransactionHistory transactions={transactions} filter="earn" /></TabsContent>
                <TabsContent value="spend"><TransactionHistory transactions={transactions} filter="spend" /></TabsContent>
              </>
            )}
          </Tabs>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-primary" /> Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Badges coming soon! Complete exchanges to unlock achievements.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
