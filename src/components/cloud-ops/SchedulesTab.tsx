import React, { useState, useEffect } from 'react';
import { Search, Plus, CalendarDays, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { schedulesApi, Schedule, ScheduleFilters } from '@/lib/api/schedules';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

const SchedulesTab = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ScheduleFilters>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    // Apply search query filter with debounce
    const handler = setTimeout(() => {
      if (searchQuery) {
        fetchSchedules();
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const data = await schedulesApi.getAll(filters);
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch schedules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = () => {
    navigate('/create-schedule');
  };

  const handleToggleSchedule = async (scheduleId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await schedulesApi.disable(scheduleId);
      } else {
        await schedulesApi.enable(scheduleId);
      }
      
      // Refresh the schedules list
      fetchSchedules();
      
      toast({
        title: 'Success',
        description: `Schedule ${currentStatus ? 'disabled' : 'enabled'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling schedule:', error);
      toast({
        title: 'Error',
        description: `Failed to ${currentStatus ? 'disable' : 'enable'} schedule`,
        variant: 'destructive',
      });
    }
  };

  const filteredSchedules = searchQuery 
    ? schedules.filter(schedule => 
        schedule.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : schedules;
  
  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-medium text-gray-800">Schedules</h1>
        <Button className="bg-blue-500 hover:bg-blue-600" onClick={handleCreateSchedule}>
          <Plus size={16} />
          <span>Create schedule</span>
        </Button>
      </div>

      {/* Search */}
      <div className="flex justify-end mb-6">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search..."
            className="w-72"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading schedules...</span>
        </div>
      )}

      {/* Table with data */}
      {!loading && filteredSchedules.length > 0 && (
        <div className="bg-white rounded-md border border-gray-200 overflow-hidden mb-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-64">Schedule Name</TableHead>
                <TableHead>Resources</TableHead>
                <TableHead>Time Zone</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">
                    <Link to={`/schedules/${schedule.id}`} className="text-blue-600 hover:underline">
                      {schedule.name}
                    </Link>
                  </TableCell>
                  <TableCell>{schedule.resourceIds.length}</TableCell>
                  <TableCell>{schedule.timezone}</TableCell>
                  <TableCell>
                    <Badge variant={schedule.action === 'start' ? 'success' : 'destructive'}>
                      {schedule.action === 'start' ? 'Start' : 'Stop'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={schedule.enabled ? 'outline' : 'secondary'}>
                      {schedule.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(schedule.createdAt)}</TableCell>
                  <TableCell>{formatDate(schedule.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleSchedule(schedule.id, schedule.enabled)}
                    >
                      {schedule.enabled ? 'Disable' : 'Enable'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredSchedules.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-blue-500 p-10 w-40 h-40 flex items-center justify-center mb-4">
            <CalendarDays size={80} className="text-white" />
          </div>
          <p className="text-lg font-medium text-gray-700 mb-4">No schedules found.</p>
          <Button className="bg-blue-500 hover:bg-blue-600" onClick={handleCreateSchedule}>
            <Plus size={16} />
            <span>Create schedule</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default SchedulesTab;