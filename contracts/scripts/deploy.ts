import { ethers } from "hardhat";
import * as fs from "fs";

interface DeploymentInfo {
  network: string;
  deployer: string;
  timestamp: string;
  contracts: {
    YDToken: string;
    CourseManager: string;
    AaveIntegration: string;
  };
}

const { getAddress } = ethers;

// 原始地址 (全小写或您之前使用的版本)
const rawAddress = "0x6ae43d3271ff6fbe86ecd74769e6b0c5b3b7f5fe"; 
function getFinalAddress(rawAddress:string) {
  try {
      // 使用 getAddress 强制转换为正确的校验和格式
      const checkedAddress = getAddress(rawAddress); 
      
      console.log(`规范化地址: ${checkedAddress}`);
    return checkedAddress;
      // 在部署合约时，使用 checkedAddress 代替硬编码的地址
      // deployContract(..., checkedAddress);
  } catch (error) {
      console.error("地址转换失败:", error);
  }
}

async function main(): Promise<void> {
  console.log("Starting deployment...\n");

  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString(), "\n");

  // 1. 部署 YD Token
  console.log("Deploying YD Token...");
  const YDToken = await ethers.getContractFactory("YDToken");
  const ydToken = await YDToken.deploy();
  await ydToken.waitForDeployment();
  const ydTokenAddress = await ydToken.getAddress();
  console.log("YD Token deployed to:", ydTokenAddress, "\n");

  // 2. 部署 Course Manager
  console.log("Deploying Course Manager...");
  const CourseManager = await ethers.getContractFactory("CourseManager");
  const courseManager = await CourseManager.deploy(ydTokenAddress);
  await courseManager.waitForDeployment();
  const courseManagerAddress = await courseManager.getAddress();
  console.log("Course Manager deployed to:", courseManagerAddress, "\n");

  // 3. 部署 AAVE Integration（仅在有配置时部署）
  let aaveIntegrationAddress: string = "Not deployed (configure AAVE addresses in .env)";

  // if (process.env.AAVE_POOL_ADDRESS && process.env.USDT_ADDRESS) {
  //   console.log("Deploying AAVE Integration...");
  //   const AaveIntegration = await ethers.getContractFactory("AaveIntegration");

  //   // Uniswap V3 SwapRouter地址（Sepolia测试网）
  //   const swapRouterAddress: string = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";

  //   const aaveIntegration = await AaveIntegration.deploy(
  //     getFinalAddress(rawAddress),
  //     swapRouterAddress,
  //     process.env.USDT_ADDRESS,
  //     ydTokenAddress
  //   );
  //   await aaveIntegration.waitForDeployment();
  //   aaveIntegrationAddress = await aaveIntegration.getAddress();
  //   console.log("AAVE Integration deployed to:", aaveIntegrationAddress, "\n");
  // }

  // 输出部署摘要
  console.log("========================================");
  console.log("Deployment Summary:");
  console.log("========================================");
  console.log("YD Token:", ydTokenAddress);
  console.log("Course Manager:", courseManagerAddress);
  // console.log("AAVE Integration:", aaveIntegrationAddress);
  console.log("========================================\n");

  // 保存部署地址到文件
  const deploymentInfo: DeploymentInfo = {
    network: ethers.provider._hardhatProvider?.network || "unknown",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      YDToken: ydTokenAddress,
      CourseManager: courseManagerAddress,
      AaveIntegration: aaveIntegrationAddress
    }
  };

  fs.writeFileSync(
    "./deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("Deployment info saved to deployment.json\n");

  // 如果在测试网上，等待区块确认后验证合约
  const networkName = ethers.provider._hardhatProvider?.network || "unknown";
  if (networkName !== "hardhat" && networkName !== "localhost") {
    console.log("Waiting for block confirmations...");
    const deployTx = ydToken.deploymentTransaction();
    if (deployTx) {
      await deployTx.wait(6);
    }

    console.log("\nVerifying contracts on Etherscan...");

    try {
      const hre = await import("hardhat");
      await hre.run("verify:verify", {
        address: ydTokenAddress,
        constructorArguments: [],
      });
      console.log("YD Token verified!");
    } catch (error) {
      if (error instanceof Error) {
        console.log("Error verifying YD Token:", error.message);
      }
    }

    try {
      const hre = await import("hardhat");
      await hre.run("verify:verify", {
        address: courseManagerAddress,
        constructorArguments: [ydTokenAddress],
      });
      console.log("Course Manager verified!");
    } catch (error) {
      if (error instanceof Error) {
        console.log("Error verifying Course Manager:", error.message);
      }
    }
  }

  console.log("\nDeployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
