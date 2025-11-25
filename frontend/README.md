# Web3 University - Frontend

基于 React + Vite + Tailwind CSS + Wagmi + RainbowKit 的前端应用。

## 技术栈

- **React 18**: UI 框架
- **Vite**: 构建工具
- **Tailwind CSS**: CSS 框架
- **Wagmi**: 以太坊 React Hooks
- **RainbowKit**: 钱包连接 UI
- **React Router**: 路由管理
- **Ethers.js**: 以太坊交互
- **Axios**: HTTP 客户端

## 项目结构

```
src/
├── components/       # 可复用组件
│   ├── Layout.jsx
│   ├── CourseCard.jsx
│   ├── NetworkSwitcher.jsx    # ✨ 网络切换组件
│   └── NetworkWarning.jsx     # ✨ 网络警告横幅
├── pages/           # 页面组件
│   ├── Home.jsx
│   ├── Courses.jsx
│   ├── CourseDetail.jsx
│   ├── CreateCourse.jsx
│   ├── BuyTokens.jsx
│   └── Profile.jsx
├── config/          # 配置文件
│   ├── wagmi.js
│   └── contracts.js
├── App.jsx          # 主应用
├── main.jsx         # 入口文件
└── index.css        # 全局样式
```

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
```

编辑 `.env` 文件，填入必要的配置：
- `VITE_API_URL`: 后端 API 地址
- `VITE_YD_TOKEN_ADDRESS`: YD 代币合约地址
- `VITE_COURSE_MANAGER_ADDRESS`: 课程管理合约地址
- `VITE_WALLETCONNECT_PROJECT_ID`: WalletConnect 项目 ID

### 3. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000

### 4. 构建生产版本
```bash
npm run build
```

## ✨ 网络切换功能

应用支持在多个以太坊网络之间切换：

### 支持的网络
- **Sepolia 测试网** (Chain ID: 11155111) - 推荐用于测试
- **Hardhat 本地网络** (Chain ID: 31337) - 本地开发
- **Ethereum 主网** (Chain ID: 1) - 生产环境

### 功能特性
- 🔄 一键切换网络
- 🎨 网络状态颜色标识
- ⚠️ 不支持网络警告横幅
- 📊 显示当前网络和 Chain ID
- ⚡ 实时网络状态更新

### 使用方法
1. 连接钱包后，导航栏会显示当前网络
2. 点击网络按钮打开下拉菜单
3. 选择目标网络进行切换
4. MetaMask 会弹出确认窗口
5. 确认后自动切换到新网络

详细说明请参考 [网络切换功能说明.md](./网络切换功能说明.md)

## 页面说明

### 首页 (/)
- 平台介绍
- 主要特性展示
- 使用流程说明

### 课程列表 (/courses)
- 显示所有课程
- 搜索功能
- 课程卡片

### 课程详情 (/courses/:id)
- 课程详细信息
- 购买流程
  1. 检查余额
  2. 授权代币
  3. 购买课程

### 创建课程 (/create-course)
- 填写课程信息
- 设置价格
- 创建交易

### 购买代币 (/buy-tokens)
- ETH 兑换 YD
- 余额显示
- 价格计算

### 个人中心 (/profile)
- 用户信息
- MetaMask 签名修改昵称
- 已购买课程列表

## 核心功能实现

### 钱包连接
使用 RainbowKit 提供开箱即用的钱包连接体验：
```jsx
import { ConnectButton } from '@rainbow-me/rainbowkit';

<ConnectButton />
```

### 读取合约数据
使用 Wagmi 的 `useReadContract` Hook：
```jsx
const { data: balance } = useReadContract({
  address: CONTRACTS.YD_TOKEN,
  abi: YD_TOKEN_ABI,
  functionName: 'balanceOf',
  args: [address],
});
```

### 写入合约数据
使用 Wagmi 的 `useWriteContract` Hook：
```jsx
const { writeContract } = useWriteContract();

writeContract({
  address: CONTRACTS.YD_TOKEN,
  abi: YD_TOKEN_ABI,
  functionName: 'buyTokens',
  value: parseEther(amount),
});
```

### 签名验证
使用 Wagmi 的 `useSignMessage` Hook：
```jsx
const { signMessageAsync } = useSignMessage();

const signature = await signMessageAsync({
  message: 'Your message here'
});
```

## 样式设计

### Tailwind 自定义配置
- 自定义颜色主题
- 渐变动画
- 响应式断点

### 渐变背景
```jsx
className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
```

### 玻璃态效果
```jsx
className="bg-white/10 backdrop-blur-lg"
```

### 悬停动画
```jsx
className="hover:scale-105 transition-transform duration-300"
```

## 性能优化

- ✅ 使用 Vite 进行快速构建
- ✅ 代码分割和懒加载
- ✅ 图片优化
- ✅ 缓存策略
- ✅ React Query 自动请求管理

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 开发建议

### 组件开发
- 遵循 React Hooks 最佳实践
- 使用 PropTypes 或 TypeScript
- 保持组件单一职责

### 状态管理
- 本地状态使用 useState
- 全局状态使用 Context API
- 服务端状态使用 Wagmi + React Query

### 错误处理
- 捕获并友好展示错误信息
- 处理钱包连接失败
- 处理交易失败

## 常见问题

**Q: 钱包连接失败？**
A: 确保安装了 MetaMask 并连接到正确的网络（Sepolia）。

**Q: 交易一直处理中？**
A: 检查 Gas 费用是否足够，可以在 Etherscan 查看交易状态。

**Q: 看不到合约数据？**
A: 确保合约地址配置正确，且已经部署到当前连接的网络。

**Q: 如何获取 WalletConnect Project ID？**
A: 访问 https://cloud.walletconnect.com 注册并创建项目。

## 相关资源

- [React 文档](https://react.dev/)
- [Vite 文档](https://vitejs.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Wagmi 文档](https://wagmi.sh/)
- [RainbowKit 文档](https://www.rainbowkit.com/docs)
