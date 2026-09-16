/**
 * Represents the status of a deal in the FilmAuth A2A Trust & Escrow system.
 */
export type DealStatus = 'PROPOSED' | 'FUNDED' | 'DELIVERED' | 'SETTLED' | 'DISPUTED' | 'SLASHED' | 'REFUNDED';

/**
 * Represents a deal specification between two agents in the FilmAuth A2A Trust & Escrow system.
 */
export interface AgentDealSpec {
  /**
   * Unique identifier for the deal.
   */
  dealId: string;

  /**
   * Public key of the buyer.
   */
  buyerPubkey: string;

  /**
   * Public key of the seller.
   */
  sellerPubkey: string;

  /**
   * Settlement amount in lamports.
   */
  settlementAmountLamports: number;

  /**
   * Optional SPL token mint for the settlement (e.g., USDC or SOL if omitted).
   */
  settlementTokenMint?: string;

  /**
   * FOT performance bond staked by the seller.
   */
  bondFotAmount: number;

  /**
   * SHA-256 hash of the promised/delivered output.
   */
  deliverableHash?: string;

  /**
   * Public key of the dispute resolver (e.g., Internet Court, GenLayer, or Kleros).
   */
  disputeResolverPubkey: string;

  /**
   * Current status of the deal.
   */
  status: DealStatus;

  /**
   * Timestamp when the deal was created.
   */
  createdAt: number;

  /**
   * Timestamp when the deal expires.
   */
  expiresAt: number;

  /**
   * Optional metadata associated with the deal.
   */
  metadata?: Record<string, any>;
}

/**
 * Represents proof of a deliverable in the FilmAuth A2A Trust & Escrow system.
 */
export interface DeliverableProof {
  /**
   * Unique identifier for the deal.
   */
  dealId: string;

  /**
   * SHA-256 hash of the delivered file.
   */
  fileHashSha256: string;

  /**
   * Size of the delivered file in bytes.
   */
  fileSizeBytes: number;

  /**
   * Timestamp when the deliverable was proven.
   */
  timestamp: number;

  /**
   * Optional on-chain transaction signature for the deliverable proof.
   */
  onChainTxSignature?: string;

  /**
   * Optional signature for the FOT burn transaction.
   */
  fotBurnSignature?: string;

  /**
   * Amount of FOT burned for the deliverable proof.
   */
  fotBurned: number;

  /**
   * Optional MIME type of the delivered file.
   */
  mimeType?: string;
}

/**
 * Represents a dispute verdict in the FilmAuth A2A Trust & Escrow system.
 */
export interface DisputeVerdict {
  /**
   * Unique identifier for the deal.
   */
  dealId: string;

  /**
   * Verdict of the dispute.
   */
  verdict: 'RELEASE_TO_SELLER' | 'REFUND_BUYER_SLASH_BOND' | 'SPLIT_50_50';

  /**
   * Public key of the adjudicator who issued the verdict.
   */
  adjudicator: string;

  /**
   * Reason for the dispute verdict.
   */
  reason: string;

  /**
   * Signature of the dispute verdict.
   */
  signature: string;

  /**
   * Timestamp when the dispute verdict was issued.
   */
  timestamp: number;
}

/**
 * Represents the state of an escrow account in the FilmAuth A2A Trust & Escrow system.
 */
export interface EscrowAccountState {
  /**
   * Unique identifier for the deal.
   */
  dealId: string;

  /**
   * Public key of the Program Derived Address (PDA) for the escrow account.
   */
  pda: string;

  /**
   * Public key of the buyer.
   */
  buyer: string;

  /**
   * Public key of the seller.
   */
  seller: string;

  /**
   * Current balance of the settlement in the escrow account.
   */
  settlementBalance: number;

  /**
   * Current balance of the FOT bond in the escrow account.
   */
  bondFotBalance: number;

  /**
   * Current status of the deal.
   */
  status: DealStatus;

  /**
   * Optional SHA-256 hash of the promised/delivered output.
   */
  deliverableHash?: string;
}
