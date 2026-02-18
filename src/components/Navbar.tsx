import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Menu, X, MessageSquare, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { messagesApi, notificationsApi, getCurrentUser } from "@/lib/api";

const guestNavLinks = [
  { to: "/", label: "Home" },
  { to: "/browse", label: "Browse" },
  { to: "/contact", label: "Contact" },
];

const authNavLinks = [
  { to: "/browse", label: "Browse" },
  { to: "/wallet", label: "Wallet" },
  { to: "/teach", label: "Teach" },
  { to: "/learn", label: "Learn" },
  { to: "/bookings", label: "Bookings" },
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      // Only load once on mount, disable polling to prevent infinite requests
      loadUnreadCounts();
      // Disabled polling to prevent ERR_INSUFFICIENT_RESOURCES
      // const interval = setInterval(loadUnreadCounts, 60000);
      // return () => clearInterval(interval);
    } else {
      setUnreadMessages(0);
      setUnreadNotifications(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadUnreadCounts = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !isAuthenticated) {
        setUnreadMessages(0);
        setUnreadNotifications(0);
        return;
      }

      const [messagesResponse, notificationsResponse] = await Promise.all([
        messagesApi.getUnreadCount().catch(() => ({ unreadCount: 0 })),
        notificationsApi.getNotifications(true).catch(() => ({ notifications: [] })),
      ]);

      setUnreadMessages(messagesResponse.unreadCount || 0);
      const unreadNotifications = notificationsResponse.notifications?.filter((n: any) => !n.readAt) || [];
      setUnreadNotifications(unreadNotifications.length);
    } catch (error) {
      // Silently ignore errors to prevent console spam
      console.debug('Failed to load unread counts:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <Coins className="h-6 w-6 text-primary" />
          <span>Skill<span className="text-primary">Swap</span></span>
        </Link>

        {/* Desktop nav: guest = Home, Browse, Contact; logged-in = Wallet, Teach, Learn, Bookings */}
        <div className="hidden items-center gap-1 md:flex">
          {isAuthenticated && (
            <Link to="/disputes" className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Disputes
            </Link>
          )}
          {(isAuthenticated ? authNavLinks : guestNavLinks).map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Link to="/wallet" className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-semibold">
                <Coins className="h-4 w-4 text-primary" />
                {user?.creditBalance ?? 0}
              </Link>
              <Link to="/messages" className="relative">
                <Button variant="ghost" size="icon">
                  <MessageSquare className="h-5 w-5" />
                </Button>
                {unreadMessages > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </Badge>
                )}
              </Link>
              <Link to="/notifications" className="relative">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                {unreadNotifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Badge>
                )}
              </Link>
              {user?.role === "admin" && (
                <Link to="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Admin
                </Link>
              )}
              <Link to="/profile">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {user?.fullName?.charAt(0) ?? "U"}
                </div>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                Log in
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                Sign up
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t bg-background p-4 md:hidden">
          <div className="flex flex-col gap-2">
            {(isAuthenticated ? authNavLinks : guestNavLinks).map((l) => (
              <Link key={l.to} to={l.to} className="rounded-md px-3 py-2 text-sm font-medium" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link to="/messages" className="rounded-md px-3 py-2 text-sm font-medium" onClick={() => setOpen(false)}>
                  Messages {unreadMessages > 0 && `(${unreadMessages})`}
                </Link>
                <Link to="/notifications" className="rounded-md px-3 py-2 text-sm font-medium" onClick={() => setOpen(false)}>
                  Notifications {unreadNotifications > 0 && `(${unreadNotifications})`}
                </Link>
                {user?.role === "admin" && (
                  <Link to="/admin" className="rounded-md px-3 py-2 text-sm font-medium" onClick={() => setOpen(false)}>Admin</Link>
                )}
                <Link to="/profile" className="rounded-md px-3 py-2 text-sm font-medium" onClick={() => setOpen(false)}>Profile</Link>
                <Link to="/disputes" className="rounded-md px-3 py-2 text-sm font-medium" onClick={() => setOpen(false)}>My Disputes</Link>
                <Button variant="ghost" size="sm" onClick={() => { logout(); setOpen(false); }}>Logout</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => { navigate("/login"); setOpen(false); }}>Log in</Button>
                <Button size="sm" onClick={() => { navigate("/register"); setOpen(false); }}>Sign up</Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
