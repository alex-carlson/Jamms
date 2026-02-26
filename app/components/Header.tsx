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
        <h1 className="text-5xl font-bold mb-2 text-red-600 serif">{title}</h1>
        {subtitle && (
          <p className="text-gray-600 text-lg">{subtitle}</p>
        )}
      </div>
    </div>
  );
}