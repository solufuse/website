
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
} from '@/components/ui/dropdown-menu';
import CreateProjectDialog from './CreateProjectDialog';

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

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onNewConversation,
  onConversationSelect,
}) => {
  const { projects, currentProject, setCurrentProject } = useProjectContext();
  const [isCreateProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);

  return (
    <div className="flex flex-col h-full w-64 bg-background border-r">
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
              <DropdownMenuItem key={project.id} onSelect={() => setCurrentProject(project)}>
                {project.name}
              </DropdownMenuItem>
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
      <div className="flex-1 overflow-y-auto">
        <nav className="px-2">
          {conversations.map((conversation) => (
            <a
              key={conversation.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onConversationSelect(conversation.id);
              }}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                conversation.id === activeConversationId
                  ? 'bg-muted text-primary'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {conversation.name}
            </a>
          ))}
        </nav>
      </div>
      <CreateProjectDialog
        isOpen={isCreateProjectDialogOpen}
        onClose={() => setCreateProjectDialogOpen(false)}
      />
    </div>
  );
};

export default Sidebar;
