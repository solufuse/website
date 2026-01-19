
import React, { useState, useEffect } from 'react';
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
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProjectContext } from '@/context/ProjectContext';
import { ProjectDetail, ProjectRoleEnum, ProjectMember } from '@/types/types_projects';
import { lookupUser } from '@/api/users';
import { Badge } from '@/components/ui/badge';
import { roleVariantMap } from '@/lib/utils';

type DetailedProjectMember = ProjectMember & { email?: string };

interface ManageMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectDetail;
}

const ManageMembersDialog: React.FC<ManageMembersDialogProps> = ({ isOpen, onClose, project }) => {
  const { inviteMember, removeMember, updateMemberRole } = useProjectContext();
  const [detailedMembers, setDetailedMembers] = useState<DetailedProjectMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  useEffect(() => {
    if (project?.members) {
      setIsLoadingMembers(true);
      const fetchMemberDetails = async () => {
        const membersWithDetails = await Promise.all(
          project.members.map(async (member) => {
            try {
              const userProfile: { email?: string; username?: string | null } = await lookupUser({ uid: member.uid });
              return { ...member, email: userProfile.email, username: userProfile.username || member.username };
            } catch (error) {
              console.error(`Failed to lookup user ${member.uid}`, error);
              return member;
            }
          })
        );
        setDetailedMembers(membersWithDetails);
        setIsLoadingMembers(false);
      };

      fetchMemberDetails();
    } else {
      setDetailedMembers([]);
    }
  }, [project?.members]);

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

  const isOwner = (memberId: string) => {
    return project.owner_uid === memberId;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Members for {project.name}</DialogTitle>
          <DialogDescription>
            Invite, remove, and manage roles for project members.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button onClick={handleInvite} className="w-full sm:w-auto">Invite Member</Button>
          <div className="space-y-2">
            {isLoadingMembers ? (
              <p>Loading member details...</p>
            ) : (
              detailedMembers.map((member) => (
                <div key={member.uid} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback>{member.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{member.username || 'Unnamed User'}</p>
                      <p className="text-sm text-muted-foreground">{member.email || 'No email available'}</p>
                      <p className="text-xs text-muted-foreground">UID: {member.uid}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={roleVariantMap[member.project_role] || 'outline'}>
                      {member.project_role}
                    </Badge>
                    {!isOwner(member.uid) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">...</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
                            <DropdownMenuContent>
                              {Object.values(ProjectRoleEnum)
                                .filter(role => role !== member.project_role && role !== ProjectRoleEnum.OWNER)
                                .map(role => (
                                  <DropdownMenuItem key={role} onSelect={() => handleChangeRole(member.uid, role)}>
                                    Set as {role}
                                  </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-500" onSelect={() => handleKickMember(member.uid)}>
                            Kick Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageMembersDialog;
