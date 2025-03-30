import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getTokenAccounts, sendTokens } from '../utils/token';
import toast from 'react-hot-toast';

const TokenSender = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [tokenAccounts, setTokenAccounts] = useState([]);
  const [selectedToken, setSelectedToken] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (publicKey) {
      loadTokenAccounts();
    }
  }, [publicKey, connection]);

  const loadTokenAccounts = async () => {
    if (!publicKey) return;
    const accounts = await getTokenAccounts(connection, publicKey);
    setTokenAccounts(accounts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!publicKey || !signTransaction) return;

    setLoading(true);
    try {
      const recipientPubkey = new PublicKey(recipient);
      await sendTokens(
        connection,
        publicKey,
        signTransaction,
        selectedToken,
        recipientPubkey,
        Number(amount)
      );
      toast.success('Tokens sent successfully!');
      setRecipient('');
      setAmount('');
      loadTokenAccounts();
    } catch (error) {
      toast.error('Failed to send tokens. Please try again.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Select Token</label>
        <select
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value)}
          className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          required
        >
          <option value="">Select a token</option>
          {tokenAccounts.map((account) => (
            <option key={account.mint} value={account.mint}>
              {account.symbol} ({account.balance})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Recipient Address</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
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
        {loading ? 'Sending Tokens...' : 'Send Tokens'}
      </button>
    </form>
  );
};

export default TokenSender;