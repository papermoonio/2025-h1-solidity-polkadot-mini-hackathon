// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/////////////////////////////////////////////
//               Whitelist.sol             //
/////////////////////////////////////////////

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title Whitelist
 * @notice Manages a list of approved addresses
 */
contract Whitelist is Initializable, OwnableUpgradeable {
    mapping(address => bool) private _whitelisted;

    event AddressAdded(address indexed account);
    event AddressRemoved(address indexed account);

    /**
     * @notice Initializes the contract setting the initial owner
     * @param owner_ The address of the owner
     */
    function initialize(address owner_) public initializer {
         __Ownable_init(msg.sender);
        transferOwnership(owner_);
    }

    /**
     * @notice Add an address to the whitelist
     * @param account The address to add
     */
    function addToWhitelist(address account) external onlyOwner {
        _whitelisted[account] = true;
        emit AddressAdded(account);
    }

     /**
     * @notice Batch add multiple addresses to the whitelist
     * @param accounts The array of addresses to add
     */
    function batchAddToWhitelist(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            _whitelisted[accounts[i]] = true;
            emit AddressAdded(accounts[i]);
        }
    }

    /**
     * @notice Remove an address from the whitelist
     * @param account The address to remove
     */
    function removeFromWhitelist(address account) external onlyOwner {
        _whitelisted[account] = false;
        emit AddressRemoved(account);
    }

    /**
     * @notice Check if an address is whitelisted
     * @param account The address to check
     * @return True if whitelisted, false otherwise
     */
    function isWhitelisted(address account) external view returns (bool) {
        return _whitelisted[account];
    }
}