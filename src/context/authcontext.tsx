
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  api_key_set?: boolean; // ADDED: To reflect the backend property
  preferred_model?: string; // ADDED: The user's preferred model
}

interface AuthContextType {
  user: AuthenticatedUser | null;
  token: string | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  updatePreferredModel: (model: string) => Promise<void>; // ADDED: New function for model preference
  refreshUser: () => Promise<void>; // New function to refresh user data
  preferredModel?: string; // ADDED: The user's preferred model
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    loading: false,
    loginWithGoogle: async () => {},
    logout: async () => {},
    updateUsername: async () => {},
    updatePreferredModel: async () => {}, // ADDED: Default empty function
    refreshUser: async () => {}, // Provide a default empty function
});

// This is a private helper function to fetch the user profile during auth initialization.
const fetchUserProfile = async (token: string): Promise<UserProfile | null> => {
    const API_BASE_URL = 'https://api.solufuse.com';
    const response = await fetch(`${API_BASE_URL}/users/me`,
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
    // The backend now sends api_key_set, which will be in rawProfile and spread into the user object.
    const { photo_url, ...rest } = rawProfile;
    return { ...rest, photoURL: photo_url, global_role: rawProfile.global_role as GlobalRole };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferredModel, setPreferredModel] = useState<string | undefined>(undefined);

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

  // New function to allow components to trigger a user profile refresh
  const refreshUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return; // No user to refresh

    console.log("Refreshing user data...");
    try {
      const idToken = await firebaseUser.getIdToken(true); // Force token refresh
      setToken(idToken);
      const userProfile = await fetchUserProfile(idToken);

      if (userProfile) {
        const authenticatedUser: AuthenticatedUser = {
            ...userProfile,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: userProfile.photoURL || firebaseUser.photoURL,
        };
        setUser(authenticatedUser);
        setPreferredModel(authenticatedUser.preferred_model);
        console.log("User data refreshed.");
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, []);

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

  // ADDED: New dedicated function to update the preferred model
  const updatePreferredModel = async (model: string) => {
    if (!user) throw new Error("User not authenticated");
    try {
      const updatedProfile = await updateMe({ preferred_model: model });
      setUser(prevUser => {
          if (!prevUser) return null;
          return { ...prevUser, preferred_model: updatedProfile.preferred_model };
      });
      setPreferredModel(updatedProfile.preferred_model);
    } catch (error) {
      console.error("Failed to update preferred model", error);
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
                ...userProfile, // This now includes api_key_set from the backend
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
                api_key_set: false, // ADDED: default value
            };
          }

          setUser(authenticatedUser);
          setPreferredModel(authenticatedUser.preferred_model);
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
        setPreferredModel(undefined);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithGoogle, logout, updateUsername, updatePreferredModel, refreshUser, preferredModel }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
