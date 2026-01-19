import React, { useState, useEffect } from 'react';
import { ChevronRight, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useToast } from '@/components/ui/use-toast';
import { 
  organizationsApi, 
  reservationsApi, 
  EC2Reservation, 
  RDSReservation 
} from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const ReservationsTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string>('');
  const [summary, setSummary] = useState<{
    total_potential_savings: number;
    total_instances: number;
    purchased_reservations: number;
  }>({
    total_potential_savings: 0,
    total_instances: 0,
    purchased_reservations: 0,
  });
  const [ec2Reservations, setEC2Reservations] = useState<EC2Reservation[]>([]);
  const [rdsReservations, setRDSReservations] = useState<RDSReservation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

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
        // Fetch all data in parallel
        const [summaryData, ec2Data, rdsData] = await Promise.all([
          reservationsApi.getSummary(organizationId),
          reservationsApi.getEC2Reservations(organizationId),
          reservationsApi.getRDSReservations(organizationId)
        ]);
        
        setSummary(summaryData);
        setEC2Reservations(ec2Data);
        setRDSReservations(rdsData);
      } catch (error) {
        console.error('Error fetching reservation data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch reservation data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReservationData();
  }, [organizationId, toast]);

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
      second: '2-digit',
      hour12: true
    });
    
    return { formattedDate, formattedTime };
  };

  // Handle refresh
  const handleRefresh = () => {
    if (!organizationId) return;
    
    setLoading(true);
    Promise.all([
      reservationsApi.getSummary(organizationId),
      reservationsApi.getEC2Reservations(organizationId),
      reservationsApi.getRDSReservations(organizationId)
    ])
      .then(([summaryData, ec2Data, rdsData]) => {
        setSummary(summaryData);
        setEC2Reservations(ec2Data);
        setRDSReservations(rdsData);
        toast({
          title: 'Refreshed',
          description: 'Reservation data has been refreshed',
        });
      })
      .catch(error => {
        console.error('Error refreshing data:', error);
        toast({
          title: 'Error',
          description: 'Failed to refresh reservation data',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Format reservation details
  const formatReservation = (available: number, reserved: number) => {
    return `${reserved} of ${available}`;
  };

  return (
    <div className="p-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">AWS Reservations</h2>
          <p className="text-gray-600 text-sm mt-1">Manage your AWS Reserved Instances and optimize costs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 rounded-xl transition-all duration-200"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RotateCcw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1 rounded-xl transition-all duration-200">
            <Filter size={14} />
            <span>Filter</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Potential monthly savings"
          value={loading ? "Loading..." : formatCurrency(summary.total_potential_savings)}
          icon={
            <div className="bg-blue-100 rounded-full p-2">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white text-xs font-semibold">$</div>
            </div>
          }
        />
        <StatsCard
          title="Instances"
          value={loading ? "Loading..." : summary.total_instances.toString()}
        />
        <StatsCard
          title="Purchased reservations"
          value={loading ? "Loading..." : summary.purchased_reservations.toString()}
        />
        <Card className="flex flex-col justify-between p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600">Purchase reserved instances</h3>
          <div className="mt-auto">
            <Button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 h-auto mt-4 flex items-center gap-1 rounded-xl transition-all duration-200">
              <span className="text-sm">Get started</span>
              <ChevronRight size={14} />
            </Button>
          </div>
        </Card>
      </div>

      {/* EC2 reservation status section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          EC2 Reservation Status ({ec2Reservations.length})
        </h3>
      </div>

      {/* EC2 Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading EC2 reservations...</span>
            </div>
          </div>
        ) : ec2Reservations.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <ChevronRight className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No EC2 reservations found</h3>
                <p className="text-sm text-gray-500">Start optimizing costs by purchasing reserved instances</p>
              </div>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100">
                <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Account</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Region</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Instance Type</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Instance Tenancy</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Platform</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Potential Monthly Savings</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Potential Savings</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Reservation</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Updated</TableHead>
                <TableHead className="w-[30px] py-4 px-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ec2Reservations.map((reservation) => {
                const { formattedDate, formattedTime } = formatDateTime(reservation.updated_at);
                return (
                  <TableRow key={reservation.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors duration-150">
                    <TableCell className="py-4 px-6">
                      <div className="text-blue-600 font-medium text-sm">Company AWS</div>
                      <div className="text-xs text-gray-500">{reservation.cloud_account_id}</div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-sm text-gray-900">{reservation.region}</TableCell>
                    <TableCell className="py-4 px-6 text-sm text-gray-900">{reservation.instance_type}</TableCell>
                    <TableCell className="py-4 px-6 text-sm text-gray-900">{reservation.tenancy}</TableCell>
                    <TableCell className="py-4 px-6 text-sm text-gray-900">{reservation.platform}</TableCell>
                    <TableCell className="py-4 px-6 text-sm font-medium text-green-600">{formatCurrency(reservation.potential_monthly_savings)}</TableCell>
                    <TableCell className="py-4 px-6 text-sm font-medium text-green-600">{reservation.potential_savings_percentage}%</TableCell>
                    <TableCell className="py-4 px-6 text-sm text-gray-900">
                      {formatReservation(reservation.available_instances, reservation.reserved_instances)}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="text-sm text-gray-900">{formattedDate}</div>
                      <div className="text-xs text-gray-500">{formattedTime}</div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-150">
                        <ChevronRight size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* EC2 Pagination */}
      {ec2Reservations.length > 0 && (
        <div className="flex justify-center mt-4 mb-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* RDS reservation status section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          RDS Reservation Status ({rdsReservations.length})
        </h3>
      </div>

      {/* RDS Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        {loading ? (
          <div className="py-12 text-center text-gray-500">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading RDS reservations...</span>
            </div>
          </div>
        ) : rdsReservations.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <ChevronRight className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No RDS reservations found</h3>
                <p className="text-sm text-gray-500">Start optimizing database costs with reserved instances</p>
              </div>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100">
                <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Account</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Region</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Instance Type</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Multi-AZ</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Database Engine</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Potential Monthly Savings</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Potential Savings</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Reservation</TableHead>
                <TableHead className="py-4 px-6 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Updated</TableHead>
                <TableHead className="w-[30px] py-4 px-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rdsReservations.map((reservation) => {
                const { formattedDate, formattedTime } = formatDateTime(reservation.updated_at);
                return (
                  <TableRow key={reservation.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors duration-150">
                    <TableCell className="py-4 px-6">
                      <div className="text-blue-600 font-medium text-sm">Company AWS</div>
                      <div className="text-xs text-gray-500">{reservation.cloud_account_id}</div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-sm text-gray-900">{reservation.region}</TableCell>
                    <TableCell className="py-4 px-6 text-sm text-gray-900">{reservation.instance_type}</TableCell>
                    <TableCell className="py-4 px-6 text-sm text-gray-900">{reservation.multi_az ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="py-4 px-6 text-sm text-gray-900">{reservation.database_engine}</TableCell>
                    <TableCell className="py-4 px-6 text-sm font-medium text-green-600">{formatCurrency(reservation.potential_monthly_savings)}</TableCell>
                    <TableCell className="py-4 px-6 text-sm font-medium text-green-600">{reservation.potential_savings_percentage}%</TableCell>
                    <TableCell className="py-4 px-6 text-sm text-gray-900">
                      {formatReservation(reservation.available_instances, reservation.reserved_instances)}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="text-sm text-gray-900">{formattedDate}</div>
                      <div className="text-xs text-gray-500">{formattedTime}</div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors duration-150">
                        <ChevronRight size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* RDS Pagination */}
      {rdsReservations.length > 0 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default ReservationsTab;