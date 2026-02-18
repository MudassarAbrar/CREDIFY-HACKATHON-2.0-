import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { profilesApi, skillsApi, reviewsApi, followsApi, getCurrentUser, skillRequestsApi, bookingsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkillCard } from "@/components/SkillCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Star,
  Calendar,
  BookOpen,
  Award,
  Edit,
  Linkedin,
  Github,
  Globe,
  MapPin,
  Building,
  GraduationCap,
  Briefcase,
  Languages,
  Clock,
  UserPlus,
  MessageSquare,
  Mail,
  Coins,
  Send,
  CheckCircle,
  User as UserIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { User, Skill, Review, SkillRequest, Booking } from "@/lib/types";
import { format, isValid, parseISO } from "date-fns";

// Safe date formatting helper
const safeFormatDate = (dateString: string | undefined, formatStr: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    if (isValid(date)) return format(date, formatStr);
    const fallbackDate = new Date(dateString);
    if (isValid(fallbackDate)) return format(fallbackDate, formatStr);
    return 'N/A';
  } catch {
    return 'N/A';
  }
};

export default function Profile() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [mySkillRequests, setMySkillRequests] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [modalFollowers, setModalFollowers] = useState<any[]>([]);
  const [modalFollowing, setModalFollowing] = useState<any[]>([]);
  const [modalFollowsLoading, setModalFollowsLoading] = useState(false);
  const { toast } = useToast();

  const currentUser = authUser || getCurrentUser();
  const userId = currentUser?.id;

  useEffect(() => {
    if (userId) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [userId, authUser]);

  const loadProfile = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
      const profileResponse = await profilesApi.getProfile(userIdNum);
      const statsResponse = await profilesApi.getUserStats(userIdNum);
      
      // Parse profile data with proper field mapping
      const rawProfile = profileResponse.user.profile || {};
      const profileData = {
        linkedinUrl: rawProfile.linkedin_url,
        githubUrl: rawProfile.github_url,
        portfolioUrl: rawProfile.portfolio_url,
        location: rawProfile.location,
        timezone: rawProfile.timezone,
        institution: rawProfile.institution,
        degree: rawProfile.degree,
        graduationYear: rawProfile.graduation_year,
        company: rawProfile.company,
        jobTitle: rawProfile.job_title,
        yearsExperience: rawProfile.years_experience,
        languages: rawProfile.languages ? (typeof rawProfile.languages === 'string' ? JSON.parse(rawProfile.languages) : rawProfile.languages) : [],
        availabilityStatus: rawProfile.availability_status,
        responseTimeHours: rawProfile.response_time_hours,
      };
      
      const profileUser = {
        ...profileResponse.user,
        fullName: profileResponse.user.full_name || profileResponse.user.fullName || profileResponse.user.email?.split('@')[0] || 'User',
        avatarUrl: profileResponse.user.avatar_url || profileResponse.user.avatarUrl,
        userType: profileResponse.user.user_type,
        creditBalance: profileResponse.user.credit_balance,
        email: profileResponse.user.email,
        bio: profileResponse.user.bio,
        createdAt: profileResponse.user.created_at,
        rating: profileResponse.user.rating,
        profile: profileData,
        stats: statsResponse.stats,
      };
      setUser(profileUser);
      setFollowersCount(statsResponse.stats.followers);
      setFollowingCount(statsResponse.stats.following);

      // Load skills taught
      const skillsResponse = await skillsApi.getSkills({});
      const userSkills = (skillsResponse.skills || [])
        .filter((s: any) => s.user_id === parseInt(userId) && s.status === 'active')
        .map((s: any) => ({
          id: String(s.id),
          userId: String(s.user_id),
          teacherName: profileUser.full_name || profileUser.email?.split('@')[0] || 'User',
          teacherType: profileUser.user_type === 'professional' ? 'professional' : 'student',
          title: s.title,
          description: s.description || '',
          category: s.category || 'Other',
          ratePerHour: parseFloat(s.rate_per_hour || 0),
          complexity: s.complexity || 'moderate',
          status: s.status === 'active' ? 'active' : 'inactive',
          createdAt: s.created_at || new Date().toISOString(),
        }));
      setSkills(userSkills);

      // Load reviews (map snake_case from API to camelCase for display)
      const reviewsResponse = await reviewsApi.getUserReviews(parseInt(userId));
      const normalizedReviews = (reviewsResponse.reviews || []).map((r: any) => ({
        id: String(r.id),
        reviewerId: String(r.reviewer_id),
        revieweeId: String(r.reviewee_id),
        bookingId: r.booking_id != null ? String(r.booking_id) : undefined,
        rating: r.rating,
        reviewText: r.review_text,
        reviewType: r.review_type === 'as_teacher' ? 'as_teacher' : 'as_learner',
        createdAt: r.created_at,
        reviewerName: r.reviewer_name || r.reviewerName,
        reviewerEmail: r.reviewer_email || r.reviewerEmail,
      }));
      setReviews(normalizedReviews);

      // Load user's skill requests (learning requests they've created)
      try {
        const skillRequestsResponse = await skillRequestsApi.getSkillRequests({});
        const myRequests = (skillRequestsResponse.requests || []).filter(
          (r: any) => r.user_id === parseInt(userId)
        );
        setMySkillRequests(myRequests);
      } catch (e) {
        console.error('Failed to load skill requests:', e);
      }

      // Load sent booking requests
      try {
        const bookingsResponse = await bookingsApi.getBookings();
        const sent = (bookingsResponse.bookings || []).filter(
          (b: any) => b.learner_id === parseInt(userId)
        );
        setSentRequests(sent);
      } catch (e) {
        console.error('Failed to load sent requests:', e);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (formData: any) => {
    try {
      await profilesApi.updateProfile(parseInt(userId), formData);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditing(false);
      loadProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container py-8">
          <div className="text-center py-16">Loading profile...</div>
        </main>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container py-8">
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Please log in to view your profile</p>
            {!currentUser && (
              <Button onClick={() => window.location.href = '/login'}>Go to Login</Button>
            )}
          </div>
        </main>
      </div>
    );
  }

  const profile = user?.profile || {};
  const stats = user?.stats || {
    rating: user?.rating || 0,
    totalReviews: 0,
    skillsTaught: skills.length,
    skillsLearned: 0,
    followers: followersCount,
    following: followingCount,
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8">
        {/* Profile Header */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row">
          <div className="relative">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user?.fullName || 'User'}
                className="h-24 w-24 rounded-full object-cover border-2 border-primary"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
                {(user?.fullName && user.fullName.length > 0) ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-3xl font-bold">{user?.fullName || 'User'}</h1>
              <Badge variant="secondary">{user?.userType || 'user'}</Badge>
              {stats.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-semibold">{stats.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({stats.totalReviews})</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Joined {user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : 'Recently'}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {stats.skillsTaught} taught · {stats.skillsLearned} learned
              </span>
              <button
                type="button"
                onClick={() => {
                  setFollowersModalOpen(true);
                  const id = typeof userId === 'string' ? parseInt(userId) : userId;
                  if (id) {
                    setModalFollowsLoading(true);
                    Promise.all([
                      followsApi.getFollowers(id),
                      followsApi.getFollowing(id),
                    ])
                      .then(([fRes, gRes]) => {
                        setModalFollowers(fRes.followers || []);
                        setModalFollowing(gRes.following || []);
                      })
                      .catch(() => {
                        toast({ title: "Error", description: "Failed to load followers/following", variant: "destructive" });
                      })
                      .finally(() => setModalFollowsLoading(false));
                  }
                }}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                {stats.followers} followers · {stats.following} following
              </button>
            </div>
            {user?.bio && <p className="mt-2 text-muted-foreground">{user.bio}</p>}
            
            {/* Social Links */}
            <div className="mt-3 flex gap-3">
              {profile?.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {profile?.githubUrl && (
                <a
                  href={profile.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Github className="h-5 w-5" />
                </a>
              )}
              {profile?.portfolioUrl && (
                <a
                  href={profile.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Globe className="h-5 w-5" />
                </a>
              )}
            </div>

            {/* Profile Details */}
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              {profile?.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </div>
              )}
              {user?.userType === 'student' && profile?.institution && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  {profile.institution}
                  {profile.degree && ` - ${profile.degree}`}
                  {profile.graduationYear && ` (${profile.graduationYear})`}
                </div>
              )}
              {user?.userType === 'professional' && profile?.company && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building className="h-4 w-4" />
                  {profile.jobTitle} at {profile.company}
                  {profile.yearsExperience && ` · ${profile.yearsExperience} years exp.`}
                </div>
              )}
              {profile?.availabilityStatus && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {profile.availabilityStatus}
                  {profile.responseTimeHours && ` · Responds within ${profile.responseTimeHours}h`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Followers / Following modal */}
        <Dialog open={followersModalOpen} onOpenChange={setFollowersModalOpen}>
          <DialogContent className="max-w-md max-h-[80vh] flex flex-col" aria-describedby="followers-modal-desc">
            <DialogHeader>
              <DialogTitle>Followers & Following</DialogTitle>
              <DialogDescription id="followers-modal-desc">People who follow this profile and who this profile follows.</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="followers" className="flex-1 min-h-0 flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="followers">Followers ({modalFollowers.length})</TabsTrigger>
                <TabsTrigger value="following">Following ({modalFollowing.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="followers" className="flex-1 min-h-0 mt-3 overflow-auto">
                {modalFollowsLoading ? (
                  <p className="text-sm text-muted-foreground py-4">Loading...</p>
                ) : modalFollowers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No followers yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {modalFollowers.map((row: any) => {
                      const uid = row.user_id ?? row.follower_id;
                      const name = row.full_name || row.email?.split("@")[0] || "User";
                      return (
                        <li key={uid}>
                          <Link
                            to={`/profile/${uid}`}
                            onClick={() => setFollowersModalOpen(false)}
                            className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors"
                          >
                            {row.avatar_url ? (
                              <img src={row.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium">{name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </TabsContent>
              <TabsContent value="following" className="flex-1 min-h-0 mt-3 overflow-auto">
                {modalFollowsLoading ? (
                  <p className="text-sm text-muted-foreground py-4">Loading...</p>
                ) : modalFollowing.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Not following anyone yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {modalFollowing.map((row: any) => {
                      const uid = row.user_id ?? row.followee_id;
                      const name = row.full_name || row.email?.split("@")[0] || "User";
                      return (
                        <li key={uid}>
                          <Link
                            to={`/profile/${uid}`}
                            onClick={() => setFollowersModalOpen(false)}
                            className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors"
                          >
                            {row.avatar_url ? (
                              <img src={row.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                            ) : (
                              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium">{name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="skills">Skills ({skills.length})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            <TabsTrigger value="requests">My Requests</TabsTrigger>
          </TabsList>

          {/* About Tab - Complete User Details */}
          <TabsContent value="about">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</p>
                      <p className="font-medium">{user?.fullName || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
                      <p className="font-medium flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user?.email || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Account Type</p>
                      <Badge variant="secondary" className="capitalize">{user?.userType || 'user'}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Credit Balance</p>
                      <p className="font-medium flex items-center gap-1">
                        <Coins className="h-3 w-3 text-primary" />
                        {user?.creditBalance || 0} credits
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Member Since</p>
                      <p className="font-medium">{safeFormatDate(user?.createdAt, 'MMMM yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Location</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {profile?.location || 'Not set'}
                      </p>
                    </div>
                  </div>
                  {user?.bio && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Bio</p>
                        <p className="text-sm">{user.bio}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Professional/Education Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {user?.userType === 'student' ? (
                      <><GraduationCap className="h-5 w-5" /> Education</>
                    ) : (
                      <><Briefcase className="h-5 w-5" /> Professional</>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user?.userType === 'student' ? (
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Institution</p>
                        <p className="font-medium">{profile?.institution || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Degree</p>
                        <p className="font-medium">{profile?.degree || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Graduation Year</p>
                        <p className="font-medium">{profile?.graduationYear || 'Not set'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Company</p>
                        <p className="font-medium flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {profile?.company || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Job Title</p>
                        <p className="font-medium">{profile?.jobTitle || 'Not set'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Years of Experience</p>
                        <p className="font-medium">{profile?.yearsExperience ? `${profile.yearsExperience} years` : 'Not set'}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Social & Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Linkedin className="h-5 w-5 text-[#0077B5]" />
                    {profile?.linkedinUrl ? (
                      <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">
                        {profile.linkedinUrl}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Github className="h-5 w-5" />
                    {profile?.githubUrl ? (
                      <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">
                        {profile.githubUrl}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-green-600" />
                    {profile?.portfolioUrl ? (
                      <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">
                        {profile.portfolioUrl}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not set</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Availability & Languages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Availability
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                      <Badge 
                        variant={profile?.availabilityStatus === 'available' ? 'default' : 'secondary'}
                        className="capitalize mt-1"
                      >
                        {profile?.availabilityStatus || 'available'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Response Time</p>
                      <p className="font-medium">{profile?.responseTimeHours ? `Within ${profile.responseTimeHours}h` : 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Timezone</p>
                      <p className="font-medium">{profile?.timezone || 'Not set'}</p>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Languages className="h-3 w-3" />
                      Languages
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile?.languages && profile.languages.length > 0 ? (
                        profile.languages.map((lang: string, i: number) => (
                          <Badge key={i} variant="outline">{lang}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">Not set</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="skills">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {skills.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No skills listed yet.</p>
                    <Button className="mt-4" onClick={() => window.location.href = '/teach'}>
                      Create a Skill Offer
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                skills.map((s) => <SkillCard key={s.id} skill={s} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No reviews yet.</p>
                  </CardContent>
                </Card>
              ) : (
                reviews.map((review) => (
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
                          {review.reviewText && <p className="text-sm text-muted-foreground">{review.reviewText}</p>}
                          <p className="mt-2 text-xs text-muted-foreground">
                            {safeFormatDate(review.createdAt, 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* My Requests Tab - Sent booking requests and skill learning requests */}
          <TabsContent value="requests">
            <div className="space-y-6">
              {/* Sent Booking Requests (Requests to learn from others) */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Sent Booking Requests
                </h3>
                {sentRequests.length === 0 ? (
                  <Card>
                    <CardContent className="py-6 text-center text-muted-foreground">
                      No booking requests sent yet.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {sentRequests.map((req: any) => (
                      <Card key={req.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium">{req.skill_title}</p>
                              <p className="text-sm text-muted-foreground">To: {req.teacher_name || req.teacher_email?.split('@')[0]}</p>
                            </div>
                            <Badge variant={
                              req.status === 'completed' ? 'default' :
                              req.status === 'confirmed' ? 'secondary' :
                              req.status === 'pending' ? 'outline' : 'destructive'
                            }>
                              {req.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{safeFormatDate(req.scheduled_at, 'MMM d, yyyy')}</span>
                            <span>{req.duration}h</span>
                            <span className="flex items-center gap-1">
                              <Coins className="h-3 w-3" />
                              {req.credits_cost} credits
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* My Skill Requests (Learning requests I've posted) */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  My Learning Requests
                </h3>
                {mySkillRequests.length === 0 ? (
                  <Card>
                    <CardContent className="py-6 text-center text-muted-foreground">
                      <p>No learning requests posted yet.</p>
                      <Button variant="outline" className="mt-3" onClick={() => window.location.href = '/learn'}>
                        Post a Learning Request
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {mySkillRequests.map((req: any) => (
                      <Card key={req.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium">{req.title}</p>
                              <p className="text-sm text-muted-foreground">{req.category}</p>
                            </div>
                            <Badge variant={
                              req.status === 'filled' ? 'default' :
                              req.status === 'open' ? 'secondary' :
                              req.status === 'in_progress' ? 'outline' : 'destructive'
                            }>
                              {req.status}
                            </Badge>
                          </div>
                          {req.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <span>Created {safeFormatDate(req.created_at, 'MMM d, yyyy')}</span>
                            {req.budget && <span>Budget: {req.budget} credits</span>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Profile Dialog */}
        <EditProfileDialog
          open={isEditing}
          onOpenChange={setIsEditing}
          user={user}
          onSave={handleUpdateProfile}
        />
      </main>
    </div>
  );
}

function EditProfileDialog({
  open,
  onOpenChange,
  user,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onSave: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    full_name: '',
    user_type: 'student' as 'student' | 'professional',
    bio: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    location: '',
    timezone: '',
    institution: '',
    degree: '',
    graduation_year: '',
    company: '',
    job_title: '',
    years_experience: '',
    languages: '',
    availability_status: 'available',
    response_time_hours: '24',
  });

  useEffect(() => {
    if (open && user) {
      setFormData({
        full_name: user?.fullName || '',
        user_type: (user?.userType === 'professional' ? 'professional' : 'student'),
        bio: user?.bio || '',
        linkedin_url: user?.profile?.linkedinUrl || '',
        github_url: user?.profile?.githubUrl || '',
        portfolio_url: user?.profile?.portfolioUrl || '',
        location: user?.profile?.location || '',
        timezone: user?.profile?.timezone || '',
        institution: user?.profile?.institution || '',
        degree: user?.profile?.degree || '',
        graduation_year: user?.profile?.graduationYear != null ? String(user.profile.graduationYear) : '',
        company: user?.profile?.company || '',
        job_title: user?.profile?.jobTitle || '',
        years_experience: user?.profile?.yearsExperience != null ? String(user.profile.yearsExperience) : '',
        languages: user?.profile?.languages?.join(', ') || '',
        availability_status: user?.profile?.availabilityStatus || 'available',
        response_time_hours: (user?.profile?.responseTimeHours ?? 24).toString(),
      });
    }
  }, [open, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      languages: formData.languages ? formData.languages.split(',').map(l => l.trim()).filter(Boolean) : [],
      graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : undefined,
      years_experience: formData.years_experience ? parseInt(formData.years_experience) : undefined,
      response_time_hours: formData.response_time_hours ? parseInt(formData.response_time_hours) : undefined,
    };
    onSave(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="edit-profile-desc">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription id="edit-profile-desc">Update your name, bio, links, and other profile details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="user_type">User Type</Label>
              <select
                id="user_type"
                value={formData.user_type}
                onChange={(e) => setFormData({ ...formData, user_type: e.target.value as 'student' | 'professional' })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="student">Student</option>
                <option value="professional">Professional</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div>
              <Label htmlFor="github_url">GitHub URL</Label>
              <Input
                id="github_url"
                type="url"
                value={formData.github_url}
                onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                placeholder="https://github.com/..."
              />
            </div>
            <div>
              <Label htmlFor="portfolio_url">Portfolio URL</Label>
              <Input
                id="portfolio_url"
                type="url"
                value={formData.portfolio_url}
                onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Education</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="institution">Institution</Label>
                <Input
                  id="institution"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  placeholder="School or university"
                />
              </div>
              <div>
                <Label htmlFor="degree">Degree</Label>
                <Input
                  id="degree"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="e.g. BSc, MBA"
                />
              </div>
              <div>
                <Label htmlFor="graduation_year">Graduation Year</Label>
                <Input
                  id="graduation_year"
                  type="number"
                  value={formData.graduation_year}
                  onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                  placeholder="Year"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Professional</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Current or past employer"
                />
              </div>
              <div>
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  placeholder="e.g. Software Engineer"
                />
              </div>
              <div>
                <Label htmlFor="years_experience">Years Experience</Label>
                <Input
                  id="years_experience"
                  type="number"
                  value={formData.years_experience}
                  onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                  placeholder="Years"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                placeholder="e.g. America/New_York"
              />
            </div>
            <div>
              <Label htmlFor="availability_status">Availability</Label>
              <select
                id="availability_status"
                value={formData.availability_status}
                onChange={(e) => setFormData({ ...formData, availability_status: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="away">Away</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="languages">Languages (comma-separated)</Label>
              <Input
                id="languages"
                value={formData.languages}
                onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                placeholder="English, Spanish, French"
              />
            </div>
            <div>
              <Label htmlFor="response_time_hours">Response Time (hours)</Label>
              <Input
                id="response_time_hours"
                type="number"
                value={formData.response_time_hours}
                onChange={(e) => setFormData({ ...formData, response_time_hours: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
