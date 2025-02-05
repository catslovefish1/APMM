// scripts/deploy_lp.js
const { ethers } = require("hardhat");

// Replace these with the actual addresses of your already-deployed TokenA and TokenB
const tokenAAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const tokenBAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

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
