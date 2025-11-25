# Web3 University - Smart Contracts

智能合约部分，包含 YD 代币、课程管理和 AAVE 集成。

## 合约说明

### YDToken.sol
YD 代币合约（ERC20）

**功能**:
- 标准 ERC20 代币功能
- 使用 ETH 购买代币
- 价格管理（仅限 owner）
- 提取 ETH（仅限 owner）

**初始配置**:
- 名称: YD Token
- 符号: YD
- 初始供应量: 100,000,000 YD
- 默认价格: 1 YD = 0.001 ETH

### CourseManager.sol
课程管理合约

**功能**:
- 创建课程
- 购买课程（使用 YD 代币）
- 更新课程价格
- 提取课程收益
- 平台手续费管理（默认 5%）

**关键逻辑**:
- 用户必须先 approve YD 代币给合约
- 平台收取 5% 手续费
- 作者获得 95% 收益
- 记录用户购买历史

### AaveIntegration.sol
AAVE 集成合约

**功能**:
- YD 代币兑换为 USDT
- ETH 兑换为 USDT
- 质押 USDT 到 AAVE
- 从 AAVE 赎回 USDT
- 提取 USDT

**说明**:
- 使用 Uniswap V3 进行代币兑换
- 集成 AAVE V3 Pool
- 仅限 owner 操作

## 部署步骤

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件
```

### 3. 编译合约
```bash
npx hardhat compile
```

### 4. 运行测试
```bash
npx hardhat test
```

### 5. 部署到本地网络
```bash
# 终端 1: 启动本地节点
npx hardhat node

# 终端 2: 部署合约
npx hardhat run scripts/deploy.js --network localhost
```

### 6. 部署到测试网
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### 7. 验证合约
```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS
```

## 合约交互示例

### 购买 YD 代币
```javascript
const tx = await ydToken.buyTokens({ value: ethers.parseEther("0.1") });
await tx.wait();
```

### 创建课程
```javascript
const tx = await courseManager.createCourse(
  "Solidity 入门",
  "学习 Solidity 智能合约开发",
  ethers.parseEther("100") // 100 YD
);
await tx.wait();
```

### 购买课程
```javascript
// 1. 授权
const approveTx = await ydToken.approve(
  courseManagerAddress,
  ethers.parseEther("100")
);
await approveTx.wait();

// 2. 购买
const purchaseTx = await courseManager.purchaseCourse(1);
await purchaseTx.wait();
```

## Gas 优化建议

- 使用 `calldata` 而不是 `memory` 用于外部函数参数
- 合理使用事件记录而不是存储
- 批量操作减少交易次数
- 使用映射而不是数组存储大量数据

## 安全注意事项

- ⚠️ 永远不要在 Git 中提交包含真实私钥的 `.env` 文件
- ⚠️ 在主网部署前进行全面的安全审计
- ⚠️ 使用 OpenZeppelin 的安全合约库
- ⚠️ 注意重入攻击、整数溢出等常见漏洞
- ⚠️ 测试所有边界情况和异常情况

## 主要依赖

- Hardhat: 开发环境
- OpenZeppelin Contracts: 安全的合约库
- AAVE Core V3: DeFi 协议集成
- Ethers.js: 以太坊库

## 网络配置

### Sepolia 测试网
- Chain ID: 11155111
- RPC: https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
- 浏览器: https://sepolia.etherscan.io

### 获取测试 ETH
- Sepolia Faucet: https://sepoliafaucet.com

## 常见问题

**Q: 部署失败，提示 Gas 不足？**
A: 确保钱包有足够的测试 ETH，可以从 faucet 获取。

**Q: 如何获取合约地址？**
A: 部署成功后，地址会保存在 `deployment.json` 文件中。

**Q: AAVE 集成合约部署失败？**
A: 确保 `.env` 中配置了正确的 AAVE Pool 地址和 USDT 地址。

**Q: 如何修改代币价格？**
A: 使用 owner 账户调用 `YDToken.updatePrice()` 函数。

## 相关资源

- [Hardhat 文档](https://hardhat.org/docs)
- [OpenZeppelin 文档](https://docs.openzeppelin.com/)
- [AAVE 开发文档](https://docs.aave.com/developers/)
- [Solidity 文档](https://docs.soliditylang.org/)
