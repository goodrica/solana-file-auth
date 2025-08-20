import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from 'https://esm.sh/@solana/web3.js@1.95.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FileAuthRequest {
  action: 'authenticate' | 'verify'
  fileHash: string
  fileName?: string
  fileSize?: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Processing file auth request...')
    
    // Get the authorization header for user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Authentication required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }
    
    // Get environment variables
    const quicknodeUrl = Deno.env.get('QUICKNODE_RPC_URL')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!quicknodeUrl) {
      throw new Error('QuickNode RPC URL not configured')
    }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing')
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify the user's JWT token and get user ID
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid authentication token'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401
        }
      )
    }

    // Parse request body
    const { action, fileHash, fileName, fileSize }: FileAuthRequest = await req.json()

    console.log(`Processing ${action} request for hash: ${fileHash}`)

    // Initialize Solana connection
    const connection = new Connection(quicknodeUrl, 'confirmed')

    if (action === 'authenticate') {
      // Check user credits first
      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (creditsError && creditsError.code !== 'PGRST116') {
        console.error('Credits check error:', creditsError)
        throw new Error('Failed to check user credits')
      }

      // Initialize credits if user doesn't have a record
      let userCredits = creditsData
      if (!userCredits) {
        const { data: newCredits, error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            free_credits_remaining: 10,
            purchased_credits: 0,
            total_authentications: 0
          })
          .select()
          .single()

        if (insertError) {
          console.error('Failed to initialize credits:', insertError)
          throw new Error('Failed to initialize user credits')
        }
        
        userCredits = newCredits
      }

      // Check if user has sufficient credits
      const totalCredits = userCredits.free_credits_remaining + userCredits.purchased_credits
      if (totalCredits <= 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'insufficient_credits',
            message: 'You have no authentication credits remaining. Purchase FOT tokens to continue.',
            creditsRemaining: totalCredits
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 402
          }
        )
      }

      // Store file authentication record in database
      const { data: authData, error: authError } = await supabase
        .from('file_authentications')
        .insert({
          file_hash: fileHash,
          file_name: fileName,
          file_size: fileSize,
          blockchain_network: 'solana',
          authenticated_at: new Date().toISOString(),
          user_id: user.id
        })
        .select()
        .single()

      if (authError) {
        console.error('Database error:', authError)
        throw new Error('Failed to store authentication record')
      }

      // Deduct one credit (prioritize free credits first)
      const updatedFreeCredits = Math.max(0, userCredits.free_credits_remaining - 1)
      const creditsToDeductFromPurchased = Math.max(0, 1 - userCredits.free_credits_remaining)
      const updatedPurchasedCredits = Math.max(0, userCredits.purchased_credits - creditsToDeductFromPurchased)

      const { error: updateError } = await supabase
        .from('user_credits')
        .update({
          free_credits_remaining: updatedFreeCredits,
          purchased_credits: updatedPurchasedCredits,
          total_authentications: userCredits.total_authentications + 1
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Failed to update credits:', updateError)
        // Don't fail the authentication, just log the error
      }

      console.log('File authentication record created:', authData.id)

      // Get network info to include in response
      const slot = await connection.getSlot()
      const blockTime = await connection.getBlockTime(slot)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'File authenticated successfully',
          data: {
            id: authData.id,
            fileHash,
            timestamp: authData.authenticated_at,
            blockchainNetwork: 'solana',
            networkSlot: slot,
            blockTime: blockTime ? new Date(blockTime * 1000).toISOString() : null
          },
          creditsRemaining: updatedFreeCredits + updatedPurchasedCredits
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )

    } else if (action === 'verify') {
      // Check if file hash exists in our database for this user
      const { data: authRecord, error: verifyError } = await supabase
        .from('file_authentications')
        .select('*')
        .eq('file_hash', fileHash)
        .eq('user_id', user.id)
        .single()

      if (verifyError && verifyError.code !== 'PGRST116') {
        console.error('Database verification error:', verifyError)
        throw new Error('Failed to verify authentication record')
      }

      if (!authRecord) {
        return new Response(
          JSON.stringify({
            success: true,
            verified: false,
            message: 'File not found in authentication records'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        )
      }

      // File found - return verification details
      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          message: 'File authentication verified',
          data: {
            id: authRecord.id,
            fileHash: authRecord.file_hash,
            fileName: authRecord.file_name,
            fileSize: authRecord.file_size,
            authenticatedAt: authRecord.authenticated_at,
            blockchainNetwork: authRecord.blockchain_network
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    throw new Error('Invalid action specified')

  } catch (error) {
    console.error('Error in solana-file-auth function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})