import { useState } from 'react';
import { Bell, Maximize, Map, Sun, Moon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import Notifications from './Notifications';
import TutorialDialog from './TutorialDialog';
import { useLocation } from 'react-router-dom';
import { useTheme } from '@/hooks/use-theme';

const Header = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return 'Dashboard';
      case '/onboarding':
        return '';
      case '/add-account':
        return 'Add Cloud Account';
      case '/costmanagement':
        return '';
      case '/cloud-health':
        return 'Cloud Health';
      case '/cloud-ops':
        return '';
      case '/resources':
        return '';
      case '/resources/discovery':
        return 'Discovery Dashboard';
      case '/reservations':
        return 'Reservations';
      case '/optimization-lab':
        return 'Optimization Lab';
      case '/schedules':
        return 'Schedules';
      case '/create-schedule':
        return 'Create Schedule';
      case '/tags':
        return 'Tags';
      case '/users':
        return 'Users';
      case '/teams':
        return 'Teams';
      case '/audit-logs':
        return 'Audit Logs';
      case '/settings':
        return 'Settings';
      case '/profile':
        return 'Profile';
      case '/account':
        return 'Account';
      case '/billing':
        return '';
      default:
        if (path.startsWith('/schedules/')) return 'Schedule Details';
        if (path.startsWith('/resource-details')) return 'Resource Details';
        if (path.startsWith('/cloud-accounts/')) return 'Cloud Account Details';
        return 'Dashboard';
    }
  };


  return (
    <div className="h-16 bg-white flex items-center justify-between px-6 relative">
      {/* Gradient Border Line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-gray-200"></div>
      <div className="flex items-center">
        <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 hover:bg-indigo-50 border-gray-200"
          onClick={() => setIsTutorialOpen(true)}
        >
          <Map size={18} className="text-indigo-600" />
        </Button>

        <Button variant="outline" size="icon" className="h-9 w-9 hover:bg-blue-50 border-gray-200">
          <Maximize size={18} className="text-blue-600" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 hover:bg-amber-50 border-gray-200"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon size={18} className="text-purple-600" />
          ) : (
            <Sun size={18} className="text-amber-500" />
          )}
        </Button>

        <div className="relative">
          <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 hover:bg-rose-50 border-gray-200">
                <Bell size={18} className="text-rose-500" />
              </Button>
            </PopoverTrigger>
            <Notifications />
          </Popover>
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-medium">1</span>
        </div>

      </div>

      <TutorialDialog open={isTutorialOpen} onOpenChange={setIsTutorialOpen} />
    </div>
  );
};

export default Header;