import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  createTransferInstruction,
  getMint,
  getAccount,
} from '@solana/spl-token';

export const createToken = async (
  connection: Connection,
  payer: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  name: string,
  symbol: string,
  decimals: number
) => {
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;
  
  const transaction = new Transaction();
  
  // Create mint account
  transaction.add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mint,
      space: 82,
      lamports: await connection.getMinimumBalanceForRentExemption(82),
      programId: TOKEN_PROGRAM_ID,
    })
  );
  
  // Initialize mint
  transaction.add(
    createInitializeMintInstruction(
      mint,
      decimals,
      payer,
      payer,
      TOKEN_PROGRAM_ID
    )
  );
  
  // Get associated token account
  const associatedToken = await getAssociatedTokenAddress(
    mint,
    payer,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  
  // Create associated token account
  transaction.add(
    createAssociatedTokenAccountInstruction(
      payer,
      associatedToken,
      payer,
      mint,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
  );
  
  // Sign and send transaction
  transaction.feePayer = payer;
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;
  
  const signedTx = await signTransaction(transaction);
  const txid = await connection.sendRawTransaction(signedTx.serialize());
  await connection.confirmTransaction(txid);
  
  return mint.toBase58();
};

export const mintToken = async (
  connection: Connection,
  payer: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  mint: PublicKey,
  amount: number
) => {
  const mintInfo = await getMint(connection, mint);
  const associatedToken = await getAssociatedTokenAddress(
    mint,
    payer,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  
  const transaction = new Transaction().add(
    createMintToInstruction(
      mint,
      associatedToken,
      payer,
      amount * Math.pow(10, mintInfo.decimals)
    )
  );
  
  transaction.feePayer = payer;
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;
  
  const signedTx = await signTransaction(transaction);
  const txid = await connection.sendRawTransaction(signedTx.serialize());
  await connection.confirmTransaction(txid);
};

export const sendTokens = async (
  connection: Connection,
  payer: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  mintAddress: string,
  recipient: PublicKey,
  amount: number
) => {
  const mint = new PublicKey(mintAddress);
  const mintInfo = await getMint(connection, mint);
  
  const sourceAccount = await getAssociatedTokenAddress(
    mint,
    payer,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  
  const destinationAccount = await getAssociatedTokenAddress(
    mint,
    recipient,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  
  const transaction = new Transaction();
  
  // Create destination account if it doesn't exist
  try {
    await getAccount(connection, destinationAccount);
  } catch {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        payer,
        destinationAccount,
        recipient,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }
  
  // Transfer tokens
  transaction.add(
    createTransferInstruction(
      sourceAccount,
      destinationAccount,
      payer,
      amount * Math.pow(10, mintInfo.decimals)
    )
  );
  
  transaction.feePayer = payer;
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash()
  ).blockhash;
  
  const signedTx = await signTransaction(transaction);
  const txid = await connection.sendRawTransaction(signedTx.serialize());
  await connection.confirmTransaction(txid);
};

export const getTokenAccounts = async (
  connection: Connection,
  owner: PublicKey
) => {
  const accounts = await connection.getParsedTokenAccountsByOwner(owner, {
    programId: TOKEN_PROGRAM_ID,
  });
  
  return accounts.value.map((account) => {
    const parsedInfo = account.account.data.parsed.info;
    return {
      mint: parsedInfo.mint,
      balance: parsedInfo.tokenAmount.uiAmount,
      decimals: parsedInfo.tokenAmount.decimals,
      symbol: parsedInfo.mint.slice(0, 4),
    };
  });
};