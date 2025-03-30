import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getTransactionHistory } from '../utils/solana';
import { ExternalLink } from 'lucide-react';

const TransactionHistory = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (publicKey) {
      loadTransactions();
    }
  }, [publicKey, connection]);

  const loadTransactions = async () => {
    if (!publicKey) return;
    setLoading(true);
    try {
      const history = await getTransactionHistory(connection, publicKey);
      setTransactions(history);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
    setLoading(false);
  };

  const getExplorerUrl = (signature) => {
    return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Recent Transactions</h2>
        <button
          onClick={loadTransactions}
          className="text-purple-400 hover:text-purple-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      {transactions.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No transactions found</p>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div
              key={tx.signature}
              className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-mono text-sm text-gray-400">
                    {tx.signature.slice(0, 20)}...
                  </p>
                  <p className="mt-1 text-sm">
                    {new Date(tx.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
                <a
                  href={getExplorerUrl(tx.signature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
              <div className="mt-2">
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    tx.status === 'success'
                      ? 'bg-green-900 text-green-300'
                      : 'bg-red-900 text-red-300'
                  }`}
                >
                  {tx.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;