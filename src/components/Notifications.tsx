
import React from 'react';
import { PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface NotificationProps {
  className?: string;
}

const Notifications: React.FC<NotificationProps> = ({ className }) => {

  return (
    <PopoverContent className={cn("w-80 p-0", className)} align="end">
      <div className="flex items-center justify-between border-b border-gray-100 p-4">
        <h3 className="text-sm font-medium">Notifications (0)</h3>
        <span className="text-xs text-gray-400">All notifications</span>
      </div>
      
      <div className="border-l-4 border-gray-200 p-4">
        <div className="mb-2">
          <div className="text-sm font-medium text-gray-500">
            No new notifications
          </div>
          <div className="text-xs text-gray-400">
            You're all caught up! Check back later for updates.
          </div>
        </div>
      </div>
      
    </PopoverContent>
  );
};

export default Notifications;
