
// Defines types and enums related to Projects, aligning with backend schemas.

// UPDATED: This enum now matches the Pydantic schema with TitleCase values.
export enum ProjectRoleEnum {
    VIEWER = "Viewer",
    EDITOR = "Editor",
    MODERATOR = "Moderator",
    ADMIN = "Admin",
    OWNER = "Owner",
}

export interface ProjectMember {
    uid: string;
    // UPDATED: Username can be null, matching the backend's Optional[str].
    username: string | null;
    project_role: string; // Using string is safer if backend roles change.
    global_role?: string | null;
    avatar_url?: string;
}

export interface ProjectDetail {
    id: string;
    name: string;
    // UPDATED: Description can be null.
    description: string | null;
    created_at: string; // ISO 8601 date string
    owner_uid: string;
    members: ProjectMember[];
}

export interface ProjectListDetail {
    id: string;
    name: string;
    // UPDATED: Description can be null.
    description: string | null;
    user_project_role: string;
    user_global_role: string;
}

export interface PaginatedProjectListResponse {
    projects: ProjectListDetail[];
    pagination: {
        total: number;
    };
}

// --- Payloads for API Requests ---

export interface ProjectCreatePayload {
    id: string;
    name: string;
    description: string | null;
}

export interface MemberInvitePayload {
    user_id?: string;
    email?: string;
    // UPDATED: The role now correctly uses the updated enum.
    role: ProjectRoleEnum;
}

// Kept for potential future use or legacy search components
export interface ProjectSearchResult {
    id: string;
    name: string;
    description: string | null;
    role: string; 
    members: ProjectMember[];
}

export interface PaginatedProjectSearchResponse {
    projects: ProjectSearchResult[];
    pagination: any;
}
