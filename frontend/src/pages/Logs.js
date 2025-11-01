import React, { useEffect } from 'react';
import RecentActivity from '../components/logs/RecentActivity';

const Logs = () => {
  useEffect(() => {
    console.log('Logs: Mounted - rendering RecentActivity');
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Activity Logs</h1>
        <p className="text-gray-400">Explore and paginate through your recent activities</p>
      </div>

      {/* Recent Activity List */}
      <RecentActivity limit={20} showPagination={true} />
    </div>
  );
};

export default Logs;