import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Users, Calendar, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AirdropPromo = () => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const checkUserEligibility = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Sign up required",
          description: "Please sign up to check your airdrop eligibility!",
        });
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_user_id', session.user.id);

      setUserProfile({ ...profile, referralCount: referrals?.length || 0 });
      
      toast({
        title: "Eligibility checked!",
        description: `You're eligible for the airdrop! ${referrals?.length || 0} referrals completed.`,
      });
    } catch (error) {
      console.error('Error checking eligibility:', error);
      toast({
        title: "Error",
        description: "Failed to check eligibility. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            🎁 Limited Time Offer
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Free FOT Token Airdrop
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join FilmAuth before January 1, 2026, and receive free FOT tokens plus earn rewards for every friend you refer!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="border-2 border-primary/20 bg-gradient-to-b from-background to-primary/5">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Free Signup Bonus</CardTitle>
              <CardDescription>Get started completely free</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">1,000</div>
              <p className="text-sm text-muted-foreground">Free FOT tokens for signing up before Jan 1, 2026</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-accent/20 bg-gradient-to-b from-background to-accent/5 transform scale-105">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-xl">Referral Rewards</CardTitle>
              <CardDescription>Earn for every friend who joins</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">100</div>
              <p className="text-sm text-muted-foreground">FOT tokens per successful referral</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-secondary/20 bg-gradient-to-b from-background to-secondary/5">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle className="text-xl">Time Limited</CardTitle>
              <CardDescription>Exclusive early adopter program</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-lg font-bold text-destructive mb-2">Jan 1, 2026</div>
              <p className="text-sm text-muted-foreground">Deadline for airdrop eligibility</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="text-lg px-8"
              onClick={() => window.location.href = '/auth'}
            >
              <Coins className="h-5 w-5 mr-2" />
              Sign Up for Free Tokens
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8"
              onClick={checkUserEligibility}
              disabled={isLoading}
            >
              Check My Eligibility
            </Button>
          </div>

          {userProfile && (
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-center">Your Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Airdrop Eligible:</span>
                  <Badge variant={userProfile.airdrop_eligible ? "default" : "secondary"}>
                    {userProfile.airdrop_eligible ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Referrals:</span>
                  <Badge variant="outline">{userProfile.referralCount}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Your Referral Code:</span>
                  <Badge variant="secondary">{userProfile.referral_code}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold mb-4">How It Works</h3>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mx-auto">1</div>
                <p className="font-medium">Sign Up Free</p>
                <p className="text-muted-foreground">Create your account before Jan 1, 2026</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mx-auto">2</div>
                <p className="font-medium">Share & Refer</p>
                <p className="text-muted-foreground">Invite friends using your unique referral code</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mx-auto">3</div>
                <p className="font-medium">Earn Tokens</p>
                <p className="text-muted-foreground">Receive FOT tokens automatically</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AirdropPromo;