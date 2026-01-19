import React, { useState, useEffect } from 'react';
import { Home, ChevronRight, Info, Loader2, Clock, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { schedulesApi, Schedule, ScheduleExecutionHistory } from '@/lib/api/schedules';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ScheduleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ScheduleExecutionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [executingNow, setExecutingNow] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchSchedule(id);
      fetchExecutionHistory(id);
    }
  }, [id]);

  const fetchSchedule = async (scheduleId: string) => {
    try {
      setLoading(true);
      const data = await schedulesApi.getById(scheduleId);
      setSchedule(data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch schedule details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutionHistory = async (scheduleId: string) => {
    try {
      setLoadingHistory(true);
      const response = await schedulesApi.getExecutionHistory(scheduleId);
      setExecutionHistory(response.data);
    } catch (error) {
      console.error('Error fetching execution history:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch execution history',
        variant: 'destructive',
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleToggleSchedule = async () => {
    if (!schedule) return;
    
    try {
      if (schedule.enabled) {
        await schedulesApi.disable(schedule.id);
        toast({
          title: 'Success',
          description: 'Schedule disabled successfully',
        });
      } else {
        await schedulesApi.enable(schedule.id);
        toast({
          title: 'Success',
          description: 'Schedule enabled successfully',
        });
      }
      
      fetchSchedule(schedule.id);
    } catch (error) {
      console.error('Error toggling schedule:', error);
      toast({
        title: 'Error',
        description: `Failed to ${schedule.enabled ? 'disable' : 'enable'} schedule`,
        variant: 'destructive',
      });
    }
  };

  const handleExecuteNow = async () => {
    if (!schedule) return;
    
    try {
      setExecutingNow(true);
      const result = await schedulesApi.executeNow(schedule.id);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Schedule execution triggered successfully',
        });
        
        // Refresh execution history after a short delay
        setTimeout(() => {
          fetchExecutionHistory(schedule.id);
        }, 2000);
      } else {
        toast({
          title: 'Warning',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error executing schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to execute schedule',
        variant: 'destructive',
      });
    } finally {
      setExecutingNow(false);
    }
  };

  const handleEdit = () => {
    // This would navigate to an edit page in a real implementation
    toast({
      title: 'Info',
      description: 'Edit functionality not implemented yet',
    });
  };

  const handleDelete = async () => {
    if (!schedule) return;
    
    if (window.confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
      try {
        await schedulesApi.delete(schedule.id);
        toast({
          title: 'Success',
          description: 'Schedule deleted successfully',
        });
        navigate('/schedules');
      } catch (error) {
        console.error('Error deleting schedule:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete schedule',
          variant: 'destructive',
        });
      }
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
            <span className="ml-2">Loading schedule details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex-1 flex items-center justify-center flex-col">
            <p className="text-xl font-medium text-gray-700 mb-4">Schedule not found</p>
            <Button onClick={() => navigate('/schedules')}>
              Back to Schedules
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { date: createdDate } = formatDate(schedule.createdAt);
  const { date: updatedDate } = formatDate(schedule.updatedAt);
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <Link to="/" className="hover:text-blue-600">
                <Home size={16} />
              </Link>
              <ChevronRight size={14} />
              <Link to="/schedules" className="hover:text-blue-600">
                Schedules
              </Link>
              <ChevronRight size={14} />
              <span>{schedule.name}</span>
            </div>

            {/* Header with actions */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-xl font-medium text-gray-800">{schedule.name}</h1>
                <p className="text-sm text-gray-500">
                  Created {createdDate} • Last updated {updatedDate}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleToggleSchedule}
                >
                  {schedule.enabled ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExecuteNow}
                  disabled={executingNow}
                >
                  {executingNow ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Executing...
                    </>
                  ) : 'Execute Now'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleEdit}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* Schedule details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="text-sm">{schedule.description || 'No description provided'}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Status</h3>
                        <Badge variant={schedule.enabled ? 'success' : 'secondary'}>
                          {schedule.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Action Type</h3>
                        <Badge variant={schedule.action === 'start' ? 'success' : 'destructive'}>
                          {schedule.action === 'start' ? 'Start Resources' : 'Stop Resources'}
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Time Zone</h3>
                        <p className="text-sm">{schedule.timezone}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Resources</h3>
                        <p className="text-sm">{schedule.resourceIds.length} resources</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Cron Expression</h3>
                      <p className="text-sm font-mono bg-gray-100 p-1 rounded">{schedule.cronExpression}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Execution Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Next Execution</h3>
                        <div className="flex items-center">
                          <Clock size={16} className="text-blue-500 mr-1" />
                          <p className="text-sm">
                            {schedule.nextExecutionTime 
                              ? formatDate(schedule.nextExecutionTime).date + ' ' + formatDate(schedule.nextExecutionTime).time 
                              : 'Not scheduled'}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Last Execution</h3>
                        <div className="flex items-center">
                          <ArrowLeftRight size={16} className="text-blue-500 mr-1" />
                          <p className="text-sm">
                            {schedule.lastExecutionTime 
                              ? formatDate(schedule.lastExecutionTime).date + ' ' + formatDate(schedule.lastExecutionTime).time 
                              : 'Never executed'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {schedule.lastExecutionStatus && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Last Execution Status</h3>
                        <Badge variant={schedule.lastExecutionStatus === 'success' ? 'success' : 'destructive'}>
                          {schedule.lastExecutionStatus === 'success' ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Tags</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {schedule.tags && Object.entries(schedule.tags).length > 0 ? (
                          Object.entries(schedule.tags).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="px-2 py-1">
                              {key}: {value}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">No tags</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Execution History */}
            <Tabs defaultValue="history" className="mb-6">
              <TabsList>
                <TabsTrigger value="history">Execution History</TabsTrigger>
                <TabsTrigger value="resources">Managed Resources</TabsTrigger>
              </TabsList>
              
              <TabsContent value="history" className="bg-white rounded-md border border-gray-200 mt-6">
                {loadingHistory ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2">Loading execution history...</span>
                  </div>
                ) : executionHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Execution Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Resources</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {executionHistory.map((execution) => (
                        <TableRow key={execution.id}>
                          <TableCell>
                            {formatDate(execution.executionTime).date} {formatDate(execution.executionTime).time}
                          </TableCell>
                          <TableCell>
                            <Badge variant={execution.status === 'success' ? 'success' : 'destructive'}>
                              {execution.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {execution.affectedResources.length} resources affected
                          </TableCell>
                          <TableCell>{execution.details || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex justify-center items-center py-8">
                    <p className="text-gray-500">No execution history found</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="resources" className="bg-white rounded-md border border-gray-200 mt-6">
                {schedule.resourceIds.length > 0 ? (
                  <div className="p-4">
                    <p className="text-sm mb-4">This schedule manages {schedule.resourceIds.length} resources:</p>
                    <ul className="list-disc pl-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {schedule.resourceIds.map((resourceId) => (
                        <li key={resourceId} className="text-sm text-gray-700">
                          <Link to={`/resources/${resourceId}`} className="text-blue-600 hover:underline">
                            {resourceId}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex justify-center items-center py-8">
                    <p className="text-gray-500">No resources assigned to this schedule</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 p-4 text-sm text-gray-500">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-2 md:gap-6">
            <span>Terms of service</span>
            <span>Privacy Policy</span>
            <span>Contact us</span>
            <span>About</span>
            <span className="md:ml-auto">© 2021 - {new Date().getFullYear()}, Scho1ar Solution Inc. or its affiliates</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDetail;