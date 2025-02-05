require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config(); // <-- add this line

module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL, // e.g. "https://rpc.ankr.com/eth_sepolia"
      accounts: [process.env.PRIVATE_KEY]
    },
  },
};
