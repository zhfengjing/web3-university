# MetaMask 导入 YD 代币详细指南

## 前提条件

1. 已安装 MetaMask 浏览器插件
2. MetaMask 已连接到 **Sepolia 测试网**

## 一、确认网络设置

### 步骤 1：检查当前网络
1. 点击 MetaMask 图标打开钱包
2. 查看钱包顶部的网络名称
3. 如果不是 "Sepolia test network"，需要切换网络

### 步骤 2：切换到 Sepolia 测试网
1. 点击顶部的网络名称（下拉菜单）
2. 在网络列表中找到 "Sepolia test network"
3. 点击选择该网络

**注意：** 如果列表中没有 Sepolia，需要先添加：
- 点击"添加网络"或"Add network"
- 选择"手动添加网络"
- 填写以下信息：
  - **网络名称：** Sepolia test network
  - **RPC URL：** https://sepolia.infura.io/v3/YOUR_INFURA_KEY 或 https://rpc.sepolia.org
  - **链 ID：** 11155111
  - **货币符号：** SepoliaETH
  - **区块浏览器：** https://sepolia.etherscan.io

## 二、导入 YD 代币

### 方法一：通过代币列表底部导入（推荐）

1. **打开 MetaMask 主界面**
   - 确保你在"资产"（Assets）标签页
   - 可以看到 ETH 和其他已有的代币

2. **找到导入按钮**
   - 向下滚动代币列表
   - 在列表最底部找到蓝色的 "Import tokens" 文字链接
   - 点击该链接

3. **选择自定义代币**
   - 在弹出的界面中，点击 "Custom token" 标签
   - （默认是 "Search" 标签，需要切换）

4. **填写代币信息**
   - **Token contract address（代币合约地址）：**
     ```
     0x843e6B030F6a874fa9fb6Fa7Ee71733216DC0B7E
     ```
   - 粘贴地址后，稍等片刻
   - **Token symbol（代币符号）：** 自动填充为 `YD`
   - **Token decimal（代币小数位）：** 自动填充为 `18`

5. **确认导入**
   - 点击 "Add custom token" 按钮
   - 检查代币信息是否正确
   - 点击 "Import tokens" 完成导入

### 方法二：通过搜索功能导入

1. **使用搜索框**
   - 在 MetaMask 资产页面顶部有一个搜索框
   - 输入代币合约地址或 "YD"

2. **触发导入提示**
   - 如果搜索不到，会显示 "Don't see your token?" 或类似提示
   - 点击下方的 "Import" 或 "导入代币" 链接

3. **后续步骤与方法一相同**

## 三、验证导入成功

### 导入成功后你会看到：

1. **代币列表中出现 YD**
   - 在资产列表中可以看到 "YD Token"
   - 显示你的 YD 代币余额（初始可能为 0）

2. **代币详情**
   - 点击 YD 代币可以查看详情
   - 可以看到交易历史、发送、接收等选项

## 四、常见问题解决

### 问题 1：提示 "代币检测在此网络上尚不可用"

**这是正常现象！**
- Sepolia 测试网不支持自动代币检测
- 需要手动导入，按照上述步骤操作即可

### 问题 2：输入合约地址后，代币符号和小数位没有自动填充

**可能原因：**
- 网络连接问题，稍等几秒重试
- 确认你连接的是 Sepolia 测试网
- 检查合约地址是否完整正确

**解决方案：**
- 如果等待后仍未自动填充，可以手动输入：
  - Token symbol: `YD`
  - Token decimal: `18`

### 问题 3：导入后余额显示为 0

**这是正常的！**
- 新导入的代币初始余额为 0
- 需要通过以下方式获取 YD 代币：
  - 在网站上购买 YD 代币
  - 使用 YD 代币合约的 `buyTokens()` 功能
  - 从其他地址接收转账

### 问题 4：找不到 "Import tokens" 按钮

**检查事项：**
- 确保你在 "Assets/资产" 标签页，不是 "Activity/活动" 标签
- 尝试滚动到代币列表的最底部
- 更新 MetaMask 到最新版本

### 问题 5：显示 "Invalid address" 或 "地址无效"

**解决步骤：**
1. 检查合约地址是否完整（42个字符，包含0x）
2. 确认没有多余的空格
3. 确认连接的是 Sepolia 测试网，不是主网

## 五、YD 代币合约信息（备查）

```
代币名称：YD Token
代币符号：YD
合约地址：0x843e6B030F6a874fa9fb6Fa7Ee71733216DC0B7E
网络：Sepolia Test Network
Chain ID：11155111
小数位数：18
```

## 六、获取 YD 代币

导入成功后，你可以通过以下方式获取 YD 代币：

### 方式 1：在网站上购买
1. 访问 Web3 University 网站
2. 使用 MetaMask 连接钱包
3. 使用 SepoliaETH 购买 YD 代币

### 方式 2：查看 Etherscan
在浏览器中访问：
```
https://sepolia.etherscan.io/address/0x843e6B030F6a874fa9fb6Fa7Ee71733216DC0B7E
```
可以查看合约详情和交易记录

## 需要帮助？

如果遇到其他问题，请检查：
1. MetaMask 版本是否为最新
2. 浏览器是否支持 MetaMask
3. 网络连接是否正常
4. Sepolia 测试网 RPC 是否正常工作
