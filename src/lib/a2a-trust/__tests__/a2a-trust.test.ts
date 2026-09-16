import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, PublicKey } from '@solana/web3.js';
import { FilmAuthTrustClient } from '../client.js';
import { sha256Hex, verifyHash } from '../crypto.js';
import { AgentDealSpec, DeliverableProof, DisputeVerdict } from '../types.js';

describe('FilmAuth A2A Trust Engine', () => {
  const buyer = Keypair.generate();
  const seller = Keypair.generate();
  const resolver = Keypair.generate();
  const client = new FilmAuthTrustClient();

  describe('1. Cryptographic Hash Validation', () => {
    it('computes deterministic SHA-256 hex string', () => {
      const data = 'Autonomous agent dataset payload v1.0';
      const hash1 = sha256Hex(data);
      const hash2 = sha256Hex(Buffer.from(data));
      assert.equal(hash1, hash2);
      assert.equal(hash1.length, 64);
    });

    it('verifies valid deliverable integrity', () => {
      const deliverable = Buffer.from('Dataset result rows: 10,000 scraped records');
      const expectedHash = sha256Hex(deliverable);
      assert.equal(verifyHash(deliverable, expectedHash), true);
    });

    it('detects tampered/corrupted deliverable', () => {
      const original = Buffer.from('Legitimate analysis report');
      const tampered = Buffer.from('Tampered / hallucinated report');
      const originalHash = sha256Hex(original);
      assert.equal(verifyHash(tampered, originalHash), false);
    });
  });

  describe('2. Deal State Machine & Hash Anchoring', () => {
    let deal: AgentDealSpec;
    const deliverableData = Buffer.from('Scraped market intelligence dataset for trader agent');

    it('creates deal proposal with deterministic PDA derivation', () => {
      deal = client.createDealProposal({
        buyerPubkey: buyer.publicKey,
        sellerPubkey: seller.publicKey,
        settlementLamports: 1_000_000_000, // 1 SOL
        bondFotAmount: 100,               // 100 FOT performance bond
        disputeResolver: resolver.publicKey,
        expiresAt: Date.now() + 86400000,
        metadata: { taskType: 'WEB_SCRAPING', query: 'vintage cards' }
      });

      assert.ok(deal.dealId.startsWith('deal_'));
      assert.equal(deal.status, 'PROPOSED');
      assert.equal(deal.buyerPubkey, buyer.publicKey.toBase58());
      assert.equal(deal.sellerPubkey, seller.publicKey.toBase58());
      assert.equal(deal.bondFotAmount, 100);

      const [pda, bump] = client.deriveEscrowPda(deal.dealId);
      assert.ok(pda instanceof PublicKey);
      assert.ok(bump >= 0);
    });

    it('anchors deliverable with 1 FOT burn record', async () => {
      const proof: DeliverableProof = await client.anchorDeliverable(deal.dealId, deliverableData, {
        fileName: 'dataset.json',
        mimeType: 'application/json'
      });

      assert.equal(proof.dealId, deal.dealId);
      assert.equal(proof.fileHashSha256, sha256Hex(deliverableData));
      assert.equal(proof.fotBurned, 1);
      assert.ok(proof.onChainTxSignature);

      // Verify proof
      const verification = client.verifyDeliverableProof(proof, deliverableData);
      assert.equal(verification.valid, true);
      assert.equal(verification.matches, true);
    });

    it('settles deal, paying seller and returning FOT bond', async () => {
      const proof: DeliverableProof = await client.anchorDeliverable(deal.dealId, deliverableData);
      const settlement = await client.executeSettle(deal, proof);

      assert.equal(settlement.status, 'SETTLED');
      assert.equal(settlement.settlementPaid, 1_000_000_000);
      assert.equal(settlement.bondReturned, 100);
      assert.ok(settlement.txSignature);
    });
  });

  describe('3. Internet Court Dispute & Bond Slashing', () => {
    it('initiates dispute and transitions status', async () => {
      const deal = client.createDealProposal({
        buyerPubkey: buyer.publicKey,
        sellerPubkey: seller.publicKey,
        settlementLamports: 500_000_000,
        bondFotAmount: 50,
        disputeResolver: resolver.publicKey,
        expiresAt: Date.now() + 3600000
      });

      const dispute = await client.fileDispute(deal.dealId, 'Seller deliverable contained 90% mock data', buyer.publicKey, resolver.publicKey);
      assert.equal(dispute.status, 'DISPUTED');
      assert.equal(dispute.resolver, resolver.publicKey.toBase58());
      assert.equal(dispute.initiator, buyer.publicKey.toBase58());
    });

    it('adjudicates dispute: REFUND_BUYER_SLASH_BOND slashes seller bond', async () => {
      const deal = client.createDealProposal({
        buyerPubkey: buyer.publicKey,
        sellerPubkey: seller.publicKey,
        settlementLamports: 500_000_000,
        bondFotAmount: 50,
        disputeResolver: resolver.publicKey,
        expiresAt: Date.now() + 3600000
      });

      const verdict: DisputeVerdict = {
        dealId: deal.dealId,
        verdict: 'REFUND_BUYER_SLASH_BOND',
        adjudicator: resolver.publicKey.toBase58(),
        reason: 'Empirical benchmark verified deliverable hallucination rate > 40%',
        signature: 'sig_mock_adjudication_proof',
        timestamp: Date.now()
      };

      const result = await client.adjudicateDispute(verdict, deal);
      assert.equal(result.finalStatus, 'SLASHED');
      assert.equal(result.fotSlashed, 50);
      assert.equal(result.settlementRecipient, buyer.publicKey.toBase58());
    });
  });
});
