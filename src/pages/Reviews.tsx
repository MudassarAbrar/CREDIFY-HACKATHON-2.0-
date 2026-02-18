import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { reviewsApi, bookingsApi, profilesApi, getCurrentUser } from "@/lib/api";
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
  DialogDescription,
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
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());
  const [forUserReviews, setForUserReviews] = useState<Review[]>([]);
  const [forUserName, setForUserName] = useState<string>('');
  const [forUserLoading, setForUserLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'as_teacher' | 'as_learner'>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  const [apiError, setApiError] = useState<string | null>(null);

  const userId = currentUser?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    setApiError(null);
    loadReviews();
    loadCompletedBookings();
  }, [filter, userId]);

  // When opened from profile "Write review" (?for=userId), load that user's reviews and name
  useEffect(() => {
    if (!forUserId) {
      setForUserReviews([]);
      setForUserName('');
      return;
    }
    const loadForUser = async () => {
      setForUserLoading(true);
      try {
        const [reviewsRes, profileRes] = await Promise.all([
          reviewsApi.getUserReviews(parseInt(forUserId)),
          profilesApi.getProfile(parseInt(forUserId)).catch(() => ({ user: {} })),
        ]);
        const raw = Array.isArray(reviewsRes?.reviews) ? reviewsRes.reviews : [];
        setForUserReviews(raw.map(normalizeReview));
        const name = profileRes?.user?.full_name || profileRes?.user?.fullName || profileRes?.user?.email?.split('@')[0] || 'This user';
        setForUserName(name);
      } catch {
        setForUserReviews([]);
        setForUserName('This user');
      } finally {
        setForUserLoading(false);
      }
    };
    loadForUser();
  }, [forUserId]);

  const normalizeReview = (r: any): Review => ({
    id: String(r.id),
    reviewerId: String(r.reviewer_id),
    revieweeId: String(r.reviewee_id),
    bookingId: r.booking_id != null ? String(r.booking_id) : undefined,
    rating: Number(r.rating),
    reviewText: r.review_text ?? r.reviewText,
    reviewType: (r.review_type ?? r.reviewType) === 'as_learner' ? 'as_learner' : 'as_teacher',
    createdAt: r.created_at ?? r.createdAt ?? new Date().toISOString(),
    reviewerName: r.reviewer_name ?? r.reviewerName,
    reviewerEmail: r.reviewer_email ?? r.reviewerEmail,
  });

  const loadReviews = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setApiError(null);
      const response = await reviewsApi.getUserReviews(parseInt(String(userId)), filter === 'all' ? undefined : filter);
      const raw = response.reviews || [];
      setReviews(raw.map(normalizeReview));
    } catch (error: any) {
      const msg = error?.message || (error?.code === 'ECONNREFUSED' || error?.name === 'TypeError'
        ? 'Cannot reach the server. Start the backend with: cd server && npm run dev'
        : 'Failed to load reviews');
      setApiError(msg);
      setReviews([]);
      toast({
        title: "Error",
        description: msg,
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
    if (!userId) return;
    try {
      const [bookingsRes, myReviewsRes] = await Promise.all([
        bookingsApi.getBookings('completed'),
        reviewsApi.getMyReviews().catch(() => ({ reviews: [] })),
      ]);
      const raw = bookingsRes.bookings || [];
      const normalized = raw.map(normalizeBooking);
      const seen = new Set<string>();
      const deduped = normalized.filter((b) => {
        if (seen.has(b.id)) return false;
        seen.add(b.id);
        return true;
      });
      setBookings(deduped);
      const reviewedIds = new Set((myReviewsRes.reviews || []).map((r: any) => String(r.booking_id)));
      setReviewedBookingIds(reviewedIds);
    } catch (error: any) {
      if (!apiError) setApiError('Cannot reach the server. Start the backend with: cd server && npm run dev');
      setBookings([]);
    }
  };

  useEffect(() => {
    if (forUserId && reviewSectionRef.current) {
      reviewSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [forUserId, bookings]);

  const handleCreateReview = async (bookingId: number, rating: number, reviewText: string, reviewType: 'as_teacher' | 'as_learner') => {
    const bid = Number(bookingId);
    const r = Number(rating);
    if (!Number.isInteger(bid) || bid < 1 || r < 1 || r > 5) {
      toast({ title: "Error", description: "Invalid booking or rating.", variant: "destructive" });
      return;
    }
    try {
      await reviewsApi.createReview({
        booking_id: bid,
        rating: r,
        review_text: reviewText || undefined,
        review_type: reviewType,
      });
      toast({ title: "Success", description: "Review created successfully" });
      loadReviews();
      loadCompletedBookings(); // refresh so this booking disappears from "Leave a Review"
    } catch (error: any) {
      const msg = error?.message || (error?.error) || "Failed to create review";
      toast({
        title: "Error",
        description: msg,
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
            {apiError && (
              <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
                {apiError}
              </div>
            )}
            {loading ? (
              <div className="text-center py-16 text-muted-foreground">Loading reviews...</div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                {apiError ? 'Fix the connection above, then refresh.' : 'No reviews yet'}
              </div>
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

        {/* When opened from profile "Write review": show that user's reviews */}
        {forUserId && (
          <Card className="mt-8" ref={reviewSectionRef}>
            <CardHeader>
              <CardTitle>Reviews for {forUserName}</CardTitle>
              <p className="text-sm text-muted-foreground">Reviews this user has received from others.</p>
            </CardHeader>
            <CardContent>
              {forUserLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading…</div>
              ) : forUserReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {forUserReviews.map((review) => (
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
                                      i < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Review Section */}
        <Card className="mt-8" ref={forUserId ? undefined : reviewSectionRef}>
          <CardHeader>
            <CardTitle>Leave a Review</CardTitle>
            {forUserId ? (
              <p className="text-sm text-muted-foreground">Completed sessions with this user are listed below. Pick one to leave your review.</p>
            ) : (
              <p className="text-sm text-muted-foreground">Pick a completed session to leave a review.</p>
            )}
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Complete a booking to leave a review</p>
            ) : (
              <div className="space-y-4">
                {(forUserId
                  ? bookings.filter(
                      (b) => (b.teacherId === forUserId || b.learnerId === forUserId) && !reviewedBookingIds.has(b.id)
                    )
                  : bookings.filter((b) => !reviewedBookingIds.has(b.id))
                ).map((booking) => (
                  <CreateReviewDialog
                    key={booking.id}
                    booking={booking}
                    currentUserId={currentUser.id}
                    onCreate={handleCreateReview}
                  />
                ))}
                {forUserId && bookings.filter((b) => (b.teacherId === forUserId || b.learnerId === forUserId) && !reviewedBookingIds.has(b.id)).length === 0 && (
                  <p className="text-sm text-muted-foreground">No completed sessions with this user yet, or you’ve already reviewed them.</p>
                )}
                {!forUserId && bookings.filter((b) => !reviewedBookingIds.has(b.id)).length === 0 && bookings.length > 0 && (
                  <p className="text-sm text-muted-foreground">You’ve already reviewed all your completed sessions.</p>
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

  const sessionDateStr = booking.scheduledAt
    ? format(new Date(booking.scheduledAt), 'MMM d, yyyy')
    : '';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          Review {revieweeName} – {booking.skillTitle}{sessionDateStr ? ` (${sessionDateStr})` : ''}
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby="review-dialog-desc">
        <DialogHeader>
          <DialogTitle>Review {revieweeName}</DialogTitle>
          <DialogDescription id="review-dialog-desc">Rate your session and optionally add a short review.</DialogDescription>
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
