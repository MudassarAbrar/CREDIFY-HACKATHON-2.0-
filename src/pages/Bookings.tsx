import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { BookingCard } from "@/components/BookingCard";
import { Button } from "@/components/ui/button";
import { bookingsApi, getCurrentUser } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Booking } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

export default function Bookings() {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "requests" | "past">("upcoming");
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();

  // Load ALL bookings once on mount
  useEffect(() => {
    loadAllBookings();
  }, []);

  const loadAllBookings = async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      if (!currentUser) {
        setAllBookings([]);
        setLoading(false);
        return;
      }

      // Load ALL bookings without status filter to get accurate counts
      const response = await bookingsApi.getBookings();
      const converted = (response.bookings || []).map((b: any) => ({
        id: String(b.id),
        skillId: String(b.skill_id),
        skillTitle: b.skill_title || "",
        learnerId: String(b.learner_id),
        learnerName: b.learner_name || b.learner_email?.split('@')[0] || "Learner",
        teacherId: String(b.teacher_id),
        teacherName: b.teacher_name || b.teacher_email?.split('@')[0] || "Teacher",
        scheduledAt: b.scheduled_at || new Date().toISOString(),
        duration: parseInt(b.duration || 1),
        status: b.status === "pending" ? "pending" : b.status === "confirmed" ? "confirmed" : b.status === "completed" ? "completed" : "cancelled",
        creditsCost: parseFloat(b.credits_cost || 0),
        createdAt: b.created_at || new Date().toISOString(),
        // Payment confirmation flow fields
        learner_confirmed_completion: !!b.learner_confirmed_completion,
        teacher_confirmed_completion: !!b.teacher_confirmed_completion,
        credits_released: !!b.credits_released,
      }));
      setAllBookings(converted);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings based on active tab
  const upcoming = allBookings.filter((b) => b.status === "confirmed");
  const past = allBookings.filter((b) => b.status === "completed" || b.status === "cancelled");
  const requests = allBookings.filter((b) => b.status === "pending");

  const handleConfirm = async (id: string) => {
    try {
      await bookingsApi.confirmBooking(parseInt(id));
      refreshUser();
      toast({ title: "Booking confirmed!" });
      loadAllBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm booking",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await bookingsApi.cancelBooking(parseInt(id));
      refreshUser();
      toast({ title: "Booking cancelled." });
      loadAllBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking",
        variant: "destructive",
      });
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const response = await bookingsApi.completeBooking(parseInt(id));
      refreshUser();
      toast({ 
        title: response.paymentReleased ? "Payment Released!" : "Completion Confirmed",
        description: response.message || "Session marked as complete!",
      });
      loadAllBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete booking",
        variant: "destructive",
      });
    }
  };

  const isLoggedIn = !!getCurrentUser();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8">
        <h1 className="mb-6 text-3xl font-bold">Bookings</h1>

        {!isLoggedIn && !loading && (
          <div className="rounded-lg border bg-muted/30 p-8 text-center">
            <p className="text-muted-foreground mb-4">Log in to view and manage your bookings.</p>
            <Button onClick={() => window.location.href = '/login'}>Log in</Button>
          </div>
        )}

        {isLoggedIn && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upcoming" | "requests" | "past")}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="requests">Requests ({requests.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading bookings...</div>
          ) : (
            <>
              <TabsContent value="upcoming">
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {upcoming.length === 0 ? <p className="col-span-full py-8 text-center text-muted-foreground">No upcoming bookings.</p> : upcoming.map((b) => (
                    <BookingCard key={b.id} booking={b} role={user?.id === b.learnerId ? "learner" : "teacher"} onComplete={() => handleComplete(b.id)} onCancel={() => handleCancel(b.id)} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="requests">
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {requests.length === 0 ? <p className="col-span-full py-8 text-center text-muted-foreground">No pending requests.</p> : requests.map((b) => (
                    <BookingCard key={b.id} booking={b} role={user?.id === b.learnerId ? "learner" : "teacher"} onConfirm={() => handleConfirm(b.id)} onCancel={() => handleCancel(b.id)} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="past">
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {past.length === 0 ? <p className="col-span-full py-8 text-center text-muted-foreground">No past bookings.</p> : past.map((b) => (
                    <BookingCard key={b.id} booking={b} role={user?.id === b.learnerId ? "learner" : "teacher"} />
                  ))}
                </div>
              </TabsContent>
            </>
          )}
        </Tabs>
        )}
      </main>
    </div>
  );
}
