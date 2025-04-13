'use client';

import React, { useState } from 'react';
import ChannelList from './ChannelList';
import MessageList from './MessageList';
import { useAuth } from '../auth/AuthContext';

type Channel = {
  id: number;
  name: string;
  grade: string;
};

const MessagingDashboard: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const { user, loading } = useAuth();

  // If not authenticated, show login prompt
  if (!loading && !user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Sign in to access messaging</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            You need to be signed in to view and send messages in ScoutsTribe.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Login
            </a>
            <a
              href="/signup"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar with channel list */}
      <div className="w-1/4 min-w-[250px] border-r dark:border-gray-700">
        <ChannelList
          onSelectChannel={setSelectedChannel}
          selectedChannelId={selectedChannel?.id || null}
        />
      </div>
      
      {/* Main content with messages */}
      <div className="flex-grow">
        <div className="h-full flex flex-col">
          {/* Channel header */}
          {selectedChannel && (
            <div className="p-4 border-b dark:border-gray-700">
              <h2 className="font-semibold text-lg">{selectedChannel.name}</h2>
              <div className="text-sm text-gray-500">{selectedChannel.grade} Grade</div>
            </div>
          )}
          
          {/* Messages */}
          <div className="flex-grow overflow-hidden">
            <MessageList channelId={selectedChannel?.id || null} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagingDashboard;