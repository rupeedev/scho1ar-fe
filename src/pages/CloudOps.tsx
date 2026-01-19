import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import { Monitor, Calendar, ClipboardList } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import CloudHealthTab from '@/components/cloud-ops/CloudHealthTab';
import SchedulesTab from '@/components/cloud-ops/SchedulesTab';
import AuditLogsTab from '@/components/cloud-ops/AuditLogsTab';

const CloudOps = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'cloud-health';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto bg-gray-50/30">
          <div className="max-w-7xl mx-auto px-6 py-6">
            
            {/* Header Section with title and description */}
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 mb-3 tracking-tight">Cloud Operations</h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                Monitor cloud health, manage resource schedules, and track audit logs for comprehensive operational visibility.
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-transparent border-b border-gray-200 p-0 shadow-none">
                <TabsTrigger 
                  value="cloud-health" 
                  className="flex items-center gap-2 px-6 py-4 transition-all duration-300 data-[state=active]:border-b-2 data-[state=active]:border-purple-500 hover:text-purple-600 font-bold text-base text-gray-700 border-b-2 border-transparent"
                >
                  <Monitor className={`h-5 w-5 transition-all duration-300 ${activeTab === 'cloud-health' ? 'text-purple-600' : 'text-blue-500'}`} />
                  <span className={`font-bold ${activeTab === 'cloud-health' ? 'text-purple-600' : ''}`}>Cloud Health</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="schedules" 
                  className="flex items-center gap-2 px-6 py-4 transition-all duration-300 data-[state=active]:border-b-2 data-[state=active]:border-purple-500 hover:text-purple-600 font-bold text-base text-gray-700 border-b-2 border-transparent"
                >
                  <Calendar className={`h-5 w-5 transition-all duration-300 ${activeTab === 'schedules' ? 'text-purple-600' : 'text-green-500'}`} />
                  <span className={`font-bold ${activeTab === 'schedules' ? 'text-purple-600' : ''}`}>Schedules</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="audit-logs" 
                  className="flex items-center gap-2 px-6 py-4 transition-all duration-300 data-[state=active]:border-b-2 data-[state=active]:border-purple-500 hover:text-purple-600 font-bold text-base text-gray-700 border-b-2 border-transparent"
                >
                  <ClipboardList className={`h-5 w-5 transition-all duration-300 ${activeTab === 'audit-logs' ? 'text-purple-600' : 'text-indigo-500'}`} />
                  <span className={`font-bold ${activeTab === 'audit-logs' ? 'text-purple-600' : ''}`}>Audit Logs</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cloud-health" className="mt-0">
                <CloudHealthTab />
              </TabsContent>

              <TabsContent value="schedules" className="mt-0">
                <SchedulesTab />
              </TabsContent>

              <TabsContent value="audit-logs" className="mt-0">
                <AuditLogsTab />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CloudOps;