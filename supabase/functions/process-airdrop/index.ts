import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    if (req.method === 'POST') {
      const { campaignId } = await req.json()
      
      if (!campaignId) {
        throw new Error('Campaign ID is required')
      }

      console.log('Processing airdrop for campaign:', campaignId)

      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('airdrop_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (campaignError || !campaign) {
        throw new Error('Campaign not found')
      }

      // Check if campaign is active and not expired
      const now = new Date()
      const endDate = new Date(campaign.end_date)
      
      if (!campaign.is_active || now > endDate) {
        throw new Error('Campaign is not active or has expired')
      }

      // Get eligible users for the airdrop
      const { data: eligibleUsers, error: usersError } = await supabase
        .from('user_profiles')
        .select('user_id, referral_code')
        .eq('airdrop_eligible', true)
        .lt('signup_date', campaign.end_date)

      if (usersError) {
        throw new Error('Failed to fetch eligible users')
      }

      console.log(`Found ${eligibleUsers.length} eligible users`)

      // Create airdrop participants for eligible users
      const participants = eligibleUsers.map(user => ({
        campaign_id: campaignId,
        user_id: user.user_id,
        tokens_allocated: campaign.token_amount,
        is_eligible: true
      }))

      // Insert participants in batches to avoid conflicts
      const { error: insertError } = await supabase
        .from('airdrop_participants')
        .upsert(participants, {
          onConflict: 'campaign_id,user_id',
          ignoreDuplicates: true
        })

      if (insertError) {
        console.error('Insert error:', insertError)
        throw new Error('Failed to create participant records')
      }

      // Update user credits for all participants
      for (const participant of participants) {
        const { error: creditError } = await supabase
          .from('user_credits')
          .upsert({
            user_id: participant.user_id,
            purchased_credits: campaign.token_amount
          }, {
            onConflict: 'user_id',
            count: 'exact'
          })
          .select()

        if (creditError) {
          console.error('Credit update error for user', participant.user_id, ':', creditError)
          // Continue processing other users even if one fails
        }
      }

      // Mark participants as having claimed their tokens
      const { error: claimError } = await supabase
        .from('airdrop_participants')
        .update({
          tokens_claimed: campaign.token_amount,
          claimed_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)

      if (claimError) {
        console.error('Claim update error:', claimError)
      }

      console.log(`Airdrop processed successfully for ${participants.length} participants`)

      return new Response(
        JSON.stringify({
          success: true,
          message: `Airdrop processed for ${participants.length} eligible users`,
          participantCount: participants.length,
          tokenAmount: campaign.token_amount
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json'
          } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error processing airdrop:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred' 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})