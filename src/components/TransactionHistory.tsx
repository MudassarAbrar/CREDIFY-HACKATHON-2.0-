import { useState } from "react";
import { Transaction } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface TransactionHistoryProps {
  transactions: Transaction[];
  filter?: "all" | "earn" | "spend";
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { dateStyle: "medium" }) + " " + d.toLocaleTimeString(undefined, { timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function TransactionHistory({ transactions, filter = "all" }: TransactionHistoryProps) {
  const [selected, setSelected] = useState<Transaction | null>(null);
  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  if (filtered.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">No transactions yet.</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((t) => (
            <TableRow
              key={t.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => setSelected(t)}
            >
              <TableCell className="font-medium">{t.description}</TableCell>
              <TableCell>
                <Badge variant={t.type === "earn" ? "default" : "secondary"} className={t.type === "earn" ? "bg-success text-success-foreground" : ""}>
                  {t.type}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <span className={`flex items-center justify-end gap-1 font-semibold ${t.type === "earn" ? "text-success" : "text-destructive"}`}>
                  {t.type === "earn" ? "+" : "-"}{t.amount}
                  <Coins className="h-3.5 w-3.5" />
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">{t.createdAt}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md" aria-describedby="tx-detail-desc">
          <DialogHeader>
            <DialogTitle>Transaction details</DialogTitle>
            <DialogDescription id="tx-detail-desc">Details for this credit transaction: who you worked with, session, and amount.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Description:</span> {selected.description}</p>
              <p><span className="font-medium">Worked with:</span> {selected.otherPartyName || "—"}</p>
              <p><span className="font-medium">Skill / session:</span> {selected.skillTitle || "—"}</p>
              <p><span className="font-medium">Session date:</span> {formatDate(selected.scheduledAt) || formatDate(selected.createdAt)}</p>
              {selected.duration != null && (
                <p><span className="font-medium">Session length:</span> {selected.duration === 1 ? '1 hour' : `${Number(selected.duration)} hours`}</p>
              )}
              <p><span className="font-medium">Amount:</span> {selected.type === "earn" ? "+" : "-"}{selected.amount} credits</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
