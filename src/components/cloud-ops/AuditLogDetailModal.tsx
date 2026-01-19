import React from 'react';
import { X, Clock, User, Globe, Activity, Database, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AuditLog } from '@/lib/api/audit-logs';
import { formatDate } from '@/lib/utils';

interface AuditLogDetailModalProps {
  log: AuditLog | null;
  isOpen: boolean;
  onClose: () => void;
}

const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({ log, isOpen, onClose }) => {
  if (!log) return null;

  const eventTime = formatDate(log.timestamp);
  
  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'create': 'bg-green-100 text-green-800',
      'update': 'bg-blue-100 text-blue-800',
      'delete': 'bg-red-100 text-red-800',
      'start': 'bg-green-100 text-green-800',
      'stop': 'bg-yellow-100 text-yellow-800',
      'sync': 'bg-cyan-100 text-cyan-800',
      'login': 'bg-purple-100 text-purple-800',
      'logout': 'bg-purple-100 text-purple-800',
      'settings_change': 'bg-blue-100 text-blue-800',
      'permission_change': 'bg-orange-100 text-orange-800',
      'schedule_execution': 'bg-indigo-100 text-indigo-800',
      'schedule_failed': 'bg-red-100 text-red-800',
      'resource_discovered': 'bg-emerald-100 text-emerald-800',
      'cost_sync': 'bg-teal-100 text-teal-800',
      'budget_exceeded': 'bg-pink-100 text-pink-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const renderDetails = () => {
    if (!log.details || Object.keys(log.details).length === 0) {
      return <p className="text-gray-500">No additional details available</p>;
    }

    return (
      <div className="space-y-2">
        {Object.entries(log.details).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-gray-600 capitalize">
              {key.replace(/_/g, ' ')}:
            </span>
            <span className="font-medium">
              {Array.isArray(value) ? value.join(', ') : String(value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Audit Log Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Event Information</h3>
            
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Timestamp:</span>
              <span className="font-medium">{eventTime.date} at {eventTime.time}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Event ID:</span>
              <span className="font-mono text-sm text-blue-500">{log.id}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Action:</span>
              <Badge className={`${getActionColor(log.action)} border-none`}>
                {log.action.replace(/_/g, ' ')}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge variant={log.success ? 'success' : 'destructive'}>
                {log.success ? 'Success' : 'Failed'}
              </Badge>
            </div>
          </div>

          {/* User Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">User Information</h3>
            
            {log.userName ? (
              <>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">User:</span>
                  <span className="font-medium">{log.userName}</span>
                </div>
                {log.userEmail && (
                  <div className="flex items-center space-x-2 ml-6">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="font-medium">{log.userEmail}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Actor:</span>
                <Badge className="bg-gray-100 text-gray-800 border-none">SYSTEM</Badge>
              </div>
            )}
            
            {log.ipAddress && (
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">IP Address:</span>
                <span className="font-mono text-sm">{log.ipAddress}</span>
              </div>
            )}
            
            {log.userAgent && (
              <div className="flex items-center space-x-2 ml-6">
                <span className="text-sm text-gray-600">User Agent:</span>
                <span className="text-sm font-medium">{log.userAgent}</span>
              </div>
            )}
          </div>

          {/* Resource Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Resource Information</h3>
            
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Resource Type:</span>
              <Badge className="bg-blue-100 text-blue-800 border-none">
                {log.resource}
              </Badge>
            </div>
            
            {log.resourceId && (
              <div className="flex items-center space-x-2 ml-6">
                <span className="text-sm text-gray-600">Resource ID:</span>
                <span className="font-mono text-sm">{log.resourceId}</span>
              </div>
            )}
            
            {log.resourceName && (
              <div className="flex items-center space-x-2 ml-6">
                <span className="text-sm text-gray-600">Resource Name:</span>
                <span className="font-medium">{log.resourceName}</span>
              </div>
            )}
          </div>

          {/* Additional Details */}
          {log.details && Object.keys(log.details).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Additional Details</h3>
              {renderDetails()}
            </div>
          )}

          {/* Error Message */}
          {log.errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Error Message</h3>
                  <p className="text-sm text-red-700">{log.errorMessage}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogDetailModal;