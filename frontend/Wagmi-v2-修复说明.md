# Wagmi v2 API 修复说明

## 问题描述

启动项目时遇到白屏，控制台报错：
```
The requested module '/node_modules/.vite/deps/wagmi.js?v=380e3598'
does not provide an export named 'useNetwork'
```

## 问题原因

这是因为项目使用的是 **Wagmi v2**，而组件代码使用了 v1 的 API。Wagmi 在 v2 版本中进行了重大更新，移除和重命名了多个 Hooks。

## Wagmi v1 → v2 主要变化

| v1 API | v2 API | 说明 |
|--------|--------|------|
| `useNetwork()` | `useAccount()` | 链信息现在在 account 中 |
| `useSwitchNetwork()` | `useSwitchChain()` | 重命名 |
| `chains` 从 config | `useChains()` | 需要使用 Hook 获取 |
| `switchNetwork(chainId)` | `switchChain({ chainId })` | 参数格式变化 |
| `isLoading` | `isPending` | 重命名 |
| `pendingChainId` | `variables?.chainId` | 结构变化 |

## 修复内容

### 1. NetworkSwitcher.jsx

#### 修改前 (v1 API)
```jsx
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi';

const { isConnected } = useAccount();
const { chain } = useNetwork();
const { chains, switchNetwork, isLoading, pendingChainId } = useSwitchNetwork();

// 使用
switchNetwork(availableChain.id);
const isSwitching = isLoading && pendingChainId === availableChain.id;
```

#### 修改后 (v2 API)
```jsx
import { useAccount, useSwitchChain, useChains } from 'wagmi';

const { isConnected, chain } = useAccount();
const { switchChain, isPending, variables } = useSwitchChain();
const chains = useChains();

// 使用
switchChain({ chainId: availableChain.id });
const isSwitching = isPending && variables?.chainId === availableChain.id;
```

### 2. NetworkWarning.jsx

#### 修改前 (v1 API)
```jsx
import { useNetwork, useSwitchNetwork } from 'wagmi';

const { chain } = useNetwork();
const { switchNetwork } = useSwitchNetwork();

// 使用
switchNetwork(11155111);

// 检查不支持的网络
if (!chain?.unsupported || dismissed) {
  return null;
}
```

#### 修改后 (v2 API)
```jsx
import { useAccount, useSwitchChain, useChains } from 'wagmi';

const { chain } = useAccount();
const { switchChain } = useSwitchChain();
const chains = useChains();

// 使用
switchChain({ chainId: 11155111 });

// 检查不支持的网络（需要手动判断）
const isUnsupported = chain && !chains.some(c => c.id === chain.id);
if (!isUnsupported || dismissed) {
  return null;
}
```

## 完整的修改清单

### ✅ 已修复的文件

1. **NetworkSwitcher.jsx**
   - ✅ 导入语句：移除 `useNetwork`，添加 `useSwitchChain` 和 `useChains`
   - ✅ 获取链信息：从 `useAccount()` 获取 `chain`
   - ✅ 获取链列表：使用 `useChains()` Hook
   - ✅ 切换网络：使用 `switchChain({ chainId })`
   - ✅ 加载状态：使用 `isPending` 和 `variables?.chainId`

2. **NetworkWarning.jsx**
   - ✅ 导入语句：更新为 v2 API
   - ✅ 获取链信息：从 `useAccount()` 获取
   - ✅ 网络验证：手动检查链是否在支持列表中
   - ✅ 切换网络：使用新的 API 格式

## 代码对比

### 导入语句对比

```jsx
// ❌ 旧代码 (v1)
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi';

// ✅ 新代码 (v2)
import { useAccount, useSwitchChain, useChains } from 'wagmi';
```

### Hook 使用对比

```jsx
// ❌ 旧代码 (v1)
const { isConnected } = useAccount();
const { chain } = useNetwork();
const { chains, switchNetwork, isLoading, pendingChainId } = useSwitchNetwork();

// ✅ 新代码 (v2)
const { isConnected, chain } = useAccount();
const { switchChain, isPending, variables } = useSwitchChain();
const chains = useChains();
```

### 切换网络对比

```jsx
// ❌ 旧代码 (v1)
switchNetwork(11155111);

// ✅ 新代码 (v2)
switchChain({ chainId: 11155111 });
```

### 加载状态对比

```jsx
// ❌ 旧代码 (v1)
const isSwitching = isLoading && pendingChainId === availableChain.id;

// ✅ 新代码 (v2)
const isSwitching = isPending && variables?.chainId === availableChain.id;
```

