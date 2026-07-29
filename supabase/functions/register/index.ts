import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.23.8'
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from 'npm:@solana/web3.js@1.95.4'
import bs58 from 'npm:bs58@5.0.0'

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

const RegisterSchema = z.object({
  hash: z.string().regex(/^0x[0-9a-fA-F]{64}$/, 'hash must be "0x" followed by 64 hex characters'),
})

// --- Simple in-memory sliding-window rate limiter: 5 requests / minute / IP ---
const WINDOW_MS = 60_000
const MAX_REQUESTS = 5
const hits = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_REQUESTS) {
    hits.set(ip, recent)
    return true
  }
  recent.push(now)
  hits.set(ip, recent)
  // opportunistic cleanup
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k)
    }
  }
  return false
}

function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('cf-connecting-ip') ?? req.headers.get('x-real-ip') ?? 'unknown'
}

function loadServiceWallet(): Keypair {
  const raw = Deno.env.get('SERVICE_SECRET_JSON')
  if (!raw) throw new Error('SERVICE_SECRET_JSON is not configured')
  const trimmed = raw.trim()
  if (trimmed.startsWith('[')) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(trimmed) as number[]))
  }
  // Fall back to a base58-encoded secret key
  return Keypair.fromSecretKey(bs58.decode(trimmed))
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  const ip = getClientIp(req)
  if (isRateLimited(ip)) {
    return json(
      {
        ok: false,
        error: 'rate_limited',
        message: "You're going a bit fast — only 5 registrations per minute are allowed. Please try again shortly.",
      },
      429,
    )
  }

  try {
    const parsed = RegisterSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return json({ ok: false, error: parsed.error.flatten().fieldErrors }, 400)
    }
    const { hash } = parsed.data

    const rpcUrl = Deno.env.get('SOLANA_RPC_URL')
    if (!rpcUrl) throw new Error('SOLANA_RPC_URL is not configured')

    const connection = new Connection(rpcUrl, 'confirmed')
    const payer = loadServiceWallet()

    const instruction = new TransactionInstruction({
      keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: true }],
      programId: MEMO_PROGRAM_ID,
      data: new TextEncoder().encode(hash) as unknown as Buffer,
    })

    const transaction = new Transaction().add(instruction)
    const signature = await sendAndConfirmTransaction(connection, transaction, [payer], {
      commitment: 'confirmed',
    })

    console.log('Registered hash on', Deno.env.get('SOLANA_CLUSTER') ?? 'mainnet-beta', signature)
    return json({ ok: true, signature })
  } catch (error) {
    console.error('register error:', error)
    return json({ ok: false, error: (error as Error).message ?? 'Internal server error' }, 500)
  }
})
