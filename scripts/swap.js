// scripts/swapAforB.js
const { ethers } = require("hardhat");

// Same token addresses, plus your pool address
// Fill with actual addresses
const tokenAAddress = "";
const tokenBAddress = "";
const poolAddress = "";

async function main() {
  const tokenA = await ethers.getContractAt("IERC20", tokenAAddress);
  const tokenB = await ethers.getContractAt("IERC20", tokenBAddress);
  const pool   = await ethers.getContractAt("SimpleUniswapV2", poolAddress);

  // We'll let the second signer be the "swapper"
  const [user1] = await ethers.getSigners();
  console.log("User1 address:", user1.address);

  // Check user1's starting balances
  let balA = await tokenA.balanceOf(user1.address);
  let balB = await tokenB.balanceOf(user1.address);
  console.log("User1 starting => TokenA:", balA, "TokenB:", balB);



  // Approve the pool to spend user1's TokenA
  const amountIn = ethers.parseEther("0.1"); // user1 wants to swap 100 A
  console.log("Approving pool to spend user1's TokenA...");
  let tx = await tokenA.connect(user1).approve(poolAddress, amountIn);
  await tx.wait();

  // Swap
  console.log(`Swapping ${amountIn} TokenA for TokenB...`);
  tx = await pool.connect(user1).swap0For1(amountIn);
  await tx.wait();

  // Check user1's final balances
  let balAFinal = await tokenA.balanceOf(user1.address);
  let balBFinal = await tokenB.balanceOf(user1.address);
  console.log("User1 final => TokenA:", balAFinal, "TokenB:", balBFinal);

  // Check updated pool reserves
  const [r0, r1] = await pool.getReserves();
  console.log(`Pool reserves => Token0: ${r0}, Token1: ${r1}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
