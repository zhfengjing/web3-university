import { useState, useEffect } from 'react';
import { useAccount, useSwitchChain, useChains } from 'wagmi';
import { CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';

export default function NetworkSwitcher() {
  const { isConnected, chain } = useAccount();
  const { switchChain, isPending, variables } = useSwitchChain();
  const chains = useChains();
  const [isOpen, setIsOpen] = useState(false);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.network-switcher')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!isConnected) {
    return null;
  }

  const getNetworkColor = (chainId) => {
    switch (chainId) {
      case 1: // Mainnet
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 11155111: // Sepolia
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 31337: // Hardhat
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getNetworkIcon = (chainId) => {
    // 可以根据不同网络返回不同图标
    return chainId ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />;
  };

  return (
    <div className="network-switcher relative">
      {/* 当前网络显示按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-300 hover:shadow-lg ${
          chain?.unsupported
            ? 'text-red-400 bg-red-500/10 border-red-500/20'
            : getNetworkColor(chain?.id)
        }`}
      >
        {getNetworkIcon(chain?.id)}
        <span className="font-medium">
          {chain?.unsupported ? '不支持的网络' : chain?.name || '未知网络'}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-300 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* 网络切换下拉菜单 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden animate-fadeIn">
          <div className="p-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-gray-300">选择网络</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {chains.map((availableChain) => {
              const isCurrentChain = chain?.id === availableChain.id;
              const isSwitching = isPending && variables?.chainId === availableChain.id;

              return (
                <button
                  key={availableChain.id}
                  onClick={() => {
                    if (!isCurrentChain && switchChain) {
                      switchChain({ chainId: availableChain.id });
                      setIsOpen(false);
                    }
                  }}
                  disabled={isCurrentChain || isSwitching}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-all duration-200 ${
                    isCurrentChain
                      ? 'bg-white/10 cursor-default'
                      : 'hover:bg-white/5 cursor-pointer'
                  } ${isSwitching ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isCurrentChain ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                      }`}
                    />
                    <div className="text-left">
                      <div className="font-medium text-white">
                        {availableChain.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        Chain ID: {availableChain.id}
                      </div>
                    </div>
                  </div>

                  {isCurrentChain && (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  )}
                  {isSwitching && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* 提示信息 */}
          {chain?.unsupported && (
            <div className="p-3 border-t border-white/10 bg-red-500/10">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-400">
                  当前网络不受支持，请切换到支持的网络
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
