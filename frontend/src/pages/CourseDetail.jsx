import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { BookOpen, User, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { CONTRACTS, COURSE_MANAGER_ABI, YD_TOKEN_ABI } from '../config/contracts';

export default function CourseDetail() {
  const { id } = useParams();
  const { address, isConnected } = useAccount();
  const [course, setCourse] = useState(null);
  const [isApproving, setIsApproving] = useState(false);

  // 读取课程详情
  const { data: courseData } = useReadContract({
    address: CONTRACTS.COURSE_MANAGER,
    abi: COURSE_MANAGER_ABI,
    functionName: 'getCourse',
    args: [BigInt(id)],
  });

  // 检查是否已购买
  const { data: hasPurchased, refetch: refetchPurchaseStatus } = useReadContract({
    address: CONTRACTS.COURSE_MANAGER,
    abi: COURSE_MANAGER_ABI,
    functionName: 'checkPurchase',
    args: [address, BigInt(id)],
  });

  // 读取用户YD余额
  const { data: balance } = useReadContract({
    address: CONTRACTS.YD_TOKEN,
    abi: YD_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  // 读取授权额度
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.YD_TOKEN,
    abi: YD_TOKEN_ABI,
    functionName: 'allowance',
    args: [address, CONTRACTS.COURSE_MANAGER],
  });

  // 授权操作
  const { data: approveHash, writeContract: approve, isPending: isApprovePending } = useWriteContract();

  const { isLoading: isApproveConfirming } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // 购买操作
  const { data: purchaseHash, writeContract: purchase, isPending: isPurchasePending } = useWriteContract();

  const { isLoading: isPurchaseConfirming, isSuccess: isPurchaseSuccess } = useWaitForTransactionReceipt({
    hash: purchaseHash,
  });

  useEffect(() => {
    if (courseData) {
      setCourse({
        id: Number(courseData.id),
        title: courseData.title,
        description: courseData.description,
        author: courseData.author,
        priceInYD: courseData.priceInYD,
        totalEnrolled: Number(courseData.totalEnrolled),
        isActive: courseData.isActive,
        createdAt: Number(courseData.createdAt),
      });
    }
  }, [courseData]);

  useEffect(() => {
    if (isApproveConfirming === false && approveHash) {
      refetchAllowance();
      setIsApproving(false);
    }
  }, [isApproveConfirming, approveHash]);

  useEffect(() => {
    if (isPurchaseSuccess) {
      refetchPurchaseStatus();
    }
  }, [isPurchaseSuccess]);

  const handleApprove = async () => {
    if (!course) return;

    try {
      setIsApproving(true);
      approve({
        address: CONTRACTS.YD_TOKEN,
        abi: YD_TOKEN_ABI,
        functionName: 'approve',
        args: [CONTRACTS.COURSE_MANAGER, course.priceInYD],
      });
    } catch (error) {
      console.error('Approve error:', error);
      alert('授权失败：' + error.message);
      setIsApproving(false);
    }
  };

  const handlePurchase = async () => {
    try {
      purchase({
        address: CONTRACTS.COURSE_MANAGER,
        abi: COURSE_MANAGER_ABI,
        functionName: 'purchaseCourse',
        args: [BigInt(id)],
      });
    } catch (error) {
      console.error('Purchase error:', error);
      alert('购买失败：' + error.message);
    }
  };

  if (!course) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-400 mt-4">加载中...</p>
      </div>
    );
  }

  const priceInYD = formatEther(course.priceInYD);
  const userBalance = balance ? formatEther(balance) : '0';
  const hasEnoughBalance = balance && balance >= course.priceInYD;
  const isApproved = allowance && allowance >= course.priceInYD;
  const isOwner = address?.toLowerCase() === course.author.toLowerCase();

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      {/* Back Button */}
      <Link
        to="/courses"
        className="inline-flex items-center space-x-2 text-gray-300 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
        <span>返回课程列表</span>
      </Link>

      {/* Course Header */}
      <div className="card mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
            <div className="flex items-center space-x-6 text-gray-300">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>{course.totalEnrolled} 学生</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>{new Date(course.createdAt * 1000).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-400">
              {priceInYD} YD
            </div>
          </div>
        </div>

        {/* Purchase Status */}
        {isConnected && (
          <div className="border-t border-white/10 pt-6">
            {hasPurchased ? (
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle className="h-6 w-6" />
                <span className="text-lg font-semibold">您已购买此课程</span>
              </div>
            ) : isOwner ? (
              <div className="text-blue-400">
                <span className="text-lg font-semibold">这是您创建的课程</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">您的YD余额：</span>
                  <span className={hasEnoughBalance ? 'text-green-400' : 'text-red-400'}>
                    {userBalance} YD
                  </span>
                </div>

                {!hasEnoughBalance ? (
                  <div className="space-y-2">
                    <p className="text-red-400 text-sm">余额不足，请先购买YD代币</p>
                    <Link to="/buy-tokens" className="btn-primary block text-center">
                      购买YD代币
                    </Link>
                  </div>
                ) : !isApproved ? (
                  <button
                    onClick={handleApprove}
                    disabled={isApprovePending || isApproveConfirming}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {isApprovePending || isApproveConfirming ? '授权中...' : '授权YD代币'}
                  </button>
                ) : (
                  <button
                    onClick={handlePurchase}
                    disabled={isPurchasePending || isPurchaseConfirming}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {isPurchasePending || isPurchaseConfirming ? '购买中...' : '购买课程'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Course Content */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-4">课程介绍</h2>
        <p className="text-gray-300 whitespace-pre-wrap">{course.description}</p>
      </div>

      {/* Author Info */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">作者信息</h2>
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-gray-300 text-sm">作者地址</p>
            <p className="font-mono text-sm">
              {course.author.slice(0, 6)}...{course.author.slice(-4)}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Status */}
      {(approveHash || purchaseHash) && (
        <div className="mt-8 card">
          {approveHash && (
            <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-blue-400 text-sm">
                授权交易已提交！
                <a
                  href={`https://sepolia.etherscan.io/tx/${approveHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline ml-2"
                >
                  查看交易
                </a>
              </p>
            </div>
          )}
          {purchaseHash && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-400 text-sm">
                购买交易已提交！
                <a
                  href={`https://sepolia.etherscan.io/tx/${purchaseHash}`}
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
      )}
    </div>
  );
}
