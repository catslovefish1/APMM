// contracts/AToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @dev AToken is an upgradeable ERC20 token with `Ownable` access control.
 *      - No constructor
 *      - We use `initialize()` instead.
 */
contract BToken is Initializable, ERC20Upgradeable, OwnableUpgradeable {
    /**
     * @dev Called once by the proxy at deployment time.
     * @param name_ Name of the token
     * @param symbol_ Symbol of the token
     */
    function initialize(
        string memory name_,
        string memory symbol_
    ) public initializer {

        __ERC20_init(name_, symbol_);
        __Ownable_init(_msgSender());
        // If you had any initial storage setup, do it here.
    }

    /**
     * @dev Only the owner (whoever calls `initialize`) can mint/burn.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }



}
