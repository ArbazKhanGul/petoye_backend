import { COLORS } from '@/lib/colors';

export default function UserGrowthChart({ data }) {
  // Simple chart implementation without external libraries
  const maxValue = Math.max(...data.map(item => item.count), 1);
  
  return (
    <div className="h-64 flex items-end justify-between space-x-1">
      {data.length === 0 ? (
        <div className={`flex items-center justify-center w-full h-full text-${COLORS.TEXT_SECONDARY}`}>
          No data available
        </div>
      ) : (
        data.map((item, index) => {
          const height = (item.count / maxValue) * 100;
          return (
            <div key={item._id} className="flex flex-col items-center">
              <div className={`text-xs text-${COLORS.TEXT_SECONDARY} mb-1`}>
                {item.count}
              </div>
              <div
                className={`bg-${COLORS.PRIMARY} w-8 rounded-t hover:bg-${COLORS.ACCENT} transition-colors duration-200`}
                style={{ height: `${Math.max(height, 5)}%` }}
                title={`${item._id}: ${item.count} users`}
              ></div>
              <div className={`text-xs text-${COLORS.TEXT_MUTED} mt-1 transform rotate-45 origin-bottom-left w-16`}>
                {new Date(item._id).getMonth() + 1}/{new Date(item._id).getDate()}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
