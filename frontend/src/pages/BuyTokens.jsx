import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Coins, ArrowRight } from 'lucide-react';
import { CONTRACTS, YD_TOKEN_ABI } from '../config/contracts';

export default function BuyTokens() {
  const { address, isConnected } = useAccount();
  const [ethAmount, setEthAmount] = useState('');

  // 读取代币价格
  const { data: tokenPrice } = useReadContract({
    address: CONTRACTS.YD_TOKEN,
    abi: YD_TOKEN_ABI,
    functionName: 'tokenPrice',
  });

  // 读取用户YD余额
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.YD_TOKEN,
    abi: YD_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  // 购买代币
  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  const handleBuyTokens = async (e) => {
    e.preventDefault();

    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      alert('请输入有效的ETH数量');
      return;
    }

    try {
      writeContract({
        address: CONTRACTS.YD_TOKEN,
        abi: YD_TOKEN_ABI,
        functionName: 'buyTokens',
        value: parseEther(ethAmount),
      });
    } catch (error) {
      console.error('Purchase error:', error);
      alert('购买失败：' + error.message);
    }
  };

  // 计算将获得的YD代币数量
  const calculateYDAmount = () => {
    if (!ethAmount || !tokenPrice) return '0';
    try {
      const eth = parseEther(ethAmount);
      const yd = (eth * parseEther('1')) / tokenPrice;
      return formatEther(yd);
    } catch {
      return '0';
    }
  };

  if (isConfirming) {
    refetchBalance();
  }

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <Coins className="h-20 w-20 text-blue-400 mx-auto mb-6" />
        <h2 className="text-3xl font-bold mb-4">购买YD代币</h2>
        <p className="text-gray-300 mb-8">
          请先连接钱包以购买YD代币
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="text-center mb-8">
        <Coins className="h-16 w-16 text-blue-400 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4 gradient-text">购买YD代币</h1>
        <p className="text-gray-300">
          使用ETH购买YD代币，用于购买平台课程
        </p>
      </div>

      {/* Balance Card */}
      <div className="card mb-8">
        <h3 className="text-xl font-bold mb-4">您的余额</h3>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">YD 代币：</span>
          <span className="text-2xl font-bold text-green-400">
            {balance ? formatEther(balance) : '0'} YD
          </span>
        </div>
      </div>

      {/* Buy Form */}
      <div className="card">
        <h3 className="text-xl font-bold mb-6">购买代币</h3>

        <form onSubmit={handleBuyTokens} className="space-y-6">
          {/* Token Price Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">代币价格：</span>
              <span className="font-bold">
                1 YD = {tokenPrice ? formatEther(tokenPrice) : '0.001'} ETH
              </span>
            </div>
          </div>

          {/* ETH Amount Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              支付金额 (ETH)
            </label>
            <input
              type="number"
              step="0.001"
              placeholder="0.0"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Conversion Display */}
          {ethAmount && (
            <div className="flex items-center justify-center space-x-4 py-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {ethAmount} ETH
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-gray-400" />
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {calculateYDAmount()} YD
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || isConfirming}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending || isConfirming ? '处理中...' : '购买代币'}
          </button>
        </form>

        {/* Transaction Status */}
        {hash && (
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-sm">
              交易已提交！
              <a
                href={`https://sepolia.etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline ml-2"
              >
                查看交易
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-8 card">
        <h3 className="text-lg font-bold mb-4">注意事项</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• YD代币用于购买平台上的所有课程</li>
          <li>• 交易将通过智能合约自动执行，安全可靠</li>
          <li>• 请确保钱包中有足够的ETH支付Gas费用</li>
          <li>• 交易确认后，YD代币将自动转入您的钱包</li>
        </ul>
      </div>
    </div>
  );
}
