import React, { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Coins, Send, History, Plus, RefreshCw } from 'lucide-react';
import TokenCreator from './TokenCreator';
import TokenMinter from './TokenMinter';
import TokenSender from './TokenSender';
import TransactionHistory from './TransactionHistory';
import { requestAirdrop } from '../utils/solana';
import toast from 'react-hot-toast';

// Debounce utility function
const debounce = (fn: Function, ms: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

const Dashboard = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState(0);
  const [activeTab, setActiveTab] = useState('create');
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);

  // Debounced balance update function
  const debouncedUpdateBalance = useCallback(
    debounce(async () => {
      if (!publicKey || isUpdatingBalance) return;
      
      setIsUpdatingBalance(true);
      try {
        const balance = await connection.getBalance(publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
      }
      setIsUpdatingBalance(false);
    }, 1000),
    [publicKey, connection, isUpdatingBalance]
  );

  useEffect(() => {
    if (publicKey) {
      debouncedUpdateBalance();
    }
  }, [publicKey, debouncedUpdateBalance]);

  const handleAirdrop = async () => {
    if (!publicKey) return;
    
    try {
      await requestAirdrop(connection, publicKey);
      toast.success('Airdrop successful!');
      debouncedUpdateBalance();
    } catch (error) {
      toast.error('Airdrop failed. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          Welcome to Soul&Net
        </h1>
        <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 transition-all duration-300" />
      </div>

      {publicKey && (
        <div className="bg-gray-800 rounded-lg p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Coins className="text-yellow-400" />
            <span>{balance.toFixed(4)} SOL</span>
          </div>
          <button
            onClick={handleAirdrop}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all duration-300"
          >
            <RefreshCw size={16} />
            Request Airdrop
          </button>
        </div>
      )}

      {publicKey ? (
        <>
          <div className="flex gap-4 mb-8">
            <TabButton
              icon={<Plus size={20} />}
              label="Create Token"
              active={activeTab === 'create'}
              onClick={() => setActiveTab('create')}
            />
            <TabButton
              icon={<Coins size={20} />}
              label="Mint Token"
              active={activeTab === 'mint'}
              onClick={() => setActiveTab('mint')}
            />
            <TabButton
              icon={<Send size={20} />}
              label="Send Token"
              active={activeTab === 'send'}
              onClick={() => setActiveTab('send')}
            />
            <TabButton
              icon={<History size={20} />}
              label="History"
              active={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
            />
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            {activeTab === 'create' && <TokenCreator />}
            {activeTab === 'mint' && <TokenMinter />}
            {activeTab === 'send' && <TokenSender />}
            {activeTab === 'history' && <TransactionHistory />}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-gray-400">Your Ultimate Solana Token Manager! Connect your wallet to get started</p>
        </div>
      )}
    </div>
  );
};

const TabButton = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
      active
        ? 'bg-purple-600 text-white'
        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default Dashboard;