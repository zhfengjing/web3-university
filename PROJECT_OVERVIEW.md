# Web3 University - 项目概览

## 项目简介

Web3 University 是一个基于区块链技术的去中心化在线教育平台。使用自定义的 YD ERC20 代币进行课程交易，并集成 AAVE 协议实现平台收益的自动理财。

## 核心功能

### 1. YD 代币系统
- ✅ 符合 ERC20 标准的代币
- ✅ ETH 购买 YD 代币
- ✅ 动态价格管理
- ✅ 代币授权机制

### 2. 课程管理
- ✅ 创建课程（设置标题、描述、价格）
- ✅ 课程列表和搜索
- ✅ 使用 YD 代币购买课程
- ✅ 购买历史记录
- ✅ 平台手续费（5%）

### 3. AAVE 集成
- ✅ YD/ETH 兑换 USDT
- ✅ USDT 质押到 AAVE
- ✅ 自动收益管理
- ✅ 赎回和提现

### 4. 用户系统
- ✅ MetaMask 钱包连接
- ✅ 签名验证身份
- ✅ 修改用户昵称
- ✅ 查看已购课程
- ✅ 个人中心

### 5. 美观 UI
- ✅ 渐变背景设计
- ✅ 玻璃态卡片效果
- ✅ 悬停动画
- ✅ 响应式布局
- ✅ 深色主题

## 技术架构

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  Home    │  │ Courses  │  │ Profile  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  Create  │  │Buy Tokens│  │  Detail  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│              Wagmi + RainbowKit                      │
└─────────────────────────────────────────────────────┘
                        ↕ HTTP/WS
┌─────────────────────────────────────────────────────┐
│              Backend (Express + PostgreSQL)          │
│  ┌──────────────┐  ┌──────────────┐                │
│  │  User API    │  │  Signature   │                │
│  │              │  │  Validation  │                │
│  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────┘
                        ↕ Web3
┌─────────────────────────────────────────────────────┐
│           Smart Contracts (Solidity)                 │
│  ┌──────────────┐  ┌──────────────┐                │
│  │   YDToken    │  │CourseManager │                │
│  │   (ERC20)    │  │              │                │
│  └──────────────┘  └──────────────┘                │
│          ┌──────────────┐                           │
│          │     AAVE     │                           │
│          │ Integration  │                           │
│          └──────────────┘                           │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│              Ethereum Network (Sepolia)              │
│                 AAVE V3 Protocol                     │
└─────────────────────────────────────────────────────┘
```

## 文件结构

```
web3-university/
│
├── contracts/                    # 智能合约模块
│   ├── contracts/
│   │   ├── YDToken.sol          # YD ERC20 代币合约
│   │   ├── CourseManager.sol    # 课程管理合约
│   │   └── AaveIntegration.sol  # AAVE 集成合约
│   ├── scripts/
│   │   └── deploy.js            # 部署脚本
│   ├── hardhat.config.js        # Hardhat 配置
│   ├── package.json
│   └── README.md
│
├── frontend/                     # 前端模块
│   ├── src/
│   │   ├── components/          # 可复用组件
│   │   │   ├── Layout.jsx       # 布局组件
│   │   │   └── CourseCard.jsx   # 课程卡片
│   │   ├── pages/               # 页面组件
│   │   │   ├── Home.jsx         # 首页
│   │   │   ├── Courses.jsx      # 课程列表
│   │   │   ├── CourseDetail.jsx # 课程详情
│   │   │   ├── CreateCourse.jsx # 创建课程
│   │   │   ├── BuyTokens.jsx    # 购买代币
│   │   │   └── Profile.jsx      # 个人中心
│   │   ├── config/              # 配置文件
│   │   │   ├── wagmi.js         # Wagmi 配置
│   │   │   └── contracts.js     # 合约配置
│   │   ├── App.jsx              # 主应用
│   │   ├── main.jsx             # 入口
│   │   └── index.css            # 全局样式
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── README.md
│
├── backend/                      # 后端模块
│   ├── routes/
│   │   └── users.js             # 用户路由
│   ├── utils/
│   │   └── signature.js         # 签名验证工具
│   ├── config/
│   │   └── database.js          # 数据库配置
│   ├── database/
│   │   ├── schema.sql           # 数据库架构
│   │   └── init.js              # 初始化脚本
│   ├── server.js                # 服务器入口
│   ├── package.json
│   └── README.md
│
├── README.md                     # 主文档
├── QUICKSTART.md                 # 快速启动指南
├── PROJECT_OVERVIEW.md           # 项目概览（本文件）
└── .gitignore                    # Git 忽略配置
```

## 数据流

### 购买课程流程

```
1. 用户浏览课程列表
   Frontend → CourseManager.courseCount()
   Frontend → CourseManager.getCourse(id)

2. 用户点击购买
   检查 YD 余额 → YDToken.balanceOf(user)

3. 授权代币（首次）
   Frontend → YDToken.approve(CourseManager, amount)

4. 购买课程
   Frontend → CourseManager.purchaseCourse(id)
   CourseManager → YDToken.transferFrom(user, contract, amount)

5. 记录购买
   CourseManager → 更新购买记录
   Event: CoursePurchased

6. 后端记录活动
   Frontend → Backend API
   Backend → PostgreSQL
```

### 签名验证流程

```
1. 用户修改昵称
   Frontend → 生成消息 (包含昵称和时间戳)

2. MetaMask 签名
   Frontend → signMessageAsync(message)

3. 发送到后端
   Frontend → POST /api/users/:address/update-name
   Body: { name, message, signature }

4. 后端验证
   Backend → ethers.verifyMessage(message, signature)
   Backend → 验证时间戳（5分钟内有效）
   Backend → 更新数据库

