import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { Button } from '@/components/ui/button';

interface ChartData {
  name: string;
  costs: number;
  savings: number;
}

interface CostChartProps {
  data?: ChartData[];
  isLoading?: boolean;
  title?: string;
}

const sampleData = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const month = 'Apr';
  return {
    name: `${day} ${month}`,
    costs: 315,
    savings: 0,
  };
});

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 text-white p-3 rounded shadow-lg text-sm">
        <p className="mb-1 font-medium">{`${label}`}</p>
        <p className="text-xs">Costs: ${payload[0].value}</p>
        <p className="text-xs">Savings: ${payload[1].value}</p>
      </div>
    );
  }
  return null;
};

const CostChart = ({ data = sampleData, isLoading = false, title = "Costs vs savings trend" }: CostChartProps) => {
  return (
    <div className="bg-white rounded-md border border-gray-200 p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">{title}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs h-8">
            Chart
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8 bg-transparent text-gray-500">
            Table
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="h-64 w-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-500">Loading cost data...</span>
          </div>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 25,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={{ stroke: '#e0e0e0' }}
                height={50}
                interval={4}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="costs" fill="#0ea5e9" />
              <Bar dataKey="savings" fill="#65B741" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default CostChart;