// src/types/types_projects.ts

import type { GlobalRole, ProjectRole } from './types_roles';

// --- CORE PROJECT & PAGINATION TYPES ---

/**
 * Defines the structure for pagination data.
 */
export interface Pagination {
    total_items: number;
    total_pages: number;
    current_page: number;
    limit: number;
}

/**
 * Represents a project member, as returned by the API.
 */
export interface ProjectMember {
    user_uid: string;
    project_role: ProjectRole;
    email?: string | null;
    avatar_url?: string | null;
}

/**
 * Represents a project in search results, including its members.
 */
export interface ProjectSearchResult {
    id: string;
    name: string;
    description?: string | null;
    role: ProjectRole; // The current user's role in this project
    members: ProjectMember[];
}

/**
* Lightweight project information for list views.
*/
export interface ProjectListResult {
   id: string;
   name: string;
   description?: string | null;
   role: ProjectRole;
}

/**
 * Summary of a project a user is a member of (used in profiles).
 */
export interface ProjectSummary {
    id: string;
    role: ProjectRole;
}

// --- API RESPONSE WRAPPERS ---

/**
 * Wrapper for paginated project search results.
 */
export interface PaginatedProjectSearchResponse {
    projects: ProjectSearchResult[];
    pagination: Pagination;
}

/**
* Wrapper for paginated project list results.
*/
export interface PaginatedProjectListResponse {
   projects: ProjectListResult[];
   pagination: Pagination;
}


// --- API PAYLOADS ---

/**
 * Payload for creating a new project.
 */
export interface ProjectCreatePayload {
    id: string;
    name: string;
    description?: string;
}

/**
 * Payload for inviting or updating a member.
 */
export interface MemberInvitePayload {
    email?: string;
    user_id?: string;
    role: ProjectRole;
}

// --- LEGACY / DEPRECATED TYPES ---

export interface ProjectLegacy {
    id: string;
    name: string;
    owner_uid: string;
    role: ProjectRole | 'guest';
    is_public: boolean;
}

export interface MemberLegacy {
    uid: string;
    email: string;
    role: ProjectRole;
    photoURL?: string;
    username?: string;
    global_role?: GlobalRole;
}
