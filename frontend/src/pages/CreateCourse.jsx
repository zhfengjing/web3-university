import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { parseEther } from 'viem';
import { PlusCircle } from 'lucide-react';
import { CONTRACTS, COURSE_MANAGER_ABI } from '../config/contracts';

export default function CreateCourse() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
  });

  const { data: hash, writeContract, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.price) {
      alert('请填写所有字段');
      return;
    }

    if (parseFloat(formData.price) <= 0) {
      alert('价格必须大于0');
      return;
    }

    try {
      writeContract({
        address: CONTRACTS.COURSE_MANAGER,
        abi: COURSE_MANAGER_ABI,
        functionName: 'createCourse',
        args: [
          formData.title,
          formData.description,
          parseEther(formData.price),
        ],
      });
    } catch (error) {
      console.error('Create course error:', error);
      alert('创建失败：' + error.message);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (isSuccess) {
    setTimeout(() => {
      navigate('/courses');
    }, 2000);
  }

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <PlusCircle className="h-20 w-20 text-blue-400 mx-auto mb-6" />
        <h2 className="text-3xl font-bold mb-4">创建课程</h2>
        <p className="text-gray-300 mb-8">
          请先连接钱包以创建课程
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="text-center mb-8">
        <PlusCircle className="h-16 w-16 text-blue-400 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4 gradient-text">创建课程</h1>
        <p className="text-gray-300">
          分享您的知识，创建一个新的课程
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              课程标题 *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="例如：Solidity智能合约开发入门"
              className="input-field"
              required
            />
          </div>

          {/* Course Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              课程描述 *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="详细描述您的课程内容、学习目标等..."
              rows="6"
              className="input-field resize-none"
              required
            />
          </div>

          {/* Course Price */}
          <div>
            <label className="block text-sm font-medium mb-2">
              课程价格 (YD) *
            </label>
            <input
              type="number"
              name="price"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              placeholder="100"
              className="input-field"
              required
            />
            <p className="text-gray-400 text-sm mt-2">
              学生需要支付此数量的YD代币来购买课程
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || isConfirming}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending || isConfirming ? '创建中...' : '创建课程'}
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

        {isSuccess && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-sm">
              课程创建成功！正在跳转到课程列表...
            </p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-8 card">
        <h3 className="text-lg font-bold mb-4">创建提示</h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• 课程标题应简洁明了，突出核心内容</li>
          <li>• 详细的课程描述有助于吸引更多学生</li>
          <li>• 合理定价，考虑课程价值和目标受众</li>
          <li>• 创建后可以在个人中心管理您的课程</li>
        </ul>
      </div>
    </div>
  );
}
