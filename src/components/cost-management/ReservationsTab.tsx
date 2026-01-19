import React, { useState, useEffect } from 'react';
import { RotateCcw, Package, Database, Server, Search, Cloud, Brain, Code, HardDrive, ArrowUpDown, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  organizationsApi, 
  reservationsApi, 
  EC2Reservation, 
  RDSReservation 
} from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

// Service configuration
const SERVICES = [
  { value: 'all', label: 'All Services', icon: Package },
  { value: 'ec2', label: 'EC2 Instances', icon: Server },
  { value: 'rds', label: 'RDS Databases', icon: Database },
  { value: 'elasticache', label: 'ElastiCache', icon: HardDrive },
  { value: 'opensearch', label: 'OpenSearch', icon: Search },
  { value: 'redshift', label: 'Redshift', icon: Database },
  { value: 'dynamodb', label: 'DynamoDB', icon: Database },
  { value: 'lambda', label: 'Lambda', icon: Code },
  { value: 'sagemaker', label: 'SageMaker', icon: Brain },
];

// Sortable header component
const SortableHeader = ({ field, children, sortField, sortDirection, onSort }: {
  field: string;
  children: React.ReactNode;
  sortField: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
}) => (
  <TableHead 
    className="cursor-pointer hover:bg-gray-100 transition-colors"
    onClick={() => onSort(field)}
  >
    <div className="flex items-center gap-1">
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
      ) : (
        <ArrowUpDown size={14} className="opacity-30" />
      )}
    </div>
  </TableHead>
);

const ReservationsTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [summary, setSummary] = useState<{
    total_potential_savings: number;
    total_instances: number;
    purchased_reservations: number;
    services_breakdown?: Record<string, { count: number; savings: number }>;
  }>({
    total_potential_savings: 0,
    total_instances: 0,
    purchased_reservations: 0,
    services_breakdown: {},
  });
  const [allReservations, setAllReservations] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [sortField, setSortField] = useState<string | null>('potential_monthly_savings');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Get the current organization ID
  useEffect(() => {
    const fetchOrganizationId = async () => {
      try {
        const organizations = await organizationsApi.getAll();
        if (organizations && organizations.length > 0) {
          setOrganizationId(organizations[0].id);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch organization data',
          variant: 'destructive',
        });
      }
    };

    fetchOrganizationId();
  }, [toast]);

  // Fetch data when we have an organization ID
  useEffect(() => {
    if (!organizationId) return;
    
    const fetchReservationData = async () => {
      setLoading(true);
      
      try {
        // Fetch summary and all reservations
        const [summaryData, reservationsData] = await Promise.allSettled([
          reservationsApi.getSummary(organizationId),
          reservationsApi.getAllReservations(organizationId)
        ]);
        
        // Handle results with fallbacks
        const summary = summaryData.status === 'fulfilled' ? summaryData.value : {
          total_potential_savings: 0,
          total_instances: 0,
          purchased_reservations: 0,
          services_breakdown: {}
        };
        
        const reservations = reservationsData.status === 'fulfilled' ? reservationsData.value : [];
        
        setSummary(summary);
        setAllReservations(reservations);
      } catch (error) {
        console.log('Some reservation endpoints not available yet');
      } finally {
        setLoading(false);
      }
    };

    fetchReservationData();
  }, [organizationId]);

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending for new field
    }
  };

  // Filter reservations by selected service
  const filteredReservations = selectedService === 'all' 
    ? allReservations 
    : allReservations.filter(r => r.service_type === selectedService);

  // Sort reservations
  const sortedReservations = [...filteredReservations].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    // Handle nested fields
    if (sortField === 'service_label') {
      aValue = SERVICES.find(s => s.value === a.service_type)?.label || a.service_type;
      bValue = SERVICES.find(s => s.value === b.service_type)?.label || b.service_type;
    }
    
    // Handle resource type (could be instance_type or resource_type)
    if (sortField === 'instance_type') {
      aValue = a.instance_type || a.resource_type || '';
      bValue = b.instance_type || b.resource_type || '';
    }
    
    // Handle null/undefined values
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';
    
    // Numeric comparison for savings and counts
    if (sortField === 'potential_monthly_savings' || sortField === 'potential_savings_percentage' || sortField === 'available_instances') {
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // String comparison for text fields
    aValue = String(aValue).toLowerCase();
    bValue = String(bValue).toLowerCase();
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Paginate reservations
  const totalPages = Math.ceil(sortedReservations.length / limit);
  const startIndex = (currentPage - 1) * limit;
  const paginatedReservations = sortedReservations.slice(startIndex, startIndex + limit);

  // Handle refresh
  const handleRefresh = async () => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      const [summaryData, reservationsData] = await Promise.all([
        reservationsApi.getSummary(organizationId),
        reservationsApi.getAllReservations(organizationId)
      ]);
      
      setSummary(summaryData);
      setAllReservations(reservationsData);
      
      toast({
        title: 'Refreshed',
        description: 'Reservation data has been refreshed',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh reservation data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date and time from API response
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return { formattedDate, formattedTime };
  };

  // Get service icon
  const getServiceIcon = (serviceType: string) => {
    const service = SERVICES.find(s => s.value === serviceType);
    const Icon = service?.icon || Package;
    return <Icon size={16} className="text-gray-500" />;
  };

  // Get savings type badge color
  const getSavingsTypeBadgeColor = (savingsType?: string) => {
    switch (savingsType) {
      case 'Reserved Instance':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Savings Plans':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Reserved Capacity':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Calculate stats by service
  const serviceStats = Object.entries(summary.services_breakdown || {}).map(([service, data]) => ({
    service,
    label: SERVICES.find(s => s.value === service)?.label || service,
    ...data
  }));

  return (
    <div className="bg-gray-50/30">
      <div className="bg-gradient-to-b from-gray-50/60 via-emerald-50/40 to-gray-50/30 p-6 border-b border-emerald-200/30">
        <div className="bg-gradient-to-b from-gray-50/10 via-white/30 to-gray-50/15 backdrop-blur-sm rounded-2xl border border-emerald-200/20 overflow-hidden">
          <div className="p-6">
            {/* Header with refresh button */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-semibold text-gray-800">Reservations & Savings Opportunities</h1>
              <div className="flex items-center gap-2">
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICES.map(service => (
                      <SelectItem key={service.value} value={service.value}>
                        <div className="flex items-center gap-2">
                          <service.icon size={16} />
                          <span>{service.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-emerald-50/60 border-emerald-200/50 hover:bg-emerald-100/70 hover:scale-105 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300 shadow-sm backdrop-blur-sm flex items-center gap-1"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RotateCcw size={14} className={loading ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>

            {/* Stats Cards Row - Following Design System Standards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Potential Monthly Savings - Emerald theme for savings */}
              <div className="relative overflow-hidden border border-gray-200 shadow-sm bg-white h-40 rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-transparent w-2/5"></div>
                <div className="relative p-6 z-10">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">TOTAL MONTHLY SAVINGS</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">
                    {loading ? "Loading..." : formatCurrency(summary.total_potential_savings)}
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-200/20"></div>
              </div>
              
              {/* Resources - Pink theme for performance/metrics */}
              <div className="relative overflow-hidden border border-gray-200 shadow-sm bg-white h-40 rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/30 to-transparent w-2/5"></div>
                <div className="relative p-6 z-10">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">ELIGIBLE RESOURCES</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">
                    {loading ? "Loading..." : summary.total_instances.toString()}
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-pink-200/20"></div>
              </div>
              
              {/* Active Services - Amber theme for threshold/settings */}
              <div className="relative overflow-hidden border border-gray-200 shadow-sm bg-white h-40 rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-transparent w-2/5"></div>
                <div className="relative p-6 z-10">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">ACTIVE SERVICES</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">
                    {loading ? "Loading..." : Object.keys(summary.services_breakdown || {}).length.toString()}
                  </p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-200/20"></div>
              </div>
              
              {/* Purchase Reserved Instances - Action card */}
              <div className="relative overflow-hidden border border-gray-200 shadow-sm bg-white h-40 rounded-xl">
                <div className="relative p-6 z-10 flex flex-col h-full">
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">PURCHASE SAVINGS PLANS</p>
                  <div className="mt-auto">
                    <Button className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:bg-gradient-to-r hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 hover:scale-105 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 shadow-lg flex items-center gap-1">
                      <span>Get started</span>
                      <ArrowRight size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Service breakdown stats */}
            {serviceStats.length > 0 ? (
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Eligible Services with Savings Opportunities</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                  {serviceStats.map(stat => {
                    const service = SERVICES.find(s => s.value === stat.service);
                    const Icon = service?.icon || Package;
                    return (
                      <div 
                        key={stat.service} 
                        className="bg-white rounded-lg border border-gray-200 p-3 hover:border-emerald-300 transition-colors cursor-pointer"
                        onClick={() => setSelectedService(stat.service)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={14} className="text-gray-500" />
                          <div className="text-xs font-medium text-gray-500 uppercase">{stat.label}</div>
                        </div>
                        <div className="text-lg font-bold text-gray-900">{stat.count}</div>
                        <div className="text-xs text-emerald-600 font-medium">{formatCurrency(stat.savings)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : !loading && (
              <div className="mb-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                  <Package className="h-12 w-12 text-amber-600 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Reservation Opportunities Found</h3>
                  <p className="text-sm text-gray-600 max-w-md mx-auto">
                    No eligible resources found for reservation recommendations. 
                    Make sure you have running EC2, RDS, or other supported AWS services, 
                    then sync your resources to discover savings opportunities.
                  </p>
                  <Button 
                    onClick={handleRefresh}
                    className="mt-4 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white"
                  >
                    <RotateCcw size={16} className="mr-2" />
                    Refresh Data
                  </Button>
                </div>
              </div>
            )}

            {/* Unified reservations table - Only show if there are recommendations */}
            {(filteredReservations.length > 0 || selectedService !== 'all') && (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">
                    {selectedService === 'all' 
                      ? `All Savings Opportunities (${filteredReservations.length})`
                      : `${SERVICES.find(s => s.value === selectedService)?.label} (${filteredReservations.length})`
                    }
                  </h2>
                </div>

                {/* Reservations Table */}
                <div className="bg-white rounded-md border border-gray-200 overflow-hidden mb-4">
                  {loading ? (
                    <div className="py-8 text-center text-gray-500">Loading reservations...</div>
                  ) : paginatedReservations.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      {selectedService === 'all' 
                        ? 'No reservation opportunities found. Sync your AWS resources to discover savings opportunities.'
                        : `No ${SERVICES.find(s => s.value === selectedService)?.label} opportunities found`
                      }
                    </div>
                  ) : (
                    <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <SortableHeader field="service_label" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                        Service
                      </SortableHeader>
                      <SortableHeader field="cloud_account_name" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                        Account
                      </SortableHeader>
                      <SortableHeader field="region" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                        Region
                      </SortableHeader>
                      <SortableHeader field="instance_type" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                        Resource Type
                      </SortableHeader>
                      <TableHead>Resource Names</TableHead>
                      <TableHead>Savings Type</TableHead>
                      <SortableHeader field="available_instances" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                        Count
                      </SortableHeader>
                      <SortableHeader field="potential_monthly_savings" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                        Monthly Savings
                      </SortableHeader>
                      <SortableHeader field="potential_savings_percentage" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>
                        Savings %
                      </SortableHeader>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedReservations.map((reservation) => {
                      const { formattedDate, formattedTime } = formatDateTime(reservation.updated_at);
                      return (
                        <TableRow key={reservation.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getServiceIcon(reservation.service_type)}
                              <span className="text-sm font-medium">
                                {SERVICES.find(s => s.value === reservation.service_type)?.label || reservation.service_type.toUpperCase()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-blue-500">{reservation.cloud_account_name || 'Company AWS'}</div>
                          </TableCell>
                          <TableCell>{reservation.region}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {reservation.instance_type || reservation.resource_type || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600 max-w-xs truncate" title={reservation.instance_names || reservation.database_names || reservation.resource_names || 'N/A'}>
                              {reservation.instance_names || reservation.database_names || reservation.resource_names || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getSavingsTypeBadgeColor(reservation.savings_type)} text-xs`}>
                              {reservation.savings_type || 'Reserved Instance'}
                            </Badge>
                          </TableCell>
                          <TableCell>{reservation.available_instances}</TableCell>
                          <TableCell className="font-medium text-emerald-600">
                            {formatCurrency(reservation.potential_monthly_savings)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {reservation.potential_savings_percentage}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>{formattedDate}</div>
                            <div className="text-xs text-gray-500">{formattedTime}</div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-4">
                    <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(Math.max(1, currentPage - 1));
                        }}
                      />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink 
                          href="#" 
                          isActive={currentPage === i + 1}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(i + 1);
                          }}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(Math.min(totalPages, currentPage + 1));
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationsTab;