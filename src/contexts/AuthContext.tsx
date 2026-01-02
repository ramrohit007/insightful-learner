import React, { createContext, useContext, useState, ReactNode } from "react";
import { demoAccounts } from "@/lib/mockData";

type UserRole = "student" | "teacher";

interface User {
  email: string;
  name: string;
  role: UserRole;
  id?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithCode: (code: string, studentId: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Store active codes in memory (in real app, this would be in database)
const activeCodes: Map<string, { expiresAt: Date }> = new Map();

export const addAccessCode = (code: string) => {
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity
  activeCodes.set(code, { expiresAt });
};

export const validateCode = (code: string): boolean => {
  const codeData = activeCodes.get(code);
  if (!codeData) return false;
  if (new Date() > codeData.expiresAt) {
    activeCodes.delete(code);
    return false;
  }
  return true;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Check teacher account
    if (
      email === demoAccounts.teacher.email &&
      password === demoAccounts.teacher.password
    ) {
      setUser({
        email: demoAccounts.teacher.email,
        name: demoAccounts.teacher.name,
        role: "teacher",
      });
      return true;
    }

    // Check student accounts
    const student = demoAccounts.students.find(
      (s) => s.email === email && s.password === password
    );
    if (student) {
      setUser({
        email: student.email,
        name: student.name,
        role: "student",
        id: student.id,
      });
      return true;
    }

    return false;
  };

  const loginWithCode = async (code: string, studentId: string): Promise<boolean> => {
    if (!validateCode(code)) return false;
    
    const student = demoAccounts.students.find((s) => s.id === studentId);
    if (student) {
      setUser({
        email: student.email,
        name: student.name,
        role: "student",
        id: student.id,
      });
      return true;
    }
    return false;
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
