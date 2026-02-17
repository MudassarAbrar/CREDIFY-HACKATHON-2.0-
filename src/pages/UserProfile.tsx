import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { profilesApi, skillsApi, reviewsApi, followsApi, messagesApi, getCurrentUser } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkillCard } from "@/components/SkillCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  Calendar,
  BookOpen,
  Linkedin,
  Github,
  Globe,
  MapPin,
  Building,
  GraduationCap,
  UserPlus,
  MessageSquare,
  UserMinus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { User, Skill, Review } from "@/lib/types";
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

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (userId) {
      loadProfile();
      checkFollowStatus();
    }
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileResponse = await profilesApi.getProfile(parseInt(userId!));
      const statsResponse = await profilesApi.getUserStats(parseInt(userId!));
      
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
        createdAt: profileResponse.user.created_at || profileResponse.user.createdAt,
        bio: profileResponse.user.bio,
        rating: profileResponse.user.rating,
        profile: profileData,
        stats: statsResponse.stats,
      };
      setUser(profileUser);

      // Load skills taught
      const skillsResponse = await skillsApi.getSkills({});
      const userSkills = (skillsResponse.skills || [])
        .filter((s: any) => s.user_id === parseInt(userId!) && s.status === 'active')
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

      // Load reviews
      const reviewsResponse = await reviewsApi.getUserReviews(parseInt(userId!));
      setReviews(reviewsResponse.reviews || []);
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

  const checkFollowStatus = async () => {
    if (!currentUser || !userId) return;
    try {
      const response = await followsApi.isFollowing(parseInt(userId));
      setIsFollowing(response.isFollowing);
    } catch (error) {
      // Ignore errors
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast({
        title: "Please log in",
        description: "You need to log in to follow users",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isFollowing) {
        await followsApi.unfollowUser(parseInt(userId!));
        setIsFollowing(false);
        toast({ title: "Unfollowed", description: `You unfollowed ${user?.fullName}` });
      } else {
        await followsApi.followUser(parseInt(userId!));
        setIsFollowing(true);
        toast({ title: "Following", description: `You are now following ${user?.fullName}` });
      }
      loadProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
        variant: "destructive",
      });
    }
  };

  const handleMessage = async () => {
    if (!currentUser) {
      toast({
        title: "Please log in",
        description: "You need to log in to message users",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await messagesApi.createConversation({
        participant2_id: parseInt(userId!),
      });
      navigate(`/messages?conversation=${response.conversation.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create conversation",
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

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container py-8">
          <div className="text-center py-16">
            <p className="text-muted-foreground">User not found</p>
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
    followers: 0,
    following: 0,
  };

  const isOwnProfile = currentUser && parseInt(currentUser.id) === parseInt(userId!);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8">
        {/* Profile Header */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row">
          <div>
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="h-24 w-24 rounded-full object-cover border-2 border-primary"
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">
                {(user?.fullName && user.fullName.length > 0) ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
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
                Joined {safeFormatDate(user?.createdAt, 'MMM yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {stats.skillsTaught} taught · {stats.skillsLearned} learned
              </span>
              <span className="flex items-center gap-1">
                <UserPlus className="h-4 w-4" />
                {stats.followers} followers · {stats.following} following
              </span>
            </div>
            {user.bio && <p className="mt-2 text-muted-foreground">{user.bio}</p>}
            
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

            {/* Action Buttons */}
            {!isOwnProfile && currentUser && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"}>
                  {isFollowing ? (
                    <>
                      <UserMinus className="mr-2 h-4 w-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Follow
                    </>
                  )}
                </Button>
                <Button onClick={handleMessage} variant="outline">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/reviews?for=${userId}`)}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Write review
                </Button>
              </div>
            )}

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
            </div>
          </div>
        </div>

        <Tabs defaultValue="skills" className="space-y-6">
          <TabsList>
            <TabsTrigger value="skills">Skills Teaching</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="skills">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {skills.length === 0 ? (
                <p className="col-span-full text-muted-foreground">No skills listed yet.</p>
              ) : (
                skills.map((s) => <SkillCard key={s.id} skill={s} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-muted-foreground">No reviews yet.</p>
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
        </Tabs>
      </main>
    </div>
  );
}
