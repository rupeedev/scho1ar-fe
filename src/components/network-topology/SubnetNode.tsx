import React from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, GitBranch } from 'lucide-react';

interface SubnetNodeData {
  label: string;
  cost?: number;
  resourceCount?: number;
  showCost?: boolean;
  onClick?: () => void;
}

interface SubnetNodeProps {
  data: SubnetNodeData;
  selected?: boolean;
}

export const SubnetNode: React.FC<SubnetNodeProps> = ({ data, selected }) => {
  return (
    <div 
      className={`min-w-60 cursor-pointer transition-all duration-200 ${
        selected ? 'ring-2 ring-green-500' : ''
      }`}
      onClick={data.onClick}
    >
      <Card className="border-2 border-green-500 bg-green-50 shadow-md">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <GitBranch className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-green-900 text-sm">{data.label}</h4>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            {data.resourceCount !== undefined && (
              <span className="text-gray-600">
                {data.resourceCount} resources
              </span>
            )}
            
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