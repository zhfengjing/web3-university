export const CONTRACTS = {
  YD_TOKEN: import.meta.env.VITE_YD_TOKEN_ADDRESS || '',
  COURSE_MANAGER: import.meta.env.VITE_COURSE_MANAGER_ADDRESS || '',
  AAVE_INTEGRATION: import.meta.env.VITE_AAVE_INTEGRATION_ADDRESS || '',
};

export const YD_TOKEN_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function buyTokens() payable",
  "function tokenPrice() view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

export const COURSE_MANAGER_ABI = [
  "function createCourse(string memory title, string memory description, uint256 priceInYD) returns (uint256)",
  "function purchaseCourse(uint256 courseId)",
  "function getCourse(uint256 courseId) view returns (tuple(uint256 id, string title, string description, address author, uint256 priceInYD, uint256 totalEnrolled, bool isActive, uint256 createdAt))",
  "function courseCount() view returns (uint256)",
  "function getUserPurchases(address user) view returns (tuple(uint256 courseId, uint256 purchasedAt)[])",
  "function checkPurchase(address user, uint256 courseId) view returns (bool)",
  "function updateCoursePrice(uint256 courseId, uint256 newPrice)",
  "function withdrawCourseRevenue(uint256 courseId)",
  "function courseRevenue(uint256 courseId) view returns (uint256)",
  "event CourseCreated(uint256 indexed courseId, address indexed author, string title, uint256 price)",
  "event CoursePurchased(uint256 indexed courseId, address indexed student, uint256 price)",
];

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