### 不支持网络检测对比

```jsx
// ❌ 旧代码 (v1)
if (!chain?.unsupported || dismissed) {
  return null;
}

// ✅ 新代码 (v2)
const isUnsupported = chain && !chains.some(c => c.id === chain.id);
if (!isUnsupported || dismissed) {
  return null;
}
```

## 验证步骤

修复后，请按以下步骤验证：

### 1. 清理并重启
```bash
# 停止开发服务器
# Ctrl + C

# 清理缓存
rm -rf node_modules/.vite

# 重启
npm run dev
```

### 2. 检查浏览器
- ✅ 页面正常加载，无白屏
- ✅ 控制台无错误信息
- ✅ 网络切换器正常显示

### 3. 测试功能
1. **连接钱包**
   - 点击 "Connect Wallet"
   - 连接 MetaMask

2. **查看网络切换器**
   - 应该显示当前网络
   - 点击打开下拉菜单
   - 查看所有支持的网络

3. **切换网络**
   - 点击不同的网络
   - MetaMask 应该弹出确认窗口
   - 确认后网络应该成功切换
   - 切换器显示应该更新

4. **测试警告横幅**
   - 在 MetaMask 中切换到不支持的网络（如 BSC）
   - 应该显示红色警告横幅
   - 点击"切换到 Sepolia"应该正常工作
   - 点击关闭按钮应该隐藏横幅

## 其他可能需要检查的文件

如果项目中还有其他使用了 Wagmi Hooks 的文件，可能也需要更新。常见的位置：

- `src/pages/*.jsx` - 页面组件
- `src/components/*.jsx` - 其他组件
- `src/hooks/*.js` - 自定义 Hooks

### 搜索需要更新的代码

```bash
# 在项目根目录运行
grep -r "useNetwork" frontend/src/
grep -r "useSwitchNetwork" frontend/src/
```

## Wagmi v2 其他重要变化

### 1. useConnect
```jsx
// v1
const { connect, connectors } = useConnect();

// v2 (未变化，但建议使用 RainbowKit)
// 功能相同
```

### 2. useBalance
```jsx
// v1
const { data } = useBalance({ addressOrName: address });

// v2
const { data } = useBalance({ address });
```

### 3. useContractRead
```jsx
// v1
const { data } = useContractRead({
  addressOrName: contractAddress,
  contractInterface: abi,
  functionName: 'balanceOf',
  args: [address],
});

// v2
const { data } = useReadContract({
  address: contractAddress,
  abi: abi,
  functionName: 'balanceOf',
  args: [address],
});
```

### 4. useContractWrite
```jsx
// v1
const { write } = useContractWrite({
  addressOrName: contractAddress,
  contractInterface: abi,
  functionName: 'transfer',
});

// v2
const { writeContract } = useWriteContract();
writeContract({
  address: contractAddress,
  abi: abi,
  functionName: 'transfer',
  args: [to, amount],
});
```

## 常见问题

### Q1: 清理缓存后还是有问题？
```bash
# 完全清理
rm -rf node_modules
rm -rf node_modules/.vite
rm package-lock.json

# 重新安装
npm install

# 重启
npm run dev
```

### Q2: 提示其他 Hook 不存在？
查看上面的"其他重要变化"部分，更新相应的代码。

### Q3: TypeScript 类型错误？
如果使用 TypeScript，可能需要更新类型导入：
```typescript
import { UseAccountReturnType, UseSwitchChainReturnType } from 'wagmi';
```

### Q4: 仍然显示白屏？
1. 打开浏览器开发者工具
2. 查看 Console 标签页的错误信息
3. 根据错误信息继续修复

## 相关资源

- [Wagmi v2 迁移指南](https://wagmi.sh/react/guides/migrate-from-v1-to-v2)
- [Wagmi v2 文档](https://wagmi.sh/react/api/hooks)
- [Wagmi GitHub](https://github.com/wevm/wagmi)

## 总结

这次修复主要是将网络切换相关的组件从 Wagmi v1 API 更新到 v2 API。主要变化：

1. **useNetwork → useAccount**: 链信息现在从 account 中获取
2. **useSwitchNetwork → useSwitchChain**: 重命名并改变参数格式
3. **chains 配置 → useChains()**: 需要使用 Hook 获取
4. **手动检测不支持的网络**: v2 中没有 `chain.unsupported` 属性

修复完成后，网络切换功能应该可以正常工作了！

---

**修复日期**: 2024-01-25
**Wagmi 版本**: v2.x
**修复状态**: ✅ 完成
