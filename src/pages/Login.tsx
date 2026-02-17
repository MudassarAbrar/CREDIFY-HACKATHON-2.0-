import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: { theme?: string; size?: string; type?: string; text?: string }
          ) => void;
        };
      };
    };
  }
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const credentialHandlerRef = useRef<(credential: string) => void>(() => {});

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setGoogleLoading(true);
      try {
        await authApi.googleLogin(credential);
        toast({ title: "Success", description: "Logged in with Google!" });
        // Reload so AuthProvider picks up user from localStorage
        window.location.href = "/";
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Google sign-in failed",
          variant: "destructive",
        });
      } finally {
        setGoogleLoading(false);
      }
    },
    [toast]
  );

  credentialHandlerRef.current = handleGoogleCredential;

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    const initAndRender = () => {
      if (!window.google?.accounts?.id) return false;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: { credential: string }) => {
          credentialHandlerRef.current(response.credential);
        },
        auto_select: false,
      });
      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          text: "continue_with",
        });
      }
      return true;
    };

    if (initAndRender()) return;
    const t = setInterval(() => {
      if (initAndRender()) clearInterval(t);
    }, 100);
    return () => clearInterval(t);
  }, [googleClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Log in to your SkillSwap account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
            <div className="mt-4 flex justify-center">
              {googleClientId ? (
                <div ref={googleButtonRef} id="google-signin-button" />
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    toast({
                      title: "Google sign-in not configured",
                      description: "Add VITE_GOOGLE_CLIENT_ID to your .env file. See ENV_SETUP.md.",
                      variant: "default",
                    })
                  }
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </Button>
              )}
            </div>
            {googleLoading && (
              <p className="mt-2 text-center text-sm text-muted-foreground">Signing in with Google...</p>
            )}
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account? <Link to="/register" className="font-medium text-primary hover:underline">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
