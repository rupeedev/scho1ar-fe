import React, { useState, useEffect } from 'react';
import { Home, ChevronRight, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { 
  organizationsApi, 
  reservationsApi, 
  EC2Reservation, 
  RDSReservation 
} from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const Reservations = () => {
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="bg-blue-50 border-b border-blue-100 p-2 text-sm text-blue-700">
          Your subscription trial period ends in 1 day.
          <a href="/" className="text-blue-700 font-medium hover:underline ml-1">Click here</a> to set your default payment method.
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-gray-500 mb-4">
              <Home size={16} />
              <ChevronRight size={14} />
              <span className="text-sm">Reservations</span>
            </div>

            {/* Header with refresh button */}
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl font-semibold text-gray-800">Reservations</h1>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RotateCcw size={14} className={loading ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Filter size={14} />
                  <span>Filter</span>
                </Button>
              </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatsCard
                title="Potential monthly savings"
                value={loading ? "Loading..." : formatCurrency(summary.total_potential_savings)}
                icon={
                  <div className="bg-blue-100 rounded-full p-2">
                    <img src="/placeholder.svg" alt="Savings" className="w-8 h-8" />
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
              <Card className="flex flex-col justify-between p-4">
                <h3 className="text-sm font-medium text-gray-600">Purchase reserved instances</h3>
                <div className="mt-auto">
                  <Button className="bg-blue-500 hover:bg-blue-600 px-3 py-1 h-8 mt-2 flex items-center gap-1">
                    <span className="text-sm">Get started</span>
                    <ChevronRight size={14} className="-rotate-90" />
                  </Button>
                </div>
              </Card>
            </div>

            {/* EC2 reservation status section */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">
                EC2 reservation status ({ec2Reservations.length})
              </h2>
            </div>

            {/* EC2 Table */}
            <div className="bg-white rounded-md border border-gray-200 overflow-hidden mb-8">
              {loading ? (
                <div className="py-8 text-center text-gray-500">Loading EC2 reservations...</div>
              ) : ec2Reservations.length === 0 ? (
                <div className="py-8 text-center text-gray-500">No EC2 reservations found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Account</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Instance Type</TableHead>
                      <TableHead>Instance Tenancy</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Potential Monthly Savings</TableHead>
                      <TableHead>Potential Savings</TableHead>
                      <TableHead>Reservation</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="w-[30px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ec2Reservations.map((reservation) => {
                      const { formattedDate, formattedTime } = formatDateTime(reservation.updated_at);
                      return (
                        <TableRow key={reservation.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="text-blue-500">Company AWS</div>
                            <div className="text-xs text-gray-500">{reservation.cloud_account_id}</div>
                          </TableCell>
                          <TableCell>{reservation.region}</TableCell>
                          <TableCell>{reservation.instance_type}</TableCell>
                          <TableCell>{reservation.tenancy}</TableCell>
                          <TableCell>{reservation.platform}</TableCell>
                          <TableCell>{formatCurrency(reservation.potential_monthly_savings)}</TableCell>
                          <TableCell>{reservation.potential_savings_percentage}%</TableCell>
                          <TableCell>
                            {formatReservation(reservation.available_instances, reservation.reserved_instances)}
                          </TableCell>
                          <TableCell>
                            <div>{formattedDate}</div>
                            <div className="text-xs text-gray-500">{formattedTime}</div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="-mx-2">
                              <ChevronRight size={18} />
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
              <h2 className="text-lg font-medium text-gray-800 mb-4">
                RDS reservation status ({rdsReservations.length})
              </h2>
            </div>

            {/* RDS Table */}
            <div className="bg-white rounded-md border border-gray-200 overflow-hidden mb-4">
              {loading ? (
                <div className="py-8 text-center text-gray-500">Loading RDS reservations...</div>
              ) : rdsReservations.length === 0 ? (
                <div className="py-8 text-center text-gray-500">No RDS reservations found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Account</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Instance Type</TableHead>
                      <TableHead>Multi-AZ</TableHead>
                      <TableHead>Database Engine</TableHead>
                      <TableHead>Potential Monthly Savings</TableHead>
                      <TableHead>Potential Savings</TableHead>
                      <TableHead>Reservation</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="w-[30px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rdsReservations.map((reservation) => {
                      const { formattedDate, formattedTime } = formatDateTime(reservation.updated_at);
                      return (
                        <TableRow key={reservation.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="text-blue-500">Company AWS</div>
                            <div className="text-xs text-gray-500">{reservation.cloud_account_id}</div>
                          </TableCell>
                          <TableCell>{reservation.region}</TableCell>
                          <TableCell>{reservation.instance_type}</TableCell>
                          <TableCell>{reservation.multi_az ? 'Yes' : 'No'}</TableCell>
                          <TableCell>{reservation.database_engine}</TableCell>
                          <TableCell>{formatCurrency(reservation.potential_monthly_savings)}</TableCell>
                          <TableCell>{reservation.potential_savings_percentage}%</TableCell>
                          <TableCell>
                            {formatReservation(reservation.available_instances, reservation.reserved_instances)}
                          </TableCell>
                          <TableCell>
                            <div>{formattedDate}</div>
                            <div className="text-xs text-gray-500">{formattedTime}</div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="-mx-2">
                              <ChevronRight size={18} />
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
        </div>
      </div>
    </div>
  );
};

export default Reservations;