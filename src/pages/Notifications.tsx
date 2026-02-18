import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { notificationsApi, getCurrentUser } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  MessageSquare,
  Calendar,
  Star,
  UserPlus,
  FileText,
  Check,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Notification } from "@/lib/types";
import { format, isValid } from "date-fns";

function formatNotificationDate(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  const date = new Date(value);
  return isValid(date) ? format(date, "MMM d, yyyy HH:mm") : "—";
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]); // Only depend on user ID to prevent infinite loops

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getNotifications();
      setNotifications(response.notifications || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      loadNotifications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      toast({ title: "Success", description: "All notifications marked as read" });
      loadNotifications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark all as read",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationsApi.deleteNotification(id);
      loadNotifications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const handleClick = (notification: Notification) => {
    if (!notification.readAt) {
      handleMarkAsRead(parseInt(notification.id));
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-5 w-5" />;
      case 'booking':
        return <Calendar className="h-5 w-5" />;
      case 'review':
        return <Star className="h-5 w-5" />;
      case 'follow':
        return <UserPlus className="h-5 w-5" />;
      case 'proposal':
        return <FileText className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  if (!currentUser && !loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container py-8">
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Please log in to view notifications</p>
            <Button onClick={() => window.location.href = '/login'}>Go to Login</Button>
          </div>
        </main>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-muted-foreground">{unreadCount} unread notifications</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Bell className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`cursor-pointer transition-colors hover:bg-muted ${
                  !notification.readAt ? 'border-primary/50 bg-primary/5' : ''
                }`}
                onClick={() => handleClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 ${!notification.readAt ? 'text-primary' : 'text-muted-foreground'}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={`font-semibold ${!notification.readAt ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                          {notification.content && (
                            <p className="mt-1 text-sm text-muted-foreground">{notification.content}</p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatNotificationDate(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.readAt && (
                            <Badge variant="default" className="h-2 w-2 rounded-full p-0" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(parseInt(notification.id));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
