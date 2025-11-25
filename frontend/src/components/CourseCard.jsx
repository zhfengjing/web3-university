import { Link } from 'react-router-dom';
import { BookOpen, User, TrendingUp } from 'lucide-react';

export default function CourseCard({ course }) {
  return (
    <Link to={`/courses/${course.id}`}>
      <div className="card hover:scale-105 transition-transform duration-300 h-full">
        <div className="flex flex-col h-full">
          {/* Course Image Placeholder */}
          <div className="w-full h-48 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg mb-4 flex items-center justify-center">
            <BookOpen className="h-20 w-20 text-blue-400 opacity-50" />
          </div>

          {/* Course Info */}
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2 text-white">{course.title}</h3>
            <p className="text-gray-300 text-sm mb-4 line-clamp-2">
              {course.description}
            </p>
          </div>

          {/* Course Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <User className="h-4 w-4" />
              <span>{course.totalEnrolled || 0} 学生</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-lg font-bold text-green-400">
                {course.priceInYD} YD
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
