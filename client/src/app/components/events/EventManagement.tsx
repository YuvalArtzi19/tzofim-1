'use client';

import React, { useState, useEffect } from 'react';
import { eventAPI, memberAPI } from '../../api/api';
import { useAuth } from '../auth/AuthContext';

type Event = {
  id: number;
  name: string;
  date: string;
  type: 'global' | 'grade';
  grade?: string;
  createdBy: number;
};

type Member = {
  id: number;
  firstName: string;
  lastName: string;
  grade: string;
};

type EventStats = {
  eventId: number;
  eventName: string;
  type: 'global' | 'grade';
  date: string;
  gradeAttendance: Record<string, number>;
  totalAttendees: number;
};

const EventManagement: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<EventStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAttendanceForm, setShowAttendanceForm] = useState<number | null>(null);
  const [selectedAttendees, setSelectedAttendees] = useState<number[]>([]);

  // Form states
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState<'global' | 'grade'>('grade');
  const [eventGrade, setEventGrade] = useState('');

  const { user } = useAuth();
  const isLeaderOrAdmin = user?.roles?.includes('Tribe Leader') || user?.roles?.includes('Admin');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsData, membersData] = await Promise.all([
        eventAPI.getEvents(),
        memberAPI.getMembers()
      ]);
      
      setEvents(eventsData);
      setMembers(Array.isArray(membersData) ? membersData : Object.values(membersData).flat());
      
      if (isLeaderOrAdmin) {
        const statsData = await eventAPI.getEventStats();
        setStats(statsData);
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newEvent = await eventAPI.createEvent(
        eventName,
        eventDate,
        eventType,
        eventType === 'grade' ? (user?.grade || eventGrade) : undefined
      );
      setEvents([...events, newEvent]);
      setShowCreateForm(false);
      resetForm();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event');
    }
  };

  const handleRecordAttendance = async (eventId: number) => {
    try {
      const result = await eventAPI.recordAttendance(eventId, selectedAttendees);
      // Refresh stats after recording attendance
      if (isLeaderOrAdmin) {
        const statsData = await eventAPI.getEventStats();
        setStats(statsData);
      }
      setShowAttendanceForm(null);
      setSelectedAttendees([]);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record attendance');
    }
  };

  const resetForm = () => {
    setEventName('');
    setEventDate('');
    setEventType('grade');
    setEventGrade('');
  };

  if (loading) {
    return <div className="p-4">Loading events...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Events</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showCreateForm ? 'Cancel' : 'Create Event'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreateEvent} className="mb-6 bg-white p-4 rounded shadow">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Event Name</label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => {
                  setEventType(e.target.value as 'global' | 'grade');
                  // Reset grade when changing type
                  if (e.target.value === 'global') {
                    setEventGrade('');
                  }
                }}
                className="w-full p-2 border rounded"
                required
              >
                {isLeaderOrAdmin && <option value="global">Global</option>}
                <option value="grade">Grade</option>
              </select>
            </div>
            {eventType === 'grade' && (
              <div>
                <label className="block text-sm font-medium mb-1">Grade</label>
                <select
                  value={eventGrade}
                  onChange={(e) => setEventGrade(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Grade</option>
                  {isLeaderOrAdmin ? (
                    <>
                      <option value="shachbag">Shachbag (Leaders & Counselors)</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num.toString()}>
                          Grade {num}
                        </option>
                      ))}
                    </>
                  ) : (
                    <option value={user?.grade}>{
                      user?.grade === 'operations' ? 'Operations' :
                      user?.grade === 'shachbag' ? 'Shachbag' :
                      `Grade ${user?.grade}`
                    }</option>
                  )}
                </select>
              </div>
            )}
          </div>
          <button
            type="submit"
            className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Create Event
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Event Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              {isLeaderOrAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="px-6 py-4 whitespace-nowrap">{event.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(event.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">{event.type}</td>
                {isLeaderOrAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap">{event.grade || 'All'}</td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setShowAttendanceForm(event.id)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Record Attendance
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAttendanceForm !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Record Attendance</h3>
              <span className="text-sm text-gray-600">
                Selected: {selectedAttendees.length} members
              </span>
            </div>
            {(() => {
              const currentEvent = events.find(e => e.id === showAttendanceForm);
              const eligibleMembers = members.filter(member => {
                if (currentEvent?.type === 'grade') {
                  if (currentEvent.grade === 'shachbag') {
                    // For Shachbag events, only show counselors and tribe leaders
                    return member.grade === 'operations' || member.grade === currentEvent.grade;
                  } else {
                    // For grade-specific events, only show members of that grade
                    return member.grade === currentEvent.grade || member.grade === 'operations';
                  }
                }
                // For global events, show all members
                return true;
              });

              return (
                <>
                  <div className="mb-2">
                    <label className="flex items-center mb-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={selectedAttendees.length === eligibleMembers.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAttendees(eligibleMembers.map(m => m.id));
                          } else {
                            setSelectedAttendees([]);
                          }
                        }}
                        className="mr-2"
                      />
                      Select All ({eligibleMembers.length} eligible members)
                    </label>
                  </div>
                  <div className="max-h-60 overflow-y-auto border rounded p-2">
                    {eligibleMembers.map((member) => (
                      <label key={member.id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={selectedAttendees.includes(member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAttendees([...selectedAttendees, member.id]);
                            } else {
                              setSelectedAttendees(selectedAttendees.filter(id => id !== member.id));
                            }
                          }}
                          className="mr-2"
                        />
                        {member.firstName} {member.lastName}
                        <span className="ml-2 text-sm text-gray-500">
                          ({member.grade === 'operations' ? 'Operations' :
                            member.grade === 'shachbag' ? 'Shachbag' :
                            `Grade ${member.grade}`})
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              );
            })()}
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedAttendees.length} of {members.length} selected
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => {
                    setShowAttendanceForm(null);
                    setSelectedAttendees([]);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRecordAttendance(showAttendanceForm)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={selectedAttendees.length === 0}
                >
                  Save Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLeaderOrAdmin && stats.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Event Statistics</h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Attendance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance by Grade
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.map((stat) => (
                  <tr key={stat.eventId}>
                    <td className="px-6 py-4 whitespace-nowrap">{stat.eventName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(stat.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">{stat.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {stat.totalAttendees} members
                    </td>
                    <td className="px-6 py-4">
                      {Object.entries(stat.gradeAttendance).map(([grade, count]) => (
                        <div key={grade}>
                          {grade === 'operations' ? 'Operations' :
                           grade === 'shachbag' ? 'Shachbag' :
                           `Grade ${grade}`}: {count} members
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagement;