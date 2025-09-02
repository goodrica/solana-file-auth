import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Gift, Users, FileText, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import CreditsDisplay from "@/components/CreditsDisplay";
import ReferralManager from "@/components/ReferralManager";
import type { Session } from "@supabase/supabase-js";

const Dashboard = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [airdropParticipation, setAirdropParticipation] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/auth';
        return;
      }

      setSession(session);
      await fetchUserData(session.user.id);
    } catch (error) {
      console.error('Auth error:', error);
      window.location.href = '/auth';
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Fetch airdrop participation
      const { data: participation } = await supabase
        .from('airdrop_participants')
        .select('*, airdrop_campaigns(*)')
        .eq('user_id', userId);

      setUserProfile(profile);
      setAirdropParticipation(participation || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-8">
              <h2 className="text-xl font-semibold mb-4">Access Denied</h2>
              <p className="text-muted-foreground mb-4">Please sign in to access your dashboard.</p>
              <Button onClick={() => window.location.href = '/auth'}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalAirdropTokens = airdropParticipation.reduce((sum, p) => sum + p.tokens_allocated, 0);
  const claimedTokens = airdropParticipation.reduce((sum, p) => sum + p.tokens_claimed, 0);

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {session.user.email}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <CreditsDisplay 
              session={session} 
              onCreditsUpdate={() => fetchUserData(session.user.id)} 
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {userProfile ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Referral Code:</span>
                    <Badge variant="secondary" className="font-mono">
                      {userProfile.referral_code}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Member Since:</span>
                    <span className="text-sm">
                      {new Date(userProfile.signup_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Airdrop Eligible:</span>
                    <Badge variant={userProfile.airdrop_eligible ? "default" : "secondary"}>
                      {userProfile.airdrop_eligible ? "Yes" : "No"}
                    </Badge>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Loading profile...</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="airdrops" className="space-y-6">
          <TabsList>
            <TabsTrigger value="airdrops">Airdrops</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="airdrops">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Airdrop Rewards
                </CardTitle>
                <CardDescription>
                  Your participation in token airdrops
                </CardDescription>
              </CardHeader>
              <CardContent>
                {airdropParticipation.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">{totalAirdropTokens}</div>
                        <div className="text-sm text-muted-foreground">Total Allocated</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-accent">{claimedTokens}</div>
                        <div className="text-sm text-muted-foreground">Claimed</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {airdropParticipation.map((participation) => (
                        <div key={participation.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{participation.airdrop_campaigns?.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {participation.airdrop_campaigns?.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{participation.tokens_allocated} FOT</div>
                            <Badge variant={participation.tokens_claimed > 0 ? "default" : "outline"}>
                              {participation.tokens_claimed > 0 ? "Claimed" : "Pending"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Airdrops Yet</h3>
                    <p className="text-muted-foreground">
                      You're eligible for future airdrops! Stay tuned for announcements.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralManager />
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your recent platform activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Activity Coming Soon</h3>
                  <p className="text-muted-foreground">
                    File authentications and other activity will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;