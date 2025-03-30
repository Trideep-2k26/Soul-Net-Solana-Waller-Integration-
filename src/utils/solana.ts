import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  ParsedTransactionWithMeta,
} from '@solana/web3.js';

// Utility function to add delay between retries
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Improved retry function with exponential backoff
async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 7,
  baseDelay: number = 3000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      // Check for rate limit error in multiple ways
      const isRateLimit = 
        error.status === 429 || 
        error.message?.includes('429') ||
        error.message?.toLowerCase().includes('rate limit') ||
        error.message?.toLowerCase().includes('too many requests');

      if (isRateLimit) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Rate limit hit. Retrying in ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  
  throw lastError!;
}

export const requestAirdrop = async (connection: Connection, publicKey: PublicKey) => {
  return retry(async () => {
    const signature = await connection.requestAirdrop(
      publicKey,
      LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature);
  });
};

// Cache for transaction history
const transactionCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // Increased to 60 seconds

export const getTransactionHistory = async (
  connection: Connection,
  publicKey: PublicKey
) => {
  const cacheKey = publicKey.toBase58();
  const cached = transactionCache.get(cacheKey);
  
  // Return cached data if it's still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  return retry(async () => {
    const signatures = await connection.getSignaturesForAddress(publicKey, {
      limit: 10,
    });

    const transactions = await Promise.all(
      signatures.map(async (sig) => {
        const tx = await connection.getParsedTransaction(sig.signature);
        return {
          signature: sig.signature,
          timestamp: sig.blockTime,
          status: sig.err ? 'failed' : 'success',
          type: getTransactionType(tx),
        };
      })
    );

    // Cache the results
    transactionCache.set(cacheKey, {
      data: transactions,
      timestamp: Date.now(),
    });

    return transactions;
  });
};

const getTransactionType = (tx: ParsedTransactionWithMeta | null) => {
  if (!tx?.meta || !tx.transaction.message.instructions.length) return 'unknown';
  
  const instruction = tx.transaction.message.instructions[0];
  if ('program' in instruction) {
    return instruction.program;
  }
  return 'unknown';
};