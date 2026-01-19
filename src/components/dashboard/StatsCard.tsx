
import React, { ReactNode } from 'react';
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { InfoIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | ReactNode;
  icon?: ReactNode;
  description?: ReactNode;
  className?: string;
  percentage?: string;
  color?: 'default' | 'green' | 'red';
  tooltip?: string;
}

const StatsCard = ({
  title,
  value,
  icon,
  description,
  className,
  percentage,
  color = 'default',
  tooltip,
}: StatsCardProps) => {
  const valueColor = {
    default: 'text-gray-800',
    green: 'text-emerald-600',
    red: 'text-red-500'
  }[color];

  return (
    <div className={cn(
      "bg-white rounded-md border border-gray-200 p-4 flex flex-col",
      className
    )}>
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-gray-600 flex items-center">
          {title}
          {tooltip && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <InfoIcon className="ml-1 h-4 w-4 text-gray-400 cursor-help" />
              </HoverCardTrigger>
              <HoverCardContent className="text-xs">
                {tooltip}
              </HoverCardContent>
            </HoverCard>
          )}
        </h3>
        {icon && <div>{icon}</div>}
      </div>
      <div className="mt-2 flex-1 flex items-center justify-between">
        <div className={cn("text-2xl font-bold", valueColor)}>{value}</div>
        {percentage && (
          <div className="text-lg text-gray-500">{percentage}</div>
        )}
      </div>
      {description && (
        <div className="mt-2 text-xs">{description}</div>
      )}
    </div>
  );
};

export default StatsCard;
