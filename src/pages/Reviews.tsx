import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { reviewsApi, bookingsApi, getCurrentUser } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Star, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Review, Booking } from "@/lib/types";
import { format } from "date-fns";

export default function Reviews() {
  const [searchParams] = useSearchParams();
  const forUserId = searchParams.get('for');
  const reviewSectionRef = useRef<HTMLDivElement>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<'all' | 'as_teacher' | 'as_learner'>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (currentUser) {
      loadReviews();
      loadCompletedBookings();
    }
  }, [filter, currentUser]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewsApi.getUserReviews(parseInt(currentUser.id), filter === 'all' ? undefined : filter);
      setReviews(response.reviews || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const normalizeBooking = (b: any): Booking => ({
    id: String(b.id),
    learnerId: String(b.learner_id),
    teacherId: String(b.teacher_id),
    skillId: String(b.skill_id),
    skillTitle: b.skill_title || b.skillTitle || '',
    learnerName: b.learner_name || b.learnerName || '',
    teacherName: b.teacher_name || b.teacherName || '',
    status: b.status || 'pending',
    scheduledAt: b.scheduled_at || b.scheduledAt,
    duration: b.duration,
    creditsCost: b.credits_cost ?? b.creditsCost,
    createdAt: b.created_at || b.createdAt,
  });

  const loadCompletedBookings = async () => {
    try {
      const response = await bookingsApi.getBookings('completed');
      const raw = response.bookings || [];
      setBookings(raw.map(normalizeBooking));
    } catch (error: any) {
      // Ignore errors
    }
  };

  useEffect(() => {
    if (forUserId && reviewSectionRef.current) {
      reviewSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [forUserId, bookings]);

  const handleCreateReview = async (bookingId: number, rating: number, reviewText: string, reviewType: 'as_teacher' | 'as_learner') => {
    try {
      await reviewsApi.createReview({
        booking_id: bookingId,
        rating,
        review_text: reviewText,
        review_type: reviewType,
      });
      toast({ title: "Success", description: "Review created successfully" });
      loadReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create review",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await reviewsApi.deleteReview(reviewId);
      toast({ title: "Success", description: "Review deleted successfully" });
      loadReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container py-8">
          <div className="text-center py-16">
            <p className="text-muted-foreground">Please log in to view reviews</p>
          </div>
        </main>
      </div>
    );
  }

  const filteredReviews = filter === 'all' 
    ? reviews 
    : reviews.filter(r => r.reviewType === filter);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8">
        <h1 className="mb-6 text-3xl font-bold">Reviews</h1>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Reviews</TabsTrigger>
            <TabsTrigger value="as_teacher">As Teacher</TabsTrigger>
            <TabsTrigger value="as_learner">As Learner</TabsTrigger>
          </TabsList>

          <TabsContent value={filter}>
            {loading ? (
              <div className="text-center py-16 text-muted-foreground">Loading reviews...</div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">No reviews yet</div>
            ) : (
              <div className="space-y-4">
                {filteredReviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="font-semibold">{review.reviewerName || 'Anonymous'}</span>
                            <Badge variant="outline">{review.reviewType === 'as_teacher' ? 'As Teacher' : 'As Learner'}</Badge>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? 'fill-primary text-primary'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.reviewText && <p className="text-sm text-muted-foreground mb-2">{review.reviewText}</p>}
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(review.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                        {parseInt(review.reviewerId) === parseInt(currentUser.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteReview(parseInt(review.id))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Review Section */}
        <Card className="mt-8" ref={reviewSectionRef}>
          <CardHeader>
            <CardTitle>Leave a Review</CardTitle>
            {forUserId && (
              <p className="text-sm text-muted-foreground">Completed sessions with this user are listed below.</p>
            )}
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Complete a booking to leave a review</p>
            ) : (
              <div className="space-y-4">
                {(forUserId
                  ? bookings.filter(
                      (b) => b.teacherId === forUserId || b.learnerId === forUserId
                    )
                  : bookings
                ).map((booking) => (
                  <CreateReviewDialog
                    key={booking.id}
                    booking={booking}
                    currentUserId={currentUser.id}
                    onCreate={handleCreateReview}
                  />
                ))}
                {forUserId && bookings.filter((b) => b.teacherId === forUserId || b.learnerId === forUserId).length === 0 && (
                  <p className="text-sm text-muted-foreground">No completed sessions with this user yet.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function CreateReviewDialog({
  booking,
  currentUserId,
  onCreate,
}: {
  booking: Booking;
  currentUserId: string;
  onCreate: (bookingId: number, rating: number, reviewText: string, reviewType: 'as_teacher' | 'as_learner') => void;
}) {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const isTeacher = booking.teacherId === currentUserId;
  const reviewType = isTeacher ? 'as_teacher' : 'as_learner';
  const revieweeName = isTeacher ? booking.learnerName : booking.teacherName;

  const handleSubmit = () => {
    if (rating < 1 || rating > 5) {
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    onCreate(parseInt(booking.id), rating, reviewText, reviewType);
    setOpen(false);
    setRating(5);
    setReviewText("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          Review {revieweeName} - {booking.skillTitle}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review {revieweeName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Rating</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRating(r)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-6 w-6 ${
                      r <= rating
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="review-text">Review</Label>
            <Textarea
              id="review-text"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              placeholder="Share your experience..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Submit Review</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
