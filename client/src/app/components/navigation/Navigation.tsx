'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../auth/AuthContext';

const Navigation = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  if (!user) {
    return (
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link
                href="/"
                className="text-xl font-bold text-gray-800 hover:text-gray-600"
              >
                ScoutsTribe
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-3 py-2 rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const isLeaderOrAdmin = user.roles.includes('Admin') || user.roles.includes('Tribe Leader');
  const isCounselor = user.roles.includes('Counselor');

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link 
              href="/"
              className="text-xl font-bold text-gray-800 hover:text-gray-600"
            >
              ScoutsTribe
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/messaging"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/messaging')
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Messaging
            </Link>

            {(isLeaderOrAdmin || isCounselor) && (
              <>
                <Link
                  href="/members"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/members')
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Members
                </Link>
                <Link
                  href="/events"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/events')
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Events
                </Link>
              </>
            )}

            {isLeaderOrAdmin && (
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/admin')
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Admin
              </Link>
            )}

            <div className="flex items-center space-x-2 ml-4 pl-4 border-l">
              <span className="text-sm text-gray-700">
                {user.email}
              </span>
              <button
                onClick={logout}
                className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;