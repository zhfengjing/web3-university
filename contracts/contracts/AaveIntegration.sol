// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AaveIntegration
 * @dev AAVE集成合约 - 将平台收益质押到AAVE进行理财
 *
 * 注意：此合约为简化版本，实际使用需要集成AAVE V3的IPool接口
 * 参考：https://docs.aave.com/developers/core-contracts/pool
 */

interface IPool {
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
}

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}

contract AaveIntegration is Ownable, ReentrancyGuard {
    // AAVE Pool地址（需要根据网络设置）
    IPool public aavePool;

    // Uniswap Router地址（用于代币兑换）
    ISwapRouter public swapRouter;

    // USDT代币地址
    address public usdtAddress;

    // YD代币地址
    address public ydTokenAddress;

    // 年化收益率 (基点，100 = 1%)
    uint256 public annualYieldRate = 500; // 默认 5%

    // 用户质押记录结构
    struct StakeInfo {
        uint256 ydAmount;        // 质押的YD数量
        uint256 usdtAmount;      // 兑换后的USDT数量
        uint256 stakedAt;        // 质押时间
        uint256 lastClaimAt;     // 上次领取收益时间
        bool isActive;           // 是否活跃
    }

    // 用户质押记录：用户地址 => 质押记录
    mapping(address => StakeInfo) public userStakes;

    // 已质押的总金额
    uint256 public totalStaked;

    // 质押记录（废弃，保留用于兼容）
    mapping(address => uint256) public stakedAmount;

    // 事件
    event TokensSwapped(address indexed fromToken, address indexed toToken, uint256 amountIn, uint256 amountOut);
    event UserStaked(address indexed user, uint256 ydAmount, uint256 usdtAmount, uint256 timestamp);
    event StakedToAave(address indexed user, uint256 amount);
    event WithdrawnFromAave(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event YieldRateUpdated(uint256 newRate);

    constructor(
        address _aavePoolAddress,
        address _swapRouterAddress,
        address _usdtAddress,
        address _ydTokenAddress
    ) Ownable(msg.sender) {
        aavePool = IPool(_aavePoolAddress);
        swapRouter = ISwapRouter(_swapRouterAddress);
        usdtAddress = _usdtAddress;
        ydTokenAddress = _ydTokenAddress;
    }

    /**
     * @dev 将YD代币兑换为USDT
     */
    function swapYDToUSDT(uint256 amountIn, uint256 amountOutMinimum)
        external
        onlyOwner
        nonReentrant
        returns (uint256)
    {
        IERC20 ydToken = IERC20(ydTokenAddress);

        require(ydToken.balanceOf(address(this)) >= amountIn, "Insufficient YD balance");

        // 授权Uniswap Router
        ydToken.approve(address(swapRouter), amountIn);

        // 执行兑换
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: ydTokenAddress,
            tokenOut: usdtAddress,
            fee: 3000, // 0.3%
            recipient: address(this),
            deadline: block.timestamp + 300, // 5分钟
            amountIn: amountIn,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = swapRouter.exactInputSingle(params);

        emit TokensSwapped(ydTokenAddress, usdtAddress, amountIn, amountOut);
        return amountOut;
    }

    /**
     * @dev 将ETH兑换为USDT
     */
    function swapETHToUSDT(uint256 amountOutMinimum)
        external
        payable
        onlyOwner
        nonReentrant
        returns (uint256)
    {
        require(msg.value > 0, "Must send ETH");

        // WETH地址（需要根据网络设置）
        address wethAddress = address(0); // 实际使用时需要设置正确的WETH地址

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: wethAddress,
            tokenOut: usdtAddress,
            fee: 3000,
            recipient: address(this),
            deadline: block.timestamp + 300,
            amountIn: msg.value,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = swapRouter.exactInputSingle{value: msg.value}(params);

        emit TokensSwapped(wethAddress, usdtAddress, msg.value, amountOut);
        return amountOut;
    }

    /**
     * @dev 将USDT质押到AAVE
     */
    function stakeToAave(uint256 amount) external onlyOwner nonReentrant {
        IERC20 usdt = IERC20(usdtAddress);

        require(usdt.balanceOf(address(this)) >= amount, "Insufficient USDT balance");

        // 授权AAVE Pool
        usdt.approve(address(aavePool), amount);

        // 质押到AAVE
        aavePool.supply(usdtAddress, amount, address(this), 0);

        stakedAmount[msg.sender] += amount;
        totalStaked += amount;

        emit StakedToAave(msg.sender, amount);
    }

    /**
     * @dev 从AAVE赎回USDT
     */
    function withdrawFromAave(uint256 amount) external onlyOwner nonReentrant returns (uint256) {
        require(stakedAmount[msg.sender] >= amount, "Insufficient staked amount");

        // 从AAVE赎回
        uint256 withdrawnAmount = aavePool.withdraw(usdtAddress, amount, address(this));

        stakedAmount[msg.sender] -= amount;
        totalStaked -= amount;

        emit WithdrawnFromAave(msg.sender, withdrawnAmount);
        return withdrawnAmount;
    }

    /**
     * @dev 提取USDT
     */
    function withdrawUSDT(uint256 amount) external onlyOwner nonReentrant {
        IERC20 usdt = IERC20(usdtAddress);
        require(usdt.balanceOf(address(this)) >= amount, "Insufficient USDT balance");
        require(usdt.transfer(msg.sender, amount), "Transfer failed");
    }

    /**
     * @dev 获取合约中的USDT余额
     */
    function getUSDTBalance() external view returns (uint256) {
        return IERC20(usdtAddress).balanceOf(address(this));
    }

    /**
     * @dev 获取合约中的YD余额
     */
    function getYDBalance() external view returns (uint256) {
        return IERC20(ydTokenAddress).balanceOf(address(this));
    }

    /**
     * @dev 用户质押YD代币（简化版，直接存储YD，不兑换USDT）
     */
    function stakeYD(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        IERC20 ydToken = IERC20(ydTokenAddress);
        require(ydToken.balanceOf(msg.sender) >= amount, "Insufficient YD balance");

        // 转移YD代币到合约
        require(
            ydToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );

        // 如果用户已有质押，先计算并累加收益
        if (userStakes[msg.sender].isActive) {
            uint256 pendingReward = calculateReward(msg.sender);
            userStakes[msg.sender].ydAmount += amount;
            userStakes[msg.sender].usdtAmount += pendingReward; // 将收益加入本金
            userStakes[msg.sender].lastClaimAt = block.timestamp;
        } else {
            // 新建质押记录
            userStakes[msg.sender] = StakeInfo({
                ydAmount: amount,
                usdtAmount: amount, // 简化：假设 1 YD = 1 USDT
                stakedAt: block.timestamp,
                lastClaimAt: block.timestamp,
                isActive: true
            });
        }

        totalStaked += amount;

        emit UserStaked(msg.sender, amount, amount, block.timestamp);
    }

    /**
     * @dev 计算用户当前可领取的收益
     */
    function calculateReward(address user) public view returns (uint256) {
        StakeInfo memory stake = userStakes[user];

        if (!stake.isActive || stake.usdtAmount == 0) {
            return 0;
        }

        // 计算时间差（秒）
        uint256 timeElapsed = block.timestamp - stake.lastClaimAt;

        // 计算收益：本金 * 年化收益率 * 时间 / 365天
        // 收益 = amount * (rate / 10000) * (timeElapsed / 365 days)
        uint256 reward = (stake.usdtAmount * annualYieldRate * timeElapsed) / (10000 * 365 days);

        return reward;
    }

    /**
     * @dev 领取收益
     */
    function claimReward() external nonReentrant {
        require(userStakes[msg.sender].isActive, "No active stake");

        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "No reward to claim");

        // 更新领取时间
        userStakes[msg.sender].lastClaimAt = block.timestamp;

        // 将收益加入本金（复利）
        userStakes[msg.sender].usdtAmount += reward;

        emit RewardClaimed(msg.sender, reward);
    }

    /**
     * @dev 赎回全部本金和收益
     */
    function unstake() external nonReentrant {
        require(userStakes[msg.sender].isActive, "No active stake");

        StakeInfo memory stake = userStakes[msg.sender];

        // 计算最终收益
        uint256 reward = calculateReward(msg.sender);
        uint256 totalAmount = stake.ydAmount + reward;

        // 检查合约余额
        IERC20 ydToken = IERC20(ydTokenAddress);
        require(ydToken.balanceOf(address(this)) >= totalAmount, "Insufficient contract balance");

        // 清除质押记录
        delete userStakes[msg.sender];
        totalStaked -= stake.ydAmount;

        // 转账
        require(ydToken.transfer(msg.sender, totalAmount), "Transfer failed");

        emit WithdrawnFromAave(msg.sender, totalAmount);
    }

    /**
     * @dev 获取用户质押信息
     */
    function getUserStakeInfo(address user) external view returns (
        uint256 ydAmount,
        uint256 usdtAmount,
        uint256 stakedAt,
        uint256 pendingReward,
        bool isActive
    ) {
        StakeInfo memory stake = userStakes[user];
        return (
            stake.ydAmount,
            stake.usdtAmount,
            stake.stakedAt,
            calculateReward(user),
            stake.isActive
        );
    }

    /**
     * @dev 更新年化收益率（仅管理员）
     */
    function updateYieldRate(uint256 newRate) external onlyOwner {
        require(newRate <= 10000, "Rate too high (max 100%)");
        annualYieldRate = newRate;
        emit YieldRateUpdated(newRate);
    }

    /**
     * @dev 接收ETH
     */
    receive() external payable {}
}
