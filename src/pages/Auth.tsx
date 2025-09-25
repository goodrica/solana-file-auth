import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, User, Mail, Users, Coins, CheckCircle } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import FotTokenPurchase from "@/components/FotTokenPurchase";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [showPurchaseOption, setShowPurchaseOption] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
    }

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // Redirect authenticated users to home
        window.location.href = '/';
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session && event === 'SIGNED_IN') {
        // Redirect after successful sign in
        window.location.href = '/';
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const cleanupAuthState = () => {
    // Clean up any existing auth state
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('signup-email') as string;
    const password = formData.get('signup-password') as string;
    const confirmPassword = formData.get('confirm-password') as string;
    const referralCodeInput = (formData.get('referral-code') as string) || referralCode;

    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      cleanupAuthState();
      
      const signUpData: any = {
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      };

      // Add referral code to user metadata if provided
      if (referralCodeInput) {
        signUpData.options.data = {
          referred_by: referralCodeInput
        };
      }
      
      const { data, error } = await supabase.auth.signUp(signUpData);

      if (error) throw error;

      if (data.user && !data.session) {
        toast({
          title: "Check your email",
          description: "Please check your email for a verification link to complete registration.",
        });
      } else if (data.session) {
        toast({
          title: "Account created successfully!",
          description: referralCodeInput 
            ? "Welcome to the platform! Your referral has been recorded." 
            : "Welcome to the platform.",
        });
        setSession(data.session);
        setShowPurchaseOption(true);
      }
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message || "There was an error creating your account.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('signin-email') as string;
    const password = formData.get('signin-password') as string;

    try {
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Signed in successfully!",
          description: "Welcome back.",
        });
        window.location.href = '/';
      }
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  if (session && !showPurchaseOption) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <User className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Already signed in</h2>
            <p className="text-muted-foreground mb-4">You are already authenticated.</p>
            <Button onClick={() => window.location.href = '/'}>
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showPurchaseOption && session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md shadow-2xl border-border/50 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome!</CardTitle>
            <CardDescription>
              Your account has been created successfully! You've received 100 FREE FOT tokens to get started. 
              Want to purchase more tokens for additional file authentications?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <img src="/lovable-uploads/72ed1675-d1de-4e94-8d8f-c8f58001d250.png" alt="FOT Token" className="h-8 w-8 mx-auto mb-2" />
              <h3 className="font-semibold text-sm mb-1">FOT Tokens</h3>
              <p className="text-xs text-muted-foreground">
                Use FOT tokens to authenticate your files on the blockchain. Each authentication costs 1 token (~$0.03).
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="flex-1"
              >
                Skip for Now
              </Button>
              <FotTokenPurchase 
                session={session}
                onPurchaseComplete={() => window.location.href = '/'}
              >
                <Button className="flex-1">
                  <Coins className="h-4 w-4 mr-2" />
                  Buy Tokens
                </Button>
              </FotTokenPurchase>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              You can always purchase tokens later from your dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-2xl border-border/50 bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one to get started
          </CardDescription>
          
          {/* Promotional Banner for 100 Free Tokens */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 rounded-full p-2">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-primary">🎁 Instant Airdrop!</h3>
                <p className="text-xs text-muted-foreground">
                  Get <span className="font-bold text-primary">100 FREE FOT tokens</span> instantly when you create your account
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4 mt-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      name="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      name="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      name="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      name="signup-password"
                      type="password"
                      placeholder="Create a password"
                      className="pl-10"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      className="pl-10"
                      required
                      disabled={loading}
                      minLength={6}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referral-code">Referral Code (Optional)</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="referral-code"
                      name="referral-code"
                      type="text"
                      placeholder="Enter referral code"
                      className="pl-10"
                      disabled={loading}
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                    />
                  </div>
                  {referralCode && (
                    <p className="text-xs text-muted-foreground">
                      🎁 You'll receive bonus tokens for using a referral code!
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;