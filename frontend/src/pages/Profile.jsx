import { useState, useEffect } from 'react';
import { useAccount, useSignMessage, useReadContract, useConfig, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { readContract } from '@wagmi/core';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { User, BookOpen, Edit2, Save, X, DollarSign, TrendingUp } from 'lucide-react';
import { API_URL, CONTRACTS, COURSE_MANAGER_ABI } from '../config/contracts';
import { formatEther } from 'viem';

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

  // 提取收益的合约调用
  const { data: withdrawHash, writeContract: withdrawRevenue } = useWriteContract();

  const { isLoading: isWithdrawing, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
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
    if (courseCount && address) {
      loadCreatedCourses();
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

  const loadProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/${address}`);
      setProfile(response.data);
      setNewName(response.data.name || '');
    } catch (error) {
      console.error('Load profile error:', error);
      // 如果用户不存在，创建新用户
      if (error.response?.status === 404) {
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

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      alert('请输入名称');
      return;
    }

    try {
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
      alert('更新失败：' + (error.response?.data?.error || error.message));
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

                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-xs text-gray-400">可提取收益</p>
                      <p className="text-lg font-bold text-green-400">
                        {course.revenue} YD
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleWithdrawRevenue(course.id)}
                    disabled={
                      parseFloat(course.revenue) === 0 ||
                      withdrawingCourseId === course.id ||
                      isWithdrawing
                    }
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
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
                      : '提取收益'}
                  </button>
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
