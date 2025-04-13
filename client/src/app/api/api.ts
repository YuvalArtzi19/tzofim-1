import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:3001', // Our backend server URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  signup: async (email: string, password: string, grade: string = '') => {
    // Default roles is always ['Counselor'] for new signups
    const response = await api.post('/api/auth/signup', {
      email,
      password,
      roles: ['Counselor'],
      grade
    });
    return response.data;
  },
  
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    // Store token in localStorage
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  logout: async () => {
    await api.post('/api/auth/logout');
    // Clear stored data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  }
};

// Messaging API calls
export const messagingAPI = {
  getChannels: async () => {
    const response = await api.get('/api/channels');
    return response.data;
  },
  
  createChannel: async (name: string, grade: string) => {
    const response = await api.post('/api/channels', { name, grade });
    return response.data;
  },
  
  getMessages: async (channelId: number) => {
    const response = await api.get(`/api/channels/${channelId}/messages`);
    return response.data;
  },
  
  sendMessage: async (channelId: number, text: string) => {
    const response = await api.post(`/api/channels/${channelId}/messages`, { text });
    return response.data;
  },
  
  editMessage: async (channelId: number, messageId: number, text: string) => {
    const response = await api.put(`/api/channels/${channelId}/messages/${messageId}`, { text });
    return response.data;
  },
  
  deleteMessage: async (channelId: number, messageId: number) => {
    const response = await api.delete(`/api/channels/${channelId}/messages/${messageId}`);
    return response.data;
  }
};

// User management API calls
export const userAPI = {
  getUsers: async () => {
    const response = await api.get('/api/admin/users');
    return response.data;
  },
  
  getUsersByGrade: async () => {
    const response = await api.get('/api/admin/users/by-grade');
    return response.data;
  },
  
  getLeadershipByGrade: async () => {
    const response = await api.get('/api/admin/grades/leadership');
    return response.data;
  },
  
  updateUserRoles: async (userId: number, roles: string[]) => {
    const response = await api.put(`/api/admin/users/${userId}/roles`, { roles });
    return response.data;
  },
  
  updateUserGrade: async (userId: number, grade: string) => {
    const response = await api.put(`/api/admin/users/${userId}/grade`, { grade });
    return response.data;
  },
  
  deleteUser: async (userId: number) => {
    const response = await api.delete(`/api/admin/users/${userId}`);
    return response.data;
  },
  
  createUser: async (email: string, password: string, roles: string[] = ['Counselor'], grade: string = '') => {
    const response = await api.post('/api/admin/users', { email, password, roles, grade });
    return response.data;
  },
  
  removeUserGrade: async (userId: number) => {
    const response = await api.delete(`/api/admin/users/${userId}/grade`);
    return response.data;
  }
};

// Member management API calls
export const memberAPI = {
  getMembers: async () => {
    const response = await api.get('/api/grade/members');
    return response.data;
  },

  addMember: async (firstName: string, lastName?: string, year?: string) => {
    const response = await api.post('/api/grade/members', {
      firstName,
      lastName,
      year: year || new Date().getFullYear().toString()
    });
    return response.data;
  },

  updateMember: async (memberId: number, firstName: string, lastName?: string) => {
    const response = await api.put(`/api/grade/members/${memberId}`, { firstName, lastName });
    return response.data;
  },

  deleteMember: async (memberId: number) => {
    const response = await api.delete(`/api/grade/members/${memberId}`);
    return response.data;
  },

  searchMembers: async (params: { query?: string; year?: string; grade?: string }) => {
    const searchParams = new URLSearchParams();
    if (params.query) searchParams.append('query', params.query);
    if (params.year) searchParams.append('year', params.year);
    if (params.grade) searchParams.append('grade', params.grade);
    
    const response = await api.get(`/api/members/search?${searchParams.toString()}`);
    return response.data;
  },

  transferMembers: async (members: number[], newGrade: string, year?: string) => {
    const response = await api.post('/api/members/transfer', {
      members,
      newGrade,
      year: year || new Date().getFullYear().toString()
    });
    return response.data;
  }
};

// Grade advancement API call
export const gradeAPI = {
  advanceGrades: async () => {
    const response = await api.post('/api/members/advance-grades');
    return response.data;
  }
};

// Event management API calls
export const eventAPI = {
  getEvents: async () => {
    const response = await api.get('/api/events');
    return response.data;
  },

  createEvent: async (name: string, date: string, type: 'global' | 'grade', grade?: string) => {
    const response = await api.post('/api/events', { name, date, type, grade });
    return response.data;
  },

  recordAttendance: async (eventId: number, attendees: number[]) => {
    const response = await api.post(`/api/events/${eventId}/attendance`, { attendees });
    return response.data;
  },

  getEventStats: async () => {
    const response = await api.get('/api/events/stats');
    return response.data;
  }
};

export default api;