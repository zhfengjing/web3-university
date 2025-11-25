import { useAccount, useSwitchChain, useChains } from 'wagmi';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export default function NetworkWarning() {
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const chains = useChains();
  const [dismissed, setDismissed] = useState(false);

  // 检查当前链是否在支持的链列表中
  const isUnsupported = chain && !chains.some(c => c.id === chain.id);

  // 如果网络正常或用户已关闭警告，不显示
  if (!isUnsupported || dismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-red-500/30 animate-fadeIn">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-400 animate-pulse" />
            </div>
            <div>
              <p className="text-white font-semibold">网络错误</p>
              <p className="text-gray-300 text-sm">
                您当前连接的网络不受支持。请切换到 Sepolia 测试网或本地 Hardhat 网络。
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {switchChain && (
              <button
                onClick={() => switchChain({ chainId: 11155111 })} // Sepolia
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200"
              >
                切换到 Sepolia
              </button>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
              aria-label="关闭"
            >
              <X className="h-5 w-5 text-gray-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
