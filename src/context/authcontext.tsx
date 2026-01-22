
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { UserProfile, GlobalRole } from '@/types';
import { updateMe } from '@/api/users'; 
import type { UserUpdatePayload } from '@/types/types_users';

// Create a new, consolidated user type
export interface AuthenticatedUser extends Omit<UserProfile, 'email' | 'photoURL'> {
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
  updateUsername: (username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    loading: false,
    loginWithGoogle: async () => {},
    logout: async () => {},
    updateUsername: async () => {},
});

// This is a private helper function to fetch the user profile during auth initialization.
const fetchUserProfile = async (token: string): Promise<UserProfile | null> => {
    const API_URL = 'https://api.solufuse.com';
    const response = await fetch(`${API_URL}/users/me`,
        {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to fetch user profile.' }));
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }
    
    const rawProfile = await response.json();
    // Transform snake_case from API to camelCase for frontend
    const { photo_url, ...rest } = rawProfile;
    return { ...rest, photoURL: photo_url, global_role: rawProfile.global_role as GlobalRole };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Failed to login with Google", error);
    }
  };

  const logout = async () => {
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

  const updateUsername = async (username: string) => {
    if (!user) {
        throw new Error("User not authenticated, cannot update username.");
    }
    try {
        const payload: UserUpdatePayload = { username };
        const updatedProfile = await updateMe(payload);

        setUser(prevUser => {
            if (!prevUser) return null;

            const newUser: AuthenticatedUser = {
                ...prevUser,
                ...updatedProfile,
                username: updatedProfile.username || undefined,
                first_name: updatedProfile.first_name || undefined,
                last_name: updatedProfile.last_name || undefined,
                bio: updatedProfile.bio || undefined,
                photoURL: updatedProfile.photo_url || prevUser.photoURL,
                global_role: updatedProfile.global_role as GlobalRole,
            };
            return newUser;
        });
    } catch (error) {
        console.error("Failed to update username in context", error);
        throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          const userProfile = await fetchUserProfile(idToken);

          let authenticatedUser: AuthenticatedUser;

          if (userProfile) {
            authenticatedUser = {
                ...userProfile,
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: userProfile.photoURL || firebaseUser.photoURL,
                username: userProfile.username || undefined,
                first_name: userProfile.first_name || undefined,
                last_name: userProfile.last_name || undefined,
                bio: userProfile.bio || undefined,
            };
          } else {
            authenticatedUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                global_role: 'user', 
                is_active: true,
                projects: [],
                username: undefined,
            };
          }

          setUser(authenticatedUser);
        } catch (error) {
          console.error("Authentication process failed:", error);
          await auth.signOut();
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setToken(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithGoogle, logout, updateUsername }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
