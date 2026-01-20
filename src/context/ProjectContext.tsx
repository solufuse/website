
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import {
    ProjectListDetail, // Use the lightweight version for the main list
    ProjectDetail,       // Use the detailed version for the current project
    ProjectCreatePayload,
    MemberInvitePayload,
    ProjectRoleEnum, // <-- IMPORT ENUM
} from '@/types/types_projects';
import {
    getProjectDetails,
    createProject,
    deleteProject,
    inviteOrUpdateMember,
    kickMember,
    listProjects
} from '@/api/projects';
import { useAuthContext } from './authcontext';

// --- CONTEXT SHAPE ---
interface ProjectContextType {
  projects: ProjectListDetail[];          
  currentProject: ProjectDetail | null;   
  isLoading: boolean;
  error: string | null;
  refreshProjects: () => void;
  addProject: (payload: ProjectCreatePayload) => Promise<void>;
  removeProject: (projectId: string) => Promise<void>;
  setCurrentProjectById: (projectId: string | null) => void; 
  inviteMember: (payload: MemberInvitePayload) => Promise<void>;
  removeMember: (targetUid: string) => Promise<void>;
  // UPDATED to use ProjectRoleEnum
  updateMemberRole: (targetUid: string, role: ProjectRoleEnum) => Promise<void>; 
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authIsLoading } = useAuthContext();

  const [projects, setProjects] = useState<ProjectListDetail[]>([]);
  const [currentProject, setCurrentProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (authIsLoading || !user) return;
    setIsLoading(true);
    setError(null);
    try {
        const response = await listProjects();
        setProjects(response.projects);
    } catch (err: any) {
        setError(err.message);
        setProjects([]);
        setCurrentProject(null);
    }
    setIsLoading(false);
  }, [user, authIsLoading]);

  const refreshProjects = useCallback(() => { fetchProjects(); }, [fetchProjects]);

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
    await setCurrentProjectById(currentProject.id);
  };

  const removeMember = async (targetUid: string) => {
    if (!currentProject) return;
    await kickMember(currentProject.id, targetUid);
    setCurrentProject(prev => prev ? { ...prev, members: prev.members.filter(m => m.uid !== targetUid) } : null);
  };

  // UPDATED to use ProjectRoleEnum and the correct payload field
  const updateMemberRole = async (targetUid: string, role: ProjectRoleEnum) => {
    if (!currentProject) return;
    // Corrected payload to use 'user_id' instead of 'uid'
    await inviteOrUpdateMember(currentProject.id, { user_id: targetUid, role });
    // Optimistic update
     setCurrentProject(prev => {
        if (!prev) return null;
        return {
            ...prev,
            members: prev.members.map(m => m.uid === targetUid ? { ...m, project_role: role } : m)
        };
    });
  };

  useEffect(() => {
    if (user && !authIsLoading) {
        fetchProjects();
    }
  }, [user, authIsLoading, fetchProjects]);

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
    refreshProjects,
    addProject,
    removeProject,
    setCurrentProjectById,
    inviteMember,
    removeMember,
    updateMemberRole
  }), [
    projects, currentProject, isLoading, error,
    refreshProjects, addProject, removeProject, setCurrentProjectById, 
    inviteMember, removeMember, updateMemberRole
  ]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) throw new Error('useProjectContext must be used within a ProjectProvider');
  return context;
};
