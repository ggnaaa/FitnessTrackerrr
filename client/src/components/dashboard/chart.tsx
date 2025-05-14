interface ChartProps {
  data: {
    day: string;
    value: number;
    target?: number;
  }[];
  yAxisLabels?: string[];
}

export function WeightChart({ data, yAxisLabels = ["75kg", "70kg", "65kg", "60kg"] }: ChartProps) {
  return (
    <div className="h-full relative">
      {/* Chart Container */}
      <div className="absolute inset-0 flex items-end justify-between px-2">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center space-y-2">
            <div
              className="chart-bar bg-indigo-100 w-6 rounded-t-sm"
              style={{ height: `${100 - item.value}%` }}
            >
              <div
                className="bg-primary w-full rounded-t-sm"
                style={{ height: `${item.value}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">{item.day}</span>
          </div>
        ))}
      </div>

      {/* Y-axis labels */}
      <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-xs text-gray-500 py-6">
        {yAxisLabels.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
    </div>
  );
}
