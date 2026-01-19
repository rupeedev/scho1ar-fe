import React from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Network } from 'lucide-react';

interface VpcNodeData {
  label: string;
  cost?: number;
  resourceCount?: number;
  region?: string;
  showCost?: boolean;
  onClick?: () => void;
}

interface VpcNodeProps {
  data: VpcNodeData;
  selected?: boolean;
}

export const VpcNode: React.FC<VpcNodeProps> = ({ data, selected }) => {
  return (
    <div 
      className={`min-w-80 cursor-pointer transition-all duration-200 ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={data.onClick}
    >
      <Card className="border-2 border-blue-500 bg-blue-50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Network className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">{data.label}</h3>
            </div>
            {data.region && (
              <Badge variant="outline" className="text-xs">
                {data.region}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              {data.resourceCount !== undefined && (
                <span className="text-gray-600">
                  {data.resourceCount} resources
                </span>
              )}
            </div>
            
            {data.showCost && data.cost !== undefined && (
              <div className="flex items-center space-x-1 text-emerald-600 font-semibold">
                <DollarSign className="h-3 w-3" />
                <span>${data.cost.toFixed(2)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <Handle type="source" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
};