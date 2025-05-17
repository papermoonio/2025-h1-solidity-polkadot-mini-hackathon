// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IContractVerifier{
    struct ContractVersion {
        bytes32 fileHash;
        address uploader;
        uint256 timestamp;
        string remark;
    }

    struct ContractMeta {
        string contractType; // 如“采购类”、“销售类”等
        address[] allowedViewers; // 允许访问该合约的地址列表
    }

    struct UserInfo {
        string role; // 如 "Uploader", "Business", "Auditor"
        string departmentId;
    }

    // === 事件 ===
    event ContractUploaded(uint256 indexed contractId, bytes32 fileHash, address indexed uploader);
    event ContractAccessGranted(uint256 indexed contractId, address indexed user);
    event ContractAccessRevoked(uint256 indexed contractId, address indexed user);
    event RoleAssigned(address indexed user, string role, string departmentId);

    // === 权限管理 ===
    function assignUserRole(address user) external;
    function getUserInfo(address user) external view returns (UserInfo memory);

    // === 合同上传与访问控制 ===
    function uploadContract(
        uint256 contractId,
        bytes32 fileHash,
        string calldata remark,
        string calldata contractType
    ) external;

    function grantAccessToContract(uint256 contractId, address user) external;
    function revokeAccessFromContract(uint256 contractId, address user) external;
    function canAccessContract(uint256 contractId, address user) external view returns (bool);

    // === 查询接口 ===
    function getLatestHash(uint256 contractId) external view returns (bytes32);
    function getHistoryCount(uint256 contractId) external view returns (uint256);
    function getHistory(uint256 contractId, uint256 version) external view returns (ContractVersion memory);
    function getContractMeta(uint256 contractId) external view returns (ContractMeta memory);
    function isHashExists(bytes32 fileHash) external view returns (bool);

    // === 可选辅助 ===
    function getUploaderHistory(address uploader) external view returns (uint256[] memory contractIds);
}
