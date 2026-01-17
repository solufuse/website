import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import {
    ProjectSearchResult,
    ProjectCreatePayload,
    MemberInvitePayload,
    ProjectMember,
    Pagination
} from '@/types/types_projects';
import { ProjectRole } from '@/types/types_roles';
import {
    searchProjects,
    createProject,
    deleteProject,
    inviteOrUpdateMember,
    kickMember,
    listProjects
} from '@/api/projects';
import { FileTreeNode } from '@/utils/fileTree';
import { useAuthContext } from './authcontext';

// --- CONTEXT SHAPE ---
interface ProjectContextType {
  projects: ProjectSearchResult[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  fetchProjects: (params?: { q?: string; id?: string }) => Promise<void>;
  refreshProjects: () => void;
  addProject: (payload: ProjectCreatePayload) => Promise<void>;
  removeProject: (projectId: string) => Promise<void>;
  currentProject: ProjectSearchResult | null;
  setCurrentProject: (project: ProjectSearchResult | null) => void;
  getProjectById: (projectId: string) => ProjectSearchResult | undefined;
  members: ProjectMember[];
  isMembersLoading: boolean;
  inviteMember: (projectId: string, payload: MemberInvitePayload) => Promise<void>;
  removeMember: (projectId: string, targetUid: string) => Promise<void>;
  updateMemberRole: (projectId: string, targetUid: string, role: ProjectRole) => Promise<void>;
  currentDiagramFile: string | null;
  setCurrentDiagramFile: (path: string | null) => void;
  refreshDiagramResults: () => void;
  diagramResultRefreshKey: number;
  projectTree: FileTreeNode | null;
  setProjectTree: (tree: FileTreeNode | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authIsLoading } = useAuthContext();

  const [projects, setProjects] = useState<ProjectSearchResult[]>([]);
  const [currentProject, setCurrentProjectState] = useState<ProjectSearchResult | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

 const fetchProjects = useCallback(async (params: { q?: string; id?: string } = {}) => {
    if (authIsLoading) return;
    setIsLoading(true);
    setError(null);
    try {
        let response;
        // If there's a search query or an ID, use the detailed search endpoint
        if (params.q || params.id) {
            response = await searchProjects(params);
        } else {
            // Otherwise, use the lightweight list endpoint
            response = await listProjects();
        }
        // The ProjectSearchResult and ProjectListResult are compatible for this context
        setProjects(response.projects as ProjectSearchResult[]);
        setPagination(response.pagination);
    } catch (err: any) {
        setError(err.message);
        if (!user) {
            setProjects([]);
            setPagination(null);
        }
    }
    setIsLoading(false);
}, [user, authIsLoading]);


  const refreshProjects = useCallback(() => { fetchProjects({}); }, [fetchProjects]);

  const addProject = useCallback(async (payload: ProjectCreatePayload) => {
    await createProject(payload);
    refreshProjects();
  }, [refreshProjects]);

  const getProjectById = useCallback((projectId: string) => projects.find(p => p.id === projectId), [projects]);

  const setCurrentProject = useCallback((project: ProjectSearchResult | null) => {
    setCurrentProjectState(project);
    if (project) {
      localStorage.setItem('lastProjectId', project.id);
    } else {
      localStorage.removeItem('lastProjectId');
    }
    setCurrentDiagramFile(null);
    setProjectTree(null);
  }, []);

  const removeProject = useCallback(async (projectId: string) => {
    await deleteProject(projectId);
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (currentProject?.id === projectId) {
      const newCurrent = projects.length > 1 ? projects.find(p => p.id !== projectId) || null : null;
      setCurrentProject(newCurrent);
    }
  }, [projects, currentProject, setCurrentProject]);

  // --- MEMBER MANAGEMENT (OPTIMISTIC UPDATES) ---

  const inviteMember = async (projectId: string, payload: MemberInvitePayload) => {
    await inviteOrUpdateMember(projectId, payload);
    // Refresh the entire project to get user details (email, etc.)
    const updatedProjectData = await searchProjects({ id: projectId });
    if (updatedProjectData.projects.length > 0) {
        setCurrentProjectState(updatedProjectData.projects[0]);
        setProjects(p => p.map(proj => proj.id === projectId ? updatedProjectData.projects[0] : proj));
    }
  };

  const removeMember = async (projectId: string, targetUid: string) => {
    await kickMember(projectId, targetUid);
    setCurrentProjectState(prev => {
        if (!prev || prev.id !== projectId) return prev;
        return {
            ...prev,
            members: prev.members.filter(m => m.user_uid !== targetUid)
        };
    });
  };

  const updateMemberRole = async (projectId: string, targetUid: string, role: ProjectRole) => {
    await inviteOrUpdateMember(projectId, { user_id: targetUid, role });
     setCurrentProjectState(prev => {
        if (!prev || prev.id !== projectId) return prev;
        return {
            ...prev,
            members: prev.members.map(m => m.user_uid === targetUid ? { ...m, project_role: role } : m)
        };
    });
  };
  
  // --- OTHER STATES ---
  const [currentDiagramFile, setCurrentDiagramFile] = useState<string | null>(null);
  const [diagramResultRefreshKey, setDiagramResultRefreshKey] = useState<number>(0);
  const [projectTree, setProjectTree] = useState<FileTreeNode | null>(null);
  const refreshDiagramResults = () => setDiagramResultRefreshKey(k => k + 1);

  // --- SIDE EFFECTS ---

  useEffect(() => {
    if (user && !authIsLoading) {
        fetchProjects({});
    }
  }, [user, authIsLoading, fetchProjects]);

  useEffect(() => {
    if (projects.length > 0 && !currentProject) {
      const lastId = localStorage.getItem('lastProjectId');
      const projectToSelect = lastId ? getProjectById(lastId) : projects[0];
      if (projectToSelect) {
          setCurrentProject(projectToSelect);
      }
    }
  }, [projects, currentProject, getProjectById, setCurrentProject]);

  const members = useMemo(() => currentProject?.members || [], [currentProject]);
  const isMembersLoading = useMemo(() => isLoading && !!currentProject, [isLoading, currentProject]);

  const value = useMemo(() => ({ 
    projects, pagination, isLoading, error,
    fetchProjects, refreshProjects, addProject, removeProject,
    currentProject, setCurrentProject, getProjectById,
    members, isMembersLoading, inviteMember, removeMember, updateMemberRole,
    currentDiagramFile, setCurrentDiagramFile, refreshDiagramResults, diagramResultRefreshKey, projectTree, setProjectTree,
  }), [
    projects, pagination, isLoading, error, members, isMembersLoading,
    currentProject, diagramResultRefreshKey, projectTree, currentDiagramFile, 
    fetchProjects, refreshProjects, addProject, removeProject,
    setCurrentProject, getProjectById, inviteMember, removeMember, updateMemberRole
  ]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

// --- ACCESS HOOK ---
export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) throw new Error('useProjectContext must be used within a ProjectProvider');
  return context;
};
