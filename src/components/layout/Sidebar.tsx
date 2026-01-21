
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronsUpDown, PanelLeftClose, Folder, Users, Settings, Check, Trash2, MoreVertical, Link, Filter, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import CreateProjectDialog from './CreateProjectDialog';
import ManageMembersDialog from './ManageMembersDialog';
import ProjectSettingsDialog from './ProjectSettingsDialog';
import { useAuthContext } from '@/context/authcontext';
import { useProjectContext } from '@/context/ProjectContext';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Conversation {
  id: string;
  name: string;
}

// --- PROPS --- (Simplified)
interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  isCreatingChat: boolean;
  onNewConversation: () => void;
  onConversationSelect: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const roleVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    "super_admin": "destructive",
    "admin": "destructive",
    "moderator": "secondary",
    "nitro": "default",
    "user": "outline",
    "guest": "outline",
    "Owner": "default",
    "Editor": "secondary",
    "Viewer": "outline",
};

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  isCreatingChat,
  onNewConversation,
  onConversationSelect,
  onDeleteConversation,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const { user } = useAuthContext();
  const {
      projects,
      currentProject,
      setCurrentProjectById,
      filterAccessLevel,
      setAccessLevelFilter,
      refreshProjects,
      removeProject,
  } = useProjectContext();
  const navigate = useNavigate();

  const [isCreateProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [isManageMembersDialogOpen, setManageMembersDialogOpen] = useState(false);
  const [isProjectSettingsDialogOpen, setProjectSettingsDialogOpen] = useState(false);

  const currentUserProjectRole = currentProject?.members.find(m => m.uid === user?.uid)?.project_role;
  const globalRole = user?.global_role;

  const handleProjectSelect = (id: string) => {
      setCurrentProjectById(id);
      navigate(`/chats/${id}`);
  }

  const handleProjectCreated = (newProjectId: string) => {
    refreshProjects();
    handleProjectSelect(newProjectId);
  };

  const handleProjectDeleted = () => {
    if (currentProject) {
        removeProject(currentProject.id);
        navigate('/');
    }
  };

  const handleCopyLink = (conversationId: string) => {
    if (currentProject) {
        const link = `${window.location.origin}/chats/${currentProject.id}/${conversationId}`;
        navigator.clipboard.writeText(link);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
    <div className={`flex flex-col h-full bg-background border-r transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-72' : 'w-20'}`}>
      <div className={`p-4 border-b flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
        <h2 className={`text-lg font-semibold tracking-tight ${!isSidebarOpen && 'hidden'}`}>
          Solufuse
        </h2>
        <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
          <PanelLeftClose className="h-5 w-5" />
        </Button>
      </div>

      <div className={`p-4 ${!isSidebarOpen && 'p-2'}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between mb-4">
              <span className={!isSidebarOpen ? 'hidden' : 'truncate'}>
                {currentProject ? currentProject.name : 'Select a project'}
              </span>
              <ChevronsUpDown className={`h-4 w-4 shrink-0 opacity-50 ${isSidebarOpen ? 'ml-2' : 'mx-auto'}`} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            <DropdownMenuLabel className="flex items-center justify-between">
                <span>Projects</span>
                <Button variant="ghost" size="icon" onClick={refreshProjects} className="h-8 w-8">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </DropdownMenuLabel>
            <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <Filter className="mr-2 h-4 w-4" />
                    <span>Filter by: {filterAccessLevel || 'All'}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem onSelect={() => setAccessLevelFilter(null)}>
                            <span>All</span>
                            {filterAccessLevel === null && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setAccessLevelFilter('owner')}>
                            <span>Owner</span>
                            {filterAccessLevel === 'owner' && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setAccessLevelFilter('member')}>
                            <span>Member</span>
                            {filterAccessLevel === 'member' && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setAccessLevelFilter('public')}>
                            <span>Public</span>
                            {filterAccessLevel === 'public' && <Check className="ml-auto h-4 w-4" />}
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <ScrollArea style={{maxHeight: '200px'}}>
                {projects.map((project) => (
                   <DropdownMenuItem key={project.id} onSelect={() => handleProjectSelect(project.id)}>
                      <Folder className="mr-2 h-4 w-4" />
                      <span>{project.name}</span>
                      {currentProject?.id === project.id && <Check className="ml-auto h-4 w-4" />}
                   </DropdownMenuItem>
                ))}
            </ScrollArea>
            <DropdownMenuSeparator />
             <DropdownMenuItem onSelect={() => setCreateProjectDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              <span>Create Project</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
             <DropdownMenuItem onSelect={() => setProjectSettingsDialogOpen(true)} disabled={!currentProject}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setManageMembersDialogOpen(true)} disabled={!currentProject}>
                <Users className="mr-2 h-4 w-4" />
                Members
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
            <TooltipTrigger asChild>
                <Button onClick={onNewConversation} disabled={isCreatingChat || !currentProject} className="w-full">
                    {isSidebarOpen ? (
                        isCreatingChat ? 'Creating...' : <><PlusCircle className="mr-2 h-4 w-4" /> New Chat</>
                    ) : (
                        <PlusCircle className="h-5 w-5" />
                    )}
                </Button>
            </TooltipTrigger>
            {!isSidebarOpen && <TooltipContent side="right"><p>New Chat</p></TooltipContent>}
        </Tooltip>

      </div>

      <div className={`px-4 ${!isSidebarOpen && 'px-2'}`}>
        <div className={`text-xs font-semibold text-muted-foreground px-1 ${!isSidebarOpen && 'hidden'}`}>ROLES</div>
        <div className="flex flex-wrap gap-1 mt-2">
            {globalRole && <Badge variant={roleVariantMap[globalRole] || 'outline'}>{isSidebarOpen ? globalRole : globalRole.charAt(0).toUpperCase()}</Badge>}
            {currentUserProjectRole && <Badge variant={roleVariantMap[currentUserProjectRole] || 'outline'}>{isSidebarOpen ? currentUserProjectRole : currentUserProjectRole.charAt(0).toUpperCase()}</Badge>}
            {(!globalRole && !currentUserProjectRole && user) && <Badge variant={'outline'}>{isSidebarOpen ? 'user' : 'U'}</Badge>}
        </div>
      </div>

      <ScrollArea className="flex-1 mt-4">
        <nav className="grid gap-1 p-2">
          {conversations.map((conversation) => (
             <Tooltip key={conversation.id}>
                <TooltipTrigger asChild>
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            onConversationSelect(conversation.id);
                        }}
                        className={`group relative flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md ${conversation.id === activeConversationId ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted'} ${!isSidebarOpen && 'justify-center'}`}>
                        
                        <span className={`flex-1 truncate min-w-0 ${!isSidebarOpen && 'hidden'}`}>
                            {conversation.name.length > 25 ? `${conversation.name.substring(0, 30)}...` : conversation.name}
                        </span>
                        
                        {isSidebarOpen && (
                            <div className="ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                            }}>
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                handleCopyLink(conversation.id);
                                            }}>
                                            <Link className="mr-2 h-4 w-4" />
                                            <span>Copy Link</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                onDeleteConversation(conversation.id);
                                            }}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Delete</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </a>
                </TooltipTrigger>
                {!isSidebarOpen && <TooltipContent side="right"><p>{conversation.name}</p></TooltipContent>}
            </Tooltip>
          ))}
        </nav>
      </ScrollArea>
      
      <CreateProjectDialog isOpen={isCreateProjectDialogOpen} onClose={() => setCreateProjectDialogOpen(false)} onProjectCreated={handleProjectCreated} />
      {currentProject && <ManageMembersDialog isOpen={isManageMembersDialogOpen} onClose={() => setManageMembersDialogOpen(false)} project={currentProject} onMembersChanged={refreshProjects} />}
      {currentProject && (
        <ProjectSettingsDialog
          isOpen={isProjectSettingsDialogOpen}
          onClose={() => setProjectSettingsDialogOpen(false)}
          project={currentProject}
          onProjectDeleted={handleProjectDeleted}
        />
      )}
    </div>
    </TooltipProvider>
  );
};

export default Sidebar;
