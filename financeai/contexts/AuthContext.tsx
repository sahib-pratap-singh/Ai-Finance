import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser } from '../services/storage';

interface User {
  uid: string;
  email: string | null;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ currentUser: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage on mount
    const checkAuth = () => {
      const user = getCurrentUser();
      setCurrentUser(user);
      setLoading(false);
    };

    checkAuth();

    // Listen for storage updates (login/logout)
    window.addEventListener('storage-update', checkAuth);
    return () => window.removeEventListener('storage-update', checkAuth);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
