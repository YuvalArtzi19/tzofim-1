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
  edited?: boolean;
};

type MessageListProps = {
  channelId: number | null;
};

const MessageList: React.FC<MessageListProps> = ({ channelId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editMessageText, setEditMessageText] = useState('');
  
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

  const handleStartEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditMessageText(message.text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditMessageText('');
  };

  const handleSaveEdit = async () => {
    if (!channelId || !editingMessageId || !editMessageText.trim() || !user) {
      return;
    }

    try {
      const updatedMessage = await messagingAPI.editMessage(channelId, editingMessageId, editMessageText);
      
      // Update the message in the local state
      setMessages(messages.map(m =>
        m.id === editingMessageId ? updatedMessage : m
      ));
      
      // Reset editing state
      setEditingMessageId(null);
      setEditMessageText('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to edit message');
      console.error('Error editing message:', err);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!channelId || !user) {
      return;
    }

    try {
      await messagingAPI.deleteMessage(channelId, messageId);
      
      // Remove the message from the local state
      setMessages(messages.filter(m => m.id !== messageId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete message');
      console.error('Error deleting message:', err);
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
                className={`flex ${message.userId === user?.id ? 'justify-end' : 'justify-start'} group`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.userId === user?.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <div className="text-xs mb-1 flex justify-between">
                    <div>
                      {message.userId !== user?.id && (
                        <span className="font-semibold">{message.userName}</span>
                      )}
                      <span className="text-opacity-75 ml-2">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {message.edited && <span className="ml-2 italic">(edited)</span>}
                    </div>
                    
                    {/* Edit/Delete buttons for own messages */}
                    {message.userId === user?.id && (
                      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleStartEdit(message)}
                          className="text-xs hover:underline"
                          aria-label="Edit message"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="text-xs hover:underline"
                          aria-label="Delete message"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Message content or edit form */}
                  {editingMessageId === message.id ? (
                    <div className="mt-1">
                      <input
                        type="text"
                        value={editMessageText}
                        onChange={(e) => setEditMessageText(e.target.value)}
                        className="w-full px-2 py-1 text-black border rounded"
                      />
                      <div className="flex justify-end mt-1 space-x-2">
                        <button
                          onClick={handleCancelEdit}
                          className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="text-xs px-2 py-1 bg-green-500 text-white rounded"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>{message.text}</div>
                  )}
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