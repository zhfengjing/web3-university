import { Link } from 'react-router-dom';
import { BookOpen, Coins, Shield, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-20 animate-fadeIn">
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-6xl font-bold mb-6">
          <span className="gradient-text">Web3 University</span>
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          去中心化学习平台，使用区块链技术，让知识传播更透明、更公平
        </p>
        <div className="flex items-center justify-center space-x-4">
          <Link to="/courses" className="btn-primary">
            浏览课程
          </Link>
          <Link to="/create-course" className="btn-secondary">
            创建课程
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">优质课程</h3>
          <p className="text-gray-300 text-sm">
            区块链、Web3、加密货币等前沿技术课程
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Coins className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">代币经济</h3>
          <p className="text-gray-300 text-sm">
            使用YD代币购买课程，享受去中心化支付
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">安全可靠</h3>
          <p className="text-gray-300 text-sm">
            基于以太坊智能合约，交易透明可追溯
          </p>
        </div>

        <div className="card text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">AAVE理财</h3>
          <p className="text-gray-300 text-sm">
            平台收益自动质押到AAVE，获得额外收益
          </p>
        </div>
      </section>

      {/* How it Works */}
      <section>
        <h2 className="text-4xl font-bold text-center mb-12 gradient-text">
          如何开始
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-bold mb-2">连接钱包</h3>
            <p className="text-gray-300">
              使用MetaMask连接到平台，开启Web3学习之旅
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-bold mb-2">购买YD代币</h3>
            <p className="text-gray-300">
              使用ETH购买YD代币，准备购买课程
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-bold mb-2">学习课程</h3>
            <p className="text-gray-300">
              浏览课程，使用YD代币购买，开始学习
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="card text-center py-12">
        <h2 className="text-3xl font-bold mb-4 gradient-text">
          准备好开始了吗？
        </h2>
        <p className="text-gray-300 mb-8">
          立即连接钱包，探索Web3学习的无限可能
        </p>
        <Link to="/courses" className="btn-primary inline-block">
          立即开始
        </Link>
      </section>
    </div>
  );
}
