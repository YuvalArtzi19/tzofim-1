'use client';

import React, { useState, useEffect } from 'react';
import { memberAPI, gradeAPI } from '../../api/api';
import { useAuth } from '../auth/AuthContext';

type Member = {
  id: number;
  firstName: string;
  lastName: string;
  grade: string;
  registrationYear?: string;
  initialGrade?: string;
};

const MemberManagement: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchYear, setSearchYear] = useState('');
  const [searchGrade, setSearchGrade] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

  const { user } = useAuth();
  const isLeaderOrAdmin = user?.roles?.includes('Tribe Leader') || user?.roles?.includes('Admin');
  const isCounselor = user?.roles?.includes('Counselor');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const data = await memberAPI.getMembers();
      setMembers(Array.isArray(data) ? data : Object.values(data).flat());
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load members');
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // For counselors, use their assigned grade
      const memberGrade = isCounselor ? user?.grade : selectedGrade;
      
      if (!memberGrade) {
        setError('Grade is required');
        return;
      }

      // Validate grade format
      if (!memberGrade.match(/^\d+$/)) {
        setError('Grade must be a number');
        return;
      }

      const gradeNum = parseInt(memberGrade);
      if (gradeNum < 1 || gradeNum > 12) {
        setError('Grade must be between 1 and 12');
        return;
      }

      const newMember = await memberAPI.addMember(firstName, lastName, memberGrade);
      setMembers(Array.isArray(members) ? [...members, newMember] : [newMember]);
      setFirstName('');
      setLastName('');
      setSelectedGrade('');
      setShowAddForm(false);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleAdvanceGrades = async () => {
    if (!window.confirm('Are you sure you want to advance all member grades? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await gradeAPI.advanceGrades();
      setMembers(result.updatedMembers);
      setError(null);
      if (result.errors?.length > 0) {
        setError(`Some members could not be advanced: ${result.errors.join(', ')}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to advance grades');
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    try {
      const updatedMember = await memberAPI.updateMember(
        editingMember.id,
        firstName,
        lastName
      );
      setMembers(members.map(m => m.id === updatedMember.id ? updatedMember : m));
      setEditingMember(null);
      setFirstName('');
      setLastName('');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update member');
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await memberAPI.deleteMember(memberId);
      setMembers(members.filter(m => m.id !== memberId));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete member');
    }
  };

  const startEdit = (member: Member) => {
    setEditingMember(member);
    setFirstName(member.firstName);
    setLastName(member.lastName);
    setShowAddForm(false);
  };

  if (loading) {
    return <div className="p-4">Loading members...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Grade Members</h2>
        <div className="space-x-2">
          {isLeaderOrAdmin && (
            <button
              onClick={handleAdvanceGrades}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Advance All Grades
            </button>
          )}
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingMember(null);
              setFirstName('');
              setLastName('');
              setSelectedGrade('');
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {showAddForm ? 'Cancel' : 'Add Member'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right">&times;</button>
        </div>
      )}

      {(showAddForm || editingMember) && (
        <form onSubmit={editingMember ? handleUpdateMember : handleAddMember} className="mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            {!isCounselor && !editingMember && (
              <div>
                <label className="block text-sm font-medium mb-1">Grade</label>
                <div>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={selectedGrade}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
                        setSelectedGrade(value);
                      }
                    }}
                    className="w-full p-2 border rounded"
                    placeholder="Enter grade (1-12)"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter grade number (1-12)
                  </p>
                </div>
              </div>
            )}
          </div>
          <button
            type="submit"
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            {editingMember ? 'Update Member' : 'Add Member'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade
              </th>
              {isLeaderOrAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration Year
                </th>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {member.firstName} {member.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {member.grade}
                </td>
                {isLeaderOrAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    {member.registrationYear || 'N/A'}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => startEdit(member)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberManagement;