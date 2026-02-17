import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { SkillCard } from "@/components/SkillCard";
import { SKILL_CATEGORIES, Skill } from "@/lib/types";
import { skillsApi, skillRequestsApi, bookingsApi, getCurrentUser } from "@/lib/api";
import { SkillRequestCard } from "@/components/SkillRequestCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, Search, User, Calendar, Clock, Star, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { format, addDays } from "date-fns";

export default function BrowseSkills() {
  const [mode, setMode] = useState<'teaching' | 'learning'>('teaching');
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [complexity, setComplexity] = useState("all");
  const [selected, setSelected] = useState<Skill | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillRequests, setSkillRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingDuration, setBookingDuration] = useState(1);
  const [bookingDate, setBookingDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [bookingTime, setBookingTime] = useState('10:00');
  const [submitting, setSubmitting] = useState(false);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (mode === 'teaching') {
      loadSkills();
    } else {
      loadSkillRequests();
    }
  }, [category, complexity, mode]);

  // Load user's existing bookings to prevent duplicates
  useEffect(() => {
    const loadUserBookings = async () => {
      if (!currentUser) return;
      try {
        const response = await bookingsApi.getBookings();
        setUserBookings(response.bookings || []);
      } catch (e) {
        console.error('Failed to load bookings:', e);
      }
    };
    loadUserBookings();
  }, [currentUser]);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const params: any = { status: 'active' };
      if (category !== "all") params.category = category;
      if (complexity !== "all") params.complexity = complexity;
      
      const response = await skillsApi.getSkills(params);
      const currentUserId = currentUser?.id != null ? String(currentUser.id) : null;
      const convertedSkills: Skill[] = (response.skills || [])
        .map((s: any) => ({
          id: String(s.id),
          userId: String(s.user_id),
          teacherName: s.teacher_name || s.teacher_email?.split('@')[0] || 'Teacher',
          teacherType: s.teacher_type === 'professional' ? 'professional' : 'student',
          title: s.title,
          description: s.description || '',
          category: s.category || 'Other',
          ratePerHour: parseFloat(s.rate_per_hour || 0),
          complexity: s.complexity || 'moderate',
          status: s.status === 'active' ? 'active' : 'inactive',
          createdAt: s.created_at || new Date().toISOString(),
        }))
        .filter((s: Skill) => currentUserId === null || s.userId !== currentUserId);
      setSkills(convertedSkills);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load skills",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSkillRequests = async () => {
    try {
      setLoading(true);
      const params: any = { status: 'open' };
      if (category !== "all") params.category = category;
      
      const response = await skillRequestsApi.getSkillRequests(params);
      setSkillRequests(response.requests || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load skill requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredSkills = skills.filter((s) => {
    if (search && !s.title.toLowerCase().includes(search.toLowerCase()) && !s.description.toLowerCase().includes(search.toLowerCase())) return false;
    return s.status === "active";
  });

  const filteredRequests = skillRequests.filter((r) => {
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !r.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return r.status === 'open' || r.status === 'in_progress';
  });

  // Check if user has already requested this skill
  const hasExistingRequest = (skillId: string) => {
    return userBookings.some(
      (b: any) => String(b.skill_id) === skillId && 
        (b.status === 'pending' || b.status === 'confirmed')
    );
  };

  const handleOpenBookingDialog = (skill: Skill) => {
    if (!currentUser) {
      toast({
        title: "Login required",
        description: "Please log in to request a session",
        variant: "destructive",
      });
      window.location.href = '/login';
      return;
    }

    if (hasExistingRequest(skill.id)) {
      toast({
        title: "Already requested",
        description: `You already have a pending or confirmed booking for "${skill.title}"`,
        variant: "destructive",
      });
      return;
    }

    if (String(skill.userId) === String(currentUser?.id)) {
      toast({
        title: "Cannot book own skill",
        description: "You cannot request your own skill",
        variant: "destructive",
      });
      return;
    }

    setSelected(skill);
    setBookingDialogOpen(true);
  };

  const handleSubmitBooking = async () => {
    if (!selected || !currentUser) return;

    try {
      setSubmitting(true);
      const scheduledAt = `${bookingDate}T${bookingTime}:00`;
      
      await bookingsApi.createBooking({
        skill_id: parseInt(selected.id),
        scheduled_at: scheduledAt,
        duration: bookingDuration,
      });

      toast({ 
        title: "Request sent!", 
        description: `Your request for "${selected.title}" has been sent to ${selected.teacherName}.` 
      });
      
      setBookingDialogOpen(false);
      setSelected(null);
      
      // Refresh user bookings
      const response = await bookingsApi.getBookings();
      setUserBookings(response.bookings || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create booking request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequest = (skill: Skill) => {
    handleOpenBookingDialog(skill);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8">
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold">Browse Skills</h1>
              <p className="text-muted-foreground">
                {mode === 'teaching' ? 'Discover skills to learn from peers' : 'Find learners looking for skills'}
              </p>
            </div>
            <div className="flex gap-2 rounded-lg border p-1">
              <Button
                variant={mode === 'teaching' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('teaching')}
              >
                Teaching
              </Button>
              <Button
                variant={mode === 'learning' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('learning')}
              >
                Learning
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search skills..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {SKILL_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={complexity} onValueChange={setComplexity}>
            <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Complexity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="simple">Simple</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="complex">Complex</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading...</div>
        ) : mode === 'teaching' ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{filteredSkills.length} skills found</p>
            {filteredSkills.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">No skills match your filters.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSkills.map((s) => (
                  <SkillCard key={s.id} skill={s} onViewDetails={setSelected} onRequestLearn={handleRequest} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">{filteredRequests.length} requests found</p>
            {filteredRequests.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">No skill requests match your filters.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredRequests.map((r) => (
                  <SkillRequestCard key={r.id} request={r} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Detail Modal */}
      <Dialog open={!!selected && !bookingDialogOpen} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{selected.category}</p>
                <DialogTitle className="text-xl">{selected.title}</DialogTitle>
                <DialogDescription className="mt-2">{selected.description}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Teacher Info */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {selected.teacherName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium">{selected.teacherName}</p>
                      <Badge variant="secondary" className="text-xs capitalize">{selected.teacherType}</Badge>
                    </div>
                  </div>
                  <Link to={`/profile/${selected.userId}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Profile
                    </Button>
                  </Link>
                </div>

                {/* Skill Details */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase">Complexity</p>
                    <p className="font-medium capitalize">{selected.complexity}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase">Rate</p>
                    <p className="font-medium flex items-center justify-center gap-1">
                      <Coins className="h-4 w-4 text-primary" />
                      {selected.ratePerHour}/hr
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase">Category</p>
                    <p className="font-medium text-sm">{selected.category}</p>
                  </div>
                </div>

                {/* Already Requested Warning */}
                {hasExistingRequest(selected.id) && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      You already have a pending/confirmed booking for this skill
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
                <Button 
                  onClick={() => handleOpenBookingDialog(selected)}
                  disabled={hasExistingRequest(selected.id) || String(selected.userId) === String(currentUser?.id)}
                >
                  Request to Learn
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Request Session</DialogTitle>
                <DialogDescription>
                  Schedule a learning session for "{selected.title}" with {selected.teacherName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={bookingDate}
                      min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                      onChange={(e) => setBookingDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Select value={String(bookingDuration)} onValueChange={(v) => setBookingDuration(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="3">3 hours</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Estimated Cost:</span>
                    <span className="text-lg font-semibold flex items-center gap-1">
                      <Coins className="h-4 w-4 text-primary" />
                      {Math.round(selected.ratePerHour * bookingDuration * (currentUser?.user_type === 'student' ? 0.8 : 1))} credits
                    </span>
                  </div>
                  {currentUser?.user_type === 'student' && (
                    <p className="text-xs text-green-600 mt-1">20% student discount applied!</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitBooking} disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Request'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
