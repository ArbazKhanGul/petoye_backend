export default function StatsCard({ title, value, change, changeType, icon, trend, subtitle, color = "orange" }) {
  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1) + 'M';
      } else if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'K';
      }
      return val.toLocaleString();
    }
    return val;
  };

  const colorClasses = {
    orange: "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-md hover:shadow-lg",
    green: "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-md hover:shadow-lg", 
    yellow: "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 shadow-md hover:shadow-lg",
    red: "bg-gradient-to-br from-red-50 to-pink-50 border-red-200 shadow-md hover:shadow-lg",
    purple: "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-md hover:shadow-lg",
    blue: "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-md hover:shadow-lg",
  };

  const iconColorClasses = {
    orange: "text-orange-600",
    green: "text-green-600",
    yellow: "text-yellow-600", 
    red: "text-red-600",
    purple: "text-purple-600",
    blue: "text-blue-600",
  };

  return (
    <div className={`${colorClasses[color]} border-2 rounded-xl p-6 transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <span className={`text-3xl mr-3 ${iconColorClasses[color]} drop-shadow-sm`}>{icon}</span>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">{title}</p>
              <p className="text-3xl font-bold text-gray-800">{formatValue(value)}</p>
              {subtitle && (
                <p className="text-xs text-gray-600 mt-1 font-medium">{subtitle}</p>
              )}
              {change && (
                <p className={`text-sm font-medium ${
                  changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change} from last month
                </p>
              )}
            </div>
          </div>
        </div>
        
        {trend !== undefined && (
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold shadow-sm ${
              trend >= 0 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200'
            }`}>
              <span className="mr-1 text-lg">
                {trend >= 0 ? '📈' : '📉'}
              </span>
              {Math.abs(trend)}%
            </div>
            <p className="text-xs text-gray-600 mt-1 font-medium">vs last month</p>
          </div>
        )}
      </div>
    </div>
  );
}
