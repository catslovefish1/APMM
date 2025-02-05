// contracts/BondingCurve.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./AToken.sol";
import "./BToken.sol";

/**
 * @dev BondingCurve is upgradeable, uses an initializer instead of a constructor.
 */
contract BondingCurve is Initializable, OwnableUpgradeable {
    AToken public aToken;
    BToken public bToken;

    // Upgradable contracts must not set state variables at declaration
    // if they rely on constructor logic. Instead, set them in `initialize`.

    function initialize(address _aToken, address _bToken) public initializer {
        __Ownable_init(_msgSender()); // sets owner to msg.sender (the account calling `initialize`)

        aToken = AToken(_aToken);
        bToken = BToken(_bToken);
        // The BondingCurve can be the owner of these tokens if we call
        // `aToken.transferOwnership(address(this))` from whichever account currently owns them.
    }

    /**
     * @dev Mints x A + x B for the caller, in exchange for x ETH
     */
    function mintTokens() external payable {
        require(msg.value > 0, "Must send some ETH");
        // Mint exactly msg.value of A & B
        aToken.mint(msg.sender, msg.value);
        bToken.mint(msg.sender, msg.value);
    }

    /**
     * @dev Burns `amount` A + B from the caller, returning `amount` ETH
     *      Must have approved the BondingCurve to spend A & B first.
     */
    function redeemTokens(uint256 amount) external {
        require(amount > 0, "Amount cannot be zero");
        require(aToken.balanceOf(msg.sender) >= amount, "Not enough A");
        require(bToken.balanceOf(msg.sender) >= amount, "Not enough B");
        require(address(this).balance >= amount, "Not enough ETH in contract");

        aToken.transferFrom(msg.sender, address(this), amount);
        bToken.transferFrom(msg.sender, address(this), amount);

        aToken.burn(address(this), amount);
        bToken.burn(address(this), amount);

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Failed to send ETH");
    }

    // Allow the contract to receive ETH
    receive() external payable {}

    // (Optional) Storage gap
    uint256[50] private __gap;
}
