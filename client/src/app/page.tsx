'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from './components/auth/AuthContext';

// Feature card component
const FeatureCard = ({ title, description, icon }: { title: string; description: string; icon: string }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
    <div className="flex items-center mb-4">
      <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
        <span className="text-blue-600 dark:text-blue-300 text-xl">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <p className="text-gray-600 dark:text-gray-400">{description}</p>
  </div>
);

// Home page component
const HomePage = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        {/* Hero section */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Welcome to ScoutsTribe</h1>
              <p className="text-xl max-w-3xl mx-auto mb-8">
                The centralized platform for scout group leaders and counselors to communicate, manage documents, and streamline operations.
              </p>
              {user ? (
                <Link
                  href="/messaging"
                  className="bg-white text-blue-600 px-6 py-3 rounded-md font-medium hover:bg-blue-50"
                >
                  Go to Messaging
                </Link>
              ) : (
                <Link
                  href="/signup"
                  className="bg-white text-blue-600 px-6 py-3 rounded-md font-medium hover:bg-blue-50"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Features section */}
        <div className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                title="Centralized Communication"
                description="Grade-based messaging channels for targeted communication between leaders and counselors."
                icon="💬"
              />
              <FeatureCard
                title="Weekly Forms"
                description="Create, submit, and track weekly reports and forms with ease."
                icon="📝"
              />
              <FeatureCard
                title="Document Management"
                description="Upload, organize, and share important documents with tagging for easy retrieval."
                icon="📁"
              />
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-white dark:bg-gray-800 shadow-inner py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} ScoutsTribe. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default function Home() {
  return <HomePage />;
}
