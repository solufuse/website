
// Defines types and enums related to Projects, aligning with backend schemas.

export enum ProjectRoleEnum {
    VIEWER = "Viewer",
    EDITOR = "Editor",
    MODERATOR = "Moderator",
    ADMIN = "Admin",
    OWNER = "Owner",
}

export interface ProjectMember {
    uid: string;
    username: string | null;
    project_role: string;
    global_role?: string | null;
    avatar_url?: string;
    email?: string;
}

export interface ProjectDetail {
    id: string;
    name: string;
    description: string | null;
    created_at: string; // ISO 8601 date string
    owner_uid: string;
    members: ProjectMember[];
    visibility: 'public' | 'private'; // <-- ADDED
}

export interface ProjectListDetail {
    id: string;
    name: string;
    description: string | null;
    user_project_role: string;
    user_global_role: string;
    access_level: 'owner' | 'member' | 'public' | 'global'; // <-- ADDED
}

export interface PaginatedProjectListResponse {
    projects: ProjectListDetail[];
    pagination: {
        total: number;
    };
}

// --- Payloads for API Requests ---

export interface ProjectCreatePayload {
    name: string;
    description: string | null;
}

export interface MemberInvitePayload {
    user_id?: string;
    email?: string;
    role: ProjectRoleEnum;
}
