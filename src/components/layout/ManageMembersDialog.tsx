
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Project } from '@/types';
import { ProjectRole } from '@/types/types_roles';

interface ManageMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

const ManageMembersDialog: React.FC<ManageMembersDialogProps> = ({ isOpen, onClose, project }) => {
  if (!project) return null;

  const handleInvite = () => {
    // TODO: Implement invite functionality
    console.log('Invite new member');
  };

  const handleChangeRole = (userId: string, newRole: ProjectRole) => {
    // TODO: Implement role change functionality
    console.log(`Change role for user ${userId} to ${newRole}`);
  };

  const handleKickMember = (userId: string) => {
    // TODO: Implement kick member functionality
    console.log(`Kick member ${userId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Members for {project.name}</DialogTitle>
          <DialogDescription>
            Invite, remove, and manage roles for project members.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button onClick={handleInvite}>Invite Member</Button>
          <div className="space-y-2">
            {project.members?.map((member) => (
              <div key={member.user_uid} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback>{member.email?.charAt(0) || member.user_uid.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{member.email || member.user_uid}</p>
                    <p className="text-sm text-muted-foreground">{member.project_role}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost">...</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => handleChangeRole(member.user_uid, 'editor')}>
                      Make Editor
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleChangeRole(member.user_uid, 'viewer')}>
                      Make Viewer
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleKickMember(member.user_uid)}>
                      Kick Member
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageMembersDialog;
