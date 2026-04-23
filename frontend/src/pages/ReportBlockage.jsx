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
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#7c6248] hover:text-[#181511] transition-colors font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#181511]">Road Hazards</h1>
        <p className="text-sm text-[#7c6248] mt-1">Report and view active hazards in the Nashville area</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Report Form */}
        <div>
          <BlockageReport onSuccess={handleSuccess} />
        </div>

        {/* Blockage List */}
        <div>
          <h2 className="text-xl font-bold text-[#181511] mb-4">Recent Blockages</h2>
          <BlockageList key={refreshKey} />
        </div>
      </div>
    </div>
  );
};

export default ReportBlockage;
