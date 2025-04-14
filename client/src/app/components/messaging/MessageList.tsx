'use client';

import React, { useState, useEffect, useRef } from 'react';
import { messagingAPI, userAPI } from '../../api/api';
import { useAuth } from '../auth/AuthContext';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

type Message = {
  id: number;
  channelId: number;
  userId: number;
  userName: string;
  text: string;
  timestamp: string;
  edited?: boolean;
  mentions?: string[]; // Array of mentioned usernames
};

type EmojiData = {
  id: string;
  native: string;
  unified: string;
};

interface User {
  id: number;
  email: string;
  roles: string[];
  grade?: string;
}

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [users, setUsers] = useState<User[]>([]);
  
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionListRef = useRef<HTMLDivElement>(null);

  // Get all users for mentions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userAPI.getUsers();
        setUsers(response);
      } catch (err) {
        console.error('Error fetching users for mentions:', err);
      }
    };
    fetchUsers();
  }, []);

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
      
      setMessages(messages.map(m =>
        m.id === editingMessageId ? updatedMessage : m
      ));
      
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
                    <div className="whitespace-pre-wrap">
                      {message.text.split(/(@\w+(?:\.\w+)*)/g).map((part, index) => {
                        if (part.match(/@\w+(?:\.\w+)*/)) {
                          return (
                            <span key={index} className="text-blue-500 hover:underline cursor-pointer font-medium">
                              {part}
                            </span>
                          );
                        }
                        return part;
                      })}
                    </div>
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
        <form onSubmit={handleSendMessage} className="flex flex-col space-y-2">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                setCursorPosition(e.target.selectionStart);
                
                // Handle @ mentions
                const currentPosition = e.target.selectionStart;
                const textBeforeCursor = e.target.value.slice(0, currentPosition);
                const lastWord = textBeforeCursor.split(/\s/).pop() || '';
                
                if (lastWord.startsWith('@')) {
                  setMentionFilter(lastWord.slice(1).toLowerCase());
                  setShowMentions(true);
                } else {
                  setShowMentions(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (newMessage.trim()) {
                    handleSendMessage(e);
                  }
                }
              }}
              placeholder="Type a message... (Shift + Enter for new line, @ for mentions)"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[2.5rem] max-h-32 resize-y pr-24"
              disabled={!user}
            />
            
            {/* Emoji and Send buttons */}
            <div className="absolute right-2 top-2 flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                😊
              </button>
              <button
                type="submit"
                disabled={!newMessage.trim() || !user}
                className="px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-full mb-2 right-0">
                <Picker
                  data={data}
                  onEmojiSelect={(emoji: EmojiData) => {
                    const start = newMessage.slice(0, cursorPosition);
                    const end = newMessage.slice(cursorPosition);
                    setNewMessage(start + emoji.native + end);
                    setShowEmojiPicker(false);
                    textareaRef.current?.focus();
                  }}
                  theme="light"
                />
              </div>
            )}
            
            {/* Mentions List */}
            {showMentions && (
              <div
                ref={mentionListRef}
                className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto"
              >
                {users
                  .filter(u => u.email.toLowerCase().includes(mentionFilter))
                  .map(u => (
                    <button
                      key={u.id}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        const textBeforeCursor = newMessage.slice(0, cursorPosition);
                        const textAfterCursor = newMessage.slice(cursorPosition);
                        const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
                        const newText = textBeforeCursor.slice(0, lastAtSymbol) + '@' + u.email + ' ' + textAfterCursor;
                        setNewMessage(newText);
                        setShowMentions(false);
                        textareaRef.current?.focus();
                      }}
                    >
                      {u.email}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessageList;