import Link from "next/link";

interface NavigationProps {
  currentPage: 'power-hour' | 'popular-jamms';
  className?: string;
}

export default function Navigation({ currentPage, className = "" }: NavigationProps) {
  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="bg-white p-4">
        <nav className="flex gap-4 justify-center">
          <Link 
            href="/"
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              currentPage === 'power-hour'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 hover:from-blue-500 hover:via-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            🍺 Power Hour
          </Link>
          <Link 
            href="/popular-jamms"
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              currentPage === 'popular-jamms'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 hover:from-yellow-500 hover:via-amber-500 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
            }`}
          >
            Popular Jamms ✨
          </Link>
        </nav>
      </div>
    </div>
  );
}