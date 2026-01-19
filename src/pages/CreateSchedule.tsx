
import React, { useState, useEffect } from 'react';
import { Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { schedulesApi, CreateScheduleDto } from '@/lib/api/schedules';
import { cloudAccountsApi } from '@/lib/api/cloud-accounts';
import { resourcesApi } from '@/lib/api/resources';
import { organizationsApi } from '@/lib/api/organizations';

// Simple type for selected grid cells
type GridSelection = Record<string, Record<number, 'start' | 'stop'>>;

const CreateSchedule = () => {
  const [scheduleName, setScheduleName] = useState('');
  const [description, setDescription] = useState('');
  const [cloudAccountId, setCloudAccountId] = useState('');
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [timeZone, setTimeZone] = useState('Asia/Singapore');
  const [scheduleMode, setScheduleMode] = useState('Weekly Timesheet');
  const [action, setAction] = useState<'start' | 'stop'>('stop');
  
  const [cloudAccounts, setCloudAccounts] = useState<Array<{ id: string, name: string, account_id_on_provider?: string }>>([]);
  const [resources, setResources] = useState<Array<{ 
    id: string, 
    resource_name: string, 
    name?: string,
    resource_type?: string,
    resource_id_on_provider?: string,
    region?: string,
    status?: string 
  }>>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [organization, setOrganization] = useState<any>(null);
  
  const [gridSelection, setGridSelection] = useState<GridSelection>({});
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Days of the week
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Hours for the grid
  const hours = [
    '12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
    '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'
  ];

  // Fetch organization first, then cloud accounts
  useEffect(() => {
    fetchOrganization();
  }, []);
  
  const fetchOrganization = async () => {
    try {
      const orgs = await organizationsApi.getAll();
      if (orgs && orgs.length > 0) {
        setOrganization(orgs[0]);
        fetchCloudAccounts(orgs[0].id);
      } else {
        toast({
          title: 'Error',
          description: 'No organization found. Please create an organization first.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch organization',
        variant: 'destructive',
      });
    }
  };

  // Fetch resources when cloud account changes
  useEffect(() => {
    if (cloudAccountId) {
      fetchResources(cloudAccountId);
    }
  }, [cloudAccountId]);

  const fetchCloudAccounts = async (organizationId: string) => {
    try {
      setLoadingAccounts(true);
      const accounts = await cloudAccountsApi.getAll(organizationId);
      setCloudAccounts(accounts);
      
      // Auto-select the first account if available
      if (accounts.length > 0) {
        setCloudAccountId(accounts[0].id);
      }
    } catch (error) {
      console.error('Error fetching cloud accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch cloud accounts. Please ensure you have added at least one cloud account.',
        variant: 'destructive',
      });
    } finally {
      setLoadingAccounts(false);
    }
  };

  const fetchResources = async (accountId: string) => {
    try {
      setLoadingResources(true);
      const fetchedResources = await resourcesApi.getAll(accountId);
      
      // Filter for schedulable resources (EC2, RDS, etc.)
      const schedulableResources = fetchedResources.filter((resource: any) => {
        const type = resource.resource_type?.toLowerCase() || '';
        return type.includes('instance') || 
               type.includes('ec2') || 
               type.includes('rds') || 
               type.includes('lambda') ||
               type.includes('ecs') ||
               type.includes('fargate');
      });
      
      setResources(schedulableResources);
      
      if (schedulableResources.length === 0 && fetchedResources.length > 0) {
        toast({
          title: 'No Schedulable Resources',
          description: 'No EC2, RDS, or other schedulable resources found in this account.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch resources. Please sync your cloud account first.',
        variant: 'destructive',
      });
    } finally {
      setLoadingResources(false);
    }
  };

  const handleGridCellClick = (day: string, hour: number) => {
    setGridSelection(prev => {
      const newSelection = { ...prev };
      
      if (!newSelection[day]) {
        newSelection[day] = {};
      }
      
      if (newSelection[day][hour]) {
        // Toggle between start and stop
        newSelection[day][hour] = newSelection[day][hour] === 'start' ? 'stop' : 'start';
      } else {
        // Default to the currently selected action
        newSelection[day][hour] = action;
      }
      
      return newSelection;
    });
  };

  const generateCronExpression = (): string => {
    // Simple implementation - in a real app this would be more sophisticated
    // Format: minute hour day-of-month month day-of-week
    // For now, just return a basic expression that runs daily at 9 AM
    return '0 9 * * *';
  };

  const handleSave = async () => {
    if (!scheduleName) {
      toast({
        title: 'Validation Error',
        description: 'Schedule name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!cloudAccountId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a cloud account',
        variant: 'destructive',
      });
      return;
    }

    if (selectedResourceIds.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one resource',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Convert to snake_case for backend
      const scheduleData: any = {
        name: scheduleName,
        description: description,
        cloud_account_id: cloudAccountId,
        resource_ids: selectedResourceIds,
        definition: gridSelection, // Include the grid selection
        timezone: timeZone,
        schedule_mode: scheduleMode.toLowerCase().replace(' ', '_'),
        action_type: action,
        is_active: true,
        cron_expression: generateCronExpression(),
        tags: { 
          createdBy: 'web-ui',
          mode: scheduleMode
        }
      };
      
      await schedulesApi.create(scheduleData);
      
      toast({
        title: 'Success',
        description: 'Schedule created successfully',
      });
      
      navigate('/schedules');
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to create schedule',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/schedules');
  };

  const getCellBackgroundColor = (day: string, hourIndex: number) => {
    if (gridSelection[day]?.[hourIndex] === 'start') {
      return 'bg-green-400 border-green-300';
    } else if (gridSelection[day]?.[hourIndex] === 'stop') {
      return 'bg-red-400 border-red-300';
    }
    return 'bg-gray-200 border-gray-300 hover:bg-gray-300';
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4">
            {/* Form */}
            <div className="bg-white rounded-md border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule Name*
                  </label>
                  <Input 
                    type="text" 
                    placeholder="Enter a schedule name"
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Input 
                    type="text" 
                    placeholder="Enter a description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Zone*
                  </label>
                  <select 
                    className="w-full h-10 border border-gray-200 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                  >
                    <option value="Asia/Singapore">Asia/Singapore</option>
                    <option value="UTC">UTC</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="America/New_York">America/New_York</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule Mode
                  </label>
                  <select 
                    className="w-full h-10 border border-gray-200 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={scheduleMode}
                    onChange={(e) => setScheduleMode(e.target.value)}
                  >
                    <option value="Weekly Timesheet">Weekly Timesheet</option>
                    <option value="Monthly Schedule">Monthly Schedule</option>
                    <option value="Custom Schedule">Custom Schedule</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Action Type*
                    </label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 cursor-help">
                            <Info size={14} className="text-gray-400" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-64">Select the default action for this schedule</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <select 
                    className="w-full h-10 border border-gray-200 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={action}
                    onChange={(e) => setAction(e.target.value as 'start' | 'stop')}
                  >
                    <option value="start">Start</option>
                    <option value="stop">Stop</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Cloud Account*
                    </label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="ml-1 cursor-help">
                            <Info size={14} className="text-gray-400" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-64">Select a cloud account to manage resources</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <select 
                    className="w-full h-10 border border-gray-200 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={cloudAccountId}
                    onChange={(e) => setCloudAccountId(e.target.value)}
                    disabled={loadingAccounts}
                  >
                    <option value="">Select a cloud account</option>
                    {cloudAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.name} {account.account_id_on_provider ? `(${account.account_id_on_provider})` : ''}
                      </option>
                    ))}
                  </select>
                  {loadingAccounts && <div className="mt-1 text-sm text-gray-600 flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" /> Loading accounts...
                  </div>}
                </div>
              </div>

              {/* Resource Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Resources*
                </label>
                
                {loadingResources ? (
                  <div className="flex items-center text-sm text-gray-600">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading resources...
                  </div>
                ) : resources.length > 0 ? (
                  <div className="border border-gray-200 rounded-md p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Found {resources.length} schedulable resource{resources.length !== 1 ? 's' : ''}
                      </span>
                      <button
                        type="button"
                        className="text-sm text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          if (selectedResourceIds.length === resources.length) {
                            setSelectedResourceIds([]);
                          } else {
                            setSelectedResourceIds(resources.map(r => r.id));
                          }
                        }}
                      >
                        {selectedResourceIds.length === resources.length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    
                    {/* Group resources by type */}
                    {Object.entries(
                      resources.reduce((acc: any, resource) => {
                        const type = resource.resource_type || 'Other';
                        if (!acc[type]) acc[type] = [];
                        acc[type].push(resource);
                        return acc;
                      }, {})
                    ).map(([type, typeResources]: [string, any]) => (
                      <div key={type} className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          {type.replace(/_/g, ' ').toUpperCase()}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                          {typeResources.map((resource: any) => (
                            <div key={resource.id} className="flex items-start p-2 hover:bg-gray-50 rounded">
                              <input 
                                type="checkbox"
                                id={`resource-${resource.id}`}
                                className="mt-1 mr-2"
                                checked={selectedResourceIds.includes(resource.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedResourceIds(prev => [...prev, resource.id]);
                                  } else {
                                    setSelectedResourceIds(prev => prev.filter(id => id !== resource.id));
                                  }
                                }}
                              />
                              <label htmlFor={`resource-${resource.id}`} className="text-sm flex-1 cursor-pointer">
                                <div className="font-medium">
                                  {resource.resource_name || resource.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {resource.resource_id_on_provider && (
                                    <span className="mr-2">ID: {resource.resource_id_on_provider}</span>
                                  )}
                                  {resource.region && (
                                    <span>Region: {resource.region}</span>
                                  )}
                                </div>
                                {resource.status && (
                                  <div className="text-xs">
                                    <span className={`inline-block px-2 py-0.5 rounded-full ${
                                      resource.status === 'running' ? 'bg-green-100 text-green-800' :
                                      resource.status === 'stopped' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {resource.status}
                                    </span>
                                  </div>
                                )}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    {cloudAccountId ? (
                      <div className="space-y-2">
                        <p>No schedulable resources found for this account.</p>
                        <p className="text-xs">
                          To see resources here:
                        </p>
                        <ol className="text-xs ml-4 list-decimal">
                          <li>Go to the Cloud Accounts page</li>
                          <li>Click "Sync" on your cloud account to discover resources</li>
                          <li>Come back here after sync completes</li>
                        </ol>
                        <p className="text-xs mt-2">
                          Only EC2 instances, RDS databases, and similar resources can be scheduled.
                        </p>
                      </div>
                    ) : 'Select a cloud account to view resources'}
                  </div>
                )}
              </div>

              {/* Weekly Schedule Grid */}
              <div className="overflow-x-auto mb-8">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Schedule Timesheet</h3>
                <p className="text-xs text-gray-500 mb-4">Click on grid cells to toggle between running (green) and stopped (red) states</p>

                <div className="min-w-max">
                  {/* Hours header */}
                  <div className="flex">
                    <div className="w-16"></div>
                    {hours.map((hour, index) => (
                      <div key={index} className="w-12 text-xs text-center font-medium">
                        {hour}
                      </div>
                    ))}
                  </div>

                  {/* Days and grid */}
                  {days.map((day, dayIndex) => (
                    <div key={dayIndex} className="flex items-center">
                      <div className="w-16 py-2 font-medium text-sm">{day}</div>
                      {hours.map((_, hourIndex) => (
                        <div 
                          key={hourIndex} 
                          className={`w-12 h-8 border cursor-pointer ${getCellBackgroundColor(day, hourIndex)}`}
                          onClick={() => handleGridCellClick(day, hourIndex)}
                        ></div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-8 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-400"></div>
                  <span className="text-sm">Running</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-400"></div>
                  <span className="text-sm">Stopped</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save'}
              </Button>
            </div>
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

export default CreateSchedule;
