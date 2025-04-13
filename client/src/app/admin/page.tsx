'use client';

import React from 'react';
import UserManagement from '../components/admin/UserManagement';

export default function AdminPage() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <UserManagement />
      </div>
    </div>
  );
}