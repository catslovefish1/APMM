// scripts/deploy.js
const { ethers, upgrades } = require("hardhat");

async function main() {
  // 1) Deploy AToken proxy
  const AToken = await ethers.getContractFactory("AToken");
  const aTokenProxy = await upgrades.deployProxy(
    AToken,
    ["A Token", "A"], // arguments for initialize(string memory, string memory)
    { initializer: "initialize" }
  );
  await aTokenProxy.waitForDeployment();
  console.log("AToken Proxy deployed at:", await aTokenProxy.getAddress());

  // 2) Deploy BToken proxy
  const BToken = await ethers.getContractFactory("BToken");
  const bTokenProxy = await upgrades.deployProxy(
    BToken,
    ["B Token", "B"], // arguments for initialize(string memory, string memory)
    { initializer: "initialize" }
  );
  await bTokenProxy.waitForDeployment();
  console.log("BToken Proxy deployed at:", await bTokenProxy.getAddress());

  // 3) Deploy BondingCurve proxy
  const BondingCurve = await ethers.getContractFactory("BondingCurve");
  const bondingCurveProxy = await upgrades.deployProxy(
    BondingCurve,
    [await aTokenProxy.getAddress(), await bTokenProxy.getAddress()], // arguments for initialize(address, address)
    { initializer: "initialize" }
  );
  await bondingCurveProxy.waitForDeployment();
  console.log("BondingCurve Proxy deployed at:", await bondingCurveProxy.getAddress());

  // 4) Transfer Ownership of AToken & BToken to the BondingCurve
  //    so that BondingCurve can mint/burn them.
  const transferTx1 = await aTokenProxy.transferOwnership(await bondingCurveProxy.getAddress());
  await transferTx1.wait();
  console.log("Transferred ownership of AToken to BondingCurve.");

  const transferTx2 = await bTokenProxy.transferOwnership(await bondingCurveProxy.getAddress());
  await transferTx2.wait();
  console.log("Transferred ownership of BToken to BondingCurve.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
