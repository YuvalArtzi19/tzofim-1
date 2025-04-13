'use client';

import React, { useState, useEffect, useRef } from 'react';
import { messagingAPI } from '../../api/api';
import { useAuth } from '../auth/AuthContext';

type Message = {
  id: number;
  channelId: number;
  userId: number;
  userName: string;
  text: string;
  timestamp: string;
};

type MessageListProps = {
  channelId: number | null;
};

const MessageList: React.FC<MessageListProps> = ({ channelId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages when channelId changes
  useEffect(() => {
    if (channelId === null) return;
    
    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await messagingAPI.getMessages(channelId);
        setMessages(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load messages');
        console.error('Error fetching messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [channelId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!channelId || !newMessage.trim() || !user) {
      return;
    }
    
    try {
      const sentMessage = await messagingAPI.sendMessage(channelId, newMessage);
      setMessages([...messages, sentMessage]);
      setNewMessage('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message');
      console.error('Error sending message:', err);
    }
  };

  if (!channelId) {
    return (
      <div className="flex-grow flex items-center justify-center p-8 text-gray-500">
        Select a channel to view messages
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages container */}
      <div className="flex-grow overflow-y-auto p-4">
        {loading ? (
          <div className="text-center p-4">Loading messages...</div>
        ) : error ? (
          <div className="text-center p-4 text-red-500">{error}</div>
        ) : messages.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            No messages in this channel yet. Be the first to send a message!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.userId === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.userId === user?.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <div className="text-xs mb-1">
                    {message.userId !== user?.id && (
                      <span className="font-semibold">{message.userName}</span>
                    )}
                    <span className="text-opacity-75 ml-2">
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div>{message.text}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input */}
      <div className="border-t dark:border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!user}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !user}
            className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageList;