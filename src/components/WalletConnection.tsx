import React, { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const WalletConnection: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const { toast } = useToast();

  useEffect(() => {
    const updateWalletInProfile = async () => {
      if (connected && publicKey) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Check if profile exists
            const { data: existingProfile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', user.id)
              .single();

            if (existingProfile) {
              // Update existing profile
              const { error } = await supabase
                .from('user_profiles')
                .update({
                  wallet_address: publicKey.toBase58(),
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

              if (error) {
                console.error('Error updating wallet address:', error);
              } else {
                toast({
                  title: "Wallet Connected",
                  description: `Connected to ${publicKey.toBase58().slice(0, 8)}...${publicKey.toBase58().slice(-8)}`,
                });
              }
            } else {
              // Create new profile with required referral_code
              const referralCode = `REF${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
              const { error } = await supabase
                .from('user_profiles')
                .insert({
                  user_id: user.id,
                  wallet_address: publicKey.toBase58(),
                  referral_code: referralCode,
                });

              if (error) {
                console.error('Error creating profile with wallet:', error);
              } else {
                toast({
                  title: "Wallet Connected",
                  description: `Connected to ${publicKey.toBase58().slice(0, 8)}...${publicKey.toBase58().slice(-8)}`,
                });
              }
            }
          }
        } catch (error) {
          console.error('Error updating wallet:', error);
        }
      }
    };

    updateWalletInProfile();
  }, [connected, publicKey, toast]);

  return (
    <div className="flex items-center gap-2">
      <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !rounded-md !px-4 !py-2 !text-sm !font-medium !transition-colors" />
      {connected && publicKey && (
        <div className="flex items-center gap-2">
          <img src="/lovable-uploads/72ed1675-d1de-4e94-8d8f-c8f58001d250.png" alt="FOT Token" className="h-4 w-4" />
          <span className="text-sm text-muted-foreground">100,000 FOT</span>
        </div>
      )}
    </div>
  );
};