// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CourseManager
 * @dev 课程管理合约 - 管理课程创建、购买和收益分配
 */
contract CourseManager is Ownable, ReentrancyGuard {
    IERC20 public ydToken;

    struct Course {
        uint256 id;
        string title;
        string description;
        address author;
        uint256 priceInYD;
        uint256 totalEnrolled;
        bool isActive;
        uint256 createdAt;
    }

    struct Purchase {
        uint256 courseId;
        uint256 purchasedAt;
    }

    // 课程存储
    mapping(uint256 => Course) public courses;
    uint256 public courseCount;

    // 用户购买记录：用户地址 => 课程ID => 是否已购买
    mapping(address => mapping(uint256 => bool)) public hasPurchased;

    // 用户购买的所有课程
    mapping(address => Purchase[]) public userPurchases;

    // 课程收益：课程ID => 总收益
    mapping(uint256 => uint256) public courseRevenue;

    // 平台手续费率（5%）
    uint256 public platformFeeRate = 5;

    // 平台累计收益
    uint256 public platformRevenue;

    // 事件
    event CourseCreated(uint256 indexed courseId, address indexed author, string title, uint256 price);
    event CoursePurchased(uint256 indexed courseId, address indexed student, uint256 price);
    event CourseUpdated(uint256 indexed courseId, uint256 newPrice);
    event RevenueWithdrawn(uint256 indexed courseId, address indexed author, uint256 amount);
    event PlatformFeeUpdated(uint256 newFeeRate);

    constructor(address _ydTokenAddress) Ownable(msg.sender) {
        ydToken = IERC20(_ydTokenAddress);
    }

    /**
     * @dev 创建课程
     */
    function createCourse(
        string memory title,
        string memory description,
        uint256 priceInYD
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(priceInYD > 0, "Price must be greater than 0");

        courseCount++;

        courses[courseCount] = Course({
            id: courseCount,
            title: title,
            description: description,
            author: msg.sender,
            priceInYD: priceInYD,
            totalEnrolled: 0,
            isActive: true,
            createdAt: block.timestamp
        });

        emit CourseCreated(courseCount, msg.sender, title, priceInYD);
        return courseCount;
    }

    /**
     * @dev 购买课程
     */
    function purchaseCourse(uint256 courseId) external nonReentrant {
        require(courseId > 0 && courseId <= courseCount, "Invalid course ID");
        require(courses[courseId].isActive, "Course is not active");
        require(!hasPurchased[msg.sender][courseId], "Already purchased this course");

        Course storage course = courses[courseId];
        require(msg.sender != course.author, "Cannot purchase your own course");

        uint256 price = course.priceInYD;

        // 计算平台手续费和作者收益
        uint256 platformFee = (price * platformFeeRate) / 100;
        uint256 authorRevenue = price - platformFee;

        // 从购买者转移代币到合约
        require(
            ydToken.transferFrom(msg.sender, address(this), price),
            "Token transfer failed"
        );

        // 记录购买
        hasPurchased[msg.sender][courseId] = true;
        userPurchases[msg.sender].push(Purchase({
            courseId: courseId,
            purchasedAt: block.timestamp
        }));

        // 更新统计数据
        course.totalEnrolled++;
        courseRevenue[courseId] += authorRevenue;
        platformRevenue += platformFee;

        emit CoursePurchased(courseId, msg.sender, price);
    }

    /**
     * @dev 更新课程价格
     */
    function updateCoursePrice(uint256 courseId, uint256 newPrice) external {
        require(courseId > 0 && courseId <= courseCount, "Invalid course ID");
        require(courses[courseId].author == msg.sender, "Only author can update price");
        require(newPrice > 0, "Price must be greater than 0");

        courses[courseId].priceInYD = newPrice;
        emit CourseUpdated(courseId, newPrice);
    }

    /**
     * @dev 作者提取课程收益
     */
    function withdrawCourseRevenue(uint256 courseId) external nonReentrant {
        require(courseId > 0 && courseId <= courseCount, "Invalid course ID");
        require(courses[courseId].author == msg.sender, "Only author can withdraw");

        uint256 revenue = courseRevenue[courseId];
        require(revenue > 0, "No revenue to withdraw");

        courseRevenue[courseId] = 0;
        require(ydToken.transfer(msg.sender, revenue), "Token transfer failed");

        emit RevenueWithdrawn(courseId, msg.sender, revenue);
    }

    /**
     * @dev 平台提取手续费收益
     */
    function withdrawPlatformRevenue() external onlyOwner nonReentrant {
        uint256 revenue = platformRevenue;
        require(revenue > 0, "No revenue to withdraw");

        platformRevenue = 0;
        require(ydToken.transfer(owner(), revenue), "Token transfer failed");
    }

    /**
     * @dev 更新平台手续费率
     */
    function updatePlatformFeeRate(uint256 newFeeRate) external onlyOwner {
        require(newFeeRate <= 20, "Fee rate too high (max 20%)");
        platformFeeRate = newFeeRate;
        emit PlatformFeeUpdated(newFeeRate);
    }

    /**
     * @dev 获取用户购买的所有课程
     */
    function getUserPurchases(address user) external view returns (Purchase[] memory) {
        return userPurchases[user];
    }

    /**
     * @dev 检查用户是否已购买某课程
     */
    function checkPurchase(address user, uint256 courseId) external view returns (bool) {
        return hasPurchased[user][courseId];
    }

    /**
     * @dev 获取课程详情
     */
    function getCourse(uint256 courseId) external view returns (Course memory) {
        require(courseId > 0 && courseId <= courseCount, "Invalid course ID");
        return courses[courseId];
    }
}
