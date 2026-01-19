import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  HeartPulse,
  LayoutGrid,
  Box,
  Calendar,
  GanttChartSquare,
  ClipboardList,
  BookOpen,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Menu,
  User,
  Settings,
  LogOut,
  MessageCircle,
  CreditCard,
  FileText,
  Network
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { useClerkAuth } from '@/hooks/use-clerk-auth';

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active = false,
  badge,
  to,
  collapsed = false,
  onClick,
  iconColor
}: { 
  icon: React.ElementType; 
  label: string;
  active?: boolean;
  badge?: number;
  to?: string;
  collapsed?: boolean;
  onClick?: () => void;
  iconColor?: string;
}) => {
  const content = (
    <>
      <Icon size={20} className={`transition-all duration-300 ${active ? 'text-white drop-shadow-sm' : iconColor || 'text-gray-500'}`} />
      {!collapsed && (
        <>
          <span className="font-medium">{label}</span>
          {badge && (
            <span className={`ml-auto flex items-center justify-center text-xs font-semibold rounded-full w-5 h-5 transition-colors duration-300 ${
              active 
                ? 'bg-white/20 text-white backdrop-blur-sm' 
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {badge}
            </span>
          )}
        </>
      )}
      
      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
          {label}
          {badge && (
            <span className="ml-2 px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
              {badge}
            </span>
          )}
        </div>
      )}
    </>
  );

  const className = `group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${
    active
      ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white shadow-lg'
      : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 hover:scale-105'
  }`;

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={className}
        title={collapsed ? label : undefined}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={to!}
      className={className}
      title={collapsed ? label : undefined}
    >
      {content}
    </Link>
  );
};

const Sidebar = ({ onChatToggle }: { onChatToggle?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const { user, signOut } = useClerkAuth();

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    if (user) {
      // Use Clerk user data
      setUserData({
        display_name: user.fullName || user.firstName || user.email?.split('@')[0] || 'User',
        email: user.email,
        avatar_url: user.imageUrl
      });
    } else {
      setUserData(null);
    }
  }, [user]);

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      
      // Show logout toast
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      
      // Navigate to login page
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format display name for better presentation
  const formatDisplayName = (name: string) => {
    if (!name) return "User";
    
    // Remove dots and replace with spaces
    const cleanName = name.replace(/\./g, ' ');
    
    // Split into words and capitalize each word
    const words = cleanName.split(' ').filter(word => word.length > 0);
    const formattedWords = words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
    
    return formattedWords.join(' ');
  };

  // Generate avatar fallback from display name or email
  const getAvatarFallback = () => {
    if (!user) return "?";
    
    if (userData?.display_name) {
      const names = userData.display_name.split(' ');
      if (names.length > 1) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return userData.display_name.substring(0, 2).toUpperCase();
    }
    
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return "U";
  };
  
  return (
    <div className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300 shadow-lg`}>
      {/* Header with toggle button */}
      <div className={`${collapsed ? 'p-3' : 'p-4'} flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50`}>
        {!collapsed && (
          <>
            <div className="h-8 w-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2z" fill="#FFFFFF" />
                <path d="M22 10h-4.5v2H22c1.103 0 2 .897 2 2s-.897 2-2 2h-2v-4h-2v4h-4v2h4v4h2v-4h2c2.206 0 4-1.794 4-4s-1.794-4-4-4zm-12 4c1.103 0 2 .897 2 2s-.897 2-2 2h-2v-4h2zm0-2h-4v8h4c2.206 0 4-1.794 4-4s-1.794-4-4-4z" fill="#10B981" />
              </svg>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Scho1ar</span>
          </>
        )}
        
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={`${collapsed ? 'mx-auto' : 'ml-auto'} p-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 hover:text-emerald-700 transition-all duration-300 hover:scale-110`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </button>
      </div>
      
      {/* Navigation Items */}
      <div className={`flex-1 overflow-y-auto ${collapsed ? 'py-4 px-2' : 'py-4 px-3'} space-y-2`}>
        <SidebarItem 
          icon={LayoutGrid} 
          label="Dashboard" 
          active={location.pathname === "/dashboard"} 
          to="/dashboard" 
          collapsed={collapsed}
          iconColor="text-indigo-600"
        />
        <SidebarItem 
          icon={HeartPulse} 
          label="Cloud Ops" 
          active={location.pathname === "/cloud-ops"} 
          to="/cloud-ops" 
          collapsed={collapsed}
          iconColor="text-rose-500"
        />
        <SidebarItem
          icon={BarChart3}
          label="Cost Management"
          active={location.pathname === "/costmanagement"}
          to="/costmanagement"
          collapsed={collapsed}
          iconColor="text-emerald-600"
        />
        <SidebarItem 
          icon={Box} 
          label="Resources" 
          active={location.pathname === "/resources" || location.pathname.startsWith("/resources")} 
          to="/resources" 
          collapsed={collapsed}
          iconColor="text-purple-600"
        />
        <SidebarItem 
          icon={Network} 
          label="Architecture" 
          active={location.pathname === "/architecture"} 
          to="/architecture" 
          collapsed={collapsed}
          iconColor="text-cyan-600"
        />
        <SidebarItem 
          icon={BookOpen} 
          label="Onboarding" 
          active={location.pathname === "/onboarding"} 
          to="/onboarding" 
          collapsed={collapsed}
          iconColor="text-amber-600"
        />
      </div>

      {/* Bottom Menu Items and Footer */}
      <div className="border-t border-gray-100 bg-gradient-to-r from-gray-50 to-emerald-50">
        {/* Bottom Menu Items */}
        <div className={`${collapsed ? 'p-2' : 'p-4'} ${collapsed ? '' : 'pb-2'} space-y-2`}>
          {/* Support Section Header */}
          {!collapsed && (
            <div className="px-3 pb-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Support & Billing</h3>
            </div>
          )}
          
          {/* Billing */}
          <SidebarItem 
            icon={CreditCard} 
            label="Billing" 
            active={location.pathname === "/billing"} 
            to="/billing" 
            collapsed={collapsed}
            iconColor="text-blue-600"
          />
          
          {/* Documentation */}
          <SidebarItem 
            icon={FileText} 
            label="Documentation" 
            active={location.pathname === "/documentation"} 
            to="/documentation" 
            collapsed={collapsed}
            iconColor="text-teal-600"
          />
          
          {/* Contact Support */}
          {onChatToggle && (
            <SidebarItem 
              icon={MessageCircle} 
              label="Contact Support" 
              onClick={onChatToggle}
              collapsed={collapsed}
            />
          )}
        </div>
        
        {/* User Avatar Dropdown */}
        <div className={`${collapsed ? 'p-2' : 'px-4 pb-2'} border-t border-gray-200 dark:border-gray-600`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer hover:bg-emerald-50 rounded-xl p-2 transition-all duration-200">
                <Avatar className="h-8 w-8 bg-purple-600">
                  {userData?.avatar_url ? (
                    <AvatarImage src={userData.avatar_url} alt={userData?.display_name || "User"} />
                  ) : (
                    <AvatarFallback>
                      {getAvatarFallback()}
                    </AvatarFallback>
                  )}
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {formatDisplayName(userData?.display_name || user?.email?.split('@')[0] || "User")}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {user?.email || ""}
                    </div>
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={collapsed ? "center" : "start"} side={collapsed ? "right" : "top"} className="w-56 mb-2 ml-2">
              <div className="px-2 py-1.5 text-sm font-semibold">
                Signed in as
              </div>
              <div className="px-2 py-1 mb-1 text-sm font-medium">
                {formatDisplayName(userData?.display_name || user?.email || "User")}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer py-2" onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                <span>Your Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-2" onClick={handleSettingsClick}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer py-2 text-red-500 hover:text-red-600" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Version Footer */}
        {!collapsed && (
          <div className="px-4 pb-4">
            <div className="text-xs text-gray-500 text-center">
              v1.0.0 • Scho1ar
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;