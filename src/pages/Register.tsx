import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"student" | "professional">("student");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register } = useAuth();
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
        toast({ title: "Success", description: "Account created with Google!" });
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
        callback: (response: { credential: string }) => credentialHandlerRef.current(response.credential),
        auto_select: false,
      });
      if (googleButtonRef.current) {
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          text: "signup_with",
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
      await register(fullName, email, password, userType);
      toast({
        title: "Success",
        description: "Account created successfully!",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
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
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Start with 100 free credits</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>I am a...</Label>
              <RadioGroup value={userType} onValueChange={(v) => setUserType(v as "student" | "professional")} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="student" id="student" />
                  <Label htmlFor="student" className="cursor-pointer">Student</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="professional" id="professional" />
                  <Label htmlFor="professional" className="cursor-pointer">Professional</Label>
                </div>
              </RadioGroup>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or sign up with</span>
              </div>
              <div className="mt-4 flex justify-center">
                {googleClientId ? (
                  <div ref={googleButtonRef} id="google-signin-button-register" />
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      toast({
                        title: "Google sign-up not configured",
                        description: "Add VITE_GOOGLE_CLIENT_ID to your .env file. See ENV_SETUP.md.",
                        variant: "default",
                      })
                    }
                  >
                    Continue with Google
                  </Button>
                )}
              </div>
              {googleLoading && (
                <p className="mt-2 text-center text-sm text-muted-foreground">Signing up with Google...</p>
              )}
            </div>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
