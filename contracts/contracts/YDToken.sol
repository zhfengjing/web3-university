// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title YDToken
 * @dev YD代币 - Web3 University平台的原生代币
 */
contract YDToken is ERC20, Ownable {
    // 代币初始供应量：1亿 YD
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18;

    // 代币价格：1 YD = 0.001 ETH
    uint256 public tokenPrice = 0.001 ether;

    // 事件
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost);
    event PriceUpdated(uint256 newPrice);

    constructor() ERC20("YD Token", "YD") Ownable(msg.sender) {
        // 铸造初始供应量给合约所有者
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @dev 购买YD代币
     */
    function buyTokens() public payable {
        require(msg.value > 0, "Must send ETH to buy tokens");

        uint256 tokenAmount = (msg.value * 10**18) / tokenPrice;
        require(balanceOf(owner()) >= tokenAmount, "Insufficient tokens in reserve");

        // 从所有者账户转移代币到购买者
        _transfer(owner(), msg.sender, tokenAmount);

        emit TokensPurchased(msg.sender, tokenAmount, msg.value);
    }

    /**
     * @dev 更新代币价格（仅限所有者）
     */
    function updatePrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be greater than 0");
        tokenPrice = newPrice;
        emit PriceUpdated(newPrice);
    }

    /**
     * @dev 提取合约中的ETH（仅限所有者）
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH to withdraw");
        payable(owner()).transfer(balance);
    }

    /**
     * @dev 接收ETH
     */
    receive() external payable {
        buyTokens();
    }
}
