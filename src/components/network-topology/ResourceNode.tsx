import React from 'react';
import { Handle, Position } from 'reactflow';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';
import { getAwsResourceIcon } from '@/components/ui/aws-icons';

interface ResourceNodeData {
  label: string;
  resourceType?: string;
  status?: string;
  cost?: number;
  region?: string;
  tags?: any;
  showCost?: boolean;
  onClick?: () => void;
}

interface ResourceNodeProps {
  data: ResourceNodeData;
  selected?: boolean;
}

const getResourceColor = (resourceType?: string, status?: string) => {
  if (status === 'stopped' || status === 'terminated') {
    return 'bg-gray-100 border-gray-400 text-gray-700';
  }
  
  switch (resourceType) {
    case 'ec2':
      return 'bg-orange-100 border-orange-500 text-orange-900';
    case 'rds':
      return 'bg-blue-100 border-blue-500 text-blue-900';
    case 'lambda':
      return 'bg-yellow-100 border-yellow-500 text-yellow-900';
    case 'load-balancer':
      return 'bg-purple-100 border-purple-500 text-purple-900';
    case 'security-group':
      return 'bg-green-100 border-green-500 text-green-900';
    case 's3':
      return 'bg-red-100 border-red-500 text-red-900';
    case 'vpc':
      return 'bg-blue-100 border-blue-500 text-blue-900';
    case 'subnet':
      return 'bg-green-100 border-green-500 text-green-900';
    default:
      return 'bg-gray-100 border-gray-500 text-gray-900';
  }
};

export const ResourceNode: React.FC<ResourceNodeProps> = ({ data, selected }) => {
  const colorClass = getResourceColor(data.resourceType, data.status);
  const Icon = data.resourceType ? () => getAwsResourceIcon(data.resourceType, "h-6 w-6") : null;

  return (
    <div 
      className={`cursor-pointer transition-all duration-200 ${
        selected ? 'ring-2 ring-indigo-500' : ''
      }`}
      onClick={data.onClick}
    >
      <div className={`
        w-20 h-20 rounded-lg border-2 shadow-sm
        flex flex-col items-center justify-center p-1
        hover:shadow-md transition-shadow
        ${colorClass}
      `}>
        {/* Resource Icon */}
        {Icon && (
          <Icon className="h-6 w-6 mb-1" />
        )}
        
        {/* Resource Label */}
        <div className="text-center">
          <p className="text-xs font-medium truncate w-full" title={data.label}>
            {data.label.length > 8 ? `${data.label.substring(0, 8)}...` : data.label}
          </p>
          
          {/* Status Badge */}
          {data.status && (
            <Badge 
              variant={data.status === 'running' ? 'default' : 'secondary'}
              className="text-xs px-1 py-0 mt-1"
            >
              {data.status.charAt(0).toUpperCase()}
            </Badge>
          )}
        </div>
        
        {/* Cost Overlay */}
        {data.showCost && data.cost !== undefined && data.cost > 0 && (
          <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs px-1 py-0.5 rounded-full flex items-center">
            <DollarSign className="h-2 w-2" />
            <span>{data.cost.toFixed(0)}</span>
          </div>
        )}
      </div>
      
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <Handle type="source" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
};