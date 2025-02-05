// contracts/SimpleUniswapV2.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleUniswapV2 {
    IERC20 public token0;
    IERC20 public token1;

    uint112 private reserve0;
    uint112 private reserve1;

    constructor(address _token0, address _token1) {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }

    function addLiquidity(uint256 amount0, uint256 amount1) external {
        token0.transferFrom(msg.sender, address(this), amount0);
        token1.transferFrom(msg.sender, address(this), amount1);
        reserve0 += uint112(amount0);
        reserve1 += uint112(amount1);
    }

    function swap0For1(uint256 amountIn) external {
        require(amountIn > 0, "amountIn must be > 0");
        uint256 r0 = reserve0;
        uint256 r1 = reserve1;

        // amountOut = r1 - (r0 * r1) / (r0 + amountIn)
        uint256 amountOut = r1 - (r0 * r1) / (r0 + amountIn);

        token0.transferFrom(msg.sender, address(this), amountIn);
        reserve0 = uint112(r0 + amountIn);
        reserve1 = uint112(r1 - amountOut);

        token1.transfer(msg.sender, amountOut);
    }

    function swap1For0(uint256 amountIn) external {
        require(amountIn > 0, "amountIn must be > 0");
        uint256 r0 = reserve0;
        uint256 r1 = reserve1;

        // amountOut = r0 - (r0 * r1) / (r1 + amountIn)
        uint256 amountOut = r0 - (r0 * r1) / (r1 + amountIn);

        token1.transferFrom(msg.sender, address(this), amountIn);
        reserve1 = uint112(r1 + amountIn);
        reserve0 = uint112(r0 - amountOut);

        token0.transfer(msg.sender, amountOut);
    }

    function getReserves() external view returns (uint112, uint112) {
        return (reserve0, reserve1);
    }
}
