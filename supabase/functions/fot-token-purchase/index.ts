import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// FOT Token mint address
const FOT_MINT_ADDRESS = "4zaq8xFC2grs6u9q9gjSiQCPqmXCJeqKk9b1UiHzRovA";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    const { action, tokenAmount, transactionSignature } = await req.json();

    if (action === 'get_purchase_info') {
      // Return purchase information including mint address
      return new Response(
        JSON.stringify({
          success: true,
          fotMintAddress: FOT_MINT_ADDRESS,
          pricePerToken: 0.03, // $0.03 per token
          minimumPurchase: 10, // Minimum 10 tokens
          recommendedAmounts: [10, 25, 50, 100] // Suggested purchase amounts
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    if (action === 'confirm_purchase') {
      if (!tokenAmount || !transactionSignature) {
        return new Response(
          JSON.stringify({ error: 'Missing tokenAmount or transactionSignature' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
      }

      console.log(`Processing FOT token purchase for user ${user.id}: ${tokenAmount} tokens, tx: ${transactionSignature}`);

      // Use service role to update credits (bypassing RLS)
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        { auth: { persistSession: false } }
      );

      // Get current credits
      const { data: currentCredits, error: fetchError } = await supabaseService
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching current credits:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Error fetching credits' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }

      // Initialize credits if they don't exist
      if (!currentCredits) {
        const { error: initError } = await supabaseService
          .from('user_credits')
          .insert({
            user_id: user.id,
            free_credits_remaining: 10,
            purchased_credits: tokenAmount,
            total_authentications: 0
          });

        if (initError) {
          console.error('Error initializing credits:', initError);
          return new Response(
            JSON.stringify({ error: 'Error initializing credits' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          );
        }
      } else {
        // Update existing credits
        const { error: updateError } = await supabaseService
          .from('user_credits')
          .update({
            purchased_credits: currentCredits.purchased_credits + tokenAmount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating credits:', updateError);
          return new Response(
            JSON.stringify({ error: 'Error updating credits' }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          );
        }
      }

      console.log(`Successfully added ${tokenAmount} FOT tokens to user ${user.id}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Successfully added ${tokenAmount} FOT tokens to your account`,
          transactionSignature
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );

  } catch (error) {
    console.error('FOT token purchase error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});