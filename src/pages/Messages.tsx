import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { messagesApi, getCurrentUser } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Trash2, User, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Conversation, Message } from "@/lib/types";
import { format, isValid, parseISO } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Helper function to safely format dates
const safeFormatDate = (dateString: string | undefined, formatStr: string): string => {
  if (!dateString) return '';
  try {
    const date = parseISO(dateString);
    if (isValid(date)) {
      return format(date, formatStr);
    }
    // Try parsing as regular date
    const fallbackDate = new Date(dateString);
    if (isValid(fallbackDate)) {
      return format(fallbackDate, formatStr);
    }
    return '';
  } catch {
    return '';
  }
};

// Helper to convert backend conversation to frontend format
const convertConversation = (conv: any, currentUserId: string): Conversation => {
  const isParticipant1 = String(conv.participant1_id) === currentUserId;
  return {
    id: String(conv.id),
    participant1Id: String(conv.participant1_id),
    participant2Id: String(conv.participant2_id),
    bookingId: conv.booking_id ? String(conv.booking_id) : undefined,
    lastMessageAt: conv.last_message_at,
    createdAt: conv.created_at,
    otherUserId: String(conv.other_user_id || (isParticipant1 ? conv.participant2_id : conv.participant1_id)),
    otherUserName: conv.other_user_name || conv.other_user_email?.split('@')[0] || 'User',
    otherUserEmail: conv.other_user_email,
    otherUserAvatar: conv.other_user_avatar,
    unreadCount: conv.unread_count || 0,
    lastMessage: conv.last_message,
  };
};

// Helper to convert backend message to frontend format
const convertMessage = (msg: any): Message => {
  return {
    id: String(msg.id),
    conversationId: String(msg.conversation_id),
    senderId: String(msg.sender_id),
    content: msg.content,
    readAt: msg.read_at,
    createdAt: msg.created_at,
    senderName: msg.sender_name || msg.sender_email?.split('@')[0] || 'User',
    senderAvatar: msg.sender_avatar,
  };
};

export default function Messages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationId = searchParams.get('conversation');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const currentUser = getCurrentUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (currentUser) {
      loadConversations();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (conversationId && currentUser) {
      loadConversation(parseInt(conversationId));
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await messagesApi.getConversations();
      const converted = (response.conversations || []).map((c: any) => 
        convertConversation(c, String(currentUser?.id))
      );
      setConversations(converted);
      
      if (conversationId) {
        const conv = converted.find((c: Conversation) => c.id === conversationId);
        if (conv) {
          setActiveConversation(conv);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (id: number) => {
    try {
      const response = await messagesApi.getConversation(id);
      const conv = convertConversation(response.conversation, String(currentUser?.id));
      setActiveConversation(conv);
      const convertedMessages = (response.messages || []).map(convertMessage);
      setMessages(convertedMessages);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load conversation",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !activeConversation) return;

    try {
      setSending(true);
      const response = await messagesApi.sendMessage(parseInt(activeConversation.id), messageContent);
      const newMessage = convertMessage(response.message);
      setMessages([...messages, newMessage]);
      setMessageContent("");
      loadConversations(); // Refresh to update unread counts
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSearchParams({ conversation: conversation.id });
    setActiveConversation(conversation);
    loadConversation(parseInt(conversation.id));
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeConversation) return;
    
    try {
      await messagesApi.deleteMessage(parseInt(activeConversation.id), parseInt(messageId));
      setMessages(messages.filter(m => m.id !== messageId));
      toast({ title: "Message deleted" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete message",
        variant: "destructive",
      });
    }
    setMessageToDelete(null);
    setDeleteDialogOpen(false);
  };

  if (!currentUser && !loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container py-8">
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">Please log in to view messages</p>
            <Button onClick={() => window.location.href = '/login'}>Go to Login</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8">
        <h1 className="mb-6 text-3xl font-bold">Messages</h1>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  {loading ? (
                    <div className="p-4 text-center text-muted-foreground">Loading...</div>
                  ) : conversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <MessageSquare className="mx-auto mb-3 h-10 w-10 opacity-50" />
                      <p>No conversations yet</p>
                      <p className="text-xs mt-2">Start a conversation from someone's profile</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv)}
                          className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                            activeConversation?.id === conv.id ? 'bg-muted' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                              {conv.otherUserName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold truncate">{conv.otherUserName}</p>
                                {conv.lastMessageAt && (
                                  <span className="text-xs text-muted-foreground">
                                    {safeFormatDate(conv.lastMessageAt, 'MMM d')}
                                  </span>
                                )}
                              </div>
                              {conv.lastMessage && (
                                <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                              )}
                            </div>
                            {conv.unreadCount && conv.unreadCount > 0 && (
                              <Badge className="ml-2">{conv.unreadCount}</Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Active Conversation */}
          <div className="lg:col-span-2">
            {activeConversation ? (
              <Card className="h-[600px] flex flex-col overflow-hidden">
                {/* Conversation Header */}
                <div className="border-b p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {activeConversation.otherUserName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold">{activeConversation.otherUserName}</p>
                        <p className="text-xs text-muted-foreground">{activeConversation.otherUserEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${activeConversation.otherUserId}`}>
                        <Button variant="ghost" size="sm">
                          <User className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No messages yet. Say hello!</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isOwn = String(msg.senderId) === String(currentUser?.id);
                        const timeStr = safeFormatDate(msg.createdAt, 'HH:mm');
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                          >
                            <div className="flex items-end gap-2 max-w-[75%]">
                              {!isOwn && (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold shrink-0">
                                  {msg.senderName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                              )}
                              <div
                                className={`rounded-2xl px-4 py-2.5 ${
                                  isOwn
                                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                                    : 'bg-muted rounded-bl-sm'
                                }`}
                              >
                                {!isOwn && (
                                  <p className="text-xs font-medium mb-1 opacity-70">{msg.senderName}</p>
                                )}
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                <p className={`mt-1 text-xs ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                                  {timeStr}
                                </p>
                              </div>
                              {isOwn && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => {
                                        setMessageToDelete(msg.id);
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t p-4 bg-background">
                  <div className="flex gap-2">
                    <Input
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type a message..."
                      disabled={sending}
                      className="rounded-full"
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={sending || !messageContent.trim()}
                      className="rounded-full"
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-[600px] flex items-center justify-center bg-muted/20">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="mx-auto mb-4 h-16 w-16 opacity-30" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">Choose from your existing conversations or start a new one</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Delete Message Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => messageToDelete && handleDeleteMessage(messageToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
