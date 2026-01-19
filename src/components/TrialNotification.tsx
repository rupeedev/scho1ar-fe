
import React from 'react';
import { Link } from 'react-router-dom';

const TrialNotification: React.FC = () => {
  return (
    <div className="bg-blue-50 border-b border-blue-100 p-3 text-sm text-blue-700">
      Your subscription trial period ends in 1 day. 
      <Link to="/" className="text-blue-700 hover:underline ml-1">Click here</Link> to set your default payment method.
    </div>
  );
};

export default TrialNotification;
