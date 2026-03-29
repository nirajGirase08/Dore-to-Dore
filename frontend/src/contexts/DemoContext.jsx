import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'dore_demo_context_enabled';

const DEMO_CONTEXT = {
  startDate: '2026-01-25',
  endDate: '2026-01-27',
  label: 'January 25-27, 2026',
};

const DemoContext = createContext(null);

export const DemoProvider = ({ children }) => {
  const [demoEnabled, setDemoEnabled] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setDemoEnabled(stored === 'true');
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(demoEnabled));
  }, [demoEnabled]);

  const value = useMemo(() => ({
    demoEnabled,
    setDemoEnabled,
    toggleDemoEnabled: () => setDemoEnabled((prev) => !prev),
    demoRange: DEMO_CONTEXT,
    getWeatherContextPayload: () => (
      demoEnabled
        ? {
            weather_mode: 'historical_range',
            historical_weather_date: DEMO_CONTEXT.startDate,
            start_date: DEMO_CONTEXT.startDate,
            end_date: DEMO_CONTEXT.endDate,
          }
        : {
            weather_mode: 'current',
            historical_weather_date: null,
            start_date: null,
            end_date: null,
          }
    ),
  }), [demoEnabled]);

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemoContext = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoContext must be used within a DemoProvider');
  }
  return context;
};

export default DemoContext;
