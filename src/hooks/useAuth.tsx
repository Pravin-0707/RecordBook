import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, getCurrentUser, login as doLogin, signup as doSignup, logout as doLogout, updateProfile as doUpdateProfile } from "@/lib/store";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => User | null;
  signup: (email: string, password: string, businessName: string) => User | null;
  logout: () => void;
  updateProfile: (updates: Partial<Pick<User, "businessName" | "phone">>) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    const u = doLogin(email, password);
    if (u) setUser(u);
    return u;
  };

  const signup = (email: string, password: string, businessName: string) => {
    const u = doSignup(email, password, businessName);
    if (u) setUser(u);
    return u;
  };

  const logout = () => {
    doLogout();
    setUser(null);
  };

  const updateProfile = (updates: Partial<Pick<User, "businessName" | "phone">>) => {
    const u = doUpdateProfile(updates);
    if (u) setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
