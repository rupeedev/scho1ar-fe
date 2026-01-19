import React from 'react';
import { Activity, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { AuditLog } from '@/lib/api/audit-logs';

interface AuditLogStatsProps {
  logs: AuditLog[];
  totalLogs: number;
}

const AuditLogStats: React.FC<AuditLogStatsProps> = ({ logs, totalLogs }) => {
  // Calculate statistics
  const last24HoursAgo = new Date();
  last24HoursAgo.setHours(last24HoursAgo.getHours() - 24);
  
  const recentLogs = logs.filter(log => 
    new Date(log.timestamp) >= last24HoursAgo
  );
  
  const failedActions = logs.filter(log => !log.success);
  const uniqueUsers = new Set(logs.map(log => log.userId)).size;
  
  // Calculate critical alerts (failed security operations, budget exceeded, etc)
  const criticalActions = logs.filter(log => 
    !log.success || 
    log.action === 'budget_exceeded' || 
    log.action === 'schedule_failed' ||
    (log.resource === 'security' && !log.success)
  );

  const stats = [
    {
      label: 'TOTAL ACTIVITIES',
      value: totalLogs.toLocaleString(),
      change: `${recentLogs.length} today`,
      gradient: 'from-emerald-500/30',
      bottomGradient: 'from-emerald-500 to-emerald-200/20',
      changeColor: 'text-emerald-600',
      icon: Activity
    },
    {
      label: 'ACTIVE USERS',
      value: uniqueUsers.toString(),
      change: 'Last 24 hours',
      gradient: 'from-blue-500/30',
      bottomGradient: 'from-blue-500 to-blue-200/20',
      changeColor: 'text-blue-600',
      icon: Users
    },
    {
      label: 'FAILED ACTIONS',
      value: failedActions.length.toString(),
      change: failedActions.length > 0 ? 'Needs review' : 'All clear',
      gradient: 'from-amber-500/30',
      bottomGradient: 'from-amber-500 to-amber-200/20',
      changeColor: failedActions.length > 0 ? 'text-amber-600' : 'text-green-600',
      icon: AlertTriangle
    },
    {
      label: 'CRITICAL ALERTS',
      value: criticalActions.length.toString(),
      change: criticalActions.length > 0 ? 'Requires attention' : 'No issues',
      gradient: 'from-red-500/30',
      bottomGradient: 'from-red-500 to-red-200/20',
      changeColor: criticalActions.length > 0 ? 'text-red-600' : 'text-green-600',
      icon: TrendingUp
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className="relative overflow-hidden border border-gray-200 shadow-sm bg-white h-40 rounded-xl"
        >
          <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} to-transparent w-2/5`}></div>
          <div className="relative p-6 z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
                <p className={`text-sm ${stat.changeColor} font-medium mt-1`}>
                  {stat.change}
                </p>
              </div>
              <stat.icon className="h-8 w-8 text-gray-400 opacity-50" />
            </div>
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.bottomGradient}`}></div>
        </div>
      ))}
    </div>
  );
};

export default AuditLogStats;