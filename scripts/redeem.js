// scripts/mint-and-redeem.js
const { ethers } = require("hardhat");

// Fill in your own deployed proxy addresses here:
const aTokenProxyAddress = "0xa6e3A62F26c4D829B4cD11342a16d46446dd9A04";
const bTokenProxyAddress = "0xD6E68592f1c3c28E4569302d0AEF1ec78Adc7c37";
const bondingCurveProxyAddress = "0x37BbB11Fe4Bd8acb31E5eF5E6140173FBe06373d";

async function main() {
  // 1. Get contract instances
  const aToken = await ethers.getContractAt("AToken", aTokenProxyAddress);
  const bToken = await ethers.getContractAt("BToken", bTokenProxyAddress);
  const bondingCurve = await ethers.getContractAt("BondingCurve", bondingCurveProxyAddress);

  // 2. Get signers
  const [deployer, user1] = await ethers.getSigners();

  // 3. Check user1's A and B balances
  let user1ABalance = await aToken.balanceOf(user1.address);
  let user1BBalance = await bToken.balanceOf(user1.address);
  console.log("User1 AToken balance:", user1ABalance.toString());
  console.log("User1 BToken balance:", user1BBalance.toString());

  // 4. Approve the BondingCurve to spend user1's A & B (for redeeming)
  tx = await aToken.connect(user1).approve(bondingCurveProxyAddress, user1ABalance);
  await tx.wait();
  tx = await bToken.connect(user1).approve(bondingCurveProxyAddress, user1BBalance);
  await tx.wait();

  console.log("Approved the BondingCurve to spend user1's A & B.");

  // 5. Redeem them for ETH
  console.log("Redeeming the same amount user1 minted...");
  tx = await bondingCurve.connect(user1).redeemTokens(ethers.parseEther("1.0"));
  await tx.wait();

  // 7. Check final A/B balances
  let user1AFinal = await aToken.balanceOf(user1.address);
  let user1BFinal = await bToken.balanceOf(user1.address);
  console.log("User1 final AToken balance:", user1AFinal.toString());
  console.log("User1 final BToken balance:", user1BFinal.toString());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
