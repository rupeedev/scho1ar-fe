
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Search, Loader2, ChevronDown, Home, Calendar } from 'lucide-react';
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
import Header from '@/components/Header';
import { Link } from 'react-router-dom';
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

const EVENT_TYPE_COLORS: Record<string, string> = {
  'create': 'bg-green-100 text-green-800',
  'update': 'bg-blue-100 text-blue-800',
  'delete': 'bg-red-100 text-red-800',
  'start': 'bg-green-100 text-green-800',
  'stop': 'bg-yellow-100 text-yellow-800',
  'login': 'bg-purple-100 text-purple-800',
  'logout': 'bg-purple-100 text-purple-800',
  'settings_change': 'bg-blue-100 text-blue-800',
  'permission_change': 'bg-orange-100 text-orange-800',
  'schedule_execution': 'bg-indigo-100 text-indigo-800'
};

const RESOURCE_TYPE_COLORS: Record<string, string> = {
  'user': 'bg-purple-100 text-purple-800',
  'organization': 'bg-blue-100 text-blue-800',
  'cloud_account': 'bg-green-100 text-green-800',
  'resource': 'bg-yellow-100 text-yellow-800',
  'schedule': 'bg-indigo-100 text-indigo-800',
  'settings': 'bg-gray-100 text-gray-800'
};

const AUDIT_ACTIONS: AuditLogAction[] = [
  'create',
  'update',
  'delete',
  'start',
  'stop',
  'login',
  'logout',
  'settings_change',
  'permission_change',
  'schedule_execution'
];

const AUDIT_RESOURCES: AuditLogResource[] = [
  'user',
  'organization',
  'cloud_account',
  'resource',
  'schedule',
  'settings'
];

const AuditLogs = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [selectedAction, setSelectedAction] = useState<AuditLogAction | ''>('');
  const [selectedResource, setSelectedResource] = useState<AuditLogResource | ''>('');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, limit, selectedAction, selectedResource]);

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
    try {
      setLoading(true);
      
      // Build filters
      const apiFilters: AuditLogFilters = { ...filters };
      
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
      
      const response = await auditLogsApi.getAll(
        apiFilters,
        currentPage,
        limit,
        'timestamp',
        'desc'
      );
      
      setAuditLogs(response.data);
      setTotalLogs(response.total);
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

  const totalPages = Math.ceil(totalLogs / limit);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="bg-blue-50 border-b border-blue-100 p-2 text-sm text-blue-700">
          Your subscription trial period ends in 1 day.
          <Link to="/" className="text-blue-700 font-medium hover:underline ml-1">Click here</Link> to set your default payment method.
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-gray-500 mb-4">
              <Link to="/" className="hover:text-blue-600">
                <Home size={16} />
              </Link>
              <span className="text-sm">Audit Logs</span>
            </div>

            <div className="mb-6">
              <h1 className="text-xl font-medium text-gray-800">Audit Logs ({totalLogs})</h1>
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
                      <TableHead className="w-1/5">Event ID</TableHead>
                      <TableHead className="w-1/6">Event Time</TableHead>
                      <TableHead className="w-1/6">Actor</TableHead>
                      <TableHead className="w-1/6">Event Type</TableHead>
                      <TableHead className="w-1/6">Resource</TableHead>
                      <TableHead className="w-1/6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => {
                      const eventTime = formatDate(log.timestamp);
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-blue-500 hover:underline cursor-pointer">
                            {log.id}
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
                            <Badge 
                              className={`${EVENT_TYPE_COLORS[log.action] || 'bg-gray-100 text-gray-800'} border-none`}
                            >
                              {log.action}
                            </Badge>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
