// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

contract RewardToken {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public owner;
    bool private initialized;
    mapping(address => bool) public isMinner;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }

    modifier onlyMinner() {
        require(isMinner[msg.sender], "RewardToken: caller is not a minter");
        _;
    }

    constructor() {
        // ERC20 name, symbol are set in initialize
        // Owner is set in initialize
    }

    function initialize() public {
        require(!initialized, "RewardToken: contract already initialized");
        name = "RewardToken";
        symbol = "RWD";
        decimals = 18;
        owner = msg.sender;
        isMinner[owner] = true; // The deployer (owner) is a minter
        _mint(owner, 10000 * (10**uint256(decimals))); // Mint initial supply to the owner
        initialized = true;
        emit OwnershipTransferred(address(0), owner);
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "ERC20: mint to the zero address");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function mint(address to, uint256 amount) public onlyMinner {
        _mint(to, amount);
    }

    function setMinner(address _addr, bool _isMinner) external onlyOwner {
        isMinner[_addr] = _isMinner;
    }

    function transfer(address to, uint256 amount) public virtual returns (bool) {
        require(balanceOf[msg.sender] >= amount, "ERC20: transfer amount exceeds balance");
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public virtual returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        require(balanceOf[from] >= amount, "ERC20: transfer amount exceeds balance");
        _transfer(from, to, amount);
        _approve(from, msg.sender, currentAllowance - amount);
        return true;
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }

    function _approve(
        address _owner,
        address spender,
        uint256 amount
    ) internal virtual {
        require(_owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        allowance[_owner][spender] = amount;
        emit Approval(_owner, spender, amount);
    }

    function renounceOwnership() public virtual onlyOwner {
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}