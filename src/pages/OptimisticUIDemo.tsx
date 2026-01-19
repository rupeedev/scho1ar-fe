import React from 'react';
import OptimisticUIDemo from '@/components/examples/OptimisticUIDemo';

const OptimisticUIDemoPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Optimistic UI Updates Demo</h1>
      
      <OptimisticUIDemo />
      
      <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">About Optimistic UI</h2>
        <p className="mb-4">
          Optimistic UI is a pattern that assumes network operations will succeed and updates the 
          interface accordingly before receiving confirmation from the server. This creates a more 
          responsive user experience, especially in applications with slower network connections.
        </p>
        
        <h3 className="text-lg font-medium mt-6 mb-2">Key Benefits:</h3>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li>
            <strong>Improved Perceived Performance:</strong> Users see changes immediately, making the application feel faster
          </li>
          <li>
            <strong>Enhanced User Experience:</strong> Reduces waiting time and provides immediate feedback
          </li>
          <li>
            <strong>Reduced Perceived Latency:</strong> Particularly valuable for operations that typically succeed
          </li>
          <li>
            <strong>Graceful Error Handling:</strong> If the operation fails, the UI can revert to its previous state
          </li>
        </ul>
        
        <h3 className="text-lg font-medium mt-6 mb-2">Implementation Strategy:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Update the UI immediately when the user performs an action</li>
          <li>Send the actual request to the server in the background</li>
          <li>If the request succeeds, no further UI updates are needed</li>
          <li>If the request fails, revert the UI to its previous state and notify the user</li>
        </ol>
      </div>
    </div>
  );
};

export default OptimisticUIDemoPage;