import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { createToken } from '../utils/token';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';

const TokenCreator = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState(9);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!publicKey || !signTransaction) return;

    setLoading(true);
    try {
      const mintAddress = await createToken(
        connection,
        publicKey,
        signTransaction,
        name,
        symbol,
        decimals
      );
      toast.success(`Token created successfully! Mint address: ${mintAddress}`);
      setName('');
      setSymbol('');
      setDecimals(9);
      setImage(null);
    } catch (error) {
      toast.error('Failed to create token. Please try again.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Token Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Token Symbol</label>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Decimals</label>
        <input
          type="number"
          value={decimals}
          onChange={(e) => setDecimals(Number(e.target.value))}
          min="0"
          max="9"
          className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Token Image (Optional)</label>
        <div className="relative">
          <input
            type="file"
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
            id="token-image"
          />
          <label
            htmlFor="token-image"
            className="flex items-center justify-center w-full bg-gray-700 rounded-lg px-4 py-8 cursor-pointer border-2 border-dashed border-gray-600 hover:border-purple-500 transition-all duration-300"
          >
            {image ? (
              <img src={image} alt="Token" className="max-h-32" />
            ) : (
              <div className="text-center">
                <Upload className="mx-auto mb-2" />
                <span className="text-sm text-gray-400">Click to upload image</span>
              </div>
            )}
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg transition-all duration-300 ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Creating Token...' : 'Create Token'}
      </button>
    </form>
  );
};

export default TokenCreator;