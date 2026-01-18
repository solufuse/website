
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronsUpDown } from 'lucide-react';
import { useProjectContext } from '@/context/ProjectContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import CreateProjectDialog from './CreateProjectDialog';
import ManageMembersDialog from './ManageMembersDialog'; // Import the new dialog
import { useAuthContext } from '@/context/authcontext';
import { Badge } from "@/components/ui/badge";
import { GlobalRole, ProjectRole } from "@/types/types_roles";

interface Conversation {
  id: string;
  name: string;
}

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onNewConversation: () => void;
  onConversationSelect: (id: string) => void;
}

const roleVariantMap: Record<GlobalRole | ProjectRole, "default" | "secondary" | "destructive" | "outline"> = {
    "super_admin": "destructive",
    "admin": "destructive",
    "moderator": "secondary",
    "nitro": "default",
    "user": "outline",
    "guest": "outline",
    "owner": "default",
    "editor": "secondary",
    "viewer": "outline",
};

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onNewConversation,
  onConversationSelect,
}) => {
  const { projects, currentProject, setCurrentProject } = useProjectContext();
  const { user } = useAuthContext();
  const [isCreateProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [isManageMembersDialogOpen, setManageMembersDialogOpen] = useState(false); // State for the new dialog

  const projectRole = currentProject?.members?.find(member => member.user_uid === user?.uid)?.project_role;
  const globalRole = user?.global_role;

  return (
    <div className="flex flex-col h-full w-64 bg-background border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold tracking-tight">
          Solufuse
        </h2>
      </div>
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between mb-4">
              {currentProject ? currentProject.name : 'Select a project'}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {projects.map((project) => (
               <DropdownMenuSub key={project.id}>
                 <DropdownMenuSubTrigger>
                  <span>{project.name}</span>
                 </DropdownMenuSubTrigger>
                 <DropdownMenuSubContent>
                  <DropdownMenuItem onSelect={() => setCurrentProject(project)}>
                    Select Project
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setManageMembersDialogOpen(true)}>
                    Members
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Description</DropdownMenuLabel>
                  <p className="px-2 py-1.5 text-sm text-muted-foreground">
                    {project.description || 'No description'}
                  </p>
                 </DropdownMenuSubContent>
               </DropdownMenuSub>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setCreateProjectDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              <span>Create Project</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={onNewConversation} className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" /> New Chat
        </Button>
      </div>
      <div className="px-4">
        <div className="text-xs font-semibold text-muted-foreground px-1">ROLES</div>
        <div className="flex flex-wrap gap-1 mt-2">
            {globalRole && <Badge variant={roleVariantMap[globalRole] || 'outline'}>{globalRole}</Badge>}
            {projectRole && <Badge variant={roleVariantMap[projectRole] || 'outline'}>{projectRole}</Badge>}
            {(!globalRole && !projectRole && user) && <Badge variant={'outline'}>user</Badge>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto mt-4">
        <nav className="px-2">
          {conversations.map((conversation) => (
            <a
              key={conversation.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onConversationSelect(conversation.id);
              }}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${                conversation.id === activeConversationId
                  ? 'bg-muted text-primary'
                  : 'text-muted-foreground hover:bg-muted'
              }`}>
              {conversation.name}
            </a>
          ))}
        </nav>
      </div>
      <CreateProjectDialog
        isOpen={isCreateProjectDialogOpen}
        onClose={() => setCreateProjectDialogOpen(false)}
      />
      <ManageMembersDialog 
        isOpen={isManageMembersDialogOpen} 
        onClose={() => setManageMembersDialogOpen(false)} 
        project={currentProject}
      />
    </div>
  );
};

export default Sidebar;
