# Web3 University - 快速启动指南

本指南将帮助你快速启动整个项目。

## 前置要求

- Node.js 16+ 和 npm
- PostgreSQL 12+
- MetaMask 浏览器扩展
- Git

## 第一步：安装所有依赖

在项目根目录运行：

```bash
# 安装合约依赖
cd contracts && npm install && cd ..

# 安装前端依赖
cd frontend && npm install && cd ..

# 安装后端依赖
cd backend && npm install && cd ..
```

## 第二步：配置环境变量

### 1. 合约配置
```bash
cd contracts
cp .env.example .env
```

编辑 `contracts/.env`：
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=your_wallet_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 2. 前端配置
```bash
cd frontend
cp .env.example .env
```

编辑 `frontend/.env`：
```env
VITE_API_URL=http://localhost:5000/api
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
# 合约地址将在部署后填入
```

### 3. 后端配置
```bash
cd backend
cp .env.example .env
```

编辑 `backend/.env`：
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=web3_university
DB_USER=postgres
DB_PASSWORD=your_postgres_password
CORS_ORIGIN=http://localhost:3000
```

## 第三步：设置数据库

```bash
# 创建数据库
createdb web3_university

# 初始化数据库表
cd backend
node database/init.js
```

## 第四步：部署智能合约

### 选项 A：部署到本地测试网（推荐用于开发）

```bash
# 终端 1：启动本地节点
cd contracts
npx hardhat node

# 终端 2：部署合约
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```

### 选项 B：部署到 Sepolia 测试网

```bash
cd contracts
npx hardhat run scripts/deploy.js --network sepolia
```

**重要**: 部署后，将 `deployment.json` 中的合约地址复制到 `frontend/.env`：
```env
VITE_YD_TOKEN_ADDRESS=0x...
VITE_COURSE_MANAGER_ADDRESS=0x...
VITE_AAVE_INTEGRATION_ADDRESS=0x...
```

## 第五步：启动应用

打开 3 个终端：

### 终端 1：启动后端
```bash
cd backend
npm run dev
```
后端将运行在 http://localhost:5000

### 终端 2：启动前端
```bash
cd frontend
npm run dev
```
前端将运行在 http://localhost:3000

### 终端 3：Hardhat 节点（如果使用本地网络）
```bash
cd contracts
npx hardhat node
```

## 第六步：配置 MetaMask

1. 打开 MetaMask 扩展
2. 连接到正确的网络：
   - 本地开发：添加 `http://localhost:8545`，Chain ID: `31337`
   - Sepolia 测试网：选择 "Sepolia test network"
3. 导入测试账户（使用 Hardhat 提供的私钥或你的测试账户）

## 第七步：获取测试 ETH

### 本地网络
Hardhat 本地节点会自动提供测试账户和 ETH。

### Sepolia 测试网
访问以下 Faucet 获取测试 ETH：
- https://sepoliafaucet.com
- https://www.alchemy.com/faucets/ethereum-sepolia

## 第八步：开始使用

1. 访问 http://localhost:3000
2. 点击 "Connect Wallet" 连接 MetaMask
3. 购买 YD 代币
4. 创建或购买课程
5. 在个人中心管理你的课程

## 常见问题解决

### 1. 数据库连接失败
```bash
# 检查 PostgreSQL 是否运行
pg_isready

# 启动 PostgreSQL（macOS）
brew services start postgresql

# 启动 PostgreSQL（Linux）
sudo service postgresql start
```

### 2. 合约部署失败
- 确保钱包有足够的 ETH
- 检查 RPC URL 是否正确
- 确认私钥格式正确（不要包含 0x 前缀）

### 3. 前端无法连接钱包
- 确保安装了 MetaMask
- 检查网络是否正确（Chain ID 匹配）
- 刷新页面重试

### 4. API 请求失败
- 确保后端正在运行
- 检查 CORS 配置
- 查看浏览器控制台错误信息

### 5. 交易失败
- 检查 Gas 费用是否足够
- 确认合约地址正确
- 查看 Etherscan 上的交易详情

## 开发工作流

### 修改智能合约后
```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy.js --network localhost
# 更新前端 .env 中的合约地址
```

### 修改数据库结构后
```bash
cd backend
node database/init.js
```

### 清理和重置
```bash
# 清理合约编译产物
cd contracts
npx hardhat clean

# 重置数据库
dropdb web3_university
createdb web3_university
cd backend
node database/init.js
```

## 生产部署提示

1. **合约部署**
   - 在主网部署前进行完整的安全审计
   - 使用多签钱包作为合约 owner
   - 在测试网充分测试

2. **前端部署**
   - 使用 `npm run build` 构建生产版本
   - 部署到 Vercel、Netlify 等平台
   - 配置正确的环境变量

3. **后端部署**
   - 使用 PM2 或 Docker 部署
   - 配置反向代理（Nginx）
   - 设置 HTTPS
   - 配置日志和监控

4. **数据库**
   - 使用托管数据库服务（AWS RDS、Heroku Postgres）
   - 定期备份
   - 配置连接池

## 下一步

- 阅读完整的 [README.md](README.md)
- 查看各模块的详细文档
- 尝试创建你的第一个课程
- 探索 AAVE 集成功能

## 获取帮助

遇到问题？
1. 检查各模块的 README 文档
2. 查看 [常见问题](#常见问题解决)
3. 在 GitHub 提交 Issue

祝你使用愉快！
