import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, Gift, Send, Calendar, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import type { User } from '@supabase/supabase-js';

const AdminDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);  
  const [participants, setParticipants] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalFOTAvailable, setTotalFOTAvailable] = useState(0);
  const [fotPrice, setFotPrice] = useState(0.10); // Current FOT price in USD
  const [isLoading, setIsLoading] = useState(true);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    token_amount: 1000,
    end_date: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/auth';
        return;
      }
      setUser(user);
      fetchAdminData();
    } catch (error) {
      console.error('Auth check error:', error);
      window.location.href = '/auth';
    }
  };

  const fetchAdminData = async () => {
    try {
      const { data: campaignsData } = await supabase
        .from('airdrop_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: participantsData } = await supabase
        .from('airdrop_participants')
        .select('*, airdrop_campaigns(name)')
        .order('created_at', { ascending: false });

      const { data: referralsData } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch total users count
      const { count: usersCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total FOT available (sum of all purchased_credits)
      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('purchased_credits');

      const totalFOT = creditsData?.reduce((sum, record) => sum + record.purchased_credits, 0) || 0;

      setCampaigns(campaignsData || []);
      setParticipants(participantsData || []);
      setReferrals(referralsData || []);
      setTotalUsers(usersCount || 0);
      setTotalFOTAvailable(totalFOT);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createCampaign = async () => {
    try {
      const { error } = await supabase
        .from('airdrop_campaigns')
        .insert([{
          ...newCampaign,
          end_date: new Date(newCampaign.end_date).toISOString()
        }]);

      if (error) throw error;

      toast({
        title: "Campaign created!",
        description: "New airdrop campaign has been created successfully.",
      });

      setNewCampaign({ name: '', description: '', token_amount: 1000, end_date: '' });
      fetchAdminData();
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign.",
        variant: "destructive",
      });
    }
  };

  const processAirdrop = async (campaignId: string) => {
    try {
      // This would typically call an edge function to process the airdrop
      const { error } = await supabase.functions.invoke('process-airdrop', {
        body: { campaignId }
      });

      if (error) throw error;

      toast({
        title: "Airdrop processed!",
        description: "Airdrop tokens have been distributed.",
      });

      fetchAdminData();
    } catch (error) {
      console.error('Error processing airdrop:', error);
      toast({
        title: "Error",
        description: "Failed to process airdrop.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-lg">Loading admin dashboard...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-lg mb-4">Access Restricted</div>
              <p className="text-muted-foreground mb-6">You need to be signed in to access the admin dashboard.</p>
              <Button onClick={() => window.location.href = '/auth'}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalReferrals = referrals.length;
  const totalTokensDistributed = participants.reduce((sum, p) => sum + p.tokens_claimed, 0);
  const activeCampaigns = campaigns.filter(c => c.is_active).length;

  return (
    <div>
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage airdrops, referrals, and campaigns</p>
        </div>

        {/* Primary Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total FOT Available</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFOTAvailable.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Tokens in circulation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current FOT Price</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${fotPrice.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">USD per token</p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReferrals}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCampaigns}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tokens Distributed</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTokensDistributed.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{participants.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="create">Create Campaign</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Airdrop Campaigns</CardTitle>
                <CardDescription>Manage your token distribution campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Token Amount</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{campaign.token_amount.toLocaleString()}</TableCell>
                        <TableCell>{new Date(campaign.end_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={campaign.is_active ? "default" : "secondary"}>
                            {campaign.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => processAirdrop(campaign.id)}
                            disabled={!campaign.is_active}
                          >
                            Process Airdrop
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle>Airdrop Participants</CardTitle>
                <CardDescription>View all participants in airdrop campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Allocated</TableHead>
                      <TableHead>Claimed</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell className="font-mono text-sm">
                          {participant.user_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>{participant.airdrop_campaigns?.name}</TableCell>
                        <TableCell>{participant.tokens_allocated}</TableCell>
                        <TableCell>{participant.tokens_claimed}</TableCell>
                        <TableCell>
                          <Badge variant={participant.is_eligible ? "default" : "secondary"}>
                            {participant.is_eligible ? "Eligible" : "Ineligible"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle>Referral Activity</CardTitle>
                <CardDescription>Monitor referral program performance</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referrer ID</TableHead>
                      <TableHead>Referred ID</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Reward</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell className="font-mono text-sm">
                          {referral.referrer_user_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {referral.referred_user_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="font-mono">{referral.referral_code}</TableCell>
                        <TableCell>{new Date(referral.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="default">{referral.reward_amount} FOT</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create New Campaign</CardTitle>
                <CardDescription>Launch a new airdrop campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    placeholder="e.g., Summer 2024 Airdrop"
                  />
                </div>

                <div>
                  <Label htmlFor="campaign-description">Description</Label>
                  <Textarea
                    id="campaign-description"
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                    placeholder="Describe the campaign..."
                  />
                </div>

                <div>
                  <Label htmlFor="token-amount">Token Amount per Participant</Label>
                  <Input
                    id="token-amount"
                    type="number"
                    value={newCampaign.token_amount}
                    onChange={(e) => setNewCampaign({ ...newCampaign, token_amount: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="datetime-local"
                    value={newCampaign.end_date}
                    onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })}
                  />
                </div>

                <Button onClick={createCampaign} className="w-full">
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;