'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import axios from 'axios';

type User = {
  id: number;
  email: string;
  role: string;
};

type Grade = {
  id: string;
  name: string;
};

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');

  // Mock grades for now - in a real app, these would come from the API
  const grades: Grade[] = [
    { id: '3', name: 'Grade 3' },
    { id: '4', name: 'Grade 4' },
    { id: '5', name: 'Grade 5' },
    { id: '6', name: 'Grade 6' },
    { id: '7', name: 'Grade 7' },
    { id: '8', name: 'Grade 8' },
    { id: '9', name: 'Grade 9' },
    { id: '10', name: 'Grade 10' },
    { id: '11', name: 'Grade 11' },
    { id: '12', name: 'Grade 12' },
    { id: 'operations', name: 'Operations' },
  ];

  // Fetch users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3001/api/admin/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user && (user.role === 'Admin' || user.role === 'Scout Leader')) {
      fetchUsers();
    }
  }, [user]);

  // Check if current user has permission to change roles
  const canChangeRoles = user && (user.role === 'Admin' || user.role === 'Scout Leader');
  
  // Only Admin and Scout Leader can assign Scout Leader role
  const canAssignScoutLeader = user && user.role === 'Admin';

  const handleRoleChange = async () => {
    // In a real app, this would make an API call to update the user's role
    alert(`Role change for ${selectedUser?.email} to ${newRole} would be saved here.`);
    
    // For now, just update the UI
    setUsers(users.map(u => 
      u.id === selectedUser?.id ? { ...u, role: newRole } : u
    ));
    setSelectedUser(null);
    setNewRole('');
  };

  const handleGradeAssignment = async () => {
    // In a real app, this would make an API call to assign the user to a grade
    alert(`Assignment of ${selectedUser?.email} to ${selectedGrade} would be saved here.`);
    setSelectedUser(null);
    setSelectedGrade('');
  };

  if (!user || (user.role !== 'Admin' && user.role !== 'Scout Leader')) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">User Management</h2>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">User Management</h2>
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">User Management</h2>
      
      {/* User List */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Users</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Role</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">{user.role}</td>
                  <td className="py-3 px-4">
                    {canChangeRoles && (
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setNewRole(user.role);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md mr-2"
                      >
                        Change Role
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setSelectedGrade('');
                      }}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-md"
                    >
                      Assign to Grade
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Role Change Modal */}
      {selectedUser && newRole !== '' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Change Role</h3>
            <p className="mb-4">
              Change role for <strong>{selectedUser.email}</strong>
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">New Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="Counselor">Counselor</option>
                <option value="Grade Manager">Grade Manager</option>
                {canAssignScoutLeader && (
                  <option value="Scout Leader">Scout Leader</option>
                )}
                {user?.role === 'Admin' && (
                  <option value="Admin">Admin</option>
                )}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Grade Assignment Modal */}
      {selectedUser && selectedGrade === '' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Assign to Grade</h3>
            <p className="mb-4">
              Assign <strong>{selectedUser.email}</strong> to a grade
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Grade</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a grade</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleGradeAssignment}
                disabled={!selectedGrade}
                className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;