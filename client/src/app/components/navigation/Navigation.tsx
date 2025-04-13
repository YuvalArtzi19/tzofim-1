'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../auth/AuthContext';

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

export default Navigation;