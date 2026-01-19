import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Filter,
  DollarSign,
  Eye,
  EyeOff,
  ChevronDown,
  X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cloudAccountsApi, NetworkTopologyData, NetworkTopologyNode } from '@/lib/api/cloud-accounts';
import { ResourceNode } from './ResourceNode';
import { VpcNodeEnhanced } from './VpcNodeEnhanced';
import { SubnetNode } from './SubnetNode';
import dagre from 'dagre';

const nodeTypes = {
  vpc: VpcNodeEnhanced,
  subnet: SubnetNode,
  resource: ResourceNode,
};

interface NetworkTopologyDiagramProps {
  accountId: string;
}

// Layout helper function using dagre
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, ranksep: 100, nodesep: 50 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: node.type === 'vpc' ? 400 : (node.type === 'subnet' ? 350 : 80), 
      height: node.type === 'vpc' ? 300 : (node.type === 'subnet' ? 200 : 80) 
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - (node.type === 'vpc' ? 200 : (node.type === 'subnet' ? 175 : 40)),
      y: nodeWithPosition.y - (node.type === 'vpc' ? 150 : (node.type === 'subnet' ? 100 : 40))
    };

    return node;
  });

  return { nodes: layoutedNodes, edges };
};

const NetworkTopologyDiagramContent: React.FC<NetworkTopologyDiagramProps> = ({ accountId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showCostOverlay, setShowCostOverlay] = useState(true);
  const [selectedResourceTypes, setSelectedResourceTypes] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<NetworkTopologyNode | null>(null);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  // Fetch network topology data
  const { data: topologyData, isLoading, error } = useQuery<NetworkTopologyData>({
    queryKey: ['network-topology', accountId],
    queryFn: () => cloudAccountsApi.getNetworkTopology(accountId),
    enabled: !!accountId,
  });

  // Fetch resource relationships data
  const { data: relationshipsData } = useQuery({
    queryKey: ['resource-relationships', accountId],
    queryFn: () => cloudAccountsApi.getResourceRelationships(accountId),
    enabled: !!accountId,
  });

  // Get unique resource types from the data
  const resourceTypes = React.useMemo(() => {
    if (!topologyData?.nodes) return [];
    const types = new Set<string>();
    
    // Add VPC and SUBNET as selectable types
    types.add('VPC');
    types.add('SUBNET');
    types.add('VPC-PEERING');
    
    topologyData.nodes.forEach(node => {
      if (node.data.resourceType) {
        types.add(node.data.resourceType.toUpperCase());
      }
    });
    
    return Array.from(types).sort();
  }, [topologyData]);

  // Process and filter nodes based on selected resource types
  const processNodes = useCallback((rawNodes: NetworkTopologyNode[]) => {
    if (!rawNodes) return [];

    let filteredNodes = rawNodes;
    let additionalPeeringNodes: NetworkTopologyNode[] = [];

    // Apply multi-select resource type filter
    if (selectedResourceTypes.length > 0) {
      // When VPC is selected, automatically include VPC Peering
      const vpcSelected = selectedResourceTypes.includes('VPC');
      const adjustedTypes = vpcSelected 
        ? [...selectedResourceTypes, 'VPC-PEERING', 'VPC_PEERING'] 
        : selectedResourceTypes;
      
      filteredNodes = rawNodes.filter(node => {
        // For VPCs
        if (node.type === 'vpc') {
          // Show VPC if it's selected or if any of its children match
          if (vpcSelected) return true;
          
          const hasMatchingChildren = rawNodes.some(child => {
            if (child.parentId === node.id) {
              if (child.type === 'subnet' && adjustedTypes.includes('SUBNET')) return true;
              if (child.data.resourceType && adjustedTypes.includes(child.data.resourceType.toUpperCase())) return true;
            }
            return false;
          });
          
          return hasMatchingChildren;
        }
        
        // For Subnets
        if (node.type === 'subnet') {
          // Show subnet if it's selected or if any of its resources match
          if (adjustedTypes.includes('SUBNET')) return true;
          
          const hasMatchingResources = rawNodes.some(child => 
            child.parentId === node.id && 
            child.data.resourceType && 
            adjustedTypes.includes(child.data.resourceType.toUpperCase())
          );
          
          return hasMatchingResources;
        }
        
        // For Resources
        return node.data.resourceType && adjustedTypes.includes(node.data.resourceType.toUpperCase());
      });
      
      // If VPC is selected and we have VPC peering connections, include them
      if (vpcSelected) {
        const peeringConnections = rawNodes.filter(node => 
          node.data.resourceType && 
          ['vpc-peering', 'vpc_peering', 'VPC-PEERING', 'VPC_PEERING'].includes(node.data.resourceType)
        );
        additionalPeeringNodes = peeringConnections;
      }
    }

    // Combine filtered nodes with additional peering nodes
    const allNodes = [...filteredNodes, ...additionalPeeringNodes];
    
    // Extract VPC metadata and peering information
    const vpcMetadata = new Map();
    allNodes.forEach(node => {
      if (node.type === 'vpc') {
        const metadata = (node.data as any).metadata || {};
        vpcMetadata.set(node.id, {
          cidr: metadata.CidrBlock || metadata.cidr_block || null,
          isDefault: metadata.IsDefault || false,
          tenancy: metadata.InstanceTenancy || 'default',
          subnetCount: allNodes.filter(n => n.type === 'subnet' && n.parentId === node.id).length,
          peeringCount: 0, // Will be calculated below
        });
      }
    });
    
    // Count VPC peering connections
    allNodes.forEach(node => {
      if (node.data.resourceType && ['vpc-peering', 'vpc_peering'].includes(node.data.resourceType.toLowerCase())) {
        const metadata = (node.data as any).metadata || {};
        const accepterVpcId = metadata.AccepterVpcInfo?.VpcId;
        const requesterVpcId = metadata.RequesterVpcInfo?.VpcId;
        
        if (accepterVpcId && vpcMetadata.has(accepterVpcId)) {
          const vpc = vpcMetadata.get(accepterVpcId);
          vpc.peeringCount++;
        }
        if (requesterVpcId && vpcMetadata.has(requesterVpcId)) {
          const vpc = vpcMetadata.get(requesterVpcId);
          vpc.peeringCount++;
        }
      }
    });
    
    // Convert to ReactFlow nodes with proper styling and sizing
    const flowNodes = allNodes.map(node => {
      const baseNode = {
        ...node,
        data: {
          ...node.data,
          showCost: showCostOverlay,
          onClick: () => setSelectedNode(node),
        },
      };

      // Set proper dimensions based on node type
      if (node.type === 'vpc') {
        const vpcInfo = vpcMetadata.get(node.id) || {};
        return {
          ...baseNode,
          data: {
            ...baseNode.data,
            cidr: vpcInfo.cidr,
            isDefault: vpcInfo.isDefault,
            tenancy: vpcInfo.tenancy,
            subnetCount: vpcInfo.subnetCount,
            peeringCount: vpcInfo.peeringCount,
          },
          style: {
            width: 400,
            height: 300,
            padding: '20px',
            backgroundColor: 'transparent',
            border: 'none',
          }
        };
      } else if (node.type === 'subnet') {
        return {
          ...baseNode,
          style: {
            width: 350,
            height: 200,
            padding: '15px',
            backgroundColor: '#F0FDF4',
            border: '2px solid #22C55E',
            borderRadius: '8px',
          },
          extent: 'parent', // Keep subnet within VPC bounds
        };
      } else {
        return {
          ...baseNode,
          style: {
            width: 80,
            height: 80,
          },
          extent: 'parent', // Keep resource within subnet/VPC bounds
        };
      }
    });

    return flowNodes;
  }, [selectedResourceTypes, showCostOverlay]);

  // Process edges from relationships data and VPC peering
  const processEdges = useCallback((nodes: Node[]) => {
    const edges: Edge[] = [];
    
    // Add regular relationships
    if (relationshipsData?.relationships) {
      relationshipsData.relationships.forEach((rel, index) => {
        edges.push({
          id: `edge-${index}`,
          source: rel.sourceId,
          target: rel.targetId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        });
      });
    }
    
    // Add VPC peering edges when VPC is selected
    if (selectedResourceTypes.includes('VPC') && topologyData?.nodes) {
      const peeringNodes = topologyData.nodes.filter(node => 
        node.data.resourceType && 
        ['vpc-peering', 'vpc_peering'].includes(node.data.resourceType.toLowerCase())
      );
      
      peeringNodes.forEach((peeringNode, idx) => {
        const metadata = (peeringNode.data as any).metadata || {};
        const accepterVpcId = metadata.AccepterVpcInfo?.VpcId;
        const requesterVpcId = metadata.RequesterVpcInfo?.VpcId;
        const status = metadata.Status?.Code || 'unknown';
        
        // Only show active peering connections
        if (status === 'active' && accepterVpcId && requesterVpcId) {
          // Find VPC nodes in the current view
          const accepterNode = nodes.find(n => n.id === accepterVpcId);
          const requesterNode = nodes.find(n => n.id === requesterVpcId);
          
          if (accepterNode && requesterNode) {
            edges.push({
              id: `peering-${idx}`,
              source: requesterVpcId,
              target: accepterVpcId,
              sourceHandle: 'vpc-right',
              targetHandle: 'vpc-left',
              type: 'smoothstep',
              animated: true,
              label: 'VPC Peering',
              style: { 
                stroke: '#8B5CF6', 
                strokeWidth: 3,
                strokeDasharray: '5,5'
              },
              labelStyle: {
                fontSize: 11,
                fontWeight: 'bold',
                fill: '#8B5CF6'
              },
              labelBgStyle: {
                fill: 'white',
                fillOpacity: 0.9
              }
            });
          }
        }
      });
    }
    
    return edges;
  }, [relationshipsData, selectedResourceTypes, topologyData]);

  // Update nodes and edges when data changes or filter changes
  useEffect(() => {
    if (topologyData?.nodes && topologyData.nodes.length > 0) {
      const processedNodes = processNodes(topologyData.nodes);
      
      // Only apply layout if we have nodes to display
      if (processedNodes.length > 0) {
        // Group VPCs that are peered together
        const vpcGroups = new Map<string, Node[]>();
        const processedVpcs = processedNodes.filter(n => n.type === 'vpc');
        const nonVpcs = processedNodes.filter(n => n.type !== 'vpc');
        
        // Find peering connections to group VPCs
        if (selectedResourceTypes.includes('VPC')) {
          const peeringNodes = topologyData.nodes.filter(node => 
            node.data.resourceType && 
            ['vpc-peering', 'vpc_peering'].includes(node.data.resourceType.toLowerCase())
          );
          
          // Create VPC groups based on peering
          processedVpcs.forEach(vpc => {
            vpcGroups.set(vpc.id, [vpc]);
          });
          
          peeringNodes.forEach(peeringNode => {
            const metadata = (peeringNode.data as any).metadata || {};
            const accepterVpcId = metadata.AccepterVpcInfo?.VpcId;
            const requesterVpcId = metadata.RequesterVpcInfo?.VpcId;
            const status = metadata.Status?.Code || 'unknown';
            
            if (status === 'active' && accepterVpcId && requesterVpcId) {
              // Merge VPC groups if they're peered
              const accepterGroup = Array.from(vpcGroups.entries()).find(([key, group]) => 
                group.some(v => v.id === accepterVpcId)
              );
              const requesterGroup = Array.from(vpcGroups.entries()).find(([key, group]) => 
                group.some(v => v.id === requesterVpcId)
              );
              
              if (accepterGroup && requesterGroup && accepterGroup[0] !== requesterGroup[0]) {
                // Merge groups
                const mergedGroup = [...accepterGroup[1], ...requesterGroup[1]];
                vpcGroups.delete(requesterGroup[0]);
                vpcGroups.set(accepterGroup[0], mergedGroup);
              }
            }
          });
        } else {
          // No VPC grouping when VPC not selected
          processedVpcs.forEach(vpc => {
            vpcGroups.set(vpc.id, [vpc]);
          });
        }
        
        // Arrange grouped VPCs horizontally
        let groupX = 0;
        const arrangedNodes: Node[] = [];
        
        vpcGroups.forEach(group => {
          group.forEach((vpc, idx) => {
            vpc.position = { x: groupX + idx * 450, y: 0 };
            arrangedNodes.push(vpc);
          });
          groupX += group.length * 450 + 100; // Space between groups
        });
        
        // Add non-VPC nodes
        arrangedNodes.push(...nonVpcs);
        
        // Process edges after nodes are arranged
        const processedEdges = processEdges(arrangedNodes);
        
        // Apply automatic layout for better organization
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          arrangedNodes,
          processedEdges,
          'TB'
        );
        
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        
        // Fit view after setting nodes
        setTimeout(() => {
          if (fitView) {
            fitView({ padding: 0.2 });
          }
        }, 100);
      } else {
        // If no nodes match filter, show empty state
        setNodes([]);
        setEdges([]);
      }
    }
  }, [topologyData, selectedResourceTypes, showCostOverlay, processNodes, processEdges, setNodes, setEdges, fitView]);

  // Handle connection between nodes
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Export diagram as image
  const exportAsImage = () => {
    const svg = document.querySelector('.react-flow__viewport');
    if (svg) {
      // Implementation for SVG to PNG conversion
      alert('Export functionality will be implemented');
    }
  };

  // Reset view
  const resetView = () => {
    fitView({ padding: 0.2 });
  };

  // Toggle resource type selection
  const toggleResourceType = (type: string) => {
    setSelectedResourceTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load network topology. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {topologyData?.stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cost</p>
                  <p className="text-2xl font-bold">${topologyData.stats.totalCost || '0.00'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-blue-500 rounded" />
                <div>
                  <p className="text-sm font-medium text-gray-600">VPCs</p>
                  <p className="text-2xl font-bold">{topologyData.stats.totalVpcs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-gray-500 rounded" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Resources</p>
                  <p className="text-2xl font-bold">{topologyData.stats.totalResources}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Topology Diagram */}
      <Card>
        <CardHeader>
          <CardTitle>Network Topology</CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <div className="h-[600px] w-full border rounded-lg relative overflow-hidden">
            {/* Empty state when filtered nodes are empty */}
            {nodes.length === 0 && selectedResourceTypes.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/90">
                <div className="text-center">
                  <Filter className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-700">No Resources Found</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    No resources match the selected filters.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setSelectedResourceTypes([])}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
            
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              attributionPosition="bottom-left"
              defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
              preventScrolling={false}
              zoomOnScroll={false}
              zoomActivationKeyCode="Control"
              panOnScroll={false}
              panOnDrag={true}
              zoomOnDoubleClick={true}
              selectNodesOnDrag={false}
              proOptions={{ hideAttribution: true }}
            >
              <Controls />
              <MiniMap />
              <Background variant="dots" gap={12} size={1} />
              
              {/* Control Panel */}
              <Panel position="top-right" className="space-y-2">
                <div className="bg-white p-3 rounded-lg shadow-lg space-y-3 w-64">
                  {/* Scroll Instructions */}
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <div className="font-semibold mb-1">Navigation:</div>
                    <div>• Scroll: Navigate page</div>
                    <div>• Drag: Pan diagram</div>
                    <div>• Buttons: Zoom in/out</div>
                  </div>
                  {/* Cost Overlay Toggle */}
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="cost-overlay" 
                      checked={showCostOverlay}
                      onCheckedChange={setShowCostOverlay}
                    />
                    <Label htmlFor="cost-overlay" className="text-sm cursor-pointer">
                      {showCostOverlay ? (
                        <>
                          <Eye className="h-3 w-3 inline mr-1" />
                          Show Costs
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3 inline mr-1" />
                          Hide Costs
                        </>
                      )}
                    </Label>
                  </div>

                  {/* Multi-Select Resource Type Filter */}
                  <div className="space-y-1">
                    <Label className="text-sm flex items-center">
                      <Filter className="h-3 w-3 mr-1" />
                      Filter by Type
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-between"
                        >
                          <span className="truncate">
                            {selectedResourceTypes.length === 0
                              ? "All Types"
                              : selectedResourceTypes.length === 1
                              ? selectedResourceTypes[0]
                              : `${selectedResourceTypes.length} selected`}
                          </span>
                          <ChevronDown className="h-3 w-3 ml-2 flex-shrink-0" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2" align="start">
                        <div className="space-y-2">
                          {/* Clear All Button */}
                          {selectedResourceTypes.length > 0 && (
                            <div className="border-b pb-2 mb-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => setSelectedResourceTypes([])}
                              >
                                <X className="h-3 w-3 mr-2" />
                                Clear All
                              </Button>
                              {selectedResourceTypes.includes('VPC') && (
                                <div className="text-xs text-purple-600 px-2 mt-1">
                                  ✓ VPC Peering connections auto-included
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Resource Type Checkboxes */}
                          <div className="max-h-64 overflow-y-auto space-y-1">
                            {resourceTypes.map(type => (
                              <div
                                key={type}
                                className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 rounded"
                              >
                                <Checkbox
                                  id={type}
                                  checked={selectedResourceTypes.includes(type)}
                                  onCheckedChange={() => toggleResourceType(type)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Label
                                  htmlFor={type}
                                  className="text-sm cursor-pointer flex-1"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    toggleResourceType(type);
                                  }}
                                >
                                  {type}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    {selectedResourceTypes.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {selectedResourceTypes.length} types selected
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => zoomIn()}
                      title="Zoom In"
                    >
                      <ZoomIn className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => zoomOut()}
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={resetView}
                      title="Reset View"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={exportAsImage}
                      title="Export"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Panel>

              {/* Selected Node Info Panel */}
              {selectedNode && (
                <Panel position="bottom-right" className="bg-white p-4 rounded-lg shadow-lg max-w-sm">
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm">{selectedNode.data.label}</h3>
                    {selectedNode.data.resourceType && (
                      <Badge variant="outline">{selectedNode.data.resourceType}</Badge>
                    )}
                    {selectedNode.data.cost !== undefined && showCostOverlay && (
                      <p className="text-sm">
                        <span className="font-medium">Cost:</span> ${selectedNode.data.cost}
                      </p>
                    )}
                    {selectedNode.data.region && (
                      <p className="text-sm">
                        <span className="font-medium">Region:</span> {selectedNode.data.region}
                      </p>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setSelectedNode(null)}
                      className="w-full"
                    >
                      Close
                    </Button>
                  </div>
                </Panel>
              )}
            </ReactFlow>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const NetworkTopologyDiagram: React.FC<NetworkTopologyDiagramProps> = (props) => {
  return (
    <ReactFlowProvider>
      <NetworkTopologyDiagramContent {...props} />
    </ReactFlowProvider>
  );
};

export default NetworkTopologyDiagram;