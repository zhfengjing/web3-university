const hre = require("hardhat");

// 这是一个 Hardhat 辅助脚本，用于生成智能合约在 Etherscan 上手动验证所需的 Standard JSON Input 文件。
// 此文件是用于在sepolia.etherscan 和etherscans上手动验证时需要生成符合standard-Json-Input类型的json文件。
// 执行命令：npx hardhat run verify-helper.js

async function main() {
  // 生成 YDToken 的 Standard JSON Input
  const ydTokenBuildInfo = await hre.artifacts.getBuildInfo("contracts/YDToken.sol:YDToken");
  const ydTokenInput = ydTokenBuildInfo.input;
  
  const fs = require("fs");
  fs.writeFileSync("YDToken-standard-input.json", JSON.stringify(ydTokenInput, null, 2));
  console.log("YDToken standard input saved to YDToken-standard-input.json");
  
  // 生成 CourseManager 的 Standard JSON Input
  const courseManagerBuildInfo = await hre.artifacts.getBuildInfo("contracts/CourseManager.sol:CourseManager");
  const courseManagerInput = courseManagerBuildInfo.input;
  
  fs.writeFileSync("CourseManager-standard-input.json", JSON.stringify(courseManagerInput, null, 2));
  console.log("CourseManager standard input saved to CourseManager-standard-input.json");


  // 生成 AaveIntegration 的 Standard JSON Input
  const aaveIntegrationBuildInfo = await hre.artifacts.getBuildInfo("contracts/AaveIntegration.sol:AaveIntegration");
  const aaveIntegrationInput = aaveIntegrationBuildInfo.input;
  
  fs.writeFileSync("AaveIntegration-standard-input.json", JSON.stringify(aaveIntegrationInput, null, 2));
  console.log("AaveIntegration standard input saved to AaveIntegration-standard-input.json");
}

main().catch(console.error);
