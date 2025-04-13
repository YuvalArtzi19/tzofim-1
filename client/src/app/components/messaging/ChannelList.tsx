'use client';

import React, { useState, useEffect } from 'react';
import { messagingAPI } from '../../api/api';
import { useAuth } from '../auth/AuthContext';

type Channel = {
  id: number;
  name: string;
  grade: string;
};

type ChannelListProps = {
  onSelectChannel: (channel: Channel) => void;
  selectedChannelId: number | null;
};

const ChannelList: React.FC<ChannelListProps> = ({ onSelectChannel, selectedChannelId }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelGrade, setNewChannelGrade] = useState('');
  
  const { user } = useAuth();
  const isLeaderOrAdmin = user?.roles?.includes('Tribe Leader') || user?.roles?.includes('Admin');
  const isCounselor = user?.roles?.includes('Counselor');
  const canCreateChannel = isLeaderOrAdmin || isCounselor;

  // Fetch channels on component mount
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const data = await messagingAPI.getChannels();
        setChannels(data);
        
        // Auto-select the first channel if none is selected
        if (data.length > 0 && selectedChannelId === null) {
          onSelectChannel(data[0]);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load channels');
        console.error('Error fetching channels:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, [onSelectChannel, selectedChannelId]);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newChannelName || !newChannelGrade) {
      setError('Channel name and grade are required');
      return;
    }
    
    try {
      const newChannel = await messagingAPI.createChannel(newChannelName, newChannelGrade);
      setChannels([...channels, newChannel]);
      setNewChannelName('');
      setNewChannelGrade('');
      setShowCreateForm(false);
      
      // Auto-select the newly created channel
      onSelectChannel(newChannel);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create channel');
      console.error('Error creating channel:', err);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading channels...</div>;
  }

  return (
    <div className="w-full h-full flex flex-col border-r dark:border-gray-700">
      <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
        <h2 className="font-semibold text-lg">Channels</h2>
        {canCreateChannel && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {showCreateForm ? 'Cancel' : '+ New Channel'}
          </button>
        )}
      </div>
      
      {error && (
        <div className="m-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
          <button 
            onClick={() => setError(null)} 
            className="ml-2 font-bold"
          >
            ×
          </button>
        </div>
      )}
      
      {showCreateForm && (
        <div className="p-4 border-b dark:border-gray-700">
          <form onSubmit={handleCreateChannel}>
            <div className="mb-3">
              <label htmlFor="channelName" className="block text-sm font-medium mb-1">
                Channel Name
              </label>
              <input
                id="channelName"
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="e.g., 7th Grade Announcements"
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="channelGrade" className="block text-sm font-medium mb-1">
                Grade
              </label>
              {isCounselor && !isLeaderOrAdmin ? (
                // Counselors can only create channels for their assigned grade
                <input
                  id="channelGrade"
                  type="text"
                  value={user?.grade || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100"
                />
              ) : (
                // Admins and Tribe Leaders can create channels for any grade
                <input
                  id="channelGrade"
                  type="text"
                  value={newChannelGrade}
                  onChange={(e) => setNewChannelGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="e.g., 7th"
                  required
                />
              )}
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md"
            >
              Create Channel
            </button>
          </form>
        </div>
      )}
      
      <div className="overflow-y-auto flex-grow">
        {channels.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No channels available.
            {canCreateChannel && !showCreateForm && (
              <div className="mt-2">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="text-blue-600 hover:underline"
                >
                  Create your first channel
                </button>
              </div>
            )}
          </div>
        ) : (
          <ul>
            {channels.map((channel) => (
              <li key={channel.id}>
                <button
                  onClick={() => onSelectChannel(channel)}
                  className={`w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    selectedChannelId === channel.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                  }`}
                >
                  <div className="font-medium">{channel.name}</div>
                  <div className="text-sm text-gray-500">{channel.grade} Grade</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChannelList;