'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { userAPI } from '../../api/api';

// --- Types ---
type User = {
  id: number;
  email: string;
  roles: string[];
  grade: string;
};

type Grade = {
  id: string;
  name: string;
};

type LeadershipInfo = {
  counselors: { id: number; email: string }[];
  leads: { id: number; email: string }[];
};

type LeadershipByGrade = {
  [grade: string]: LeadershipInfo;
};

// --- Constants ---
const GRADES_LIST: Grade[] = [
  { id: '3', name: 'Grade 3' }, { id: '4', name: 'Grade 4' }, { id: '5', name: 'Grade 5' },
  { id: '6', name: 'Grade 6' }, { id: '7', name: 'Grade 7' }, { id: '8', name: 'Grade 8' },
  { id: '9', name: 'Grade 9' }, { id: '10', name: 'Grade 10' }, { id: '11', name: 'Grade 11' },
  { id: '12', name: 'Grade 12' }, { id: 'operations', name: 'Operations' },
];

const ROLES = {
  COUNSELOR: 'Counselor',
  TRIBE_LEADER: 'Tribe Leader',
  ADMIN: 'Admin',
};

// --- Helper Functions ---
const getGradeName = (gradeId: string): string => {
  const grade = GRADES_LIST.find(g => g.id === gradeId);
  return grade ? grade.name : gradeId;
};

// --- Grade Leadership Card Component ---
interface GradeLeadershipCardProps {
  gradeId: string;
  leadership: LeadershipInfo;
  allUsers: User[];
  onUpdate: () => void; // Callback to refresh data in parent
  currentUserRoles: string[];
}

