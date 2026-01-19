import React, { useState, useMemo, useCallback } from 'react';
import { PlusCircle, X, Filter, ChevronRight, Loader2, Play, Square, AlertCircle, Search, Calendar, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Resource, CloudAccount } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useOrganizations } from '@/hooks/queries/use-organizations';
import { useCloudAccounts } from '@/hooks/queries/use-cloud-accounts';
import { useResources, useStartResource, useStopResource } from '@/hooks/queries/use-resources';
import { awsApi } from '@/lib/api/aws';
import { useQuery } from '@tanstack/react-query';
import { resourcesApi } from '@/lib/api/resources';

const ResourcesTab = () => {
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [currentFilter, setCurrentFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  
  // Pagination state for performance
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50); // Show 50 resources per page

  // Date range for filtering resources by creation date - Set to wide range to show all resources by default
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return {
      startDate: oneYearAgo,
      endDate: now
    };
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch user's organizations
  const { data: organizations, isLoading: organizationsLoading, error: organizationsError } = useOrganizations();
  const organization = organizations?.[0];

  // Fetch cloud accounts for the organization
  const { data: cloudAccounts, isLoading: accountsLoading, error: accountsError } = useCloudAccounts(organization?.id || null);

  // Create a combined query for all resources with date range filtering
  const { data: allResources = [], isLoading: resourcesLoading, error: resourcesError, refetch: refetchAllResources } = useQuery({
    queryKey: ['all-resources', cloudAccounts?.map(a => a.id), dateRange],
    queryFn: async () => {
      if (!cloudAccounts?.length) return [];
      
      // Prepare date range filters for backend
      const dateFilters = {
        created_after: dateRange.startDate.toISOString(),
        created_before: dateRange.endDate.toISOString()
      };
      
      const resourcePromises = cloudAccounts.map(account => 
        resourcesApi.getAll(account.id, dateFilters).catch(error => {
          console.warn(`Failed to fetch resources for account ${account.id}:`, error);
          return [];
        })
      );
      
      const resourceArrays = await Promise.all(resourcePromises);
      return resourceArrays.flat();
    },
    enabled: !!cloudAccounts?.length,
    staleTime: 5 * 60 * 1000, // 5 minutes cache since we're now doing backend filtering
    refetchOnWindowFocus: false, // Don't auto-refetch on window focus
    refetchOnReconnect: false, // Don't auto-refetch on reconnect
  });

  // Loading state
  const isLoading = organizationsLoading || accountsLoading || resourcesLoading;

  // Error state  
  const hasError = organizationsError || accountsError || resourcesError;

  // Resource control hooks
  const startResourceMutation = useStartResource();
  const stopResourceMutation = useStopResource();

  // Resource selection
  const toggleResourceSelection = (id: string) => {
    if (selectedResources.includes(id)) {
      setSelectedResources(selectedResources.filter(resourceId => resourceId !== id));
    } else {
      setSelectedResources([...selectedResources, id]);
    }
  };

  const toggleAllResources = () => {
    if (selectedResources.length === allResources.length) {
      setSelectedResources([]);
    } else {
      setSelectedResources(allResources.map(resource => resource.id));
    }
  };

  // Filter resources by type
  const filterByType = (type: string | null) => {
    setCurrentFilter(type);
    resetPagination();
  };

  // Reset all filters
  const resetFilters = () => {
    setCurrentFilter(null);
    setStatusFilter(null);
    setRegionFilter(null);
    setAccountFilter(null);
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    setDateRange({
      startDate: oneYearAgo,
      endDate: now
    });
    resetPagination();
  };

  // Individual resource control functions
  const handleStartResource = async (resourceId: string) => {
    try {
      await awsApi.controlResource(resourceId, 'start');
      toast({
        title: 'Resource Started',
        description: 'Resource start command sent successfully',
      });
    } catch (error) {
      console.error('Error starting resource:', error);
      toast({
        title: 'Start Failed',
        description: 'Failed to start resource',
        variant: 'destructive',
      });
    }
  };

  const handleStopResource = async (resourceId: string) => {
    try {
      await awsApi.controlResource(resourceId, 'stop');
      toast({
        title: 'Resource Stopped',
        description: 'Resource stop command sent successfully',
      });
    } catch (error) {
      console.error('Error stopping resource:', error);
      toast({
        title: 'Stop Failed',
        description: 'Failed to stop resource',
        variant: 'destructive',
      });
    }
  };

  // Bulk resource control
  const controlResources = async (action: 'start' | 'stop') => {
    if (selectedResources.length === 0) {
      toast({
        title: 'No resources selected',
        description: 'Please select at least one resource to perform this action',
      });
      return;
    }

    try {
      // Process resources sequentially to avoid overwhelming the API
      for (const resourceId of selectedResources) {
        try {
          await awsApi.controlResource(resourceId, action);
        } catch (error) {
          console.error(`Error ${action}ing resource ${resourceId}:`, error);
          toast({
            title: 'Action Failed',
            description: `Failed to ${action} resource ${resourceId}`,
            variant: 'destructive',
          });
        }
      }
      
      toast({
        title: 'Success',
        description: `${selectedResources.length} resources ${action} command sent`,
      });
      
      // Clear selection after action
      setSelectedResources([]);
      
    } catch (error) {
      console.error(`Error ${action}ing resources:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} resources`,
        variant: 'destructive',
      });
    }
  };

  // Helper function to format resource type names for display
  const formatResourceTypeDisplayName = useCallback((type: string): string => {
    const typeMap: Record<string, string> = {
      'CLOUDWATCH_METRIC': 'CloudWatch Metrics',
      'CLOUDWATCH_ALARM': 'CloudWatch Alarms', 
      'CLOUDWATCH_DASHBOARD': 'CloudWatch Dashboards',
      'EC2_INSTANCE': 'EC2 Instances',
      'EBS_VOLUME': 'EBS Volumes',
      'SUBNET': 'Subnets',
      'VPC': 'VPCs',
      'INTERNET_GATEWAY': 'Internet Gateways',
      'NAT_GATEWAY': 'NAT Gateways',
      'RDS_INSTANCE': 'RDS Instances',
      'RDS_SNAPSHOT': 'RDS Snapshots',
      'DYNAMODB_TABLE': 'DynamoDB Tables',
      'S3_BUCKET': 'S3 Buckets',
      'ECS_CLUSTER': 'ECS Clusters',
      'ECS_SERVICE': 'ECS Services',
      'ECS_TASK': 'ECS Tasks',
      'ELB': 'Load Balancers',
      'LAMBDA_FUNCTION': 'Lambda Functions'
    };
    
    return typeMap[type] || type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  // Memoized account ID lookup map for performance
  const accountIdMap = useMemo(() => {
    if (!cloudAccounts) return {};
    return cloudAccounts.reduce((acc, account) => {
      acc[account.id] = account.account_id_on_provider;
      return acc;
    }, {} as Record<string, string>);
  }, [cloudAccounts]);

  // Optimized account ID getter
  const getAccountId = useCallback((accountId: string) => {
    return accountIdMap[accountId] || 'Unknown Account ID';
  }, [accountIdMap]);

  // Memoized resource type counts for performance
  const resourceTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allResources.forEach(resource => {
      const type = resource.resource_type.toUpperCase();
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [allResources]);

  // Memoized top resource types for dynamic filter tabs - show more types
  const topResourceTypes = useMemo(() => {
    return Object.entries(resourceTypeCounts)
      .sort(([,a], [,b]) => b - a) // Sort by count (highest to lowest)
      .slice(0, 15) // Show top 15 types instead of 6 for better visibility
      .map(([type, count]) => ({
        type,
        count,
        displayName: formatResourceTypeDisplayName(type)
      }));
  }, [resourceTypeCounts, formatResourceTypeDisplayName]);

  // Get unique status values with counts
  const getStatusOptions = () => {
    const statusCounts: Record<string, number> = {};
    allResources.forEach(resource => {
      const status = resource.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    return Object.entries(statusCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([status, count]) => ({ status, count }));
  };

  // Get unique region values with counts
  const getRegionOptions = () => {
    const regionCounts: Record<string, number> = {};
    allResources.forEach(resource => {
      const region = resource.region || 'unknown';
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    });
    return Object.entries(regionCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([region, count]) => ({ region, count }));
  };

  // Get unique account values with counts
  const getAccountOptions = () => {
    const accountCounts: Record<string, number> = {};
    allResources.forEach(resource => {
      const accountId = getAccountId(resource.cloud_account_id);
      accountCounts[accountId] = (accountCounts[accountId] || 0) + 1;
    });
    return Object.entries(accountCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([accountId, count]) => ({ accountId, count }));
  };

  // Export resources data to CSV
  const exportResourcesCSV = () => {
    try {
      const csvHeaders = [
        'Resource Name',
        'Type',
        'Status',
        'Account ID',
        'Region', 
        'Created Date',
        'Monthly Cost',
        'Potential Savings'
      ];
      
      const csvRows = filteredResources.map(resource => [
        resource.resource_name || resource.resource_id_on_provider || '',
        resource.resource_type || '',
        resource.status || '',
        getAccountId(resource.cloud_account_id),
        resource.region || '',
        resource.created_at ? new Date(resource.created_at).toLocaleDateString() : '',
        resource.metadata?.monthlyCost ? `$${resource.metadata.monthlyCost}` : '',
        resource.metadata?.potentialSavings ? `$${resource.metadata.potentialSavings}` : ''
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      // Generate filename with filter context
      let csvFilename = 'resources';
      if (currentFilter) {
        csvFilename += `-${currentFilter.toLowerCase().replace(/_/g, '-')}`;
      }
      csvFilename += `-${new Date().toISOString().split('T')[0]}.csv`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', csvFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Export Successful',
        description: 'Resources exported to CSV successfully',
      });
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export resources to CSV',
        variant: 'destructive',
      });
    }
  };

  // Export resources data to PDF
  const exportResourcesPDF = () => {
    try {
      const totalMonthlyCost = filteredResources.reduce((sum, resource) => 
        sum + (resource.metadata?.monthlyCost || 0), 0
      );
      const totalPotentialSavings = filteredResources.reduce((sum, resource) => 
        sum + (resource.metadata?.potentialSavings || 0), 0
      );

      // Get unique resource types from filtered resources
      const filteredResourceTypes = new Set(filteredResources.map(resource => resource.resource_type));
      const filteredResourceTypesCount = filteredResourceTypes.size;

      // Get filter information for report context
      const filterInfo = [];
      if (currentFilter) {
        filterInfo.push(`Resource Type: ${formatResourceTypeDisplayName(currentFilter)}`);
      }
      if (statusFilter) {
        filterInfo.push(`Status: ${statusFilter}`);
      }
      if (regionFilter) {
        filterInfo.push(`Region: ${regionFilter}`);
      }
      if (accountFilter) {
        filterInfo.push(`Account: ${accountFilter}`);
      }

      // Create printable HTML content optimized for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Resources Report</title>
          <meta charset="UTF-8">
          <style>
            @media print {
              @page { 
                margin: 0.5in; 
                size: A4; 
              }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
                margin: 0; 
                padding: 0;
                font-size: 12px;
                line-height: 1.4;
              }
            }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
              margin: 20px; 
              padding: 0;
              font-size: 12px;
              line-height: 1.4;
              color: #333;
            }
            h1 { 
              color: #059669; 
              border-bottom: 3px solid #059669; 
              padding-bottom: 10px; 
              margin-bottom: 20px;
              font-size: 24px;
              font-weight: bold;
            }
            .summary { 
              background: #f0fdf4; 
              padding: 15px; 
              border-radius: 8px; 
              margin-bottom: 20px; 
              border: 1px solid #bbf7d0;
            }
            .summary p {
              margin: 5px 0;
              font-size: 13px;
            }
            .stats { 
              display: grid; 
              grid-template-columns: repeat(3, 1fr); 
              gap: 15px; 
              margin-bottom: 25px; 
            }
            .stat-card { 
              background: white; 
              border: 2px solid #e5e7eb; 
              border-radius: 8px; 
              padding: 15px; 
              text-align: center; 
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .stat-value { 
              font-size: 20px; 
              font-weight: bold; 
              color: #059669; 
              margin-bottom: 5px;
            }
            .stat-label { 
              font-size: 11px; 
              color: #6b7280; 
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-weight: 600;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px; 
              font-size: 10px;
              border: 1px solid #d1d5db;
            }
            th, td { 
              border: 1px solid #d1d5db; 
              padding: 8px 6px; 
              text-align: left; 
              vertical-align: top;
            }
            th { 
              background-color: #059669; 
              color: white; 
              font-size: 9px; 
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            tr:nth-child(even) { 
              background-color: #f9fafb; 
            }
            .status-badge { 
              padding: 3px 6px; 
              border-radius: 10px; 
              font-size: 8px; 
              font-weight: bold; 
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            .status-running { 
              background: #dcfce7; 
              color: #166534; 
              border: 1px solid #bbf7d0;
            }
            .status-stopped { 
              background: #fee2e2; 
              color: #991b1b; 
              border: 1px solid #fecaca;
            }
            .status-pending { 
              background: #fef3c7; 
              color: #92400e; 
              border: 1px solid #fed7aa;
            }
            .resource-name {
              font-weight: 600;
              color: #374151;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
              font-size: 10px;
              color: #6b7280;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <h1>Resources Report</h1>
          <div class="summary">
            <p><strong>Total Resources:</strong> ${filteredResources.length}</p>
            <p><strong>Date Range:</strong> ${format(dateRange.startDate, "MMM d, yyyy")} - ${format(dateRange.endDate, "MMM d, yyyy")}</p>
            ${filterInfo.length > 0 ? `<p><strong>Applied Filters:</strong> ${filterInfo.join(', ')}</p>` : ''}
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value">$${totalMonthlyCost.toFixed(2)}</div>
              <div class="stat-label">Total Monthly Cost</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">$${totalPotentialSavings.toFixed(2)}</div>
              <div class="stat-label">Potential Savings</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${filteredResourceTypesCount}</div>
              <div class="stat-label">Resource Types</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 25%;">Resource Name</th>
                <th style="width: 12%;">Type</th>
                <th style="width: 10%;">Status</th>
                <th style="width: 15%;">Account</th>
                <th style="width: 12%;">Region</th>
                <th style="width: 10%;">Created</th>
                <th style="width: 8%;">Monthly Cost</th>
                <th style="width: 8%;">Potential Savings</th>
              </tr>
            </thead>
            <tbody>
              ${filteredResources.map(resource => {
                let statusClass = 'status-pending';
                if (resource.status?.toLowerCase().includes('running') || resource.status?.toLowerCase().includes('available')) {
                  statusClass = 'status-running';
                } else if (resource.status?.toLowerCase().includes('stop') || resource.status?.toLowerCase().includes('terminate')) {
                  statusClass = 'status-stopped';
                }
                
                return `
                  <tr>
                    <td class="resource-name">${resource.resource_name || resource.resource_id_on_provider || ''}</td>
                    <td>${resource.resource_type || ''}</td>
                    <td><span class="status-badge ${statusClass}">${resource.status || 'unknown'}</span></td>
                    <td>${getAccountId(resource.cloud_account_id)}</td>
                    <td>${resource.region || ''}</td>
                    <td>${resource.created_at ? new Date(resource.created_at).toLocaleDateString() : ''}</td>
                    <td>${resource.metadata?.monthlyCost ? `$${resource.metadata.monthlyCost.toFixed(2)}` : '-'}</td>
                    <td>${resource.metadata?.potentialSavings ? `$${resource.metadata.potentialSavings.toFixed(2)}` : '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Generated by Scho1ar Solution - Cloud Resource Management Platform</p>
          </div>
          
          <script>
            // Auto-trigger print dialog for PDF generation
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
        </html>
      `;

      // Generate filename with filter context
      let filename = 'resources-report';
      if (currentFilter) {
        filename += `-${currentFilter.toLowerCase().replace(/_/g, '-')}`;
      }
      filename += `-${new Date().toISOString().split('T')[0]}.html`;

      // Create blob and open in new window for printing to PDF
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window to trigger print dialog
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      } else {
        // Fallback: download as HTML file
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
      }
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      toast({
        title: 'PDF Export Started',
        description: 'Print dialog opened - save as PDF to complete export',
      });
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export resources to PDF',
        variant: 'destructive',
      });
    }
  };

  // Helper function to get metadata display for different resource types
  const getMetadataDisplay = (resource: Resource) => {
    const metadata = resource.metadata || {};
    const resourceType = resource.resource_type.toLowerCase();
    switch (resourceType) {
      case 'ec2_instance':
        return metadata.instance_type ? `${metadata.instance_type}` : '';
      case 'vpc':
        return metadata.cidrBlock ? `CIDR: ${metadata.cidrBlock}` : '';
      case 'subnet':
        const az = metadata.availabilityZone;
        const cidr = metadata.cidrBlock;
        return [az && `AZ: ${az}`, cidr && `CIDR: ${cidr}`].filter(Boolean).join(' • ');
      case 's3_bucket':
        const encryption = metadata.encryption;
        const versioning = metadata.versioning;
        return [encryption && `${encryption}`, versioning && 'Versioned'].filter(Boolean).join(' • ');
      case 'internet_gateway':
      case 'nat_gateway':
        return metadata.vpcId ? `VPC: ${metadata.vpcId}` : '';
      default:
        return '';
    }
  };

  // Resource type counts and top types are now memoized above

  // Filter resources based on current filter (date range now handled by backend)
  const filteredResources = useMemo(() => {
    let filtered = allResources;

    // Note: Date range filtering is now handled by backend API

    // Apply type filter
    if (currentFilter) {
      filtered = filtered.filter(res => {
        return res.resource_type.toUpperCase() === currentFilter.toUpperCase();
      });
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(res => {
        return (res.status || 'unknown') === statusFilter;
      });
    }

    // Apply region filter
    if (regionFilter) {
      filtered = filtered.filter(res => {
        return (res.region || 'unknown') === regionFilter;
      });
    }

    // Apply account filter
    if (accountFilter) {
      filtered = filtered.filter(res => {
        return getAccountId(res.cloud_account_id) === accountFilter;
      });
    }

    return filtered;
  }, [allResources, currentFilter, statusFilter, regionFilter, accountFilter]);

  // Paginated resources for performance (only render current page)
  const paginatedResources = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredResources.slice(startIndex, endIndex);
  }, [filteredResources, currentPage, pageSize]);

  // Reset to first page when filters change
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Calculate pagination info
  const totalPages = Math.ceil(filteredResources.length / pageSize);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return (
    <div className="bg-gray-50/30">
      {/* Enhanced filter section with seamless background */}
      <div className="bg-gradient-to-b from-gray-50/60 via-emerald-50/40 to-gray-50/30 p-6 border-b border-emerald-200/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
        </div>
      </div>

      {/* Dynamic resource type navigation with seamless background blend */}
      <div className="bg-gradient-to-b from-gray-50/40 via-emerald-50/30 to-gray-50/20 p-6 border-b border-emerald-200/20">
        <div className="overflow-x-auto">
          <div className="flex gap-3 justify-start min-w-max pb-2">
          {isLoading ? (
            // Skeleton loading for filter tabs
            Array.from({ length: 7 }, (_, i) => (
              <div
                key={`filter-skeleton-${i}`}
                className="px-6 py-3 rounded-xl flex items-center gap-2 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"
              >
                <div className="h-4 w-20 bg-gray-300 rounded animate-pulse"></div>
                <div className="h-5 w-8 bg-gray-300 rounded-full animate-pulse"></div>
              </div>
            ))
          ) : (
            <>
              {/* All Resources filter */}
              <button
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  !currentFilter 
                    ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white shadow-xl transform scale-105' 
                    : 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:scale-105'
                }`}
                onClick={() => filterByType(null)}
              >
                <span>All Resources</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  !currentFilter 
                    ? 'bg-white/20 text-white backdrop-blur-sm' 
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {allResources.length}
                </span>
              </button>
              
              {/* Dynamic resource type filters with emerald gradient styling */}
              {topResourceTypes.map(({ type, count, displayName }) => (
                <button
                  key={type}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    currentFilter === type 
                      ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white shadow-xl transform scale-105' 
                      : 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:scale-105'
                  }`}
                  onClick={() => filterByType(type)}
                >
                  <span>{displayName}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    currentFilter === type 
                      ? 'bg-white/20 text-white backdrop-blur-sm' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {count}
                  </span>
                </button>
              ))}
            </>
          )}
          </div>
        </div>
        
        {/* Scroll hint when there are many filter types */}
        {topResourceTypes.length > 8 && (
          <div className="text-xs text-gray-500 text-center mt-2">
            ← Scroll horizontally to see all resource types →
          </div>
        )}
      </div>

      {/* Enhanced table section with seamless background integration */}
      <div className="bg-gradient-to-b from-gray-50/5 via-gray-50/10 to-gray-50/20 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50/40 via-emerald-50/20 to-gray-50/40 border-b border-emerald-200/20 backdrop-blur-sm">
          <div className="flex items-center justify-end gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-emerald-50/60 border-emerald-200/50 hover:bg-emerald-100/70 hover:scale-105 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300 shadow-sm backdrop-blur-sm flex items-center gap-2"
                >
                  <Download size={14} className="text-emerald-500" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl border-gray-200 shadow-lg">
                <DropdownMenuItem 
                  onClick={exportResourcesCSV}
                  className="rounded-lg cursor-pointer flex items-center gap-2 hover:bg-emerald-50"
                >
                  <FileSpreadsheet size={16} className="text-green-600" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={exportResourcesPDF}
                  className="rounded-lg cursor-pointer flex items-center gap-2 hover:bg-emerald-50"
                >
                  <FileText size={16} className="text-blue-600" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/50 text-emerald-700 font-medium rounded-xl px-4 py-2.5 transition-all duration-300 hover:scale-105"
                >
                  <Calendar className="mr-2 h-4 w-4 text-emerald-500" />
                  {format(dateRange.startDate, "MMM d, yyyy")} - {format(dateRange.endDate, "MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl border-gray-200 shadow-lg" align="end" side="top" sideOffset={20} avoidCollisions={true} collisionPadding={20}>
                <div className="p-6 space-y-6">
                  {/* Quick Preset Buttons */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Select</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const endDate = new Date();
                          const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                          setDateRange({ startDate, endDate });
                        }}
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:scale-105 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300"
                      >
                        Last 7 Days
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const endDate = new Date();
                          const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
                          setDateRange({ startDate, endDate });
                        }}
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:scale-105 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300"
                      >
                        Last 14 Days
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const endDate = new Date();
                          const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
                          setDateRange({ startDate, endDate });
                        }}
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:scale-105 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300"
                      >
                        Last 28 Days
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const endDate = new Date();
                          const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                          setDateRange({ startDate, endDate });
                        }}
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:scale-105 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300"
                      >
                        Last 30 Days
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const endDate = new Date();
                          const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                          setDateRange({ startDate, endDate });
                        }}
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:scale-105 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300"
                      >
                        Last 90 Days
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const now = new Date();
                          const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                          const endDate = new Date();
                          setDateRange({ startDate, endDate });
                        }}
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:scale-105 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300"
                      >
                        Current Month
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const now = new Date();
                          const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                          const endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                          setDateRange({ startDate, endDate });
                        }}
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:scale-105 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300"
                      >
                        Last Month
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const now = new Date();
                          const quarter = Math.floor(now.getMonth() / 3);
                          const startDate = new Date(now.getFullYear(), quarter * 3, 1);
                          const endDate = new Date();
                          setDateRange({ startDate, endDate });
                        }}
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:scale-105 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300"
                      >
                        Q{Math.floor(new Date().getMonth() / 3) + 1}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const now = new Date();
                          const startDate = new Date(now.getFullYear(), 0, 1);
                          const endDate = new Date();
                          setDateRange({ startDate, endDate });
                        }}
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:scale-105 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300"
                      >
                        Current Year
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const now = new Date();
                          const startDate = new Date(now.getFullYear() - 1, 0, 1);
                          const endDate = new Date(now.getFullYear() - 1, 11, 31);
                          setDateRange({ startDate, endDate });
                        }}
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:scale-105 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300"
                      >
                        Last Year
                      </Button>
                    </div>
                  </div>

                  {/* Side-by-side Calendars */}
                  <div className="flex gap-4">
                    <div>
                      <div className="text-sm font-medium mb-2 text-center">Start Date</div>
                      <CalendarComponent
                        mode="single"
                        selected={dateRange.startDate}
                        onSelect={(date) => {
                          if (date) {
                            setDateRange(prev => ({ 
                              ...prev, 
                              startDate: date,
                              // If start date is after end date, adjust end date
                              endDate: date > prev.endDate ? date : prev.endDate
                            }));
                          }
                        }}
                        disabled={(date) => date > new Date()}
                        className="rounded-md border"
                        numberOfMonths={1}
                      />
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2 text-center">End Date</div>
                      <CalendarComponent
                        mode="single"
                        selected={dateRange.endDate}
                        onSelect={(date) => {
                          if (date) {
                            setDateRange(prev => ({ 
                              ...prev, 
                              endDate: date,
                              // If end date is before start date, adjust start date
                              startDate: date < prev.startDate ? date : prev.startDate
                            }));
                          }
                        }}
                        disabled={(date) => date > new Date()}
                        className="rounded-md border"
                        numberOfMonths={1}
                      />
                    </div>
                  </div>

                  {/* Apply/Cancel Buttons */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowDatePicker(false)}
                    >
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const now = new Date();
                        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                        setDateRange({
                          startDate: oneYearAgo,
                          endDate: now
                        });
                        setShowDatePicker(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-emerald-50/60 border-emerald-200/50 hover:bg-emerald-100/70 hover:scale-105 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300 shadow-sm backdrop-blur-sm"
                >
                  <Filter size={14} className="text-emerald-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl border-gray-200 shadow-lg max-h-96 overflow-y-auto">
                {/* Clear All Filters */}
                <DropdownMenuLabel className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Filters</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={resetFilters}
                  className="rounded-lg cursor-pointer text-emerald-600 hover:bg-emerald-50"
                >
                  Clear All Filters
                </DropdownMenuItem>
                
                {/* Resource Type Filter */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Resource Type</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => setCurrentFilter(null)}
                  className={`rounded-lg cursor-pointer ${!currentFilter ? 'bg-emerald-50 text-emerald-700' : ''}`}
                >
                  All Types ({resourceTypeCounts ? Object.values(resourceTypeCounts).reduce((a, b) => a + b, 0) : 0})
                </DropdownMenuItem>
                {topResourceTypes.map(({ type, count, displayName }) => (
                  <DropdownMenuItem 
                    key={type}
                    onClick={() => setCurrentFilter(type)}
                    className={`rounded-lg cursor-pointer ${currentFilter === type ? 'bg-emerald-50 text-emerald-700' : ''}`}
                  >
                    {displayName} ({count})
                  </DropdownMenuItem>
                ))}
                
                {/* Status Filter */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Status</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => setStatusFilter(null)}
                  className={`rounded-lg cursor-pointer ${!statusFilter ? 'bg-emerald-50 text-emerald-700' : ''}`}
                >
                  All Statuses
                </DropdownMenuItem>
                {getStatusOptions().map(({ status, count }) => (
                  <DropdownMenuItem 
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-lg cursor-pointer ${statusFilter === status ? 'bg-emerald-50 text-emerald-700' : ''}`}
                  >
                    {status} ({count})
                  </DropdownMenuItem>
                ))}
                
                {/* Region Filter */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Region</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => setRegionFilter(null)}
                  className={`rounded-lg cursor-pointer ${!regionFilter ? 'bg-emerald-50 text-emerald-700' : ''}`}
                >
                  All Regions
                </DropdownMenuItem>
                {getRegionOptions().map(({ region, count }) => (
                  <DropdownMenuItem 
                    key={region}
                    onClick={() => setRegionFilter(region)}
                    className={`rounded-lg cursor-pointer ${regionFilter === region ? 'bg-emerald-50 text-emerald-700' : ''}`}
                  >
                    {region} ({count})
                  </DropdownMenuItem>
                ))}
                
                {/* Account Filter */}
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Account</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => setAccountFilter(null)}
                  className={`rounded-lg cursor-pointer ${!accountFilter ? 'bg-emerald-50 text-emerald-700' : ''}`}
                >
                  All Accounts
                </DropdownMenuItem>
                {getAccountOptions().map(({ accountId, count }) => (
                  <DropdownMenuItem 
                    key={accountId}
                    onClick={() => setAccountFilter(accountId)}
                    className={`rounded-lg cursor-pointer ${accountFilter === accountId ? 'bg-emerald-50 text-emerald-700' : ''}`}
                  >
                    {accountId} ({count})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="bg-gradient-to-b from-gray-50/10 via-white/30 to-gray-50/15 backdrop-blur-sm">
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow className="border-b border-emerald-200/20 bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30 backdrop-blur-sm">
                  <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Resource Name</TableHead>
                  <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Status</TableHead>
                  <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Account</TableHead>
                  <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Region</TableHead>
                  <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Created</TableHead>
                  <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Team</TableHead>
                  <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">
                    Monthly Cost
                  </TableHead>
                  <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">
                    Potential Savings
                  </TableHead>
                  <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30">Schedule</TableHead>
                  <TableHead className="w-[30px] py-4 px-6 bg-gradient-to-r from-emerald-50/30 via-gray-50/20 to-emerald-50/30"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
            {isLoading ? (
              // Enhanced skeleton loading for better perceived performance
              Array.from({ length: 10 }, (_, i) => (
                <TableRow key={`skeleton-${i}`} className="border-b border-emerald-200/10">
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col gap-2">
                      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full w-20 animate-pulse"></div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-32 animate-pulse"></div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-24 animate-pulse"></div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-12 animate-pulse"></div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-16 animate-pulse"></div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-20 animate-pulse"></div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-8 animate-pulse"></div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex gap-1">
                      <div className="h-8 w-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-pulse"></div>
                      <div className="h-8 w-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : hasError ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center py-12">
                  <div className="flex flex-col justify-center items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">Error loading resources</h3>
                      <p className="text-sm text-gray-500">Please try again or contact support if the issue persists.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredResources.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-32 text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="text-center">
                      {currentFilter ? (
                        <>
                          <h3 className="text-sm font-medium text-gray-900 mb-1">No resources found</h3>
                          <p className="text-sm text-gray-500">No resources match the filter "{currentFilter}"</p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-sm font-medium text-gray-900 mb-1">No AWS resources discovered yet</h3>
                          <p className="text-sm text-gray-500 mb-4">
                            Connect your AWS account to start discovering resources
                          </p>
                          <Link 
                            to="/onboarding" 
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-150"
                          >
                            Go to Cloud Accounts
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedResources.map((resource) => (
                <TableRow key={resource.id} className="border-b border-emerald-200/10 hover:bg-gradient-to-r hover:from-emerald-50/20 hover:via-gray-50/10 hover:to-emerald-50/20 transition-all duration-200 backdrop-blur-sm">
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col">
                      <Link
                        to={`/resources/${resource.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-150"
                      >
                        {resource.resource_name || resource.resource_id_on_provider}
                      </Link>
                      <div className="text-xs text-gray-500 mt-1">
                        {resource.resource_type}
                        {getMetadataDisplay(resource) && ` • ${getMetadataDisplay(resource)}`}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span 
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        resource.status?.toLowerCase().includes('stop') || resource.status?.toLowerCase().includes('terminate') 
                          ? 'bg-red-100 text-red-800'
                          : resource.status?.toLowerCase().includes('running') || resource.status?.toLowerCase().includes('available')
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {resource.status || 'unknown'}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="text-sm font-medium text-gray-900">{getAccountId(resource.cloud_account_id)}</div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className="text-sm text-gray-700">{resource.region}</span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="text-sm text-gray-900">{formatDate(resource.created_at).date}</div>
                    <div className="text-xs text-gray-500">{formatDate(resource.created_at).time}</div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className="text-sm text-gray-700">{resource.team?.name || '-'}</span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className="text-sm font-medium text-gray-900">
                      {resource.metadata?.monthlyCost ? formatCurrency(resource.metadata.monthlyCost) : '-'}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className="text-sm font-medium text-green-600">
                      {resource.metadata?.potentialSavings ? formatCurrency(resource.metadata.potentialSavings) : '-'}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <span className="text-sm text-gray-700">-</span>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center justify-end gap-1">
                      {/* EC2 instance controls */}
                      {resource.resource_type.toLowerCase() === 'ec2_instance' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartResource(resource.id)}
                            disabled={resource.status?.toLowerCase().includes('running') || false}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors duration-150"
                            title="Start instance"
                          >
                            <Play size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStopResource(resource.id)}
                            disabled={resource.status?.toLowerCase().includes('stop') || false}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors duration-150"
                            title="Stop instance"
                          >
                            <Square size={14} />
                          </Button>
                        </>
                      )}
                      <Link to={`/resources/${resource.id}`}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-150"
                        >
                          <ChevronRight size={14} />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {filteredResources.length > pageSize && (
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50/40 via-emerald-50/20 to-gray-50/40 border-t border-emerald-200/20">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredResources.length)} of {filteredResources.length} resources
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!hasPrevPage}
                  className="bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/50 text-emerald-700 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300 disabled:opacity-50"
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 p-0 text-xs font-medium rounded-lg transition-all duration-300 ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white shadow-lg'
                            : 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/50 text-emerald-700'
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!hasNextPage}
                  className="bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100/50 text-emerald-700 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourcesTab;