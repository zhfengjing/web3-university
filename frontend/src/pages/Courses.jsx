import { useState, useEffect } from 'react';
import { useReadContract, useConfig } from 'wagmi';
import { readContract } from '@wagmi/core';
import { BookOpen, Search } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { CONTRACTS, COURSE_MANAGER_ABI } from '../config/contracts';
import { formatEther } from 'viem';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const config = useConfig();

  // 读取课程数量
  const { data: courseCount } = useReadContract({
    address: CONTRACTS.COURSE_MANAGER,
    abi: COURSE_MANAGER_ABI,
    functionName: 'courseCount',
  });

  // 加载所有课程
  useEffect(() => {
    if (courseCount) {
      loadCourses();
    }
  }, [courseCount]);

  const loadCourses = async () => {
    const loadedCourses = [];
    const count = Number(courseCount);

    for (let i = 1; i <= count; i++) {
      try {
        const course = await readContract(config, {
          address: CONTRACTS.COURSE_MANAGER,
          abi: COURSE_MANAGER_ABI,
          functionName: 'getCourse',
          args: [i],
        });

        loadedCourses.push({
          id: Number(course.id),
          title: course.title,
          description: course.description,
          author: course.author,
          priceInYD: formatEther(course.priceInYD),
          totalEnrolled: Number(course.totalEnrolled),
          isActive: course.isActive,
        });
      } catch (error) {
        console.error(`Error loading course ${i}:`, error);
      }
    }

    setCourses(loadedCourses);
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-12">
        <BookOpen className="h-16 w-16 text-blue-400 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4 gradient-text">探索课程</h1>
        <p className="text-gray-300">
          发现优质的Web3和区块链课程
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索课程..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-12"
          />
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="h-20 w-20 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            {searchTerm ? '未找到匹配的课程' : '暂无课程'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
