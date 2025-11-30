import { useState, useEffect } from 'react';
import { useAccount, useSignMessage, useReadContract, useConfig, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { readContract } from '@wagmi/core';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { User, BookOpen, Edit2, Save, X, DollarSign, TrendingUp, Wallet, Calculator, History, Clock } from 'lucide-react';
import { API_URL, CONTRACTS, COURSE_MANAGER_ABI, YD_TOKEN_ABI, AAVE_INTEGRATION_ABI } from '../config/contracts';
import { formatEther, parseEther } from 'viem';

export default function Profile() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const config = useConfig();

  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createdCourses, setCreatedCourses] = useState([]);
  const [loadingCreated, setLoadingCreated] = useState(true);
  const [withdrawingCourseId, setWithdrawingCourseId] = useState(null);
  const [transferringToAave, setTransferringToAave] = useState(null);
  const [calculatorAmount, setCalculatorAmount] = useState('1000');
  const [calculatorDays, setCalculatorDays] = useState('365');

  // 读取用户购买记录
  const { data: purchases } = useReadContract({
    address: CONTRACTS.COURSE_MANAGER,
    abi: COURSE_MANAGER_ABI,
    functionName: 'getUserPurchases',
    args: [address],
  });

  // 读取课程总数
  const { data: courseCount } = useReadContract({
    address: CONTRACTS.COURSE_MANAGER,
    abi: COURSE_MANAGER_ABI,
    functionName: 'courseCount',
  });

  // 读取 AAVE 合约中的 YD 余额
  const { data: aaveYDBalance } = useReadContract({
    address: CONTRACTS.AAVE_INTEGRATION,
    abi: AAVE_INTEGRATION_ABI,
    functionName: 'getYDBalance',
  });

  // 读取年化收益率
  const { data: annualYieldRate } = useReadContract({
    address: CONTRACTS.AAVE_INTEGRATION,
    abi: AAVE_INTEGRATION_ABI,
    functionName: 'annualYieldRate',
  });

  // 读取用户质押信息
  const { data: userStakeInfo, refetch: refetchStakeInfo } = useReadContract({
    address: CONTRACTS.AAVE_INTEGRATION,
    abi: AAVE_INTEGRATION_ABI,
    functionName: 'getUserStakeInfo',
    args: [address],
  });

  // 提取收益的合约调用
  const { data: withdrawHash, writeContract: withdrawRevenue } = useWriteContract();

  const { isLoading: isWithdrawing, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  // 转账到 AAVE 的合约调用
  const { data: transferHash, writeContract: transferToAave } = useWriteContract();

  const { isLoading: isTransferring, isSuccess: isTransferSuccess } = useWaitForTransactionReceipt({
    hash: transferHash,
  });

  useEffect(() => {
    if (isConnected && address) {
      loadProfile();
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (purchases && purchases.length > 0) {
      loadPurchasedCourses();
    } else {
      setLoading(false);
    }
  }, [purchases]);

  useEffect(() => {
    if (courseCount !== undefined && address) {
      loadCreatedCourses();
    } else if (courseCount === undefined && address) {
      // 如果courseCount还未加载完成，保持加载状态
      setLoadingCreated(true);
    }
  }, [courseCount, address]);

  // 提取成功后重新加载课程收益
  useEffect(() => {
    if (isWithdrawSuccess) {
      loadCreatedCourses();
      setWithdrawingCourseId(null);
      alert('收益提取成功！');
    }
  }, [isWithdrawSuccess]);

  // 转账到理财合约成功后的处理
  useEffect(() => {
    if (isTransferSuccess) {
      setTransferringToAave(null);
      refetchStakeInfo();
      loadCreatedCourses();
      alert('收益已成功存入理财账户！开始赚取 ' + (annualYieldRate ? (Number(annualYieldRate) / 100).toFixed(2) : '5.00') + '% 年化收益。');
    }
  }, [isTransferSuccess]);

  const loadProfile = async () => {
    try {
      // 检查 API_URL 是否配置
      if (!API_URL) {
        console.warn('API_URL not configured, using default profile');
        setProfile({ address, name: '', createdAt: new Date() });
        return;
      }

      const response = await axios.get(`${API_URL}/users/${address}`);
      setProfile(response.data);
      setNewName(response.data.name || '');
    } catch (error) {
      console.error('Load profile error:', error);

      // 如果用户不存在（404）或后端不可用，创建默认用户对象
      if (error.response?.status === 404 || error.code === 'ERR_NETWORK' || !error.response) {
        console.log('Creating default profile for address:', address);
        setProfile({ address, name: '', createdAt: new Date() });
      } else {
        // 其他错误也创建默认对象，但记录警告
        console.warn('Unexpected error loading profile, using default:', error.message);
        setProfile({ address, name: '', createdAt: new Date() });
      }
    }
  };

  const loadPurchasedCourses = async () => {
    try {
      setLoading(true);
      const coursesData = [];

      for (const purchase of purchases) {
        const courseId = Number(purchase.courseId);

        const course = await readContract(config, {
          address: CONTRACTS.COURSE_MANAGER,
          abi: COURSE_MANAGER_ABI,
          functionName: 'getCourse',
          args: [courseId],
        });

        coursesData.push({
          id: courseId,
          title: course.title,
          description: course.description,
          priceInYD: formatEther(course.priceInYD),
          purchasedAt: Number(purchase.purchasedAt),
        });
      }

      setPurchasedCourses(coursesData);
    } catch (error) {
      console.error('Load courses error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCreatedCourses = async () => {
    try {
      setLoadingCreated(true);
      const coursesData = [];
      const count = Number(courseCount);

      for (let i = 1; i <= count; i++) {
        const course = await readContract(config, {
          address: CONTRACTS.COURSE_MANAGER,
          abi: COURSE_MANAGER_ABI,
          functionName: 'getCourse',
          args: [i],
        });

        // 只获取当前用户创建的课程
        if (course.author.toLowerCase() === address.toLowerCase()) {
          // 获取该课程的收益
          const revenue = await readContract(config, {
            address: CONTRACTS.COURSE_MANAGER,
            abi: COURSE_MANAGER_ABI,
            functionName: 'courseRevenue',
            args: [i],
          });

          coursesData.push({
            id: Number(course.id),
            title: course.title,
            description: course.description,
            priceInYD: formatEther(course.priceInYD),
            totalEnrolled: Number(course.totalEnrolled),
            revenue: formatEther(revenue),
          });
        }
      }

      setCreatedCourses(coursesData);
    } catch (error) {
      console.error('Load created courses error:', error);
    } finally {
      setLoadingCreated(false);
    }
  };

  const handleWithdrawRevenue = async (courseId) => {
    try {
      setWithdrawingCourseId(courseId);
      withdrawRevenue({
        address: CONTRACTS.COURSE_MANAGER,
        abi: COURSE_MANAGER_ABI,
        functionName: 'withdrawCourseRevenue',
        args: [courseId],
      });
    } catch (error) {
      console.error('Withdraw revenue error:', error);
      alert('提取失败：' + error.message);
      setWithdrawingCourseId(null);
    }
  };

  const handleWithdrawToAave = async (courseId, revenueAmount) => {
    if (!CONTRACTS.AAVE_INTEGRATION) {
      alert('理财合约地址未配置，请检查环境变量 VITE_AAVE_INTEGRATION_ADDRESS');
      return;
    }

    try {
      setTransferringToAave(courseId);

      // 先提取收益到用户钱包
      withdrawRevenue({
        address: CONTRACTS.COURSE_MANAGER,
        abi: COURSE_MANAGER_ABI,
        functionName: 'withdrawCourseRevenue',
        args: [courseId],
      });

      // 等待提取交易确认后，再授权并质押
      // 注意：这里使用简化方式，实际需要监听交易状态
      alert('步骤 1/3：正在提取收益到钱包...');

      setTimeout(() => {
        alert('步骤 2/3：请授权 AAVE 合约使用您的 YD Token');
        // 授权 AAVE 合约
        transferToAave({
          address: CONTRACTS.YD_TOKEN,
          abi: YD_TOKEN_ABI,
          functionName: 'approve',
          args: [CONTRACTS.AAVE_INTEGRATION, parseEther(revenueAmount)],
        });

        setTimeout(() => {
          alert('步骤 3/3：正在将 YD Token 质押到理财合约...');
          // 质押到 AAVE
          transferToAave({
            address: CONTRACTS.AAVE_INTEGRATION,
            abi: AAVE_INTEGRATION_ABI,
            functionName: 'stakeYD',
            args: [parseEther(revenueAmount)],
          });
        }, 3000);
      }, 3000);

    } catch (error) {
      console.error('Withdraw to AAVE error:', error);
      alert('操作失败：' + error.message);
      setTransferringToAave(null);
    }
  };

  // 领取理财收益
  const handleClaimReward = async () => {
    try {
      transferToAave({
        address: CONTRACTS.AAVE_INTEGRATION,
        abi: AAVE_INTEGRATION_ABI,
        functionName: 'claimReward',
      });
    } catch (error) {
      console.error('Claim reward error:', error);
      alert('领取失败：' + error.message);
    }
  };

  // 赎回理财本金和收益
  const handleUnstake = async () => {
    if (!confirm('确定要赎回全部理财本金和收益吗？赎回后将停止赚取利息。')) {
      return;
    }

    try {
      transferToAave({
        address: CONTRACTS.AAVE_INTEGRATION,
        abi: AAVE_INTEGRATION_ABI,
        functionName: 'unstake',
      });
    } catch (error) {
      console.error('Unstake error:', error);
      alert('赎回失败：' + error.message);
    }
  };

  // 计算预期收益
  const calculateExpectedReward = () => {
    const amount = parseFloat(calculatorAmount) || 0;
    const days = parseInt(calculatorDays) || 0;
    const rate = annualYieldRate ? Number(annualYieldRate) / 10000 : 0.05;

    // 收益 = 本金 * 年化收益率 * (天数 / 365)
    const reward = amount * rate * (days / 365);
    return reward.toFixed(4);
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      alert('请输入名称');
      return;
    }

    try {
      // 检查后端是否可用
      if (!API_URL) {
        // 后端不可用，仅在前端更新
        console.warn('Backend not available, updating name locally only');
        setProfile({ ...profile, name: newName });
        setIsEditing(false);
        alert('名称已更新（仅本地保存，后端服务不可用）');
        return;
      }

      // 生成签名消息
      const message = `更新名称为: ${newName}\n时间戳: ${Date.now()}`;

      // 请求用户签名
      const signature = await signMessageAsync({ message });

      // 发送到后端验证
      await axios.post(`${API_URL}/users/${address}/update-name`, {
        name: newName,
        message,
        signature,
      });

      setProfile({ ...profile, name: newName });
      setIsEditing(false);
      alert('名称更新成功！');
    } catch (error) {
      console.error('Update name error:', error);

      // 如果是网络错误，允许本地更新
      if (error.code === 'ERR_NETWORK' || !error.response) {
        setProfile({ ...profile, name: newName });
        setIsEditing(false);
        alert('后端服务不可用，名称已保存到本地');
      } else {
        alert('更新失败：' + (error.response?.data?.error || error.message));
      }
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <User className="h-20 w-20 text-blue-400 mx-auto mb-6" />
        <h2 className="text-3xl font-bold mb-4">个人中心</h2>
        <p className="text-gray-300 mb-8">
          请先连接钱包查看个人信息
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-400 mt-4">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="text-center mb-8">
        <User className="h-16 w-16 text-blue-400 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4 gradient-text">个人中心</h1>
      </div>

      {/* Profile Card */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-6">个人信息</h2>

        {/* Avatar */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-white" />
          </div>
          <div>
            <p className="text-gray-300 text-sm">钱包地址</p>
            <p className="font-mono">
              {address.slice(0, 10)}...{address.slice(-8)}
            </p>
          </div>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">昵称</label>
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input-field flex-1"
                placeholder="输入您的昵称"
              />
              <button
                onClick={handleUpdateName}
                className="btn-primary px-4 py-2"
              >
                <Save className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setNewName(profile.name || '');
                }}
                className="btn-secondary px-4 py-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-lg">
                {profile.name || '未设置'}
              </span>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
              >
                <Edit2 className="h-4 w-4" />
                <span>编辑</span>
              </button>
            </div>
          )}
          <p className="text-gray-400 text-sm mt-2">
            通过 MetaMask 签名验证身份后可修改
          </p>
        </div>
      </div>

      {/* AAVE 理财信息 */}
      {CONTRACTS.AAVE_INTEGRATION && (
        <div className="card mb-8 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <Wallet className="h-6 w-6 text-purple-400" />
            <span>我的理财账户</span>
          </h2>

          {/* 理财统计 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* 质押金额 */}
            <div className="bg-white/5 rounded-lg p-4 border border-purple-500/20">
              <p className="text-sm text-gray-400 mb-1">质押本金</p>
              <p className="text-2xl font-bold text-purple-400">
                {userStakeInfo && userStakeInfo[4]
                  ? formatEther(userStakeInfo[0])
                  : '0.00'} YD
              </p>
              {userStakeInfo && userStakeInfo[4] && userStakeInfo[2] && (
                <p className="text-xs text-gray-500 mt-1">
                  质押于 {new Date(Number(userStakeInfo[2]) * 1000).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* 待领取收益 */}
            <div className="bg-white/5 rounded-lg p-4 border border-green-500/20">
              <p className="text-sm text-gray-400 mb-1">待领取收益</p>
              <p className="text-2xl font-bold text-green-400">
                {userStakeInfo && userStakeInfo[4]
                  ? formatEther(userStakeInfo[3])
                  : '0.00'} YD
              </p>
              <p className="text-xs text-gray-500 mt-1">
                实时累计中...
              </p>
            </div>

            {/* 年化收益率 */}
            <div className="bg-white/5 rounded-lg p-4 border border-blue-500/20">
              <p className="text-sm text-gray-400 mb-1">年化收益率 (APY)</p>
              <p className="text-2xl font-bold text-blue-400">
                {annualYieldRate ? (Number(annualYieldRate) / 100).toFixed(2) : '5.00'}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                复利计息
              </p>
            </div>
          </div>

          {/* 操作按钮 */}
          {userStakeInfo && userStakeInfo[4] && (
            <div className="flex items-center space-x-3">
              <button
                onClick={handleClaimReward}
                disabled={!userStakeInfo[3] || Number(userStakeInfo[3]) === 0}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                  !userStakeInfo[3] || Number(userStakeInfo[3]) === 0
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                领取收益（复利）
              </button>

              <button
                onClick={handleUnstake}
                className="flex-1 px-4 py-2 rounded-lg font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors"
              >
                赎回本金+收益
              </button>
            </div>
          )}

          {/* 合约信息 */}
          <div className="mt-6 pt-4 border-t border-white/10 text-sm text-gray-400 flex items-center justify-between">
            <div>
              <p>理财合约总锁仓</p>
              <p className="font-mono text-purple-400 font-bold">
                {aaveYDBalance ? formatEther(aaveYDBalance) : '0.00'} YD
              </p>
            </div>
            <div className="text-right">
              <p>合约地址</p>
              <p className="font-mono text-xs">
                {CONTRACTS.AAVE_INTEGRATION.slice(0, 10)}...{CONTRACTS.AAVE_INTEGRATION.slice(-8)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 质押活动概览 */}
      {CONTRACTS.AAVE_INTEGRATION && userStakeInfo && userStakeInfo[4] && (
        <div className="card mb-8 bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-green-500/30">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <History className="h-6 w-6 text-green-400" />
            <span>理财活动概览</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 质押时长 */}
            <div className="bg-white/5 rounded-lg p-4 border border-green-500/20">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-green-400" />
                <p className="text-sm text-gray-400">质押时长</p>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {(() => {
                  const stakedAt = Number(userStakeInfo[2]);
                  const now = Math.floor(Date.now() / 1000);
                  const days = Math.floor((now - stakedAt) / 86400);
                  return days > 0 ? `${days} 天` : '< 1 天';
                })()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                开始日期: {new Date(Number(userStakeInfo[2]) * 1000).toLocaleDateString()}
              </p>
            </div>

            {/* 累计收益 */}
            <div className="bg-white/5 rounded-lg p-4 border border-green-500/20">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <p className="text-sm text-gray-400">当前总收益</p>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {formatEther(userStakeInfo[3])} YD
              </p>
              <p className="text-xs text-gray-500 mt-1">
                收益率: {annualYieldRate ? (Number(annualYieldRate) / 100).toFixed(2) : '5.00'}% APY
              </p>
            </div>

            {/* 总资产 */}
            <div className="bg-white/5 rounded-lg p-4 border border-green-500/20">
              <div className="flex items-center space-x-2 mb-2">
                <Wallet className="h-5 w-5 text-green-400" />
                <p className="text-sm text-gray-400">总资产（含收益）</p>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {(() => {
                  const principal = Number(formatEther(userStakeInfo[0]));
                  const reward = Number(formatEther(userStakeInfo[3]));
                  return (principal + reward).toFixed(4);
                })()} YD
              </p>
              <p className="text-xs text-gray-500 mt-1">
                本金 + 累计收益
              </p>
            </div>
          </div>

          {/* 提示信息 */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-gray-300">
            <p className="flex items-start space-x-2">
              <span className="text-blue-400 mt-0.5">ℹ️</span>
              <span>
                收益每秒实时累计，点击"领取收益"会将收益自动加入本金进行复利计息，无需手动操作。
                赎回时会自动结算所有收益。
              </span>
            </p>
          </div>
        </div>
      )}

      {/* 收益计算器 */}
      {CONTRACTS.AAVE_INTEGRATION && annualYieldRate && (
        <div className="card mb-8 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-blue-500/30">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <Calculator className="h-6 w-6 text-blue-400" />
            <span>收益计算器</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 输入区域 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  质押金额 (YD)
                </label>
                <input
                  type="number"
                  value={calculatorAmount}
                  onChange={(e) => setCalculatorAmount(e.target.value)}
                  className="input-field w-full"
                  placeholder="输入质押金额"
                  min="0"
                  step="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  质押天数
                </label>
                <input
                  type="number"
                  value={calculatorDays}
                  onChange={(e) => setCalculatorDays(e.target.value)}
                  className="input-field w-full"
                  placeholder="输入质押天数"
                  min="1"
                  step="1"
                />
                <div className="flex items-center space-x-2 mt-2">
                  <button
                    onClick={() => setCalculatorDays('30')}
                    className="px-3 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    30天
                  </button>
                  <button
                    onClick={() => setCalculatorDays('90')}
                    className="px-3 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    90天
                  </button>
                  <button
                    onClick={() => setCalculatorDays('180')}
                    className="px-3 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    180天
                  </button>
                  <button
                    onClick={() => setCalculatorDays('365')}
                    className="px-3 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    1年
                  </button>
                </div>
              </div>
            </div>

            {/* 结果显示 */}
            <div className="bg-white/5 rounded-lg p-6 border border-blue-500/20">
              <p className="text-sm text-gray-400 mb-2">预期收益</p>
              <p className="text-4xl font-bold text-green-400 mb-4">
                {calculateExpectedReward()} YD
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">本金</span>
                  <span className="text-white font-semibold">{calculatorAmount} YD</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">收益</span>
                  <span className="text-green-400 font-semibold">+{calculateExpectedReward()} YD</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-gray-400">到期总额</span>
                  <span className="text-blue-400 font-bold">
                    {(parseFloat(calculatorAmount) + parseFloat(calculateExpectedReward())).toFixed(4)} YD
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">
                <p>• 年化收益率: {(Number(annualYieldRate) / 100).toFixed(2)}%</p>
                <p>• 计息方式: 复利（每次领取收益会自动加入本金）</p>
                <p>• 收益每秒实时累计</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Created Courses & Revenue */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">我的创作</h2>
          <div className="flex items-center space-x-2 text-gray-300">
            <TrendingUp className="h-5 w-5" />
            <span>{createdCourses.length} 门课程</span>
          </div>
        </div>

        {loadingCreated ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : createdCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">您还没有创建任何课程</p>
            <Link to="/create-course" className="btn-primary inline-block">
              创建课程
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {createdCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <Link to={`/courses/${course.id}`} className="hover:text-blue-400">
                      <h3 className="text-lg font-bold mb-2">{course.title}</h3>
                    </Link>
                    <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                      {course.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>价格: {course.priceInYD} YD</span>
                      <span>学员: {course.totalEnrolled} 人</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-green-400" />
                      <div>
                        <p className="text-xs text-gray-400">可提取收益</p>
                        <p className="text-lg font-bold text-green-400">
                          {course.revenue} YD
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleWithdrawRevenue(course.id)}
                      disabled={
                        parseFloat(course.revenue) === 0 ||
                        withdrawingCourseId === course.id ||
                        isWithdrawing ||
                        transferringToAave === course.id
                      }
                      className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                        parseFloat(course.revenue) === 0
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : withdrawingCourseId === course.id || isWithdrawing
                          ? 'bg-blue-600 text-white cursor-wait'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {withdrawingCourseId === course.id || isWithdrawing
                        ? '提取中...'
                        : parseFloat(course.revenue) === 0
                        ? '暂无收益'
                        : '提取到钱包'}
                    </button>

                    <button
                      onClick={() => handleWithdrawToAave(course.id, course.revenue)}
                      disabled={
                        parseFloat(course.revenue) === 0 ||
                        transferringToAave === course.id ||
                        isTransferring ||
                        withdrawingCourseId === course.id ||
                        !CONTRACTS.AAVE_INTEGRATION
                      }
                      className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-1 ${
                        parseFloat(course.revenue) === 0 || !CONTRACTS.AAVE_INTEGRATION
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : transferringToAave === course.id || isTransferring
                          ? 'bg-purple-600 text-white cursor-wait'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                      title={!CONTRACTS.AAVE_INTEGRATION ? '理财合约未配置' : ''}
                    >
                      <Wallet className="h-4 w-4" />
                      <span>
                        {transferringToAave === course.id || isTransferring
                          ? '转入中...'
                          : '转入理财'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Purchased Courses */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">我的课程</h2>
          <div className="flex items-center space-x-2 text-gray-300">
            <BookOpen className="h-5 w-5" />
            <span>{purchasedCourses.length} 门课程</span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : purchasedCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">您还没有购买任何课程</p>
            <Link to="/courses" className="btn-primary inline-block">
              浏览课程
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {purchasedCourses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="block"
              >
                <div className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors border border-white/10 hover:border-white/20">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2">{course.title}</h3>
                      <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                        {course.description}
                      </p>
                      <p className="text-gray-400 text-xs">
                        购买于 {new Date(course.purchasedAt * 1000).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-4 text-green-400 font-bold">
                      {course.priceInYD} YD
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
