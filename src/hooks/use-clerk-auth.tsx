import { createContext, useContext, useEffect } from 'react';
import { useUser, useAuth, useClerk } from '@clerk/clerk-react';
import { authTokenManager } from '@/lib/auth-token';

// User type compatible with the app's expectations
export interface ClerkUserType {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  fullName: string | null;
}

type AuthContextType = {
  user: ClerkUserType | null;
  loading: boolean;
  error: Error | null;
  isSignedIn: boolean;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, getToken } = useAuth();
  const { signOut: clerkSignOut } = useClerk();

  const loading = !userLoaded;

  // Transform Clerk user to our app's user format
  const transformedUser: ClerkUserType | null = user ? {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress || null,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    fullName: user.fullName,
  } : null;

  // Register the token getter with the auth token manager
  // This allows the API client to get tokens without React context
  useEffect(() => {
    authTokenManager.setTokenGetter(getToken);

    return () => {
      authTokenManager.clearTokenGetter();
    };
  }, [getToken]);

  const signOut = async () => {
    await clerkSignOut();
  };

  const getAuthToken = async (): Promise<string | null> => {
    try {
      return await getToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: transformedUser,
        loading,
        error: null,
        isSignedIn: isSignedIn ?? false,
        signOut,
        getToken: getAuthToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useClerkAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useClerkAuth must be used within a ClerkAuthProvider');
  }

  return context;
}

// Re-export Clerk components for use in the app
export {
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
  useAuth,
  useClerk
} from '@clerk/clerk-react';
