import React from 'react';
import { useDemoContext } from '../../contexts/DemoContext';

const DemoContextBanner = ({ className = '' }) => {
  const { demoEnabled, demoRange } = useDemoContext();

  if (!demoEnabled) {
    return null;
  }

  return (
    <div className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 ${className}`}>
      <span className="font-semibold">Weather Context:</span>
      <span className="ml-2">{demoRange.label}. AI, alerts, and summaries are using this weather window. Current reported blockages remain live.</span>
    </div>
  );
};

export default DemoContextBanner;
