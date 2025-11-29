import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();
// 合约在Sourcify上验证的，配置的 sourcify: { enabled: true },

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    },
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    }
  },
  // 临时注释掉 Etherscan，只使用 Sourcify 验证
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
    customChains: [
      {
        network: "sepolia",
        chainId: 11155111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io"
        }
      }
    ]
  },
  sourcify: {
    enabled: true
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;


// 通过执行命令验证合约（目前会自动验证etherscan和sourcify）
  // npx hardhat verify--network sepolia
  
  // npx hardhat verify--network sepolia < CourseManager合约地址 > <YDToken合约地址>
  
  // npx hardhat verify --network sepolia <AaveIntegration合约地址> \
  //   <AAVE_POOL_ADDRESS> \
  //   <SWAP_ROUTER_ADDRESS> \
  //   <USDT_ADDRESS> \
  //   <YDToken合约地址>