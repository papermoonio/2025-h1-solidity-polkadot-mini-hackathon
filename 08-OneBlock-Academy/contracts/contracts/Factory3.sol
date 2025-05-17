// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Whitelist.sol";
import "./CustomNFT.sol";
import "./Claim.sol";

contract Factory3 {
    struct ProjectInfo {
        address whitelist;
        address nft;
        address claim;
        bool exists;
    }

    mapping(bytes32 => ProjectInfo) public projects;

    event ProjectDeployed(
        bytes32 indexed projectId,
        address whitelistContract,
        address nftContract,
        address claimContract
    );

    /**
     * @notice 创建一个新的项目，部署并初始化 Whitelist、CustomNFT 和 Claim 合约
     */
    function createProject(
        bytes32 projectId,
        address tokenAddress,
        string memory nftName,
        string memory nftSymbol,
        string memory baseURI,
        uint256 claimQuota
    )
        external
        returns (
            address whitelistContract,
            address nftContract,
            address claimContract
        )
    {
        require(!projects[projectId].exists, "Project ID exists");
        require(tokenAddress != address(0), "Invalid token address");
        require(bytes(nftName).length > 0, "Empty NFT name");
        require(bytes(nftSymbol).length > 0, "Empty NFT symbol");
        require(claimQuota > 0, "Quota must be > 0");

        // 1. 部署并初始化 Whitelist
        {
            bytes memory wlCode = type(Whitelist).creationCode;
            address payable addr;
            assembly {
                addr := create(0, add(wlCode, 0x20), mload(wlCode))
            }
            require(addr != address(0), "Whitelist deploy failed");
            Whitelist(addr).initialize(msg.sender);
            whitelistContract = addr;
        }

        // 2. 部署并初始化 CustomNFT（先传 address(0) 占位）
        {
            bytes memory nftCode = type(CustomNFT).creationCode;
            address payable addr;
            assembly {
                addr := create(0, add(nftCode, 0x20), mload(nftCode))
            }
            require(addr != address(0), "NFT deploy failed");
            CustomNFT(addr).initialize(nftName, nftSymbol, baseURI, address(0));
            nftContract = addr;
        }

        // 3. 部署并初始化 Claim，引用真实 NFT 地址
        {
            bytes memory clCode = type(Claim).creationCode;
            address payable addr;
            assembly {
                addr := create(0, add(clCode, 0x20), mload(clCode))
            }
            require(addr != address(0), "Claim deploy failed");
            Claim(addr).initialize(msg.sender, tokenAddress, nftContract, whitelistContract, claimQuota);
            claimContract = addr;
        }

        // 4. 绑定 Claim 到 NFT
        CustomNFT(nftContract).setClaimContract(claimContract);

        // 5. 记录项目
        projects[projectId] = ProjectInfo({
            whitelist: whitelistContract,
            nft: nftContract,
            claim: claimContract,
            exists: true
        });

        emit ProjectDeployed(projectId, whitelistContract, nftContract, claimContract);
        return (whitelistContract, nftContract, claimContract);
    }
}
