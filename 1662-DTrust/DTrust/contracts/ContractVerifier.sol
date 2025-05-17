// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./interfaces/IContractVerifier.sol";

// 定义合约验证器合约，继承自IContractVerifier接口
contract ContractVerifier is IContractVerifier {

    address public owner;

    mapping(address => UserInfo) private _userInfos;
    mapping(uint256 => ContractVersion[]) private _contractHistory;
    mapping(uint256 => ContractMeta) private _contractMetas;
    mapping(bytes32 => bool) private _hashExists;
    mapping(address => uint256[]) private _uploaderToContracts;
    mapping(uint256 => mapping(address => bool)) private _contractAccess;

    constructor() {
        owner = msg.sender;
    }

    function assignUserRole(address user) external override onlyOwner {
    _userInfos[user] = UserInfo("Uploader", "DPT");
    emit RoleAssigned(user, "Uploader", "DPT");
}


    function getUserInfo(address user) external view override returns (UserInfo memory) {
        return _userInfos[user];
    }

    function uploadContract(
        uint256 contractId,
        bytes32 fileHash,
        string calldata remark,
        string calldata contractType
    ) external override onlyUploader {
        ContractVersion memory version = ContractVersion({
            fileHash: fileHash,
            uploader: msg.sender,
            timestamp: block.timestamp,
            remark: remark
        });

        _contractHistory[contractId].push(version);
        if (_contractHistory[contractId].length == 1) {
            _contractMetas[contractId].contractType = contractType;
        }

        _hashExists[fileHash] = true;
        _uploaderToContracts[msg.sender].push(contractId);

        emit ContractUploaded(contractId, fileHash, msg.sender);
    }

    function grantAccessToContract(uint256 contractId, address user) external override onlyOwner {
        require(!_contractAccess[contractId][user], "Already granted");
        _contractAccess[contractId][user] = true;
        _contractMetas[contractId].allowedViewers.push(user);
        emit ContractAccessGranted(contractId, user);
    }

    function revokeAccessFromContract(uint256 contractId, address user) external override onlyOwner {
        require(_contractAccess[contractId][user], "Not granted");
        _contractAccess[contractId][user] = false;
        emit ContractAccessRevoked(contractId, user);
    }

    function canAccessContract(uint256 contractId, address user) external view override returns (bool) {
        return _contractAccess[contractId][user];
    }

    function getLatestHash(uint256 contractId) external view override returns (bytes32) {
        uint len = _contractHistory[contractId].length;
        require(len > 0, "No contract uploaded");
        return _contractHistory[contractId][len - 1].fileHash;
    }

    function getHistoryCount(uint256 contractId) external view override returns (uint256) {
        return _contractHistory[contractId].length;
    }

    function getHistory(uint256 contractId, uint256 version) external view override returns (ContractVersion memory) {
        require(version < _contractHistory[contractId].length, "Invalid version");
        return _contractHistory[contractId][version];
    }

    function getContractMeta(uint256 contractId) external view override returns (ContractMeta memory) {
        return _contractMetas[contractId];
    }

    function isHashExists(bytes32 fileHash) external view override returns (bool) {
        return _hashExists[fileHash];
    }

    function getUploaderHistory(address uploader) external view override returns (uint256[] memory) {
        return _uploaderToContracts[uploader];
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyUploader() {
        require(keccak256(bytes(_userInfos[msg.sender].role)) == keccak256("Uploader"), "Not uploader");
        _;
    }
}
