interface HeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export default function Header({ title, subtitle, className = "" }: HeaderProps) {
  return (
    <div className={`max-w-4xl mx-auto pt-8 ${className}`}>
      <img src="/hamms-background.png" alt="" className="w-full" />
      <div className="text-center py-8 bg-white">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-5xl font-bold text-red-600 serif">{title}</h1>
        </div>
        {subtitle && (
          <p className="text-gray-600 text-lg">{subtitle}</p>
        )}
      </div>
    </div>
  );
}