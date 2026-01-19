import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Cloud, Users, UserPlus } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import SupportChat from '@/components/SupportChat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CloudAccountsTab from '@/components/onboarding/CloudAccountsTab';
import TeamsTab from '@/components/onboarding/TeamsTab';
import UsersTab from '@/components/onboarding/UsersTab';

const Onboarding = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('cloud-accounts');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleChatOpen = () => {
    console.log('Opening chat window');
    setIsChatOpen(true);
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
  };

  // Check for tab parameter in URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['cloud-accounts', 'teams', 'users'].includes(tabParam)) {
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
      <Sidebar onChatToggle={handleChatToggle} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto bg-gray-50/30">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {/* Header Section */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Onboarding</h1>
              <p className="text-gray-600">
                Manage your cloud accounts, teams, and users from one centralized location.
              </p>
            </div>

            {/* Tabbed Interface with Nature-Inspired Design */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-transparent border-b border-gray-200 p-0 shadow-none rounded-none">
                <TabsTrigger 
                  value="cloud-accounts" 
                  className="flex items-center gap-2 px-6 py-4 transition-all duration-300 data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 hover:text-emerald-600 font-medium text-base text-gray-600 border-b-2 border-transparent"
                >
                  <Cloud className="h-5 w-5 transition-all duration-300" />
                  <span className="font-medium">Cloud Accounts</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="teams" 
                  className="flex items-center gap-2 px-6 py-4 transition-all duration-300 data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 hover:text-emerald-600 font-medium text-base text-gray-600 border-b-2 border-transparent"
                >
                  <UserPlus className="h-5 w-5 transition-all duration-300" />
                  <span className="font-medium">Teams</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="users" 
                  className="flex items-center gap-2 px-6 py-4 transition-all duration-300 data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 hover:text-emerald-600 font-medium text-base text-gray-600 border-b-2 border-transparent"
                >
                  <Users className="h-5 w-5 transition-all duration-300" />
                  <span className="font-medium">Users</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab Content */}
              <TabsContent value="cloud-accounts" className="mt-0">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <CloudAccountsTab />
                </div>
              </TabsContent>

              <TabsContent value="teams" className="mt-0">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <TeamsTab />
                </div>
              </TabsContent>

              <TabsContent value="users" className="mt-0">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <UsersTab />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      <SupportChat isOpen={isChatOpen} onClose={handleChatClose} onOpen={handleChatOpen} />
    </div>
  );
};

export default Onboarding;