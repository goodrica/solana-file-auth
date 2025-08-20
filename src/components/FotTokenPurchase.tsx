import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Coins, ExternalLink, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Session } from "@supabase/supabase-js";

interface FotTokenPurchaseProps {
  session: Session | null;
  onPurchaseComplete?: () => void;
  children: React.ReactNode;
}

interface PurchaseInfo {
  fotMintAddress: string;
  pricePerToken: number;
  minimumPurchase: number;
  recommendedAmounts: number[];
}

const FotTokenPurchase = ({ session, onPurchaseComplete, children }: FotTokenPurchaseProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [purchaseInfo, setPurchaseInfo] = useState<PurchaseInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [step, setStep] = useState<'select' | 'instructions' | 'confirm'>('select');
  const [transactionSignature, setTransactionSignature] = useState('');
  const { toast } = useToast();

  const handleOpenDialog = async () => {
    setIsOpen(true);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('fot-token-purchase', {
        body: { action: 'get_purchase_info' }
      });

      if (error) throw error;
      
      setPurchaseInfo(data);
    } catch (error) {
      console.error('Error fetching purchase info:', error);
      toast({
        title: "Error",
        description: "Failed to load purchase information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setStep('instructions');
  };

  const handleConfirmPurchase = async () => {
    if (!selectedAmount || !transactionSignature.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your transaction signature.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fot-token-purchase', {
        body: { 
          action: 'confirm_purchase',
          tokenAmount: selectedAmount,
          transactionSignature: transactionSignature.trim()
        }
      });

      if (error) throw error;

      toast({
        title: "Purchase Successful!",
        description: `${selectedAmount} FOT tokens have been added to your account`,
      });

      setIsOpen(false);
      setStep('select');
      setSelectedAmount(null);
      setTransactionSignature('');
      onPurchaseComplete?.();
      
    } catch (error) {
      console.error('Error confirming purchase:', error);
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!session) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={handleOpenDialog}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Buy FOT Tokens
          </DialogTitle>
          <DialogDescription>
            Purchase FOT tokens to authenticate more photos. Each token costs ~$0.03.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <>
            {step === 'select' && purchaseInfo && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Select how many FOT tokens you'd like to purchase:
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {purchaseInfo.recommendedAmounts.map((amount) => (
                    <Card 
                      key={amount} 
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleAmountSelect(amount)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-lg font-semibold">{amount}</div>
                        <div className="text-sm text-muted-foreground">FOT tokens</div>
                        <Badge variant="outline" className="mt-2">
                          ~${(amount * purchaseInfo.pricePerToken).toFixed(2)}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {step === 'instructions' && purchaseInfo && selectedAmount && (
              <div className="space-y-4">
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Purchase Instructions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>FOT Tokens:</span>
                      <Badge>{selectedAmount}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Estimated Cost:</span>
                      <Badge variant="outline">~${(selectedAmount * purchaseInfo.pricePerToken).toFixed(2)}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center mt-0.5 shrink-0">1</div>
                    <div>
                      <p className="font-medium">Send Solana to purchase FOT tokens</p>
                      <p className="text-muted-foreground">Use your preferred Solana wallet to send payment.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center mt-0.5 shrink-0">2</div>
                    <div>
                      <p className="font-medium">FOT Mint Address:</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded break-all block mt-1">
                        {purchaseInfo.fotMintAddress}
                      </code>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center mt-0.5 shrink-0">3</div>
                    <div>
                      <p className="font-medium">Enter your transaction signature below</p>
                      <p className="text-muted-foreground">After sending the transaction, paste the signature here.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Transaction Signature:</label>
                  <input
                    type="text"
                    value={transactionSignature}
                    onChange={(e) => setTransactionSignature(e.target.value)}
                    placeholder="Paste your transaction signature here..."
                    className="w-full px-3 py-2 border border-border rounded-md text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('select')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleConfirmPurchase}
                    disabled={!transactionSignature.trim()}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Purchase
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FotTokenPurchase;