import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TrendingUp, GanttChartSquare, ShoppingCart } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CostTrendTab from '@/components/cost-management/CostTrendTab';
import OptimizationLabTab from '@/components/cost-management/OptimizationLabTab';
import ReservationsTab from '@/components/cost-management/ReservationsTab';

const CostManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('costmanagement');

  // Check for tab parameter in URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['costmanagement', 'optimization-lab', 'reservations'].includes(tabParam)) {
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
          <div className="max-w-7xl mx-auto px-6 py-6">
            
            {/* Header Section with improved spacing */}
            <div className="mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 mb-3 tracking-tight">Cost Management</h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                Monitor your cloud spending, analyze cost trends, and optimize your budget with advanced forecasting.
              </p>
            </div>

            {/* Tabbed Interface with Emerald Theme */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-transparent border-b border-gray-200 p-0 shadow-none">
                <TabsTrigger
                  value="costmanagement"
                  className="flex items-center gap-2 px-6 py-4 transition-all duration-300 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 hover:text-emerald-600 font-bold text-base text-gray-700 border-b-2 border-transparent"
                >
                  <TrendingUp className={`h-5 w-5 transition-all duration-300 ${activeTab === 'costmanagement' ? 'text-emerald-600' : 'text-blue-500'}`} />
                  <span className={`font-bold ${activeTab === 'costmanagement' ? 'text-emerald-600' : ''}`}>Cost Trend</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="optimization-lab" 
                  className="flex items-center gap-2 px-6 py-4 transition-all duration-300 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 hover:text-emerald-600 font-bold text-base text-gray-700 border-b-2 border-transparent"
                >
                  <GanttChartSquare className={`h-5 w-5 transition-all duration-300 ${activeTab === 'optimization-lab' ? 'text-emerald-600' : 'text-purple-500'}`} />
                  <span className={`font-bold ${activeTab === 'optimization-lab' ? 'text-emerald-600' : ''}`}>Optimization Lab</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="reservations" 
                  className="flex items-center gap-2 px-6 py-4 transition-all duration-300 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 hover:text-emerald-600 font-bold text-base text-gray-700 border-b-2 border-transparent"
                >
                  <ShoppingCart className={`h-5 w-5 transition-all duration-300 ${activeTab === 'reservations' ? 'text-emerald-600' : 'text-amber-500'}`} />
                  <span className={`font-bold ${activeTab === 'reservations' ? 'text-emerald-600' : ''}`}>Reservations</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab Content */}
              <TabsContent value="costmanagement" className="mt-0">
                <CostTrendTab />
              </TabsContent>

              <TabsContent value="optimization-lab" className="mt-0">
                <OptimizationLabTab />
              </TabsContent>

              <TabsContent value="reservations" className="mt-0">
                <ReservationsTab />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CostManagement;