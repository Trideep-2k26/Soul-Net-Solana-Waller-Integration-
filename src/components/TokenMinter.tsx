import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { mintToken } from '../utils/token';
import toast from 'react-hot-toast';

const TokenMinter = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [mintAddress, setMintAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!publicKey || !signTransaction) return;

    setLoading(true);
    try {
      const mint = new PublicKey(mintAddress);
      await mintToken(connection, publicKey, signTransaction, mint, Number(amount));
      toast.success('Tokens minted successfully!');
      setMintAddress('');
      setAmount('');
    } catch (error) {
      toast.error('Failed to mint tokens. Please try again.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Token Mint Address</label>
        <input
          type="text"
          value={mintAddress}
          onChange={(e) => setMintAddress(e.target.value)}
          className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
          className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg transition-all duration-300 ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Minting Tokens...' : 'Mint Tokens'}
      </button>
    </form>
  );
};

export default TokenMinter;