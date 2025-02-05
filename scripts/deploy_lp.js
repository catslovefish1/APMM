// scripts/deploy_lp.js
const { ethers } = require("hardhat");

// Replace these with the actual addresses of your already-deployed TokenA and TokenB
const tokenAAddress = "0xa6e3A62F26c4D829B4cD11342a16d46446dd9A04";
const tokenBAddress = "0xD6E68592f1c3c28E4569302d0AEF1ec78Adc7c37";

async function main() {
  console.log("Deploying SimpleUniswapV2 with existing token addresses...");

  const SimpleUniswapV2 = await ethers.getContractFactory("SimpleUniswapV2");
  const swap = await SimpleUniswapV2.deploy(tokenAAddress, tokenBAddress);
  // Ethers v6 => waitForDeployment instead of .deployed()
  await swap.waitForDeployment();

  const swapAddress = await swap.getAddress();
  console.log("SimpleUniswapV2 deployed at:", swapAddress);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
