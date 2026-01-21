
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import {
    ProjectListDetail, 
    ProjectDetail,       
    ProjectCreatePayload,
    MemberInvitePayload,
    ProjectRoleEnum, 
} from '@/types/types_projects';
import {
    getProjectDetails,
    createProject,
    deleteProject,
    inviteOrUpdateMember,
    kickMember,
    listProjects,
    setProjectVisibility
} from '@/api/projects';
import { useAuthContext } from './authcontext';

// --- TYPE DEFINITIONS ---
type AccessLevel = ProjectListDetail['access_level'];

// --- CONTEXT SHAPE ---
interface ProjectContextType {
  projects: ProjectListDetail[];          
  currentProject: ProjectDetail | null;   
  isLoading: boolean;
  error: string | null;
  filterAccessLevel: AccessLevel | null; // <-- ADDED FILTER STATE
  setAccessLevelFilter: (level: AccessLevel | null) => void; // <-- ADDED FILTER SETTER
  refreshProjects: () => void;
  addProject: (payload: ProjectCreatePayload) => Promise<void>;
  removeProject: (projectId: string) => Promise<void>;
  setCurrentProjectById: (projectId: string | null) => void; 
  inviteMember: (payload: MemberInvitePayload) => Promise<void>;
  removeMember: (targetUid: string) => Promise<void>;
  updateMemberRole: (targetUid: string, role: ProjectRoleEnum) => Promise<void>;
  updateProjectVisibility: (visibility: 'public' | 'private') => Promise<void>; 
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authIsLoading } = useAuthContext();

  const [projects, setProjects] = useState<ProjectListDetail[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterAccessLevel, setFilterAccessLevel] = useState<AccessLevel | null>(null);

  const fetchProjects = useCallback(async (accessLevel: AccessLevel | null) => {
    if (authIsLoading || !user) return;
    setIsLoading(true);
    setError(null);
    try {
        const response = await listProjects(accessLevel ?? undefined);
        setProjects(response.projects);
    } catch (err: any) {
        setError(err.message);
        setProjects([]);
        setCurrentProject(null);
    }
    setIsLoading(false);
  }, [user, authIsLoading]);

  const setAccessLevelFilter = (level: AccessLevel | null) => {
      setFilterAccessLevel(level);
  };

  const refreshProjects = useCallback(() => {
    fetchProjects(filterAccessLevel);
  }, [fetchProjects, filterAccessLevel]);

  const setCurrentProjectById = useCallback(async (projectId: string | null) => {
    if (!projectId) {
        setCurrentProject(null);
        localStorage.removeItem('lastProjectId');
        return;
    }

    if (currentProject?.id === projectId) return;

    setIsLoading(true);
    try {
        const projectDetails = await getProjectDetails(projectId);
        setCurrentProject(projectDetails);
        localStorage.setItem('lastProjectId', projectId);
    } catch (err: any) {
        setError(`Failed to load project: ${err.message}`);
        setCurrentProject(null);
        localStorage.removeItem('lastProjectId');
    }
    setIsLoading(false);
  }, [currentProject?.id]);

  const addProject = async (payload: ProjectCreatePayload) => {
    await createProject(payload);
    refreshProjects();
  };

  const removeProject = async (projectId: string) => {
    await deleteProject(projectId);
    if (currentProject?.id === projectId) {
        setCurrentProjectById(null);
    }
    refreshProjects();
  };

  const inviteMember = async (payload: MemberInvitePayload) => {
    if (!currentProject) return;
    await inviteOrUpdateMember(currentProject.id, payload);
    await setCurrentProjectById(currentProject.id); // Refresh details
  };

  const removeMember = async (targetUid: string) => {
    if (!currentProject) return;
    await kickMember(currentProject.id, targetUid);
    setCurrentProject(prev => prev ? { ...prev, members: prev.members.filter(m => m.uid !== targetUid) } : null);
  };

  const updateMemberRole = async (targetUid: string, role: ProjectRoleEnum) => {
    if (!currentProject) return;
    await inviteOrUpdateMember(currentProject.id, { user_id: targetUid, role });
    setCurrentProject(prev => {
        if (!prev) return null;
        return {
            ...prev,
            members: prev.members.map(m => m.uid === targetUid ? { ...m, project_role: role } : m)
        };
    });
  };

  const updateProjectVisibility = async (visibility: 'public' | 'private') => {
    if (!currentProject) return;
    await setProjectVisibility(currentProject.id, visibility);
    setCurrentProject(prev => prev ? { ...prev, visibility } : null);
  };

  useEffect(() => {
    if (user && !authIsLoading) {
        fetchProjects(filterAccessLevel);
    }
  }, [user, authIsLoading, fetchProjects, filterAccessLevel]);

  useEffect(() => {
    if (projects.length > 0 && !currentProject) {
      const lastId = localStorage.getItem('lastProjectId');
      if (lastId && projects.some(p => p.id === lastId)) {
          setCurrentProjectById(lastId);
      }
    }
  }, [projects, currentProject, setCurrentProjectById]);

  const value = useMemo(() => ({ 
    projects,
    currentProject,
    isLoading,
    error,
    filterAccessLevel, // <-- EXPORTED
    setAccessLevelFilter, // <-- EXPORTED
    refreshProjects,
    addProject,
    removeProject,
    setCurrentProjectById,
    inviteMember,
    removeMember,
    updateMemberRole,
    updateProjectVisibility
  }), [
    projects, currentProject, isLoading, error, filterAccessLevel,
    refreshProjects, addProject, removeProject, setCurrentProjectById, 
    inviteMember, removeMember, updateMemberRole, updateProjectVisibility
  ]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) throw new Error('useProjectContext must be used within a ProjectProvider');
  return context;
};
