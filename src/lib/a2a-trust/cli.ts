// src/lib/a2a-trust/cli.ts

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PublicKey } from '@solana/web3.js';

interface AgentDealSpec {
  buyer: string;
  seller: string;
  amount: number;
  bond: number;
  timestamp: number;
}

interface AnchorProof {
  dealId: string;
  filePath: string;
  hash: string;
  timestamp: number;
}

interface DisputeRecord {
  dealId: string;
  reason: string;
  timestamp: number;
}

class FilmAuthCLI {
  private args: string[];

  constructor() {
    this.args = process.argv.slice(2);
    this.parseArgs();
  }

  private parseArgs(): void {
    const command = this.args[0];

    switch (command) {
      case 'hash':
        this.handleHashCommand();
        break;
      case 'propose-deal':
        this.handleProposeDealCommand();
        break;
      case 'anchor':
        this.handleAnchorCommand();
        break;
      case 'verify':
        this.handleVerifyCommand();
        break;
      case 'dispute':
        this.handleDisputeCommand();
        break;
      default:
        this.showHelp();
    }
  }

  private showHelp(): void {
    console.log(`
FilmAuth A2A Trust & Internet Court CLI

Commands:
  hash <file-path>          Compute SHA-256 hash for deliverable
  propose-deal              Propose a deal
    --buyer <pubkey>        Buyer's public key
    --seller <pubkey>       Seller's public key
    --amount <lamports>     Amount in lamports
    --bond <fot>            Bond amount in FOT
  anchor                    Anchor a deal
    --deal-id <id>          Deal ID
    --file <path>           File path
  verify                    Verify deliverable integrity
    --file <path>           File path
    --hash <sha256>         SHA-256 hash
  dispute                   Create an Internet Court dispute
    --deal-id <id>          Deal ID
    --reason <text>         Dispute reason
`);
  }

  private handleHashCommand(): void {
    if (this.args.length < 2) {
      console.error('Error: File path is required');
      return;
    }

    const filePath = this.args[1];
    const hash = this.computeFileHash(filePath);

    if (hash) {
      console.log(`SHA-256 hash for ${filePath}:`);
      console.log(hash);
    }
  }

  private handleProposeDealCommand(): void {
    const args = this.parseKeyValueArgs(this.args.slice(1));

    if (!args.buyer || !args.seller || !args.amount || !args.bond) {
      console.error('Error: Missing required arguments');
      return;
    }

    try {
      // Validate public keys
      new PublicKey(args.buyer);
      new PublicKey(args.seller);

      const dealSpec: AgentDealSpec = {
        buyer: args.buyer,
        seller: args.seller,
        amount: parseInt(args.amount, 10),
        bond: parseFloat(args.bond),
        timestamp: Date.now(),
      };

      console.log('Agent Deal Specification:');
      console.log(JSON.stringify(dealSpec, null, 2));
    } catch (error) {
      console.error('Error: Invalid public key format');
    }
  }

  private handleAnchorCommand(): void {
    const args = this.parseKeyValueArgs(this.args.slice(1));

    if (!args['deal-id'] || !args.file) {
      console.error('Error: Missing required arguments');
      return;
    }

    const filePath = args.file;
    const hash = this.computeFileHash(filePath);

    if (hash) {
      const anchorProof: AnchorProof = {
        dealId: args['deal-id'],
        filePath,
        hash,
        timestamp: Date.now(),
      };

      console.log('Anchor Proof:');
      console.log(JSON.stringify(anchorProof, null, 2));
    }
  }

  private handleVerifyCommand(): void {
    const args = this.parseKeyValueArgs(this.args.slice(1));

    if (!args.file || !args.hash) {
      console.error('Error: Missing required arguments');
      return;
    }

    const filePath = args.file;
    const expectedHash = args.hash;
    const actualHash = this.computeFileHash(filePath);

    if (actualHash && actualHash === expectedHash) {
      console.log('Verification successful: Deliverable integrity confirmed');
    } else {
      console.error('Verification failed: Deliverable integrity compromised');
    }
  }

  private handleDisputeCommand(): void {
    const args = this.parseKeyValueArgs(this.args.slice(1));

    if (!args['deal-id'] || !args.reason) {
      console.error('Error: Missing required arguments');
      return;
    }

    const disputeRecord: DisputeRecord = {
      dealId: args['deal-id'],
      reason: args.reason,
      timestamp: Date.now(),
    };

    console.log('Internet Court Dispute Record:');
    console.log(JSON.stringify(disputeRecord, null, 2));
  }

  private computeFileHash(filePath: string): string | null {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash('sha256');
      hash.update(fileBuffer);
      return hash.digest('hex');
    } catch (error) {
      console.error(`Error: Unable to compute hash for ${filePath}`);
      return null;
    }
  }

  private parseKeyValueArgs(args: string[]): Record<string, string> {
    const result: Record<string, string> = {};

    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith('--')) {
        const key = args[i].substring(2);
        if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
          result[key] = args[i + 1];
          i++; // Skip the next argument as it's the value
        } else {
          result[key] = '';
        }
      }
    }

    return result;
  }
}

// Run the CLI
new FilmAuthCLI();
