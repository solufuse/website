
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
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProjectDetail, ProjectRoleEnum, ProjectMember } from '@/types/types_projects';
import { inviteOrUpdateMember, kickMember } from '@/api/projects';
import { Badge } from '@/components/ui/badge';
import { roleVariantMap } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useAuthContext } from '@/context/authcontext';
import { MoreVertical } from 'lucide-react';

// No longer need to extend the type, as the backend provides everything.
type DetailedProjectMember = ProjectMember;

interface ManageMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectDetail;
  onMembersChanged: () => void; // Callback to refresh project details
}

const ManageMembersDialog: React.FC<ManageMembersDialogProps> = ({ isOpen, onClose, project, onMembersChanged }) => {
  const { user } = useAuthContext();
  // The project.members array is already detailed, so we can use it directly.
  const [detailedMembers, setDetailedMembers] = useState<DetailedProjectMember[]>(project.members || []);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This effect now simply syncs the state with the prop.
  // The redundant user lookup calls have been removed.
  useEffect(() => {
    setDetailedMembers(project.members || []);
  }, [project]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
        setError('Please enter a valid email address.');
        return;
    }
    setIsInviting(true);
    setError(null);
    try {
        await inviteOrUpdateMember(project.id, { email: inviteEmail, role: ProjectRoleEnum.VIEWER });
        setInviteEmail('');
        onMembersChanged(); // Refresh the project details
    } catch (err) {
        console.error("Failed to invite member:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred during invitation.');
    } finally {
        setIsInviting(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: ProjectRoleEnum) => {
    try {
        await inviteOrUpdateMember(project.id, { uid: userId, role: newRole });
        // Optimistically update the UI
        setDetailedMembers(prevMembers => 
            prevMembers.map(member => 
                member.uid === userId ? { ...member, project_role: newRole } : member
            )
        );
        onMembersChanged(); // Also call the parent refresh for full consistency
    } catch (err) {
        console.error(`Failed to change role for ${userId}:`, err);
        alert('Failed to change member role.');
    }
  };

  const handleKickMember = async (userId: string) => {
    if (window.confirm("Are you sure you want to kick this member?")) {
        try {
            await kickMember(project.id, userId);
            onMembersChanged();
        } catch (err) {
            console.error(`Failed to kick member ${userId}:`, err);
            alert('Failed to kick member.');
        }
    }
  };

  const currentUserIsAdmin = project.members.some(m => 
    m.uid === user?.uid && 
    (m.project_role.toLowerCase() === 'admin' || m.project_role.toLowerCase() === 'owner')
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Members for {project.name}</DialogTitle>
          <DialogDescription>
            Invite, remove, and manage roles for project members.
          </DialogDescription>
        </DialogHeader>
        
        {currentUserIsAdmin && (
            <div className="space-y-2 pt-4">
                <div className="flex space-x-2">
                    <Input 
                        type="email" 
                        placeholder="user@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        disabled={isInviting}
                    />
                    <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
                        {isInviting ? 'Inviting...' : 'Invite'}
                    </Button>
                </div>
                {error && <p className="text-sm text-red-500 px-1">{error}</p>}
            </div>
        )}

        <div className="mt-4 space-y-2 h-80 overflow-y-auto pr-2">
            {detailedMembers.map((member) => (
              <div key={member.uid} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                <div className="flex items-center space-x-4 min-w-0">
                  <Avatar>
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback>{member.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{member.username || 'Unnamed User'}</p>
                    <p className="text-sm text-muted-foreground truncate">{member.email || 'No email available'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Badge variant={roleVariantMap[member.project_role] || 'outline'}>
                    {member.project_role}
                  </Badge>
                  {currentUserIsAdmin && member.project_role.toLowerCase() !== 'owner' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuContent>
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                {Object.values(ProjectRoleEnum)
                                    .filter(role => 
                                        role.toLowerCase() !== member.project_role.toLowerCase() && 
                                        role.toLowerCase() !== 'owner'
                                    )
                                    .map(role => (
                                    <DropdownMenuItem key={role} onSelect={() => handleChangeRole(member.uid, role)}>
                                        Set as {role}
                                    </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onSelect={() => handleKickMember(member.uid)}>
                            Kick Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenuPortal>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageMembersDialog;
