import React, { useState, useEffect } from 'react';
import { Search, Loader2, ChevronDown, Calendar, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/utils';
import { 
  auditLogsApi, 
  AuditLog, 
  AuditLogFilters, 
  AuditLogAction, 
  AuditLogResource 
} from '@/lib/api/audit-logs';
import AuditLogStats from './AuditLogStats';
import AuditLogDetailModal from './AuditLogDetailModal';
import { organizationsApi } from '@/lib/api/organizations';
import { cloudTrailSyncApi } from '@/lib/api/cloudtrail-sync';
import { cloudAccountsApi } from '@/lib/api/cloud-accounts';

const EVENT_TYPE_COLORS: Record<string, string> = {
  'create': 'bg-green-100 text-green-800',
  'update': 'bg-blue-100 text-blue-800',
  'delete': 'bg-red-100 text-red-800',
  'start': 'bg-green-100 text-green-800',
  'stop': 'bg-yellow-100 text-yellow-800',
  'sync': 'bg-cyan-100 text-cyan-800',
  'login': 'bg-purple-100 text-purple-800',
  'logout': 'bg-purple-100 text-purple-800',
  'settings_change': 'bg-blue-100 text-blue-800',
  'permission_change': 'bg-orange-100 text-orange-800',
  'schedule_execution': 'bg-indigo-100 text-indigo-800',
  'schedule_failed': 'bg-red-100 text-red-800',
  'resource_discovered': 'bg-emerald-100 text-emerald-800',
  'cost_sync': 'bg-teal-100 text-teal-800',
  'budget_exceeded': 'bg-pink-100 text-pink-800',
  // CloudTrail actions
  'read': 'bg-gray-100 text-gray-800',
  'assume_role': 'bg-amber-100 text-amber-800',
  'execute': 'bg-violet-100 text-violet-800',
  'LookupEvents': 'bg-sky-100 text-sky-800'
};

const RESOURCE_TYPE_COLORS: Record<string, string> = {
  'user': 'bg-purple-100 text-purple-800',
  'organization': 'bg-blue-100 text-blue-800',
  'cloud_account': 'bg-green-100 text-green-800',
  'resource': 'bg-yellow-100 text-yellow-800',
  'schedule': 'bg-indigo-100 text-indigo-800',
  'team': 'bg-orange-100 text-orange-800',
  'cost': 'bg-pink-100 text-pink-800',
  'settings': 'bg-gray-100 text-gray-800',
  'system': 'bg-slate-100 text-slate-800',
  // AWS Services
  'EC2': 'bg-orange-100 text-orange-800',
  'SSM': 'bg-blue-100 text-blue-800',
  'XRAY': 'bg-purple-100 text-purple-800',
  'TAGGING': 'bg-green-100 text-green-800',
  'STS': 'bg-amber-100 text-amber-800',
  'MONITORING': 'bg-indigo-100 text-indigo-800',
  'LOGS': 'bg-cyan-100 text-cyan-800',
  'CloudTrail': 'bg-emerald-100 text-emerald-800',
  'CONFIG': 'bg-red-100 text-red-800',
  'ELB': 'bg-yellow-100 text-yellow-800'
};

// Extended list to include CloudTrail actions
const AUDIT_ACTIONS: any[] = [
  // Application actions
  'create',
  'update',
  'delete',
  'start',
  'stop',
  'sync',
  'login',
  'logout',
  'settings_change',
  'permission_change',
  'schedule_execution',
  'schedule_failed',
  'resource_discovered',
  'cost_sync',
  'budget_exceeded',
  // CloudTrail actions
  'read',
  'assume_role',
  'execute',
  'LookupEvents'
];

// Extended list to include AWS service types
const AUDIT_RESOURCES: any[] = [
  // Application resources
  'user',
  'organization',
  'cloud_account',
  'resource',
  'schedule',
  'team',
  'cost',
  'settings',
  'system',
  // AWS Services (from CloudTrail)
  'EC2',
  'SSM',
  'XRAY',
  'TAGGING',
  'STS',
  'MONITORING',
  'LOGS',
  'CloudTrail',
  'CONFIG',
  'ELB'
];

// Helper function to determine event importance
const getEventImportance = (action: string): 'high' | 'medium' | 'low' => {
  const highImportance = ['delete', 'permission_change', 'login', 'logout', 'assume_role', 'execute'];
  const mediumImportance = ['create', 'update', 'start', 'stop', 'sync'];
  const lowImportance = ['read', 'LookupEvents', 'Describe', 'List', 'Get'];
  
  if (highImportance.includes(action)) return 'high';
  if (mediumImportance.includes(action)) return 'medium';
  if (lowImportance.some(prefix => action.startsWith(prefix))) return 'low';
  
  // Check for specific patterns in CloudTrail events
  if (action.toLowerCase().includes('delete')) return 'high';
  if (action.toLowerCase().includes('create') || action.toLowerCase().includes('update')) return 'medium';
  if (action.toLowerCase().includes('get') || action.toLowerCase().includes('list') || action.toLowerCase().includes('describe')) return 'low';
  
  return 'low'; // Default to low for unknown events
};

const getImportanceBadgeColor = (importance: 'high' | 'medium' | 'low') => {
  switch(importance) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-gray-100 text-gray-600 border-gray-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

const AuditLogsTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(50); // Increased to 50 for better performance with 4000+ logs
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [selectedAction, setSelectedAction] = useState<AuditLogAction | ''>('');  // Start with empty (All)
  const [selectedResource, setSelectedResource] = useState<AuditLogResource | ''>('');  // Start with empty (All)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [showImportantOnly, setShowImportantOnly] = useState(true); // Default to important events only
  
  const { toast } = useToast();

  // Fetch organization on mount
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const orgs = await organizationsApi.getAll();
        if (orgs && orgs.length > 0) {
          setOrganizationId(orgs[0].id);
          localStorage.setItem('organizationId', orgs[0].id);
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
      }
    };
    fetchOrganization();
  }, []);

  useEffect(() => {
    if (organizationId) {
      fetchAuditLogs();
    }
  }, [currentPage, limit, selectedAction, selectedResource, organizationId, showImportantOnly]);

  useEffect(() => {
    // Apply search query filter with debounce
    const handler = setTimeout(() => {
      if (searchQuery.length >= 3 || searchQuery === '') {
        fetchAuditLogs();
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const fetchAuditLogs = async () => {
    if (!organizationId) return;
    
    try {
      setLoading(true);
      
      // Build filters
      const apiFilters: AuditLogFilters = { 
        ...filters,
        organizationId 
      };
      
      if (selectedAction) {
        apiFilters.action = selectedAction;
      }
      
      if (selectedResource) {
        apiFilters.resource = selectedResource;
      }
      
      // Add search query as filter if specified
      if (searchQuery && searchQuery.length >= 3) {
        // This assumes the backend supports a search parameter
        // You might need to adjust this based on actual API implementation
        apiFilters.resourceId = searchQuery;
      }
      
      // Add importance filter
      if (showImportantOnly) {
        apiFilters.importanceLevel = 'important';
      }
      
      const response = await auditLogsApi.getAll(
        apiFilters,
        currentPage,
        limit,
        'timestamp',
        'desc'
      );
      
      setAuditLogs(response.data);
      setTotalLogs(response.total);
      setTotalPages(response.totalPages || Math.ceil(response.total / limit));
      setHasNextPage(response.hasNextPage || currentPage < Math.ceil(response.total / limit));
      setHasPreviousPage(response.hasPreviousPage || currentPage > 1);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleActionFilterChange = (action: AuditLogAction | '') => {
    setSelectedAction(action);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleResourceFilterChange = (resource: AuditLogResource | '') => {
    setSelectedResource(resource);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedAction('');
    setSelectedResource('');
    setCurrentPage(1);
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  const handleSyncCloudTrail = async () => {
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'Organization not loaded',
        variant: 'destructive',
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus('Fetching cloud accounts...');
    
    try {
      // Get all cloud accounts for the organization
      const cloudAccounts = await cloudAccountsApi.getAll(organizationId);
      
      if (!cloudAccounts || cloudAccounts.length === 0) {
        toast({
          title: 'No Cloud Accounts',
          description: 'Please add a cloud account first',
          variant: 'destructive',
        });
        return;
      }

      setSyncStatus(`Syncing CloudTrail events from ${cloudAccounts.length} account(s)...`);
      
      // Sync CloudTrail events for all accounts
      const result = await cloudTrailSyncApi.syncAllAccounts(24); // Sync last 24 hours
      
      if (result.successfulSyncs > 0) {
        toast({
          title: 'CloudTrail Sync Complete',
          description: `Imported ${result.totalEventsImported} events from ${result.successfulSyncs} account(s)`,
        });
        
        // Refresh the audit logs
        await fetchAuditLogs();
      } else {
        toast({
          title: 'Sync Failed',
          description: 'Failed to import CloudTrail events. Check your AWS credentials.',
          variant: 'destructive',
        });
      }
      
      // Show detailed results if there were failures
      if (result.failedSyncs > 0) {
        const failedAccounts = result.results
          .filter(r => !r.success)
          .map(r => r.accountName)
          .join(', ');
        
        toast({
          title: 'Some Accounts Failed',
          description: `Failed to sync: ${failedAccounts}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error syncing CloudTrail:', error);
      toast({
        title: 'Sync Error',
        description: 'Failed to sync CloudTrail events',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
      setSyncStatus('');
    }
  };

  return (
    <div className="p-6">
      {/* Statistics Cards */}
      {!loading && <AuditLogStats logs={auditLogs} totalLogs={totalLogs} />}
      
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-medium text-gray-800">
          Audit Logs ({totalLogs})
          {showImportantOnly && (
            <span className="ml-2 text-sm font-normal text-orange-600">
              (Important Events Only)
            </span>
          )}
        </h1>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setShowImportantOnly(!showImportantOnly);
              setCurrentPage(1); // Reset to first page when toggling
            }}
            variant={showImportantOnly ? "default" : "outline"}
            className={showImportantOnly ? 
              "bg-orange-600 hover:bg-orange-700 border-orange-600" : 
              "border-gray-300"
            }
          >
            {showImportantOnly ? (
              <>🔥 Important Only</>
            ) : (
              <>📋 All Events</>
            )}
          </Button>
          <Button
            onClick={handleSyncCloudTrail}
            disabled={isSyncing || !organizationId}
            variant="outline"
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {syncStatus || 'Syncing...'}
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync CloudTrail
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Input
            type="text"
            placeholder="Search by ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border border-gray-300">
              {selectedAction ? `Action: ${selectedAction}` : 'Action type'}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem onClick={() => handleActionFilterChange('')}>
              All actions
            </DropdownMenuItem>
            {AUDIT_ACTIONS.map(action => (
              <DropdownMenuItem 
                key={action}
                onClick={() => handleActionFilterChange(action)}
              >
                {action.replace('_', ' ')}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border border-gray-300">
              {selectedResource ? `Resource: ${selectedResource}` : 'Resource type'}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem onClick={() => handleResourceFilterChange('')}>
              All resources
            </DropdownMenuItem>
            {AUDIT_RESOURCES.map(resource => (
              <DropdownMenuItem 
                key={resource}
                onClick={() => handleResourceFilterChange(resource)}
              >
                {resource.replace('_', ' ')}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {(selectedAction || selectedResource || searchQuery) && (
          <Button 
            variant="ghost" 
            onClick={clearFilters}
            className="text-blue-600"
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading audit logs...</span>
        </div>
      )}

      {/* Table */}
      {!loading && auditLogs.length > 0 && (
        <div className="bg-white rounded-md border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/6">Event ID</TableHead>
                <TableHead className="w-1/6">Event Time</TableHead>
                <TableHead className="w-1/6">Actor</TableHead>
                <TableHead className="w-1/6">Event Type</TableHead>
                <TableHead className="w-1/6">Resource</TableHead>
                <TableHead className="w-1/6">Status</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => {
                const eventTime = formatDate(log.timestamp);
                return (
                  <TableRow key={log.id}>
                    <TableCell 
                      className="font-mono text-blue-500 hover:underline cursor-pointer"
                      onClick={() => handleViewDetails(log)}
                    >
                      {log.id.length > 12 ? `${log.id.substring(0, 12)}...` : log.id}
                    </TableCell>
                    <TableCell className="whitespace-pre-line">
                      <div>{eventTime.date}</div>
                      <div className="text-xs text-gray-500">{eventTime.time}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {log.userName ? (
                          <>
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs w-fit">
                              USER
                            </span>
                            <span className="text-xs text-gray-700 mt-1">{log.userName}</span>
                          </>
                        ) : (
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs w-fit">
                            SYSTEM
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={`${EVENT_TYPE_COLORS[log.action] || 'bg-gray-100 text-gray-800'} border-none`}
                        >
                          {log.action}
                        </Badge>
                        {(() => {
                          const importance = getEventImportance(log.action);
                          if (importance === 'high') {
                            return (
                              <span className="text-red-600 text-xs font-semibold" title="High Importance">
                                🔴
                              </span>
                            );
                          } else if (importance === 'medium') {
                            return (
                              <span className="text-yellow-600 text-xs font-semibold" title="Medium Importance">
                                🟡
                              </span>
                            );
                          }
                          return null; // Don't show indicator for low importance
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <Badge 
                          className={`${RESOURCE_TYPE_COLORS[log.resource] || 'bg-gray-100 text-gray-800'} border-none mb-1`}
                        >
                          {log.resource}
                        </Badge>
                        {log.resourceName && (
                          <span className="text-xs text-blue-500 hover:underline">
                            {log.resourceName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={log.success ? 'success' : 'destructive'}
                        className="w-fit"
                      >
                        {log.success ? 'Success' : 'Failed'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                        className="p-2"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Empty state */}
      {!loading && auditLogs.length === 0 && (
        <div className="bg-white rounded-md border shadow-sm p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No audit logs found</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            {searchQuery || selectedAction || selectedResource ? 
              "No audit logs match your current filters. Try different criteria or clear filters." : 
              "There are no audit logs in your account yet. Activity will be recorded as actions are performed."}
          </p>
          {(searchQuery || selectedAction || selectedResource) && (
            <Button 
              variant="outline" 
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && auditLogs.length > 0 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              
              // Show first page, current page and adjacent, and last page
              if (
                pageNumber === 1 || 
                pageNumber === totalPages || 
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNumber)}
                      isActive={pageNumber === currentPage}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              }
              
              // Show ellipsis for breaks in sequence
              if (
                (pageNumber === 2 && currentPage > 3) ||
                (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
              ) {
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              
              return null;
            })}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      
      {/* Detail Modal */}
      <AuditLogDetailModal
        log={selectedLog}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
};

export default AuditLogsTab;