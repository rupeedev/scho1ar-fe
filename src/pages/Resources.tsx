import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Search, Tags } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ResourcesTab from '@/components/resources/ResourcesTab';
import DiscoveryTab from '@/components/resources/DiscoveryTab';
import TagsTab from '@/components/resources/TagsTab';

const Resources = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('discovery');

  // Check for tab parameter in URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['discovery', 'resources', 'tags'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="flex h-screen bg-gray-50/30">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto bg-gray-50/30">
          <div className="max-w-7xl mx-auto px-8 py-8">
            
            {/* Header Section with improved spacing */}
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 mb-3 tracking-tight">Resources</h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                Manage your cloud resources, discoveries, and tags from one centralized location.
              </p>
            </div>

            {/* Tabbed Interface with Emerald Theme */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-transparent border-b border-gray-200 p-0 shadow-none">
                <TabsTrigger 
                  value="discovery" 
                  className="flex items-center gap-2 px-6 py-4 transition-all duration-300 data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 hover:text-emerald-600 font-bold text-base text-gray-600 border-b-2 border-transparent"
                >
                  <Search className="h-5 w-5 transition-all duration-300" />
                  <span className="font-bold">Discovery</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="resources" 
                  className="flex items-center gap-2 px-6 py-4 transition-all duration-300 data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 hover:text-emerald-600 font-bold text-base text-gray-600 border-b-2 border-transparent"
                >
                  <Box className="h-5 w-5 transition-all duration-300" />
                  <span className="font-bold">Resources</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="tags" 
                  className="flex items-center gap-2 px-6 py-4 transition-all duration-300 data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 hover:text-emerald-600 font-bold text-base text-gray-600 border-b-2 border-transparent"
                >
                  <Tags className="h-5 w-5 transition-all duration-300" />
                  <span className="font-bold">Tags</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab Content with seamless background integration */}
              <TabsContent value="discovery" className="mt-0">
                <DiscoveryTab />
              </TabsContent>

              <TabsContent value="resources" className="mt-0">
                <ResourcesTab />
              </TabsContent>

              <TabsContent value="tags" className="mt-0">
                <TagsTab />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Resources;