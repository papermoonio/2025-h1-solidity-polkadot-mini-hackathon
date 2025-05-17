// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title CustomNFT
 * @notice ERC721 NFT with minting restricted to the Claim contract
 */
contract CustomNFT is Initializable, ERC721Upgradeable {
    string private _baseTokenURI;
    address public claimContract;
    uint256 private _tokenIdTracker;

    modifier onlyClaim() {
        require(msg.sender == claimContract, "Caller is not claim contract");
        _;
    }

    /**
     * @notice Initializes the NFT contract
     * @param name_ Token name
     * @param symbol_ Token symbol
     * @param baseURI_ Base URI for all tokens
     * @param claimContract_ Address of the Claim contract
     */
    function initialize(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address claimContract_
    ) public initializer {
        __ERC721_init(name_, symbol_);
        _baseTokenURI = baseURI_;
        claimContract = claimContract_;
        _tokenIdTracker = 1;
    }

    /**
     * @notice Mint a new NFT to an address
     * @param to Recipient address
     * @return tokenId of the minted NFT
     */
    function mint(address to) external onlyClaim returns (uint256) {
        uint256 tokenId = _tokenIdTracker;
        _tokenIdTracker++;
        _safeMint(to, tokenId);
        return tokenId;
    }


    /**
     * @notice Set the Claim contract address (for future use)
     * @param _claimContract Address of the Claim contract
     */
    function setClaimContract(address _claimContract) external {
        require(claimContract == address(0), "Claim contract already set");
        claimContract = _claimContract;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }


} 
