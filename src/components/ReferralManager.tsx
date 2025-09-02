import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Share2, Users, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReferralData {
  referral_code: string;
  referral_count: number;
  referrals: any[];
}

const ReferralManager = () => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('referral_code')
        .eq('user_id', session.user.id)
        .single();

      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_user_id', session.user.id);

      if (profile) {
        setReferralData({
          referral_code: profile.referral_code,
          referral_count: referrals?.length || 0,
          referrals: referrals || []
        });
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast({
        title: "Error",
        description: "Failed to load referral data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (referralData?.referral_code) {
      navigator.clipboard.writeText(referralData.referral_code);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard.",
      });
    }
  };

  const shareReferralLink = () => {
    if (referralData?.referral_code) {
      const shareUrl = `${window.location.origin}/auth?ref=${referralData.referral_code}`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Join FilmAuth and get free FOT tokens!',
          text: 'Sign up for FilmAuth with my referral code and we both get free tokens!',
          url: shareUrl
        });
      } else {
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied!",
          description: "Referral link copied to clipboard.",
        });
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading referral data...</div>;
  }

  if (!referralData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral Program</CardTitle>
          <CardDescription>Sign in to view your referral information</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const earnedTokens = referralData.referral_count * 20;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img src="/lovable-uploads/72ed1675-d1de-4e94-8d8f-c8f58001d250.png" alt="FOT Token" className="h-5 w-5" />
            Your Referral Stats
          </CardTitle>
          <CardDescription>Earn 20 FOT tokens for each successful referral</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{referralData.referral_count}</div>
              <div className="text-sm text-muted-foreground">Successful Referrals</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">{earnedTokens}</div>
              <div className="text-sm text-muted-foreground">Tokens Earned</div>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-lg px-4 py-2">
                <Gift className="h-4 w-4 mr-1" />
                Active
              </Badge>
              <div className="text-sm text-muted-foreground mt-1">Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Share Your Referral Code</CardTitle>
          <CardDescription>Invite friends and earn tokens together</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="referral-code">Your Referral Code</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="referral-code"
                value={referralData.referral_code}
                readOnly
                className="font-mono"
              />
              <Button variant="outline" size="icon" onClick={copyReferralCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={shareReferralLink} className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share Referral Link
            </Button>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">How referrals work:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Share your referral code with friends</li>
              <li>• They sign up using your code</li>
              <li>• You both get 20 FOT tokens</li>
              <li>• No limit on referrals!</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {referralData.referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {referralData.referrals.slice(0, 5).map((referral: any) => (
                <div key={referral.id} className="flex justify-between items-center p-2 border rounded">
                  <span className="text-sm">Referral #{referral.id.slice(0, 8)}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <img src="/lovable-uploads/72ed1675-d1de-4e94-8d8f-c8f58001d250.png" alt="FOT Token" className="h-3 w-3" />
                      +20 FOT
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReferralManager;