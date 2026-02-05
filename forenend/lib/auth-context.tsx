'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { 
  type User, 
  getCurrentUser, 
  setCurrentUser, 
  getUserByEmail, 
  createUser,
  initializeStorage,
  runMigrationAndUseBackend 
} from './storage';
import { sendWelcomeSMS } from './sms-service';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (name: string, email: string, phone: string, password: string, role: 'bus_admin' | 'user') => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      initializeStorage();
      await runMigrationAndUseBackend();
      const currentUser = getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
    })();
  }, []);

  const login = (email: string, password: string) => {
    const foundUser = getUserByEmail(email);
    
    if (!foundUser) {
      return { success: false, error: 'User not found' };
    }
    
    if (foundUser.password !== password) {
      return { success: false, error: 'Invalid password' };
    }

    // Check if bus_admin is approved
    if (foundUser.role === 'bus_admin' && foundUser.status === 'pending') {
      return { success: false, error: 'Akoonkaaga wali lama ansixin. Fadlan sug ansixinta Admin-ka.' };
    }

    if (foundUser.role === 'bus_admin' && foundUser.status === 'rejected') {
      return { success: false, error: 'Akoonkaaga waa la diiday. Fadlan la xiriir Admin-ka.' };
    }
    
    setCurrentUser(foundUser);
    setUser(foundUser);
    return { success: true };
  };

  const register = async (name: string, email: string, phone: string, password: string, role: 'bus_admin' | 'user') => {
    const existingUser = getUserByEmail(email);
    
    if (existingUser) {
      return { success: false, error: 'Email already registered' };
    }
    
    const newUser = await createUser({ name, email, phone, password, role });
    
    // Only set current user if not bus_admin (they need approval first)
    if (role !== 'bus_admin') {
      setCurrentUser(newUser);
      setUser(newUser);
    }
    
    // Send welcome SMS
    try {
      if (role === 'bus_admin') {
        await sendWelcomeSMS(phone, `${name}, mahadsanid is-diiwaan gelintaada. Akoonkaaga wuxuu sugayaa ansixinta Admin-ka. Waxaan kuu soo diri doonnaa fariin marka la ansixiyo.`);
      } else {
        await sendWelcomeSMS(phone, name);
      }
    } catch (error) {
      console.error('Failed to send welcome SMS:', error);
    }
    
    return { success: true, pendingApproval: role === 'bus_admin' };
  };

  const logout = () => {
    setCurrentUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
