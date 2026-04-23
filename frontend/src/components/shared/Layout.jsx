import React from 'react';
import Navbar from './Navbar';
import AlertBanner from './AlertBanner';
import MessageBanner from './MessageBanner';
import ToastNotification from './ToastNotification';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <AlertBanner />
      <MessageBanner />
      <ToastNotification />
      <main className="flex-1 bg-[#f8f4ec]">
        {children}
      </main>
      <footer className="bg-[#181511] text-[#f8f4ec] py-6 text-center">
        <div className="container-custom">
          <p className="text-sm opacity-75">
            Dore-to-Dore &copy; 2025 | Vanderbilt Community Resource Matching Platform
          </p>
          <p className="text-xs opacity-40 mt-1">
            Built for crisis response and community support
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
