// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ParkingLot
 * @author matrix
 * @notice 一个简单的车位 NFT 合约
 */
contract ParkingLot is ERC721Burnable, Ownable {

    /**
     * @notice 车位结构体
     * @param id 车位 ID
     * @param name 车位名称
     * @param picture 车位图片
     * @param location 车位位置
     * @param owner 车位拥有者
     * @param renter 车位租户
     * @param rent_end_time 车位租赁结束时间
     * @param rent_price 车位租金
     * @param latitude 车位纬度
     * @param longitude 车位经度
     * @param create_time 车位创建时间
     * @param update_time 车位更新时间
     */
    struct ParkingSpot {
        uint256 id;
        string name;
        string picture;
        string location;
        address owner;
        address renter;
        uint256 rent_end_time;
        uint256 rent_price;
        int256 latitude;
        int256 longitude;
        uint256 create_time;
        uint256 update_time;
    }

    /**
     * @notice 存储所有车位
     */
    mapping(uint256 => ParkingSpot) public parkingSpots;

    /**
     * @notice 下一个车位 ID
     */
    uint256 public nextTokenId = 1;

    uint256 public activeSupply; // 只统计有效 NFT

    uint256[] public activeParkingSpots; // 存储有效 tokenId

    /**
     * @notice 铸造事件
     * @param tokenId 车位的唯一标识符
     */
    event ParkingSpotMinted(uint256 tokenId, address owner);

    /**
     * @notice 租用事件
     * @param tokenId 车位的唯一标识符
     */
    event ParkingSpotRented(uint256 tokenId, address renter,  uint256 rentStartTime, uint256 rentEndTime);
    
    /**
     * @notice 销毁事件
     * @param tokenId 车位的唯一标识符
     */
    event ParkingSpotBurned(uint256 tokenId);

    /**
     * @notice 更新事件
     * @param tokenId 车位的唯一标识符
     */
    event ParkingSpotUpdated(uint256 tokenId);

    /**
     * @notice 退租事件
     * @param tokenId 车位的唯一标识符
     * @param renter 租户
     * @param terminateRentalTime 退租时间
     */
    event ParkingSpotTerminateRental(uint256 tokenId, address renter, uint256 terminateRentalTime);

    constructor() ERC721("ParkingSpotNFT", "PSNFT") Ownable(msg.sender) {}

    /**
     * @notice 铸造车位
     * @param name The name of the parking lot
     * @param picture The picture of the parking lot
     * @param location The location of the parking lot
     * @param rentPrice The rent price of the parking lot
     * @param longitude The longitude of the parking lot
     * @param latitude The latitude of the parking lot
     */
    function mintParkingSpot(
        string memory name,
        string memory picture,
        string memory location,
        uint256 rentPrice,
        int256 longitude,
        int256 latitude
    ) public {
        uint256 tokenId = nextTokenId++;
        
        parkingSpots[tokenId] = ParkingSpot({
            id: tokenId,
            name: name,
            picture: picture,
            owner: msg.sender,
            location: location,
            renter: address(0),
            rent_end_time: 0,
            rent_price: rentPrice,
            latitude: latitude,
            longitude: longitude,
            create_time: block.timestamp,
            update_time: block.timestamp
        });

        _mint(msg.sender, tokenId);
        activeParkingSpots.push(tokenId);
        activeSupply++;

        emit ParkingSpotMinted(tokenId, msg.sender);
    }

    /**
     * @param tokenId 车位的唯一标识符
     * @param duration 车位的租赁时长
     */
    function rentParkingSpot(uint256 tokenId, uint256 duration) public payable {
        require(ownerOf(tokenId) != address(0), "Car spot does not exist");
        ParkingSpot storage spot = parkingSpots[tokenId];

        require(spot.renter == address(0) || block.timestamp > spot.rent_end_time, "Spot is already rented");
        
        // 要求租户不能是车位的拥有者
        require(msg.sender != spot.owner, "Owner cannot rent his own spot");

        spot.renter = msg.sender;
        spot.rent_end_time = block.timestamp + (duration * 1 days);

        (bool success, ) = payable(spot.owner).call{value: msg.value}("");
        require(success, "Transfer failed");

        emit ParkingSpotRented(tokenId, msg.sender, block.timestamp, spot.rent_end_time);
    }

    /**
     * 退租车位
     * @param tokenId 车位的唯一标识符
     */
    function terminateRentalParkingSpot(uint256 tokenId) public {
        ParkingSpot storage spot = parkingSpots[tokenId];
        
        require(ownerOf(tokenId) != address(0), "Parking spot does not exist");
        require(spot.renter != address(0), "This spot is not currently rented");
        require(msg.sender == spot.renter, "Only the renter can terminate the rental");

        spot.renter = address(0);
        spot.rent_end_time = 0;
        emit ParkingSpotTerminateRental(tokenId, msg.sender, block.timestamp);
    }

    /**
     * 销毁车位
     * @param tokenId 车位的唯一标识符
     */
    function burnParkingSpot(uint256 tokenId) public {
        require(ownerOf(tokenId) != address(0), "Parking spot does not exist");
        ParkingSpot storage spot = parkingSpots[tokenId];
        require(spot.owner == msg.sender, "You are not the owner of this parking spot");
        require(spot.renter == address(0) || block.timestamp > spot.rent_end_time, "Spot is currently rented");

        delete parkingSpots[tokenId]; 
        _burn(tokenId);

        // 从 activeParkingSpots 中移除
        for (uint i = 0; i < activeParkingSpots.length; i++) {
            if (activeParkingSpots[i] == tokenId) {
                activeParkingSpots[i] = activeParkingSpots[activeParkingSpots.length - 1];
                activeParkingSpots.pop();
                break;
            }
        }

        activeSupply--;

        emit ParkingSpotBurned(tokenId);
    }

    /**
     * 更新车位
     * @param tokenId 车位的唯一标识符
     * @param name 车位名称
     * @param picture 车位图片
     * @param location 车位位置
     * @param rentPrice 车位租金
     * @param longitude 车位经度
     * @param latitude 车位纬度
     */
    function updateParkingSpot(
        uint256 tokenId,
        string memory name,
        string memory picture,
        string memory location,
        uint256 rentPrice,
        int256 longitude,
        int256 latitude
    ) public {
        require(ownerOf(tokenId) == msg.sender, "Only the owner can update the parking spot");
        ParkingSpot storage spot = parkingSpots[tokenId];

        spot.name = name;
        spot.picture = picture;
        spot.location = location;
        spot.rent_price = rentPrice;
        spot.longitude = longitude;
        spot.latitude = latitude;
        spot.update_time = block.timestamp;

        emit ParkingSpotUpdated(tokenId);
    }

    /**
     * 获取所有车位
     * @return ParkingSpot[] 所有车位
     */
    function getAllParkingSpots() public view returns (ParkingSpot[] memory) {
        ParkingSpot[] memory spots = new ParkingSpot[](activeSupply);
        for (uint256 i = 0; i < activeParkingSpots.length; i++) {
            spots[i] = parkingSpots[activeParkingSpots[i]];
        }
        return spots;
    }

    /**
     * 获取我的车位
     * @return ParkingSpot[] 我的车位
     */
    function getMyParkingSpots() public view returns (ParkingSpot[] memory) {
        uint count = 0;
        for (uint256 i = 0; i < activeParkingSpots.length; i++) {
            if (parkingSpots[activeParkingSpots[i]].owner == msg.sender || parkingSpots[activeParkingSpots[i]].renter == msg.sender) {
                count++;
            }
        }

        ParkingSpot[] memory spots = new ParkingSpot[](count);
        uint index = 0;
        for (uint256 i = 0; i < activeParkingSpots.length; i++) {
            if (parkingSpots[activeParkingSpots[i]].owner == msg.sender || parkingSpots[activeParkingSpots[i]].renter == msg.sender) {
                spots[index] = parkingSpots[activeParkingSpots[i]];
                index++;
            }
        }
        return spots;
    }
}