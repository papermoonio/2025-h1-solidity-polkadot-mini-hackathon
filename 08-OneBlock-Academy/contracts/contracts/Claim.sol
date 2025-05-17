// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

interface ICustomNFT {
    function mint(address to) external returns (uint256);
}

interface IWhitelist {
    function isWhitelisted(address user) external view returns (bool);
    function addToWhitelist(address user) external;
}

contract Claim is OwnableUpgradeable {
    IERC20 public token;
    ICustomNFT public nft;
    IWhitelist public whitelist;
    uint256 public quota;

    mapping(address => bool) public claimed;

    event Deposited(address indexed from, uint256 amount);
    event Claimed(address indexed account, uint256 tokenAmount, uint256 tokenId);
    event QuotaUpdated(uint256 oldQuota, uint256 newQuota);

    bytes4 private constant TRANSFER_SELECTOR = bytes4(keccak256(bytes("transfer(address,uint256)")));
    bytes4 private constant TRANSFER_FROM_SELECTOR = bytes4(keccak256(bytes("transferFrom(address,address,uint256)")));

    function initialize(
        address initialOwner,
        address tokenAddress,
        address nftAddress,
        address whitelistAddr,
        uint256 quota_
    ) public initializer {
        __Ownable_init(initialOwner);
        token = IERC20(tokenAddress);
        nft = ICustomNFT(nftAddress);
        whitelist = IWhitelist(whitelistAddr);
        quota = quota_;
    }

    function deposit(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");

        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= amount, "Insufficient allowance");

        _safeTransferFrom(address(token), msg.sender, address(this), amount);

        emit Deposited(msg.sender, amount);
    }

    function claim() external {
        require(!claimed[msg.sender], "Already claimed");
        require(whitelist.isWhitelisted(msg.sender), "Not whitelisted");

        uint256 tokenId;
        try nft.mint(msg.sender) returns (uint256 id) {
            tokenId = id;
        } catch Error(string memory reason) {
            revert(string(abi.encodePacked("NFT mint failed: ", reason)));
        }

        claimed[msg.sender] = true;

        _safeTransfer(address(token), msg.sender, quota);

        emit Claimed(msg.sender, quota, tokenId);
    }

    function updateQuota(uint256 newQuota) external onlyOwner {
        require(newQuota > 0, "Quota must be > 0");
        uint256 old = quota;
        quota = newQuota;
        emit QuotaUpdated(old, newQuota);
    }

    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be > 0");

        uint256 bal = token.balanceOf(address(this));
        require(bal >= amount, "Insufficient balance");

        _safeTransfer(address(token), msg.sender, amount);
    }

    /// @dev 安全转账，适配非标准 ERC20
    function _safeTransfer(address token_, address to, uint256 value) private {
        (bool success, bytes memory data) = token_.call(
            abi.encodeWithSelector(TRANSFER_SELECTOR, to, value)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "SafeTransfer: TRANSFER_FAILED");
    }

    /// @dev 安全转账From，适配非标准 ERC20
    function _safeTransferFrom(address token_, address from, address to, uint256 value) private {
        (bool success, bytes memory data) = token_.call(
            abi.encodeWithSelector(TRANSFER_FROM_SELECTOR, from, to, value)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "SafeTransferFrom: TRANSFER_FAILED");
    }
}
