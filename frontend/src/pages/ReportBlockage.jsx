import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BlockageReport from '../components/crisis/BlockageReport';
import BlockageList from '../components/crisis/BlockageList';

const ReportBlockage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showList, setShowList] = useState(false);

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
    setShowList(true);
  };

  return (
    <div className="container-custom py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/dashboard" className="text-primary-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Report Form */}
        <div>
          <BlockageReport onSuccess={handleSuccess} />
        </div>

        {/* Blockage List */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Blockages</h2>
          <BlockageList key={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default ReportBlockage;
