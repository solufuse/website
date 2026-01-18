
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
import { useProjectContext } from '@/context/ProjectContext';
import { ProjectRoleEnum } from '@/types/types_projects';

interface ManageMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ManageMembersDialog: React.FC<ManageMembersDialogProps> = ({ isOpen, onClose }) => {
  const { currentProject, inviteMember, removeMember, updateMemberRole } = useProjectContext();

  if (!currentProject) return null;

  const handleInvite = () => {
    const email = prompt("Enter email of the user to invite:");
    if (email) {
      inviteMember({ email, role: ProjectRoleEnum.VIEWER });
    }
  };

  const handleChangeRole = (userId: string, newRole: ProjectRoleEnum) => {
    updateMemberRole(userId, newRole);
  };

  const handleKickMember = (userId: string) => {
    if (window.confirm("Are you sure you want to kick this member?")) {
      removeMember(userId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Members for {currentProject.name}</DialogTitle>
          <DialogDescription>
            Invite, remove, and manage roles for project members.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button onClick={handleInvite}>Invite Member</Button>
          <div className="space-y-2">
            {currentProject.members?.map((member) => (
              <div key={member.uid} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback>{member.username?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{member.username || member.uid}</p>
                    <p className="text-sm text-muted-foreground">{member.project_role}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost">...</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => handleChangeRole(member.uid, ProjectRoleEnum.EDITOR)}>
                      Make Editor
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleChangeRole(member.uid, ProjectRoleEnum.VIEWER)}>
                      Make Viewer
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleKickMember(member.uid)}>
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
