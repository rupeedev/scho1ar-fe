import { createContext, useContext, useEffect, useState } from 'react';
import { usersApi, User } from '@/lib/api/users';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: Error | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Get current user from API
    const fetchCurrentUser = async () => {
      setLoading(true);
      try {
        const currentUser = await usersApi.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Error getting current user:', err);
        setError(err instanceof Error ? err : new Error('Unknown auth error'));
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
      }}
    >
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