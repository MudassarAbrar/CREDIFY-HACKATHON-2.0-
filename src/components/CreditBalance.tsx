import { Coins, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CreditBalanceProps {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export function CreditBalance({ balance, totalEarned, totalSpent }: CreditBalanceProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Coins className="mb-2 h-8 w-8 text-primary" />
          <p className="label-uppercase mb-1">Balance</p>
          <p className="animate-count-up text-4xl font-bold">{balance}</p>
          <p className="text-xs text-muted-foreground">credits</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <TrendingUp className="mb-2 h-6 w-6 text-success" />
          <p className="label-uppercase mb-1">Earned</p>
          <p className="text-2xl font-bold">{totalEarned}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <TrendingDown className="mb-2 h-6 w-6 text-destructive" />
          <p className="label-uppercase mb-1">Spent</p>
          <p className="text-2xl font-bold">{totalSpent}</p>
        </CardContent>
      </Card>
    </div>
  );
}
