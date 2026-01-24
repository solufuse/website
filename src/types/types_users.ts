// This file contains types specific to User objects and user-related API calls.

// Publicly viewable user information
export interface UserPublic {
    uid: string;
    username: string | null;
    email: string; // Often included for identification
    photo_url?: string;
}

// Full user profile for the authenticated user ('me')
export interface UserProfile extends UserPublic {
    first_name: string | null;
    last_name: string | null;
    bio: string | null;
    global_role: string;
    api_key_set: boolean; // Indicates if the user has a Gemini API key set on the backend.
    preferred_model?: string; // The user's preferred default AI model.
}

// Payload for updating the user's own profile
export interface UserUpdatePayload {
    username?: string;
    first_name?: string;
    last_name?: string;
    bio?: string;
    photo_url?: string;
    preferred_model?: string; // Allow users to update their preferred model.
}

// Response for paginated user search, as returned by the backend
export interface PaginatedUsersResponse {
    users: UserPublic[];
    pagination: {
        total_items: number;
        total_pages: number;
        current_page: number;
        limit: number;
    };
}
