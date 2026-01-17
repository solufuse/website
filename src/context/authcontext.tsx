import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import { UserProfile } from '@/types';

// Create a new, consolidated user type
export interface AuthenticatedUser extends Omit<UserProfile, 'email'> {
  uid: string;
  email: string | null;
  displayName: string | null; 
  photoURL: string | null;
}

interface AuthContextType {
  user: AuthenticatedUser | null;
  token: string | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    loading: false, // Changed: Default loading to false
    loginWithGoogle: async () => {},
    logout: async () => {},
});

// This is a private helper function to fetch the user profile during auth initialization.
const fetchUserProfile = async (token: string): Promise<UserProfile | null> => {
    const API_URL = 'https://api.solufuse.com';
    const response = await fetch(`${API_URL}/users/me`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (response.status === 404) {
        // If the user is not found, it's a new user. Return null.
        return null;
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to fetch user profile.' }));
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Initial check is still a loading phase

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Failed to login with Google", error);
    }
  };

  const logout = async () => {
      // Save the current user's info to localStorage before signing out.
      if (user) {
          const lastUserInfo = {
              displayName: user.displayName,
              photoURL: user.photoURL
          };
          localStorage.setItem('lastUser', JSON.stringify(lastUserInfo));
      }

      try {
          await signOut(auth);
      } catch (error) {
          console.error("Failed to sign out", error);
      }
  };

  useEffect(() => {
    // The listener is set up once and handles all auth state changes.
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          const userProfile = await fetchUserProfile(idToken);

          let authenticatedUser: AuthenticatedUser;

          if (userProfile) {
            // User exists in the database.
            authenticatedUser = {
                ...userProfile,
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: userProfile.photoURL || firebaseUser.photoURL,
            };
          } else {
            // This is a new user.
            authenticatedUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                global_role: 'user', // Assign a default role
                is_active: true,
                projects: [], // No projects yet
            };
          }

          setUser(authenticatedUser);
        } catch (error) {
          console.error("Authentication process failed:", error);
          await auth.signOut(); // Sign out on error
        } finally {
          setLoading(false); // Stop loading after attempt
        }
      } else {
        setUser(null); // Clear user for guests
        setToken(null);
        setLoading(false); // Stop loading
      }
    });

    // Cleanup the listener on component unmount
    return () => unsubscribe();
  }, []); // The empty dependency array ensures this effect runs only once.

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);