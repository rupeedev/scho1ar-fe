import React from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Network, Globe, Shield, Server } from 'lucide-react';

interface VpcNodeData {
  label: string;
  cost?: number;
  resourceCount?: number;
  region?: string;
  showCost?: boolean;
  onClick?: () => void;
  cidr?: string;
  isDefault?: boolean;
  tenancy?: string;
  subnetCount?: number;
  peeringCount?: number;
}

interface VpcNodeProps {
  data: VpcNodeData;
  selected?: boolean;
}

export const VpcNodeEnhanced: React.FC<VpcNodeProps> = ({ data, selected }) => {
  return (
    <div 
      className={`min-w-96 cursor-pointer transition-all duration-200 ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={data.onClick}
    >
      <Card className="border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-lg">
        <CardHeader className="pb-2 px-4 pt-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Network className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900 text-sm">{data.label}</h3>
                {data.isDefault && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    Default
                  </Badge>
                )}
              </div>
              
              {/* CIDR Block Display */}
              {data.cidr && (
                <div className="flex items-center space-x-1 mt-1">
                  <Globe className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-mono text-blue-800 bg-blue-200/50 px-2 py-0.5 rounded">
                    {data.cidr}
                  </span>
                </div>
              )}
            </div>
            
            {data.region && (
              <Badge variant="outline" className="text-xs ml-2">
                {data.region}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="px-4 pb-3 pt-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Resource Count */}
            <div className="flex items-center space-x-1">
              <Server className="h-3 w-3 text-gray-500" />
              <span className="text-gray-600">
                {data.resourceCount || 0} resources
              </span>
            </div>
            
            {/* Subnet Count */}
            {data.subnetCount !== undefined && (
              <div className="flex items-center space-x-1">
                <Network className="h-3 w-3 text-gray-500" />
                <span className="text-gray-600">
                  {data.subnetCount} subnets
                </span>
              </div>
            )}
            
            {/* Peering Connections */}
            {data.peeringCount !== undefined && data.peeringCount > 0 && (
              <div className="flex items-center space-x-1">
                <Shield className="h-3 w-3 text-purple-500" />
                <span className="text-purple-600 font-medium">
                  {data.peeringCount} peering
                </span>
              </div>
            )}
            
            {/* Tenancy */}
            {data.tenancy && data.tenancy !== 'default' && (
              <div className="flex items-center space-x-1">
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {data.tenancy}
                </Badge>
              </div>
            )}
          </div>
          
          {/* Cost Display */}
          {data.showCost && data.cost !== undefined && (
            <div className="flex items-center justify-end mt-2 pt-2 border-t">
              <div className="flex items-center space-x-1 text-emerald-600 font-semibold">
                <DollarSign className="h-3 w-3" />
                <span className="text-sm">${data.cost.toFixed(2)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Connection handles for peering connections */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="vpc-top"
        className="w-3 h-3 bg-purple-500 border-2 border-white" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="vpc-bottom"
        className="w-3 h-3 bg-purple-500 border-2 border-white" 
      />
      <Handle 
        type="source" 
        position={Position.Left} 
        id="vpc-left"
        className="w-3 h-3 bg-purple-500 border-2 border-white" 
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="vpc-right"
        className="w-3 h-3 bg-purple-500 border-2 border-white" 
      />
    </div>
  );
};