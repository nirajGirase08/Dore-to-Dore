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
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
      <footer className="bg-gray-800 text-white py-6 text-center">
        <div className="container-custom">
          <p className="text-sm">
            Dore-to-Dore &copy; 2024 | Vanderbilt Community Resource Matching Platform
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Built for crisis response and community support
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
