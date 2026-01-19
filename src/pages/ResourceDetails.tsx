import React, { useState, useEffect } from 'react';
import { Home, PlusCircle, X, Filter, RotateCcw, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatsCard from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { resourcesApi, Resource } from '@/lib/api/resources';
import { reservationsApi, Reservation } from '@/lib/api/reservations';
import { formatCurrency } from '@/lib/utils';

const ResourceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [resource, setResource] = useState<Resource | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [reservationSummary, setReservationSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [cloudAccountName, setCloudAccountName] = useState('');
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchResourceDetails(id);
      fetchReservations();
    }
  }, [id]);

  const fetchResourceDetails = async (resourceId: string) => {
    try {
      setLoading(true);
      const data = await resourcesApi.getById(resourceId);
      setResource(data);

      // Get cloud account name - in a full implementation, we would fetch this from the API
      setCloudAccountName('Company AWS');

      // Fetch recommendations
      try {
        const recommendationsData = await resourcesApi.getRecommendations(resourceId);
        setRecommendations(recommendationsData);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }

      // Fetch metrics (last 7 days)
      try {
        const endTime = new Date();
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - 7);
        
        const metricsData = await resourcesApi.getMetrics(
          resourceId, 
          'CPUUtilization', 
          startTime, 
          endTime
        );
        setMetrics(metricsData);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    } catch (error) {
      console.error('Error fetching resource details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch resource details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      setLoadingReservations(true);
      // For demo purposes, we're using a default organization ID
      // In a real app, this would come from the auth context or app state
      const organizationId = 'default';
      
      const [reservationData, summaryData] = await Promise.all([
        reservationsApi.getAll(organizationId),
        reservationsApi.getSummary(organizationId)
      ]);
      
      setReservations(reservationData);
      setReservationSummary(summaryData);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch reservation data',
        variant: 'destructive',
      });
    } finally {
      setLoadingReservations(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2">Loading resource details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!resource && !loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 flex items-center justify-center flex-col">
            <p className="text-xl font-medium text-gray-700 mb-4">Resource not found</p>
            <Button onClick={() => navigate('/resources')}>
              Back to Resources
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
              <ChevronRight size={14} />
              <Link to="/resources" className="hover:text-blue-600">
                <span className="text-sm">Resources</span>
              </Link>
              <ChevronRight size={14} />
              <span className="text-sm">{resource?.resource_name || 'Resource details'}</span>
            </div>

            {/* Resource Header */}
            <div className="mb-6">
              <h1 className="text-xl font-medium text-gray-800">{resource?.resource_name}</h1>
              <p className="text-sm text-gray-500">
                {resource?.resource_id_on_provider} • {resource?.resource_type} • {resource?.region} • {resource?.status}
              </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="mb-6" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                <TabsTrigger value="reservations">Reservations</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="tags">Tags</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6">
                {/* Resource details cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatsCard
                    title="Resource Type"
                    value={resource?.resource_type || ''}
                  />
                  <StatsCard
                    title="Region"
                    value={resource?.region || ''}
                  />
                  <StatsCard
                    title="Status"
                    value={resource?.status || ''}
                  />
                  <Card className="flex flex-col justify-between p-4">
                    <h3 className="text-sm font-medium text-gray-600">Actions</h3>
                    <div className="mt-auto flex gap-2">
                      {resource?.status?.toLowerCase() === 'running' ? (
                        <Button 
                          className="bg-red-500 hover:bg-red-600 px-3 py-1 h-8 mt-2"
                          onClick={async () => {
                            try {
                              await resourcesApi.stop(resource.id);
                              toast({
                                title: 'Success',
                                description: 'Resource stopped successfully'
                              });
                              // Refresh resource data
                              fetchResourceDetails(resource.id);
                            } catch (error) {
                              toast({
                                title: 'Error',
                                description: 'Failed to stop resource',
                                variant: 'destructive'
                              });
                            }
                          }}
                        >
                          Stop
                        </Button>
                      ) : (
                        <Button 
                          className="bg-green-500 hover:bg-green-600 px-3 py-1 h-8 mt-2"
                          onClick={async () => {
                            try {
                              await resourcesApi.start(resource.id);
                              toast({
                                title: 'Success',
                                description: 'Resource started successfully'
                              });
                              // Refresh resource data
                              fetchResourceDetails(resource.id);
                            } catch (error) {
                              toast({
                                title: 'Error',
                                description: 'Failed to start resource',
                                variant: 'destructive'
                              });
                            }
                          }}
                        >
                          Start
                        </Button>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Resource metadata */}
                <div className="bg-white rounded-md border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Resource Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Resource ID</p>
                      <p className="text-sm">{resource?.resource_id_on_provider}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Cloud Account</p>
                      <p className="text-sm">{cloudAccountName} ({resource?.cloud_account_id})</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Created At</p>
                      <p className="text-sm">{new Date(resource?.created_at || '').toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Updated At</p>
                      <p className="text-sm">{new Date(resource?.updated_at || '').toLocaleString()}</p>
                    </div>
                    {resource?.metadata && Object.entries(resource.metadata).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-sm font-medium text-gray-600">{key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}</p>
                        <p className="text-sm">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Recommendations Tab */}
              <TabsContent value="recommendations" className="mt-6">
                {recommendations ? (
                  <div className="bg-white rounded-md border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Usage Recommendations</h3>
                    {/* Display recommendations data */}
                    <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
                      {JSON.stringify(recommendations, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-white rounded-md border border-gray-200 p-6 text-center">
                    <p className="text-gray-500">No recommendations available for this resource.</p>
                  </div>
                )}
              </TabsContent>

              {/* Reservations Tab */}
              <TabsContent value="reservations" className="mt-6">
                {/* Stats Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <StatsCard
                    title="Potential monthly savings"
                    value={formatCurrency(reservationSummary?.total_potential_savings || 0)}
                    icon={
                      <div className="bg-blue-100 rounded-full p-2">
                        <img src="/placeholder.svg" alt="Savings" className="w-8 h-8" />
                      </div>
                    }
                  />
                  <StatsCard
                    title="Instances"
                    value={reservationSummary?.total_instances || 0}
                  />
                  <StatsCard
                    title="Purchased reservations"
                    value={reservationSummary?.purchased_reservations || 0}
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
                    EC2 reservation status ({reservations.length})
                  </h2>
                </div>

                {loadingReservations ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2">Loading reservations...</span>
                  </div>
                ) : (
                  <>
                    {/* Table */}
                    <div className="bg-white rounded-md border border-gray-200 overflow-hidden mb-4">
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
                          {reservations.map((reservation) => (
                            <TableRow key={reservation.id} className="hover:bg-gray-50">
                              <TableCell>
                                <div className="text-blue-500">{cloudAccountName}</div>
                                <div className="text-xs text-gray-500">{reservation.cloud_account_id}</div>
                              </TableCell>
                              <TableCell>{reservation.region}</TableCell>
                              <TableCell>{reservation.instance_type}</TableCell>
                              <TableCell>{reservation.tenancy}</TableCell>
                              <TableCell>{reservation.platform}</TableCell>
                              <TableCell>{formatCurrency(reservation.potential_monthly_savings)}</TableCell>
                              <TableCell>{reservation.potential_savings_percentage}%</TableCell>
                              <TableCell>{reservation.reserved_instances} of {reservation.available_instances}</TableCell>
                              <TableCell>
                                <div>{new Date(reservation.updated_at).toLocaleDateString()}</div>
                                <div className="text-xs text-gray-500">{new Date(reservation.updated_at).toLocaleTimeString()}</div>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" className="-mx-2">
                                  <ChevronRight size={18} />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
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
                  </>
                )}
              </TabsContent>

              {/* Metrics Tab */}
              <TabsContent value="metrics" className="mt-6">
                {metrics ? (
                  <div className="bg-white rounded-md border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Resource Metrics</h3>
                    {/* In a real app, we would render charts here using the metrics data */}
                    <p className="mb-4">CPU Utilization for the last 7 days</p>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
                      {JSON.stringify(metrics, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="bg-white rounded-md border border-gray-200 p-6 text-center">
                    <p className="text-gray-500">No metrics available for this resource.</p>
                  </div>
                )}
              </TabsContent>

              {/* Tags Tab */}
              <TabsContent value="tags" className="mt-6">
                <div className="bg-white rounded-md border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800">Tags</h3>
                    <Button size="sm">
                      <PlusCircle size={16} className="mr-1" />
                      Add Tag
                    </Button>
                  </div>
                  {resource?.tags && Object.keys(resource.tags).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(resource.tags).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <div>
                            <p className="text-sm font-medium">{key}</p>
                            <p className="text-sm text-gray-500">{value}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <X size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center">No tags found for this resource.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetails;
