const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:3001/api');

// Get auth token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Set auth token
export const setAuthToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

// Get current user from localStorage
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Set current user
export const setCurrentUser = (user: any): void => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

// API request helper
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(error.message || 'Network error. Please check if the backend server is running.');
  }
};

// Auth API
export const authApi = {
  register: async (data: { email: string; password: string; user_type?: string; full_name?: string }) => {
    const response = await apiRequest<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setAuthToken(response.token);
    setCurrentUser(response.user);
    return response;
  },

  login: async (email: string, password: string) => {
    const response = await apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(response.token);
    setCurrentUser(response.user);
    return response;
  },

  logout: () => {
    setAuthToken(null);
    setCurrentUser(null);
  },

  getMe: async () => {
    return apiRequest<{ user: any }>('/auth/me');
  },

  /** Google OAuth: send ID token from Google Sign-In, receive JWT and user */
  googleLogin: async (credential: string) => {
    const response = await apiRequest<{ token: string; user: any }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
    setAuthToken(response.token);
    setCurrentUser(response.user);
    return response;
  },
};

// Users API
export const usersApi = {
  getUser: (id: number) => apiRequest<{ user: any }>(`/users/${id}`),
  updateUser: (id: number, data: any) =>
    apiRequest<{ user: any }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getUserSkills: (id: number) => apiRequest<{ skills: any[] }>(`/users/${id}/skills`),
};

