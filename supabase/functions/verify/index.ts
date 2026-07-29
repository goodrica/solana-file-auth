import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.23.8'
import { Connection } from 'npm:@solana/web3.js@1.95.4'

const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'

const VerifySchema = z.object({
  hash: z.string().regex(/^0x[0-9a-fA-F]{64}$/, 'hash must be "0x" followed by 64 hex characters'),
  signature: z.string().trim().min(64).max(120),
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function decodeMemos(tx: any): string[] {
  const memos: string[] = []
  const message = tx?.transaction?.message
  const instructions = [
    ...(message?.instructions ?? []),
    ...((tx?.meta?.innerInstructions ?? []).flatMap((i: any) => i.instructions ?? [])),
  ]

  for (const ix of instructions) {
    if (ix?.programId?.toString?.() !== MEMO_PROGRAM_ID && ix?.program !== 'spl-memo') continue
    if (typeof ix.parsed === 'string') {
      memos.push(ix.parsed)
    } else if (typeof ix.data === 'string') {
      try {
        memos.push(new TextDecoder().decode(Uint8Array.from(atob(ix.data), (c) => c.charCodeAt(0))))
      } catch {
        // ignore non-utf8 payloads
      }
    }
  }

  // Log messages are a reliable fallback for memo contents
  for (const log of tx?.meta?.logMessages ?? []) {
    const match = /Program log: Memo \(len \d+\): "(.*)"$/.exec(log)
    if (match) memos.push(match[1])
  }

  return memos
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  try {
    const parsed = VerifySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) {
      return json({ ok: false, error: parsed.error.flatten().fieldErrors }, 400)
    }
    const { hash, signature } = parsed.data

    const rpcUrl = Deno.env.get('SOLANA_RPC_URL')
    if (!rpcUrl) throw new Error('SOLANA_RPC_URL is not configured')

    const connection = new Connection(rpcUrl, 'confirmed')
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    })

    if (!tx) {
      return json({ ok: false, error: 'transaction_not_found', message: 'Transaction not found on Solana mainnet.' }, 404)
    }

    const memos = decodeMemos(tx)
    const match = memos.some((m) => m.trim().toLowerCase() === hash.toLowerCase())

    if (!match) {
      return json({ ok: false, error: 'hash_mismatch', message: 'No memo in this transaction matches the provided hash.' }, 200)
    }

    return json({
      ok: true,
      signature,
      hash,
      blockTime: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : null,
      slot: tx.slot,
    })
  } catch (error) {
    console.error('verify error:', error)
    return json({ ok: false, error: (error as Error).message ?? 'Internal server error' }, 500)
  }
})
