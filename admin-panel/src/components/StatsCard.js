import { COLORS } from '@/lib/colors';

export default function StatsCard({ title, value, change, changeType, icon, trend, subtitle, variant = "primary" }) {
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

  const cardClasses = {
    primary: "bg-gradient-to-br from-surface-900 to-surface-800 border-primary shadow-lg hover:shadow-xl",
    secondary: "bg-gradient-to-br from-dark-800 to-dark-700 border-secondary shadow-lg hover:shadow-xl",
    accent: "bg-gradient-to-br from-surface-900 to-surface-800 border-accent shadow-lg hover:shadow-xl",
    success: "bg-gradient-to-br from-surface-900 to-surface-800 border-green-500 shadow-lg hover:shadow-xl",
    warning: "bg-gradient-to-br from-surface-900 to-surface-800 border-yellow-500 shadow-lg hover:shadow-xl",
    error: "bg-gradient-to-br from-surface-900 to-surface-800 border-red-500 shadow-lg hover:shadow-xl",
  };

  const iconColorClasses = {
    primary: "text-primary",
    secondary: "text-white",
    accent: "text-accent",
    success: "text-green-500",
    warning: "text-yellow-500",
    error: "text-red-500",
  };

  return (
    <div className={`${cardClasses[variant]} border-2 rounded-xl p-6 transition-all duration-300 hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <span className={`text-3xl mr-3 ${iconColorClasses[variant]} drop-shadow-sm`}>{icon}</span>
            <div>
              <p className="text-sm font-semibold text-white opacity-70 mb-1">{title}</p>
              <p className="text-3xl font-bold text-white">{formatValue(value)}</p>
              {subtitle && (
                <p className="text-xs text-white opacity-50 mt-1 font-medium">{subtitle}</p>
              )}
              {change && (
                <p className={`text-sm font-medium ${
                  changeType === 'positive' ? 'text-green-500' : 'text-red-500'
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
                ? 'bg-gradient-to-r from-green-800 to-green-700 text-green-400 border border-green-500' 
                : 'bg-gradient-to-r from-red-800 to-red-700 text-red-400 border border-red-500'
            }`}>
              <span className="mr-1 text-lg">
                {trend >= 0 ? '📈' : '📉'}
              </span>
              {Math.abs(trend)}%
            </div>
            <p className="text-xs text-white opacity-50 mt-1 font-medium">vs last month</p>
          </div>
        )}
      </div>
    </div>
  );
}
