
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronsUpDown, PanelLeftClose, MessageSquare, Folder, Users, Settings, Check, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import CreateProjectDialog from './CreateProjectDialog';
import ManageMembersDialog from './ManageMembersDialog';
import { useAuthContext } from '@/context/authcontext';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ProjectDetail, ProjectListDetail } from '@/types/types_projects';

interface Conversation {
  id: string;
  name: string;
}

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  isCreatingChat: boolean;
  onNewConversation: () => void;
  onConversationSelect: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  projects: ProjectListDetail[];
  currentProject: ProjectDetail | null;
  onProjectSelect: (id: string) => void;
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
  projects,
  currentProject,
  onProjectSelect,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const { user } = useAuthContext();
  const [isCreateProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [isManageMembersDialogOpen, setManageMembersDialogOpen] = useState(false);

  const currentUserProjectRole = currentProject?.members.find(m => m.uid === user?.uid)?.project_role;
  const globalRole = user?.global_role;

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
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Projects</DropdownMenuLabel>
            {projects.map((project) => (
               <DropdownMenuItem key={project.id} onSelect={() => onProjectSelect(project.id)}>
                  <Folder className="mr-2 h-4 w-4" />
                  <span>{project.name}</span>
                  {currentProject?.id === project.id && <Check className="ml-auto h-4 w-4" />}
               </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
             <DropdownMenuItem onSelect={() => setCreateProjectDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              <span>Create Project</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
             <DropdownMenuItem disabled={!currentProject}>
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
                <Button onClick={onNewConversation} disabled={isCreatingChat} className="w-full">
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
                    className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md ${conversation.id === activeConversationId ? 'bg-muted text-primary' : 'text-muted-foreground hover:bg-muted'} ${!isSidebarOpen && 'justify-center'}`}
                    >
                        <div className="flex items-center truncate">
                            <MessageSquare className={`h-5 w-5 ${isSidebarOpen && 'mr-3'}`} />
                            <span className={`truncate ${!isSidebarOpen && 'hidden'}`}>{conversation.name}</span>
                        </div>
                        {isSidebarOpen && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onDeleteConversation(conversation.id);
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </a>
                </TooltipTrigger>
                {!isSidebarOpen && <TooltipContent side="right"><p>{conversation.name}</p></TooltipContent>}
            </Tooltip>
          ))}
        </nav>
      </ScrollArea>
      
      <CreateProjectDialog isOpen={isCreateProjectDialogOpen} onClose={() => setCreateProjectDialogOpen(false)} />
      {currentProject && <ManageMembersDialog isOpen={isManageMembersDialogOpen} onClose={() => setManageMembersDialogOpen(false)} project={currentProject} />}
    </div>
    </TooltipProvider>
  );
};

export default Sidebar;
