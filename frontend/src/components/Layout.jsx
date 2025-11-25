import { Link, Outlet, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { BookOpen, Home, PlusCircle, User, Coins } from 'lucide-react';
import NetworkSwitcher from './NetworkSwitcher';
import NetworkWarning from './NetworkWarning';

export default function Layout() {
  const location = useLocation();

  // 判断链接是否为当前活跃路由
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // 获取导航链接的样式类
  const getLinkClass = (path) => {
    const baseClass = "flex items-center space-x-1.5 transition-all duration-300 whitespace-nowrap px-3 py-2 rounded-lg outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50";
    const activeClass = "bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg";
    const inactiveClass = "text-gray-300 hover:text-white hover:bg-white/5";

    return `${baseClass} ${isActive(path) ? activeClass : inactiveClass}`;
  };

  return (
    <div className="min-h-screen">
      {/* Network Warning Banner */}
      <NetworkWarning />

      {/* Navigation */}
      <nav className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-4 h-16">
            {/* Logo + Navigation Links - 左侧 */}
            <div className="flex items-center space-x-8 flex-1">
              {/* Logo */}
              <Link to="/" className="flex items-center space-x-2 flex-shrink-0 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded-lg">
                <BookOpen className="h-8 w-8 text-blue-400" />
                <span className="text-xl lg:text-2xl font-bold gradient-text whitespace-nowrap">Web3 University</span>
              </Link>

              {/* Navigation Links */}
              <div className="hidden lg:flex items-center space-x-2">
                <Link
                  to="/"
                  className={getLinkClass('/')}
                >
                  <Home className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">首页</span>
                </Link>
                <Link
                  to="/courses"
                  className={getLinkClass('/courses')}
                >
                  <BookOpen className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">课程</span>
                </Link>
                <Link
                  to="/create-course"
                  className={getLinkClass('/create-course')}
                >
                  <PlusCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">创建课程</span>
                </Link>
                <Link
                  to="/buy-tokens"
                  className={getLinkClass('/buy-tokens')}
                >
                  <Coins className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">购买代币</span>
                </Link>
                <Link
                  to="/profile"
                  className={getLinkClass('/profile')}
                >
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">个人中心</span>
                </Link>
              </div>
            </div>

            {/* Network Switcher & Connect Wallet Button - 右侧 */}
            <div className="flex items-center space-x-2 lg:space-x-3 flex-shrink-0">
              <NetworkSwitcher />
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  mounted,
                }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        style: {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              className="btn-primary"
                              type="button"
                            >
                              Connect Wallet
                            </button>
                          );
                        }

                        return (
                          <button
                            onClick={openAccountModal}
                            className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg border border-white/20 transition-all duration-300"
                            type="button"
                          >
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="font-medium text-white">
                              {account.displayName}
                            </span>
                            {account.displayBalance && (
                              <span className="text-gray-300 text-sm">
                                ({account.displayBalance})
                              </span>
                            )}
                          </button>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white/5 backdrop-blur-lg border-t border-white/10 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">
            <p className="mb-2">Web3 University - 去中心化学习平台</p>
            <p className="text-sm">基于区块链技术的在线教育平台</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
