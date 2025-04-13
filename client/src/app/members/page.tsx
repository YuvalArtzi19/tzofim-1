'use client';

import React from 'react';
import MemberManagement from '../components/members/MemberManagement';
import { useAuth } from '../components/auth/AuthContext';
import { useRouter } from 'next/navigation';

const MembersPage = () => {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Only counselors, admins, and tribe leaders can access this page
  if (!user?.roles?.some(role => ['Counselor', 'Admin', 'Tribe Leader'].includes(role))) {
    return (
      <div className="p-4">
        <h1 className="text-xl text-red-600">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Member Management</h1>
      <MemberManagement />
    </div>
  );
};

export default MembersPage;