5. 返回结果
   Backend → 返回更新后的用户信息
```

## 智能合约详解

### YDToken.sol
**继承**: ERC20, Ownable

**主要函数**:
- `buyTokens()`: 购买代币（payable）
- `updatePrice(uint256)`: 更新代币价格（onlyOwner）
- `withdraw()`: 提取 ETH（onlyOwner）

**事件**:
- `TokensPurchased(address buyer, uint256 amount, uint256 cost)`
- `PriceUpdated(uint256 newPrice)`

### CourseManager.sol
**继承**: Ownable, ReentrancyGuard

**主要结构**:
```solidity
struct Course {
    uint256 id;
    string title;
    string description;
    address author;
    uint256 priceInYD;
    uint256 totalEnrolled;
    bool isActive;
    uint256 createdAt;
}
```

**主要函数**:
- `createCourse(title, description, price)`: 创建课程
- `purchaseCourse(courseId)`: 购买课程（需先 approve）
- `updateCoursePrice(courseId, newPrice)`: 更新价格
- `withdrawCourseRevenue(courseId)`: 提取收益
- `getUserPurchases(address)`: 获取购买记录

**事件**:
- `CourseCreated(courseId, author, title, price)`
- `CoursePurchased(courseId, student, price)`

### AaveIntegration.sol
**继承**: Ownable, ReentrancyGuard

**主要函数**:
- `swapYDToUSDT(amountIn, amountOutMin)`: 兑换代币
- `swapETHToUSDT(amountOutMin)`: 兑换 ETH
- `stakeToAave(amount)`: 质押到 AAVE
- `withdrawFromAave(amount)`: 从 AAVE 赎回
- `withdrawUSDT(amount)`: 提取 USDT

**事件**:
- `TokensSwapped(fromToken, toToken, amountIn, amountOut)`
- `StakedToAave(user, amount)`
- `WithdrawnFromAave(user, amount)`

## 安全考虑

### 智能合约安全
- ✅ 使用 OpenZeppelin 安全合约
- ✅ ReentrancyGuard 防止重入攻击
- ✅ Ownable 访问控制
- ✅ 输入验证和边界检查
- ✅ 事件日志记录

### 后端安全
- ✅ 签名验证确保身份
- ✅ 时间戳防止重放攻击
- ✅ 参数化查询防止 SQL 注入
- ✅ 输入验证和消毒
- ✅ CORS 配置

### 前端安全
- ✅ 环境变量管理
- ✅ 安全的钱包连接
- ✅ 交易确认提示
- ✅ 错误处理
- ✅ 用户友好的反馈

## 性能优化

### 智能合约
- 使用映射而非数组存储大量数据
- 最小化链上存储
- 批量操作减少 Gas
- 事件索引优化查询

### 前端
- React Query 自动缓存
- 代码分割和懒加载
- 图片优化
- Vite 快速构建

### 后端
- 数据库连接池
- 查询优化和索引
- API 响应缓存
- 分页处理

## 可扩展性

### 功能扩展
- 课程内容管理（IPFS 存储）
- 课程评价和评分
- 讲师认证系统
- NFT 证书发放
- 学习进度追踪
- 社区论坛

### 技术扩展
- TypeScript 类型安全
- GraphQL API
- 微服务架构
- Redis 缓存
- CDN 加速
- 移动端 App

## 测试策略

### 智能合约测试
```bash
cd contracts
npx hardhat test
npx hardhat coverage
```

### 前端测试
- 单元测试（Jest + React Testing Library）
- 集成测试
- E2E 测试（Playwright）

### 后端测试
- API 测试（Supertest）
- 数据库测试
- 签名验证测试

## 部署策略

### 开发环境
- 本地 Hardhat 网络
- 本地 PostgreSQL
- Vite 开发服务器

### 测试环境
- Sepolia 测试网
- 测试数据库
- 预览部署

### 生产环境
- Ethereum 主网
- 生产数据库（RDS）
- CDN 部署
- 负载均衡

## 监控和维护

### 智能合约监控
- Etherscan 合约验证
- 事件监听
- Gas 使用分析

### 应用监控
- 错误追踪（Sentry）
- 性能监控（New Relic）
- 日志聚合（ELK）
- 用户分析（Google Analytics）

### 数据库维护
- 定期备份
- 性能优化
- 索引维护
- 数据清理

## 成本估算

### Gas 费用（Sepolia 测试网）
- 部署 YDToken: ~2,000,000 gas
- 部署 CourseManager: ~3,000,000 gas
- 创建课程: ~150,000 gas
- 购买课程: ~100,000 gas
- 购买代币: ~50,000 gas

### 运营成本
- 服务器: $20-50/月
- 数据库: $15-30/月
- CDN: $10-20/月
- 域名: $10-15/年

## 许可证和合规

- MIT 开源许可证
- 注意各地区加密货币法规
- 用户协议和隐私政策
- KYC/AML 考虑（如需要）

## 社区和贡献

- 欢迎提交 Issue
- 欢迎 Pull Request
- 代码审查流程
- 贡献者指南

## 路线图

### Phase 1: MVP（已完成）
- ✅ 基础合约
- ✅ 前后端应用
- ✅ 核心功能

### Phase 2: 增强功能
- ⏳ 课程内容管理
- ⏳ 评价系统
- ⏳ NFT 证书

### Phase 3: 生态扩展
- ⏳ 移动端应用
- ⏳ DAO 治理
- ⏳ 多链支持

## 联系和支持

- GitHub Issues
- Discord 社区
- Twitter
- Email 支持

---

**最后更新**: 2024年1月
**版本**: 1.0.0
**作者**: Web3 University Team
