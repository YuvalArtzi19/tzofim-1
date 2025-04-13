'use client';

import React from 'react';
import MessagingDashboard from '../components/messaging/MessagingDashboard';
import Link from 'next/link';
import { useAuth } from '../components/auth/AuthContext';

// Navigation component with auth-aware links
const Navigation = () => {
  const { user, logout } = useAuth();
  
  return (
    <nav className="flex items-center space-x-4">
      {user ? (
        <>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {user.email}
          </span>
          {(user.roles?.includes('Admin') || user.roles?.includes('Tribe Leader')) && (
            <Link href="/admin" className="text-blue-600 hover:underline text-sm mr-2">
              Admin
            </Link>
          )}
          <button
            onClick={logout}
            className="text-red-600 hover:underline text-sm"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
          <Link href="/signup" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </>
      )}
    </nav>
  );
};

export default function MessagingPage() {
  return (
    <div className="min-h-screen flex flex-col">
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-xl font-bold">
                ScoutsTribe
              </Link>
              <div className="hidden sm:flex space-x-4">
                <Link
                  href="/messaging"
                  className="text-blue-600 font-medium border-b-2 border-blue-600 pb-1"
                >
                  Messaging
                </Link>
                <Link
                  href="/forms"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 pb-1 border-b-2 border-transparent"
                >
                  Forms
                </Link>
                <Link
                  href="/documents"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 pb-1 border-b-2 border-transparent"
                >
                  Documents
                </Link>
              </div>
            </div>
            <Navigation />
          </div>
        </header>
        
        <main className="flex-grow flex">
          <div className="w-full h-full max-w-7xl mx-auto">
            <MessagingDashboard />
          </div>
        </main>
        
        <footer className="bg-white dark:bg-gray-800 shadow-inner py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} ScoutsTribe. All rights reserved.
          </div>
        </footer>
    </div>
  );
}