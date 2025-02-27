// scripts/addliquidity.js
const { ethers } = require("hardhat");

// Fill with actual addresses
const tokenAAddress = "0xa6e3A62F26c4D829B4cD11342a16d46446dd9A04";
const tokenBAddress = "0xD6E68592f1c3c28E4569302d0AEF1ec78Adc7c37";
const poolAddress = "0x55c6febe58702480aDD50A930d6323F2bFB8606D";

async function main() {
    // 1) Get contract instances
    const tokenA = await ethers.getContractAt("IERC20", tokenAAddress);
    const tokenB = await ethers.getContractAt("IERC20", tokenBAddress);
    const pool = await ethers.getContractAt("SimpleUniswapV2", poolAddress);

    // 2) Get signers

    const [user1] = await ethers.getSigners();
    console.log("user1 address:", user1.address);

    // 3) Decide how many tokens to deposit
    const amountA = ethers.parseEther("0.01");
    const amountB = ethers.parseEther("0.01");

    // 4) Check user1 balances before deposit
    let user1ABal = await tokenA.balanceOf(user1.address);
    let user1BBal = await tokenB.balanceOf(user1.address);

    console.log("User1 TokenA balance (before):", user1ABal.toString());
    console.log("User1 TokenB balance (before):", user1BBal.toString());

    // 5) If user1 doesn't have enough TokenA or TokenB, transfer from deployer
    if (user1ABal < amountA) {
        console.log(`User1 has insufficient TokenA, transferring from deployer...`);
        return;
    }

    if (user1BBal < amountB) {
        console.log(`User1 has insufficient TokenB, transferring from deployer...`);
        return;
    }

    // Double-check balances
    user1ABal = await tokenA.balanceOf(user1.address);
    user1BBal = await tokenB.balanceOf(user1.address);
    console.log("User1 TokenA balance (after potential transfer):", user1ABal.toString());
    console.log("User1 TokenB balance (after potential transfer):", user1BBal.toString());

    // 6) Approve the pool to spend tokens from user1
    console.log("Approving the pool to spend tokens...");
    let tx = await tokenA.connect(user1).approve(poolAddress, amountA);
    await tx.wait();
    tx = await tokenB.connect(user1).approve(poolAddress, amountB);
    await tx.wait();

    // 7) Call addLiquidity using user1
    console.log(`Adding liquidity: ${amountA} A, ${amountB} B`);
    tx = await pool.connect(user1).addLiquidity(amountA, amountB);
    await tx.wait();

    // 8) Check the new reserves
    const [r0, r1] = await pool.getReserves();
    console.log(`Reserves => token0: ${r0}, token1: ${r1}`);

    // 4) Check user1 balances before deposit
    user1ABal = await tokenA.balanceOf(user1.address);
    user1BBal = await tokenB.balanceOf(user1.address);

    console.log("User1 TokenA balance (after):", user1ABal.toString());
    console.log("User1 TokenB balance (after):", user1BBal.toString());
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
