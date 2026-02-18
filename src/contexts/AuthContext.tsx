import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { User } from "@/lib/types";
import { authApi, getCurrentUser, setCurrentUser, setAuthToken } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, userType: "student" | "professional") => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Convert backend user to frontend User type (exported for Google OAuth etc.)
export const convertUser = (backendUser: any): User => {
  return {
    id: String(backendUser.id),
    email: backendUser.email,
    fullName: backendUser.full_name || backendUser.email?.split('@')[0] || 'User',
    userType: backendUser.user_type === 'professional' ? 'professional' : 'student',
    creditBalance: parseFloat(backendUser.credit_balance || 0),
    role: backendUser.role === 'admin' ? 'admin' : 'user',
    bio: backendUser.bio || '',
    joinedAt: backendUser.created_at ? new Date(backendUser.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    rating: 0,
    skillsTaught: 0,
    skillsLearned: 0,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = getCurrentUser();
    return stored ? convertUser(stored) : null;
  });

  // Check if user is still valid on mount
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(convertUser(currentUser));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      const convertedUser = convertUser(response.user);
      setUser(convertedUser);
    } catch (error) {
      throw error;
    }
  }, []);

  const register = useCallback(async (fullName: string, email: string, password: string, userType: "student" | "professional") => {
    try {
      const response = await authApi.register({
        email,
        password,
        full_name: fullName,
        user_type: userType,
      });
      const convertedUser = convertUser(response.user);
      setUser(convertedUser);
    } catch (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getCurrentUser()) return;
    try {
      const response = await authApi.getMe();
      setCurrentUser(response.user);
      setUser(convertUser(response.user));
    } catch {
      // Token may have expired
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
