import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const HeatmapChart = ({ 
  data, 
  title = 'Usage Heatmap',
  xLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  yLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
  colorScale = ['#0f172a', '#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
}) => {
  const maxValue = useMemo(() => {
    return Math.max(...data.flat());
  }, [data]);

  const getColor = (value) => {
    if (maxValue === 0) return colorScale[0];
    const index = Math.min(
      Math.floor((value / maxValue) * (colorScale.length - 1)),
      colorScale.length - 1
    );
    return colorScale[index];
  };

  const getIntensity = (value) => {
    if (maxValue === 0) return 0;
    return (value / maxValue) * 100;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 rounded-xl p-6 border border-slate-800"
    >
      <h3 className="text-lg font-semibold text-white mb-6">{title}</h3>
      
      <TooltipProvider>
        <div className="space-y-2">
          {/* Header row with day labels */}
          <div className="flex">
            <div className="w-16" /> {/* Spacer for time labels */}
            {xLabels.map((label, index) => (
              <div 
                key={label} 
                className="flex-1 text-center text-xs text-slate-400 py-2"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="space-y-1">
            {data.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center">
                {/* Time label */}
                <div className="w-16 text-xs text-slate-400 pr-4">
                  {yLabels[rowIndex]}
                </div>
                
                {/* Row cells */}
                <div className="flex-1 flex gap-1">
                  {row.map((value, colIndex) => (
                    <Tooltip key={colIndex}>
                      <TooltipTrigger asChild>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: (rowIndex * 7 + colIndex) * 0.01 }}
                          className="flex-1 h-8 rounded cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-emerald-500/50"
                          style={{ 
                            backgroundColor: getColor(value),
                            opacity: 0.7 + (getIntensity(value) / 100) * 0.3
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent 
                        side="top" 
                        className="bg-slate-800 border-slate-700"
                      >
                        <div className="text-sm">
                          <div className="font-medium text-white">
                            {xLabels[colIndex]} {yLabels[rowIndex]}
                          </div>
                          <div className="text-slate-400">
                            {value} {value === 1 ? 'issue' : 'issues'}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {getIntensity(value).toFixed(0)}% intensity
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4">
            <span className="text-xs text-slate-400">Low</span>
            <div className="flex gap-0.5">
              {colorScale.map((color, index) => (
                <div 
                  key={index}
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-xs text-slate-400">High</span>
          </div>
        </div>
      </TooltipProvider>
    </motion.div>
  );
};

export default HeatmapChart;