// Skills API
export const skillsApi = {
  getSkills: (params?: { category?: string; min_rate?: number; max_rate?: number; user_type?: string; complexity?: string }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return apiRequest<{ skills: any[] }>(`/skills${query ? `?${query}` : ''}`);
  },

  getSkill: (id: number) => apiRequest<{ skill: any }>(`/skills/${id}`),

  createSkill: (data: { title: string; description?: string; category?: string; rate_per_hour: number; complexity?: string }) =>
    apiRequest<{ skill: any }>('/skills', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSkill: (id: number, data: any) =>
    apiRequest<{ skill: any }>(`/skills/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteSkill: (id: number) =>
    apiRequest<{ message: string }>(`/skills/${id}`, {
      method: 'DELETE',
    }),

  createSkillRequest: (data: { title: string; description?: string; category?: string; preferred_rate_max?: number; urgency?: string; budget?: number }) =>
    apiRequest<{ request_id: number; message: string }>('/skills/request', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Bookings API
export const bookingsApi = {
  getBookings: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return apiRequest<{ bookings: any[] }>(`/bookings${query}`);
  },

  getBooking: (id: number) => apiRequest<{ booking: any }>(`/bookings/${id}`),

  createBooking: (data: { skill_id: number; scheduled_at: string; duration: number }) =>
    apiRequest<{ booking: any }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  confirmBooking: (id: number) =>
    apiRequest<{ booking: any }>(`/bookings/${id}/confirm`, {
      method: 'PUT',
    }),

  cancelBooking: (id: number) =>
    apiRequest<{ booking: any }>(`/bookings/${id}/cancel`, {
      method: 'PUT',
    }),

  completeBooking: (id: number) =>
    apiRequest<{ booking: any; message?: string; paymentReleased?: boolean }>(`/bookings/${id}/complete`, {
      method: 'PUT',
    }),

  confirmCompletion: (id: number) =>
    apiRequest<{ booking: any; message?: string }>(`/bookings/${id}/confirm-completion`, {
      method: 'PUT',
    }),

  getPaymentStatus: (id: number) =>
    apiRequest<{
      bookingId: number;
      status: string;
      creditsCost: number;
      learnerConfirmed: boolean;
      teacherConfirmed: boolean;
      creditsReleased: boolean;
      completedAt?: string;
      learnerConfirmedAt?: string;
      teacherConfirmedAt?: string;
    }>(`/bookings/${id}/payment-status`),
};

// Transactions API
export const transactionsApi = {
  getTransactions: (type?: 'earn' | 'spend') => {
    const query = type ? `?type=${type}` : '';
    return apiRequest<{ transactions: any[] }>(`/transactions${query}`);
  },
};

// Matching API
export const matchingApi = {
  findMatches: (params: { skill_id?: number; user_id?: number; category?: string }) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    const query = queryParams.toString();
    return apiRequest<{ matches: any[] }>(`/matching${query ? `?${query}` : ''}`);
  },
};

// Profile API
export const profilesApi = {
  getProfile: (userId: number) => apiRequest<{ user: any }>(`/profiles/${userId}`),
  updateProfile: (userId: number, data: any) =>
    apiRequest<{ user: any }>(`/profiles/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getUserStats: (userId: number) => apiRequest<{ stats: any }>(`/profiles/${userId}/stats`),
};

// Review API
export const reviewsApi = {
  createReview: (data: { booking_id: number; rating: number; review_text?: string; review_type: 'as_teacher' | 'as_learner' }) =>
    apiRequest<{ review: any }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getUserReviews: (userId: number, type?: string) => {
    const query = type ? `?type=${type}` : '';
    return apiRequest<{ reviews: any[] }>(`/reviews/user/${userId}${query}`);
  },
  updateReview: (reviewId: number, data: { rating?: number; review_text?: string }) =>
    apiRequest<{ review: any }>(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteReview: (reviewId: number) =>
    apiRequest<{ message: string }>(`/reviews/${reviewId}`, {
      method: 'DELETE',
    }),
};

// Skill Request API
export const skillRequestsApi = {
  getSkillRequests: (params?: { category?: string; status?: string; urgency?: string; max_rate?: number }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return apiRequest<{ requests: any[] }>(`/skill-requests${query ? `?${query}` : ''}`);
  },
  getSkillRequest: (id: number) => apiRequest<{ request: any }>(`/skill-requests/${id}`),
  createSkillRequest: (data: { title: string; description?: string; category?: string; preferred_rate_max?: number; urgency?: string; budget?: number }) =>
    apiRequest<{ request: any }>('/skill-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSkillRequest: (id: number, data: any) =>
    apiRequest<{ request: any }>(`/skill-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  closeSkillRequest: (id: number, status?: string) =>
    apiRequest<{ request: any }>(`/skill-requests/${id}/close`, {
      method: 'PUT',
      body: JSON.stringify({ status: status || 'closed' }),
    }),
};

// Message API
export const messagesApi = {
  getConversations: () => apiRequest<{ conversations: any[] }>('/messages/conversations'),
  getConversation: (id: number) => apiRequest<{ conversation: any; messages: any[] }>(`/messages/conversations/${id}`),
  createConversation: (data: { participant2_id: number; booking_id?: number }) =>
    apiRequest<{ conversation: any }>('/messages/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  sendMessage: (conversationId: number, content: string) =>
    apiRequest<{ message: any }>(`/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  markAsRead: (conversationId: number) =>
    apiRequest<{ message: string }>(`/messages/conversations/${conversationId}/read`, {
      method: 'PUT',
    }),
  getUnreadCount: () => apiRequest<{ unreadCount: number }>('/messages/unread-count'),
  deleteMessage: (conversationId: number, messageId: number) =>
    apiRequest<{ message: string }>(`/messages/conversations/${conversationId}/messages/${messageId}`, {
      method: 'DELETE',
    }),
  deleteConversation: (conversationId: number) =>
    apiRequest<{ message: string }>(`/messages/conversations/${conversationId}`, {
      method: 'DELETE',
    }),
};

// Follow API
export const followsApi = {
  followUser: (userId: number) =>
    apiRequest<{ message: string }>(`/follows/${userId}`, {
      method: 'POST',
    }),
  unfollowUser: (userId: number) =>
    apiRequest<{ message: string }>(`/follows/${userId}`, {
      method: 'DELETE',
    }),
  getFollowers: (userId: number) => apiRequest<{ followers: any[] }>(`/follows/${userId}/followers`),
  getFollowing: (userId: number) => apiRequest<{ following: any[] }>(`/follows/${userId}/following`),
  isFollowing: (userId: number) => apiRequest<{ isFollowing: boolean }>(`/follows/${userId}/status`),
};

// Notification API
export const notificationsApi = {
  getNotifications: (unreadOnly?: boolean) => {
    const query = unreadOnly ? '?unread_only=true' : '';
    return apiRequest<{ notifications: any[] }>(`/notifications${query}`);
  },
  markAsRead: (id: number) =>
    apiRequest<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),
  markAllAsRead: () =>
    apiRequest<{ message: string }>('/notifications/read-all', {
      method: 'PUT',
    }),
  deleteNotification: (id: number) =>
    apiRequest<{ message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    }),
};
