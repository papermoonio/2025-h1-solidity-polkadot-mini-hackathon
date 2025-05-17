// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

contract GovToken {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    uint256 public CLAIM_AMOUNT;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public hasClaimed;
    mapping(address => bool) public isMinner;

    address public owner;
    bool private initialized;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyMinner() {
        require(isMinner[msg.sender], "Not a minner");
        _;
    }

    constructor() {}

    function initialize() public {
        require(!initialized, "Contract already initialized");
        name = "GovToken";
        symbol = "GOV";
        decimals = 18;
        owner = msg.sender;
        isMinner[msg.sender] = true;
        initialized = true;
        CLAIM_AMOUNT = 100;
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        require(to != address(0), "Transfer to zero address");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");

        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(to != address(0), "Transfer to zero address");
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");

        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;

        emit Transfer(from, to, amount);
        return true;
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "Mint to zero address");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        require(from != address(0), "Burn from zero address");
        require(balanceOf[from] >= amount, "Burn amount exceeds balance");
        totalSupply -= amount;
        balanceOf[from] -= amount;
        emit Transfer(from, address(0), amount);
    }

    function mint(address to, uint256 amount) public onlyMinner {
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    function burnFrom(address _from,uint256 _amount) public onlyMinner(){
        _burn(_from, _amount);
    }

    /// @notice 用户一次性领取 GOV 代币
    function claim() external {
        require(!hasClaimed[msg.sender], "Already claimed");
        hasClaimed[msg.sender] = true;
        _mint(msg.sender, CLAIM_AMOUNT);
    }

    function checkClaimed() external view returns(bool) {
        return hasClaimed[msg.sender];
    }

    function setMinner(address _addr, bool _isMinner) external onlyOwner {
        isMinner[_addr] = _isMinner;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is zero address");
        address oldOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

