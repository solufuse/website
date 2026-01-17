import { auth } from '../firebase';

// Function to get a fresh auth token
export const getAuthToken = async () => {
    const user = auth.currentUser;
    if (user) {
        return await user.getIdToken();
    }
    
    // For anonymous users, Firebase automatically provides a token.
    // We wait for the auth state to be ready to ensure we have a user object.
    await auth.authStateReady();
    if (!auth.currentUser) {
        throw new Error("User not authenticated. Please log in.");
    }
    return await auth.currentUser.getIdToken();
};