const GradeLeadershipCard: React.FC<GradeLeadershipCardProps> = ({
  gradeId,
  leadership,
  allUsers,
  onUpdate,
  currentUserRoles,
}) => {
  const [showAddCounselor, setShowAddCounselor] = useState(false);
  const [showAddLeader, setShowAddLeader] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canAssignTribeLeader = currentUserRoles.includes(ROLES.ADMIN) || currentUserRoles.includes(ROLES.TRIBE_LEADER);

  // Filter users available to be added to this grade/role
  const availableUsers = useMemo(() => {
    const assignedUserIds = new Set([
      ...leadership.counselors.map(u => u.id),
      ...leadership.leads.map(u => u.id),
    ]);
    return allUsers.filter(u => 
      !assignedUserIds.has(u.id) && // Not already assigned in this card
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) // Matches search term
    );
  }, [allUsers, leadership, searchTerm]);

  const handleAddUser = async (userToAdd: User, role: string) => {
    setError(null);
    try {
      // Ensure user is assigned to this grade
      if (userToAdd.grade !== gradeId) {
        await userAPI.updateUserGrade(userToAdd.id, gradeId);
      }
      // Add the new role without removing existing ones
      const newRoles = Array.from(new Set([...userToAdd.roles, role]));
      await userAPI.updateUserRoles(userToAdd.id, newRoles);
      
      // Reset UI and trigger parent update
      setSearchTerm('');
      setShowAddCounselor(false);
      setShowAddLeader(false);
      onUpdate(); 
    } catch (err: any) {
      setError(`Failed to add ${userToAdd.email}: ${err.response?.data?.message || err.message}`);
      console.error(`Error adding ${role}:`, err);
    }
  };

  const handleRemoveUser = async (userToRemove: { id: number; email: string }, role: string) => {
     setError(null);
     const targetUser = allUsers.find(u => u.id === userToRemove.id);
     if (!targetUser) return;

     try {
        // Remove the specific role
        const newRoles = targetUser.roles.filter(r => r !== role);
        
        // If removing the last role in this grade, should we clear the grade?
        // For now, we only update roles. Grade assignment is separate.
        // If newRoles is empty, maybe default to 'Counselor'? Or prevent removal?
        // Let's prevent removing the last role for now via API or logic.
        // The current API replaces roles, so this logic works.
        if (newRoles.length === 0) {
             // Optionally prevent removing the last role or assign a default
             // For now, let's allow removal, which might leave the user role-less in this grade
             console.warn(`User ${targetUser.email} will have no roles left in grade ${gradeId}.`);
        }

        await userAPI.updateUserRoles(targetUser.id, newRoles);
        
        // Trigger parent update
        onUpdate();
     } catch (err: any) {
        setError(`Failed to remove ${userToRemove.email}: ${err.response?.data?.message || err.message}`);
        console.error(`Error removing ${role}:`, err);
     }
  };

  const renderUserList = (users: { id: number; email: string }[], roleToRemove: string) => (
    <ul className="mb-4 text-sm space-y-2">
      {users.map(u => (
        <li key={u.id} className="flex justify-between items-center group bg-white dark:bg-gray-800 p-2 rounded-md shadow-sm">
          <span className="font-medium">{u.email}</span>
          <button
            onClick={() => handleRemoveUser(u, roleToRemove)}
            className="text-red-500 hover:text-red-700 text-xs opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 px-2 py-1 rounded"
            aria-label={`Remove ${u.email}`}
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );

  const renderAddUserSection = (roleToAdd: string, showStateSetter: React.Dispatch<React.SetStateAction<boolean>>) => (
    <div className="mt-3 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
       <div className="flex gap-2 mb-3">
         <input
           type="text"
           placeholder="Search user email..."
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           className="flex-1 px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600"
         />
         <button
           onClick={() => showStateSetter(false)}
           className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
         >
           Cancel
         </button>
       </div>
       {availableUsers.length > 0 ? (
         <ul className="max-h-48 overflow-y-auto text-sm space-y-2">
           {availableUsers.map(u => (
             <li key={u.id}>
               <button
                 onClick={() => handleAddUser(u, roleToAdd)}
                 className="w-full text-left p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
               >
                 <div className="font-medium text-blue-600 dark:text-blue-400">{u.email}</div>
                 <div className="text-xs text-gray-500 dark:text-gray-400">
                   {u.roles.join(', ') || 'No roles'} - Grade: {u.grade ? getGradeName(u.grade) : 'N/A'}
                 </div>
               </button>
             </li>
           ))}
         </ul>
       ) : (
         <p className="text-sm text-gray-500 dark:text-gray-400 italic">No matching users found or all eligible users assigned.</p>
       )}
    </div>
  );

  return (
    <div className={`border rounded-lg overflow-hidden shadow-lg transition-all duration-200 ${
      leadership.counselors.length === 0 ? 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700' :
      leadership.counselors.length <= 2 ? 'bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700' :
      'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700'
    }`}>
      <div className={`px-4 py-3 font-semibold text-lg flex justify-between items-center ${
        leadership.counselors.length === 0 ? 'bg-red-100 dark:bg-red-800 text-red-900 dark:text-red-100' :
        leadership.counselors.length <= 2 ? 'bg-orange-100 dark:bg-orange-800 text-orange-900 dark:text-orange-100' :
        'bg-green-100 dark:bg-green-800 text-green-900 dark:text-green-100'
      }`}>
        <span>{getGradeName(gradeId)}</span>
        <span className={`text-sm font-medium px-2 py-1 rounded ${
          leadership.counselors.length === 0 ? 'bg-red-200 dark:bg-red-700 text-red-900 dark:text-red-100' :
          leadership.counselors.length <= 2 ? 'bg-orange-200 dark:bg-orange-700 text-orange-900 dark:text-orange-100' :
          'bg-green-200 dark:bg-green-700 text-green-900 dark:text-green-100'
        }`}>
          {leadership.counselors.length} counselor{leadership.counselors.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="p-5">
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        
        {/* Tribe Leaders Section */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-lg">Tribe Leaders</h4>
            {canAssignTribeLeader && (
              <button
                onClick={() => { setShowAddLeader(true); setShowAddCounselor(false); setSearchTerm(''); }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded-md transition-colors"
              >
                + Add Leader
              </button>
            )}
          </div>
          {leadership.leads.length === 0 ? (
            <p className="text-gray-500 text-sm mb-4 italic">No tribe leaders assigned</p>
          ) : (
            renderUserList(leadership.leads, ROLES.TRIBE_LEADER)
          )}
          {showAddLeader && renderAddUserSection(ROLES.TRIBE_LEADER, setShowAddLeader)}
        </div>

        <hr className="my-4 dark:border-gray-600"/>

        {/* Counselors Section */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-lg">Counselors</h4>
             <button
               onClick={() => { setShowAddCounselor(true); setShowAddLeader(false); setSearchTerm(''); }}
               className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded-md transition-colors"
             >
               + Add Counselor
             </button>
          </div>
          {leadership.counselors.length === 0 ? (
            <p className="text-gray-500 text-sm mb-4 italic">No counselors assigned</p>
          ) : (
            renderUserList(leadership.counselors, ROLES.COUNSELOR)
          )}
          {showAddCounselor && renderAddUserSection(ROLES.COUNSELOR, setShowAddCounselor)}
        </div>
      </div>
    </div>
  );
};


// --- Main User Management Component ---
const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [usersByGrade, setUsersByGrade] = useState<Record<string, User[]>>({});
  const [leadershipByGrade, setLeadershipByGrade] = useState<LeadershipByGrade>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRoles, setNewUserRoles] = useState<string[]>(['Counselor']);
  const [newUserGrade, setNewUserGrade] = useState('');
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'leadership'>('users');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, usersByGradeData, leadershipData] = await Promise.all([
        userAPI.getUsers(),
        userAPI.getUsersByGrade(),
        userAPI.getLeadershipByGrade()
      ]);
      setUsers(usersData);
      setUsersByGrade(usersByGradeData);
      setLeadershipByGrade(leadershipData);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch user data');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.roles?.includes(ROLES.ADMIN) || user.roles?.includes(ROLES.TRIBE_LEADER))) {
      fetchData();
    }
  }, [user]);

  const canChangeRoles = user && (user.roles?.includes(ROLES.ADMIN) || user.roles?.includes(ROLES.TRIBE_LEADER));
  const canAssignAdmin = user && user.roles?.includes(ROLES.ADMIN);
  const canAssignTribeLeader = user && (user.roles?.includes(ROLES.ADMIN) || user.roles?.includes(ROLES.TRIBE_LEADER));

  const handleRoleChange = async () => {
    if (!selectedUser || !selectedRoles) return; // selectedRoles can be empty
    
    // Prevent removing the last role? Or ensure a default?
    if (selectedRoles.length === 0) {
        setError("A user must have at least one role. Assign a role before saving.");
        // Alternatively, assign a default like Counselor:
        // setSelectedRoles([ROLES.COUNSELOR]); 
        // await userAPI.updateUserRoles(selectedUser.id, [ROLES.COUNSELOR]);
        return; 
    }
    setError(null); // Clear previous error

    try {
      await userAPI.updateUserRoles(selectedUser.id, selectedRoles);
      setSelectedUser(null);
      setSelectedRoles([]);
      fetchData(); // Refresh all data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user roles');
      console.error('Error updating user roles:', err);
    }
  };

  const handleGradeAssignment = async () => {
    if (!selectedUser || !selectedGrade) return;
    setError(null);
    try {
      await userAPI.updateUserGrade(selectedUser.id, selectedGrade);
      setSelectedUser(null);
      setSelectedGrade('');
      fetchData(); // Refresh all data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user grade');
      console.error('Error updating user grade:', err);
    }
  };
  
  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    setError(null);
    
    try {
      await userAPI.deleteUser(deleteConfirmUser.id);
      setDeleteConfirmUser(null);
      fetchData(); // Refresh all data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
      console.error('Error deleting user:', err);
    }
  };
  
  const handleRemoveGrade = async (userId: number) => {
    setError(null);
    
    try {
      await userAPI.removeUserGrade(userId);
      fetchData(); // Refresh all data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove grade assignment');
      console.error('Error removing grade assignment:', err);
    }
  };
  
  const handleAddUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      setError('Email and password are required');
      return;
    }
    
    setError(null);
    
    try {
      await userAPI.createUser(newUserEmail, newUserPassword, newUserRoles, newUserGrade);
      
      // Reset form
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRoles(['Counselor']);
      setNewUserGrade('');
      setShowAddUserModal(false);
      
      fetchData(); // Refresh all data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
      console.error('Error creating user:', err);
    }
  };
  
  const handleNewUserRoleToggle = (role: string) => {
    if (newUserRoles.includes(role)) {
      setNewUserRoles(newUserRoles.filter(r => r !== role));
    } else {
      setNewUserRoles([...newUserRoles, role]);
    }
  };

  const handleRoleToggle = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  // --- Render Logic ---
  if (!user || (!user.roles?.includes(ROLES.ADMIN) && !user.roles?.includes(ROLES.TRIBE_LEADER))) {
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

  // Display general error first if present
   if (error && !selectedUser) { // Only show general error if no modal is open
     return (
       <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
         <h2 className="text-2xl font-bold mb-4">User Management</h2>
         <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
           {error}
         </div>
         <button 
           onClick={fetchData} // Use fetchData to retry
           className="px-4 py-2 bg-blue-600 text-white rounded-md"
         >
           Try Again
         </button>
       </div>
     );
   }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[400px]">
      <h2 className="text-2xl font-bold mb-6">User Management</h2>
      
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 ${activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}
          onClick={() => setActiveTab('users')}
        >
          All Users
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'leadership' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}
          onClick={() => setActiveTab('leadership')}
        >
          Leadership Assignment
        </button>
      </div>
      
      {/* Content Area */}
      <div>
        {/* All Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">All Users</h3>
              {canAssignAdmin && (
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  + Add User
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-700 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Roles</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Grade</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-3 px-4 text-sm">{u.email}</td>
                      <td className="py-3 px-4">
                        {u.roles.map((role) => (
                          <span key={role} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                            {role}
                          </span>
                        ))}
                        {u.roles.length === 0 && <span className="text-xs text-gray-500">No roles</span>}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {u.grade ? (
                          <div className="flex items-center">
                            <span className="mr-2">{getGradeName(u.grade)}</span>
                            <button
                              onClick={() => handleRemoveGrade(u.id)}
                              className="text-red-500 hover:text-red-700 text-xs"
                              title="Remove grade assignment"
                            >
                              ×
                            </button>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4 text-sm flex flex-wrap gap-1">
                        {canChangeRoles && (
                          <button
                            onClick={() => { setSelectedUser(u); setSelectedRoles(u.roles); setSelectedGrade(''); setError(null); }}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                          >
                            Change Roles
                          </button>
                        )}
                        <button
                          onClick={() => { setSelectedUser(u); setSelectedGrade(u.grade || ''); setSelectedRoles([]); setError(null); }}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700"
                        >
                          Assign Grade
                        </button>
                        {canAssignAdmin && u.id !== user?.id && (
                          <button
                            onClick={() => setDeleteConfirmUser(u)}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        
        {/* Leadership by Grade Tab (Card View) */}
        {activeTab === 'leadership' && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Leadership by Grade</h3>
            {Object.keys(leadershipByGrade).length === 0 ? (
              <p className="text-gray-500">No leadership assigned to grades yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {GRADES_LIST.map(grade => (
                  <GradeLeadershipCard
                    key={grade.id}
                    gradeId={grade.id}
                    leadership={leadershipByGrade[grade.id] || { counselors: [], leads: [] }}
                    allUsers={users}
                    onUpdate={fetchData} // Pass refresh function
                    currentUserRoles={user?.roles || []}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      {selectedUser && selectedRoles.length >= 0 && !selectedGrade && ( // Check for roles array presence
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Change Roles</h3>
            <p className="mb-4 text-sm">
              Manage roles for <strong>{selectedUser.email}</strong>
            </p>
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Roles</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input type="checkbox" id="role-counselor" checked={selectedRoles.includes(ROLES.COUNSELOR)} onChange={() => handleRoleToggle(ROLES.COUNSELOR)} className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                  <label htmlFor="role-counselor" className="text-sm">Counselor</label>
                </div>
                {canAssignTribeLeader && (
                  <div className="flex items-center">
                    <input type="checkbox" id="role-tribe-leader" checked={selectedRoles.includes(ROLES.TRIBE_LEADER)} onChange={() => handleRoleToggle(ROLES.TRIBE_LEADER)} className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                    <label htmlFor="role-tribe-leader" className="text-sm">Tribe Leader</label>
                  </div>
                )}
                {canAssignAdmin && (
                  <div className="flex items-center">
                    <input type="checkbox" id="role-admin" checked={selectedRoles.includes(ROLES.ADMIN)} onChange={() => handleRoleToggle(ROLES.ADMIN)} className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                    <label htmlFor="role-admin" className="text-sm">Admin</label>
                  </div>
                  )}
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={() => {setSelectedUser(null); setError(null);}} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
              <button onClick={handleRoleChange} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Save Roles</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Grade Assignment Modal */}
      {selectedUser && selectedGrade !== undefined && selectedRoles.length === 0 && ( // Check for grade presence
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
             <h3 className="text-xl font-semibold mb-4">Assign to Grade</h3>
             <p className="mb-4 text-sm">
               Assign <strong>{selectedUser.email}</strong> to a grade
             </p>
              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
             <div className="mb-4">
               <label htmlFor="gradeSelect" className="block text-sm font-medium mb-1">Grade</label>
               <select
                 id="gradeSelect"
                 value={selectedGrade}
                 onChange={(e) => setSelectedGrade(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
               >
                 <option value="">Select a grade</option>
                 {GRADES_LIST.map((grade) => (
                   <option key={grade.id} value={grade.id}>
                     {grade.name}
                   </option>
                 ))}
               </select>
             </div>
             <div className="flex justify-end space-x-3">
               <button onClick={() => {setSelectedUser(null); setError(null);}} className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
               <button onClick={handleGradeAssignment} disabled={!selectedGrade} className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50">Save Grade</button>
             </div>
           </div>
         </div>
       )}

       {/* Add User Modal */}
       {showAddUserModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
             <h3 className="text-xl font-semibold mb-4">Add New User</h3>
             {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
             
             <div className="space-y-4">
               <div>
                 <label htmlFor="newUserEmail" className="block text-sm font-medium mb-1">Email</label>
                 <input
                   id="newUserEmail"
                   type="email"
                   value={newUserEmail}
                   onChange={(e) => setNewUserEmail(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                   placeholder="user@example.com"
                 />
               </div>
               
               <div>
                 <label htmlFor="newUserPassword" className="block text-sm font-medium mb-1">Password</label>
                 <input
                   id="newUserPassword"
                   type="password"
                   value={newUserPassword}
                   onChange={(e) => setNewUserPassword(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                   placeholder="Password"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium mb-1">Roles</label>
                 <div className="space-y-2">
                   <div className="flex items-center">
                     <input
                       type="checkbox"
                       id="new-role-counselor"
                       checked={newUserRoles.includes(ROLES.COUNSELOR)}
                       onChange={() => handleNewUserRoleToggle(ROLES.COUNSELOR)}
                       className="mr-2 h-4 w-4"
                     />
                     <label htmlFor="new-role-counselor" className="text-sm">Counselor</label>
                   </div>
                   
                   {canAssignTribeLeader && (
                     <div className="flex items-center">
                       <input
                         type="checkbox"
                         id="new-role-tribe-leader"
                         checked={newUserRoles.includes(ROLES.TRIBE_LEADER)}
                         onChange={() => handleNewUserRoleToggle(ROLES.TRIBE_LEADER)}
                         className="mr-2 h-4 w-4"
                       />
                       <label htmlFor="new-role-tribe-leader" className="text-sm">Tribe Leader</label>
                     </div>
                   )}
                   
                   {canAssignAdmin && (
                     <div className="flex items-center">
                       <input
                         type="checkbox"
                         id="new-role-admin"
                         checked={newUserRoles.includes(ROLES.ADMIN)}
                         onChange={() => handleNewUserRoleToggle(ROLES.ADMIN)}
                         className="mr-2 h-4 w-4"
                       />
                       <label htmlFor="new-role-admin" className="text-sm">Admin</label>
                     </div>
                   )}
                 </div>
               </div>
               
               <div>
                 <label htmlFor="newUserGrade" className="block text-sm font-medium mb-1">Grade (Optional)</label>
                 <select
                   id="newUserGrade"
                   value={newUserGrade}
                   onChange={(e) => setNewUserGrade(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                 >
                   <option value="">No grade assignment</option>
                   {GRADES_LIST.map((grade) => (
                     <option key={grade.id} value={grade.id}>
                       {grade.name}
                     </option>
                   ))}
                 </select>
               </div>
             </div>
             
             <div className="flex justify-end space-x-3 mt-6">
               <button
                 onClick={() => {setShowAddUserModal(false); setError(null);}}
                 className="px-4 py-2 border border-gray-300 rounded-md text-sm"
               >
                 Cancel
               </button>
               <button
                 onClick={handleAddUser}
                 className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
               >
                 Add User
               </button>
             </div>
           </div>
         </div>
       )}
       
       {/* Delete User Confirmation Modal */}
       {deleteConfirmUser && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
             <h3 className="text-xl font-semibold mb-4">Confirm Delete User</h3>
             {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
             
             <p className="mb-6">
               Are you sure you want to delete user <strong>{deleteConfirmUser.email}</strong>? This action cannot be undone.
             </p>
             
             <div className="flex justify-end space-x-3">
               <button
                 onClick={() => setDeleteConfirmUser(null)}
                 className="px-4 py-2 border border-gray-300 rounded-md text-sm"
               >
                 Cancel
               </button>
               <button
                 onClick={handleDeleteUser}
                 className="px-4 py-2 bg-red-600 text-white rounded-md text-sm"
               >
                 Delete User
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
};

export default UserManagement;