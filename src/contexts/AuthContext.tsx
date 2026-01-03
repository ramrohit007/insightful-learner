import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { apiClient } from "@/lib/api";

type UserRole = "student" | "teacher";

interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  student_id?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithCode: (code: string, studentId: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Load user from localStorage on mount
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    // Save user to localStorage whenever it changes
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const userData = await apiClient.login(email, password);
      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role as UserRole,
        student_id: userData.student_id,
      });
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const loginWithCode = async (code: string, studentId: string): Promise<boolean> => {
    try {
      const userData = await apiClient.loginWithCode(code, studentId);
      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role as UserRole,
        student_id: userData.student_id,
      });
      return true;
    } catch (error) {
      console.error("Code login error:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithCode,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
