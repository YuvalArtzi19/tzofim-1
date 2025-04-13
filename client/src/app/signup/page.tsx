'use client';

import React from 'react';
import SignupForm from '../components/auth/SignupForm';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col">
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">
              ScoutsTribe
            </Link>
            <nav>
              <Link href="/login" className="text-blue-600 hover:underline">
                Login
              </Link>
            </nav>
          </div>
        </header>
        
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <SignupForm />
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