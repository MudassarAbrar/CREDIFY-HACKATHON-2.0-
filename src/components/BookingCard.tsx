import { Booking } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Coins, User, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isValid, parseISO } from "date-fns";

const statusStyles: Record<string, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  confirmed: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-success/15 text-success border-success/30",
  cancelled: "bg-muted text-muted-foreground",
};

// Safe date formatting
const safeFormatDate = (dateString: string, formatStr: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    if (isValid(date)) return format(date, formatStr);
    const fallback = new Date(dateString);
    if (isValid(fallback)) return format(fallback, formatStr);
    return 'N/A';
  } catch {
    return 'N/A';
  }
};

interface BookingCardProps {
  booking: Booking;
  role: "learner" | "teacher";
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onComplete?: (id: string) => void;
}

export function BookingCard({ booking, role, onConfirm, onCancel, onComplete }: BookingCardProps) {
  const { toast } = useToast();
  const otherPerson = role === "learner" ? booking.teacherName : booking.learnerName;

  const handleDispute = () => {
    toast({
      title: "Payment dispute",
      description: "Dispute resolution is coming soon. For now, please contact support if you have an issue with this booking.",
      variant: "default",
    });
  };

  // Determine confirmation status for both-party payment release flow
  const learnerConfirmed = booking.learner_confirmed_completion || false;
  const teacherConfirmed = booking.teacher_confirmed_completion || false;
  const myConfirmed = role === "learner" ? learnerConfirmed : teacherConfirmed;
  const otherConfirmed = role === "learner" ? teacherConfirmed : learnerConfirmed;
  const creditsReleased = booking.credits_released || booking.status === "completed";

  return (
    <Card className="card-hover">
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <h3 className="font-semibold">{booking.skillTitle}</h3>
          <Badge variant="outline" className={statusStyles[booking.status]}>
            {booking.status}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            {role === "learner" ? "Teacher: " : "Learner: "}{otherPerson}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {safeFormatDate(booking.scheduledAt, 'MMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {booking.duration}h
          </span>
          <span className="flex items-center gap-1">
            <Coins className="h-3.5 w-3.5" />
            {booking.creditsCost} credits
          </span>
        </div>

        {/* Payment Status for confirmed bookings */}
        {booking.status === "confirmed" && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Session Completion Status:</p>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                {learnerConfirmed ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className={learnerConfirmed ? "text-green-600" : "text-muted-foreground"}>
                  Learner {learnerConfirmed ? "confirmed" : "pending"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {teacherConfirmed ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className={teacherConfirmed ? "text-green-600" : "text-muted-foreground"}>
                  Teacher {teacherConfirmed ? "confirmed" : "pending"}
                </span>
              </div>
            </div>
            {!myConfirmed && (
              <p className="text-xs text-amber-600 mt-2">
                Please confirm completion after the session ends to release payment.
              </p>
            )}
            {myConfirmed && !otherConfirmed && (
              <p className="text-xs text-blue-600 mt-2">
                Waiting for {role === "learner" ? "teacher" : "learner"} to confirm completion.
              </p>
            )}
          </div>
        )}

        {/* Payment released status for completed bookings */}
        {booking.status === "completed" && (
          <div className="mt-3 pt-3 border-t space-y-2">
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Payment released to teacher</span>
            </div>
            <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700" onClick={handleDispute}>
              <AlertTriangle className="h-4 w-4 mr-1" />
              Report a problem / Dispute
            </Button>
          </div>
        )}

        {/* Dispute button for confirmed (not yet completed) */}
        {booking.status === "confirmed" && (
          <div className="mt-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-amber-600 text-xs" onClick={handleDispute}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              Report a problem
            </Button>
          </div>
        )}
      </CardContent>

      {(booking.status === "pending" || booking.status === "confirmed") && (
        <CardFooter className="flex gap-2 border-t px-4 pt-3">
          {booking.status === "pending" && role === "teacher" && onConfirm && (
            <Button size="sm" onClick={() => onConfirm(booking.id)}>
              Accept Booking
            </Button>
          )}
          {booking.status === "confirmed" && onComplete && !myConfirmed && (
            <Button size="sm" onClick={() => onComplete(booking.id)}>
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              Confirm Completion
            </Button>
          )}
          {booking.status === "confirmed" && myConfirmed && !otherConfirmed && (
            <Badge variant="secondary" className="text-xs">
              Awaiting {role === "learner" ? "teacher" : "learner"}'s confirmation
            </Badge>
          )}
          {onCancel && booking.status !== "completed" && (
            <Button size="sm" variant="outline" onClick={() => onCancel(booking.id)}>
              Cancel
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
