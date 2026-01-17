
// src/types/index.ts
// This file acts as a central hub for all type definitions in the application.
// It re-exports types from more specific files, providing a single point of import for other modules.

// [+] Export all role-related and project-related types for external consumption
export * from './types_roles';
export * from './types_projects';
export type { ProjectSearchResult as Project } from './types_projects'; // Alias for backward compatibility


// [+] Import types needed for declarations within this file's scope, to fix resolution errors.
import type { GlobalRole } from './types_roles';
import type { ProjectSummary } from './types_projects';

// --- API ACTION PAYLOADS (USER-SPECIFIC) ---

// Payload for updating a user's profile
export interface UserUpdatePayload {
    username?: string;
    first_name?: string;
    last_name?: string;
    birth_date?: string; // ISO 8601 date string (YYYY-MM-DD)
    bio?: string;
}

// Payload for banning/unbanning a user
export interface BanRequestPayload {
    user_id: string;
    is_active: boolean;
    reason?: string;
    notes?: string;
}

// Payload for updating a user's global role
export interface RoleUpdatePayload {
    email?: string;
    user_id?: string;
    role: GlobalRole; // This now correctly references the imported type
}


// --- CORE USER & APP MODELS ---

// Publicly visible user information
export interface UserPublic {
    uid: string;
    username?: string;
    photoURL?: string | null;
    email_masked?: string;
    global_role: GlobalRole; // This now correctly references the imported type
    bio?: string;
    is_active: boolean;
    created_at?: string; // ISO 8601 datetime string
}

// Detailed user profile for the authenticated user ("Me")
export interface UserProfile extends UserPublic {
    email?: string;
    first_name?: string;
    last_name?: string;
    birth_date?: string; // ISO 8601 date string (YYYY-MM-DD)
    projects: ProjectSummary[]; // This now correctly references the imported type
}

// Admin-level view of a user's profile
export interface UserAdminView extends UserPublic {
    email?: string;
    first_name?: string;
    last_name?: string;
    ban_reason?: string;
    admin_notes?: string;
}

// Represents a user within the application, potentially from Firebase Auth
export interface AppUser {
    uid: string;
    email?: string | null;
    displayName?: string | null; 
    photoURL?: string | null;
    isAnonymous?: boolean;
    global_role: GlobalRole; // This now correctly references the imported type
}


// --- FILE & STORAGE TYPES ---

/**
 * Represents a file or folder as returned by the file details API.
 */
export interface FileInfo {
    filename: string;
    path: string;
    size: number;
    uploaded_at: string;
    content_type: string;
    type: 'folder' | 'file';
}

// Statistics about the object storage
export interface StorageStats {
    total_size_bytes: number;
    total_file_count: number;
    orphan_file_count: number;
    orphan_total_size_bytes: number;
}

// Represents an item in the storage audit log
export interface AuditItem {
    id: string; 
    action: 'CREATE' | 'DELETE' | 'ACCESS';
    timestamp: string; // ISO 8601
    user_id?: string;
    details: string;
}


// --- MISCELLANEOUS & LEGACY TYPES ---

// Specific settings for a "Loadflow" feature
export interface LoadflowSettings {
  target_mw: number;
  tolerance_mw: number;
  swing_bus_id: string;
}

// General application configuration
export interface AppConfig {
  loadflow_settings: LoadflowSettings;
}
