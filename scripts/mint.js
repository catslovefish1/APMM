// scripts/mint-and-check.js
const { ethers } = require("hardhat");

// Fill in your own deployed proxy addresses here:
const aTokenProxyAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const bTokenProxyAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const bondingCurveProxyAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

async function main() {
  // 1) Get contract instances
  const aToken = await ethers.getContractAt("AToken", aTokenProxyAddress);
  const bToken = await ethers.getContractAt("BToken", bTokenProxyAddress);
  const bondingCurve = await ethers.getContractAt("BondingCurve", bondingCurveProxyAddress);

  // 2) Get signers
  const [user1] = await ethers.getSigners();
  console.log("User1 address:", user1.address);

  // 3) Check user1's ETH balance before minting
  let user1EthBalanceBefore = await ethers.provider.getBalance(user1.address);
  console.log("User1 ETH balance (before mint):", ethers.formatEther(user1EthBalanceBefore));

  // 4) Let user1 call `mintTokens` with 1 ETH
  console.log("\nUser1 minting 1 A + 1 B for 1 ETH...");
  const tx = await bondingCurve.connect(user1).mintTokens({
    value: ethers.parseEther("1.0"), // 1 ETH
  });
  await tx.wait(); // wait for tx confirmation

  // 5) Check user1's ETH balance after minting
  let user1EthBalanceAfter = await ethers.provider.getBalance(user1.address);
  console.log("User1 ETH balance (after mint):", ethers.formatEther(user1EthBalanceAfter));

  // 6) Check user1's new AToken & BToken balances
  const user1ABalance = await aToken.balanceOf(user1.address);
  const user1BBalance = await bToken.balanceOf(user1.address);

  console.log("\nUser1 AToken balance (raw):", user1ABalance.toString());
  console.log("User1 BToken balance (raw):", user1BBalance.toString());

  // Format them as human-readable if they have 18 decimals
  console.log(
    "User1 AToken balance (formatted):",
    ethers.formatUnits(user1ABalance, 18)
  );
  console.log(
    "User1 BToken balance (formatted):",
    ethers.formatUnits(user1BBalance, 18)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
