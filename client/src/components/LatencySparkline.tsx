import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  status?: 'operational' | 'degraded' | 'outage';
}

export const LatencySparkline: React.FC<SparklineProps> = ({
  data,
  width = 120,
  height = 32,
  status = 'operational'
}) => {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  const strokeColor =
    status === 'outage'
      ? '#f43f5e'
      : status === 'degraded'
      ? '#f59e0b'
      : '#10b981';

  const fillColor =
    status === 'outage'
      ? 'rgba(244, 63, 94, 0.15)'
      : status === 'degraded'
      ? 'rgba(245, 158, 11, 0.15)'
      : 'rgba(16, 185, 129, 0.15)';

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={areaD} fill={fillColor} />
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].split(',')[0]}
          cy={points[points.length - 1].split(',')[1]}
          r="2.5"
          fill={strokeColor}
          className="animate-ping"
        />
      )}
    </svg>
  );
};
