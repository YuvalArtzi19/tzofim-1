'use client';

import React from 'react';
import MessagingDashboard from '../components/messaging/MessagingDashboard';
import Link from 'next/link';
import Navigation from '../components/navigation/Navigation';

export default function MessagingPage() {
  return (
    <div className="w-full h-full max-w-7xl mx-auto p-4">
      <MessagingDashboard />
    </div>
  );
}