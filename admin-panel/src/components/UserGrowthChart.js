export default function UserGrowthChart({ data }) {
  // Simple chart implementation without external libraries
  const maxValue = Math.max(...data.map(item => item.count), 1);
  
  return (
    <div className="h-64 flex items-end justify-between space-x-1">
      {data.length === 0 ? (
        <div className="flex items-center justify-center w-full h-full text-gray-500">
          No data available
        </div>
      ) : (
        data.map((item, index) => {
          const height = (item.count / maxValue) * 100;
          return (
            <div key={item._id} className="flex flex-col items-center">
              <div className="text-xs text-gray-500 mb-1">
                {item.count}
              </div>
              <div
                className="bg-blue-500 w-8 rounded-t"
                style={{ height: `${Math.max(height, 5)}%` }}
                title={`${item._id}: ${item.count} users`}
              ></div>
              <div className="text-xs text-gray-400 mt-1 transform rotate-45 origin-bottom-left w-16">
                {new Date(item._id).getMonth() + 1}/{new Date(item._id).getDate()}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
