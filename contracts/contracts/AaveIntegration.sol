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

    // 已质押的总金额
    uint256 public totalStaked;

    // 质押记录
    mapping(address => uint256) public stakedAmount;

    // 事件
    event TokensSwapped(address indexed fromToken, address indexed toToken, uint256 amountIn, uint256 amountOut);
    event StakedToAave(address indexed user, uint256 amount);
    event WithdrawnFromAave(address indexed user, uint256 amount);

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
     * @dev 接收ETH
     */
    receive() external payable {}
}
