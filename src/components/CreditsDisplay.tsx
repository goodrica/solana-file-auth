import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Coins, Camera, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import FotTokenPurchase from "./FotTokenPurchase";
import type { Session } from "@supabase/supabase-js";

interface UserCredits {
  free_credits_remaining: number;
  purchased_credits: number;
  total_authentications: number;
}

interface CreditsDisplayProps {
  session: Session | null;
  onCreditsUpdate?: (credits: UserCredits) => void;
}

const CreditsDisplay = ({ session, onCreditsUpdate }: CreditsDisplayProps) => {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCredits = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching credits:', error);
        return;
      }

      // Initialize credits if user doesn't have a record
      if (!data) {
        const { data: newCredits, error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: session.user.id,
            free_credits_remaining: 10,
            purchased_credits: 0,
            total_authentications: 0
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error initializing credits:', insertError);
          return;
        }

        setCredits(newCredits);
        onCreditsUpdate?.(newCredits);
      } else {
        setCredits(data);
        onCreditsUpdate?.(data);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [session]);

  if (!session || loading) return null;

  const totalCredits = credits ? credits.free_credits_remaining + credits.purchased_credits : 0;

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5 text-primary" />
          Authentication Credits
        </CardTitle>
        <CardDescription>
          Track your photo authentication usage and FOT token balance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Total Credits</span>
          </div>
          <Badge variant={totalCredits > 0 ? "default" : "destructive"} className="text-sm">
            {totalCredits}
          </Badge>
        </div>

        {credits && (
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Free credits remaining:</span>
              <span className="font-medium">{credits.free_credits_remaining}</span>
            </div>
            <div className="flex justify-between">
              <span>FOT tokens:</span>
              <span className="font-medium">{credits.purchased_credits}</span>
            </div>
            <div className="flex justify-between">
              <span>Total authentications:</span>
              <span className="font-medium">{credits.total_authentications}</span>
            </div>
          </div>
        )}

        {totalCredits <= 3 && (
          <div className="pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">
              {totalCredits === 0 
                ? "No credits remaining! Purchase FOT tokens to continue." 
                : "Running low on credits. Purchase FOT tokens to continue authenticating photos."}
            </p>
            <FotTokenPurchase 
              session={session} 
              onPurchaseComplete={fetchCredits}
            >
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                Buy FOT Tokens
              </Button>
            </FotTokenPurchase>
            <p className="text-xs text-center text-muted-foreground mt-1">
              FOT tokens cost ~$0.03 each
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditsDisplay;