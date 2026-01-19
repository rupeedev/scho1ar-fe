
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

const AccountBreadcrumbs: React.FC = () => {
  return (
    <div className="flex items-center gap-2 text-gray-500 mb-4">
      <Link to="/dashboard" className="hover:text-blue-600">
        <Home size={16} />
      </Link>
      <ChevronRight size={14} />
      <Link to="/cloud-accounts" className="text-sm hover:text-blue-600">Cloud Accounts</Link>
      <ChevronRight size={14} />
      <span className="text-sm">Add Account</span>
    </div>
  );
};

export default AccountBreadcrumbs;
