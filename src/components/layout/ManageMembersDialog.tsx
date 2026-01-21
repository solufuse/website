
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
import { MoreVertical, RefreshCw } from 'lucide-react';

type DetailedProjectMember = ProjectMember;

interface ManageMembersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectDetail;
  onMembersChanged: () => void;
}

// Normalize the roleVariantMap to use lowercase keys for consistent lookups
const lowerCaseRoleVariantMap: Record<string, string> = Object.entries(roleVariantMap).reduce((acc, [key, value]) => {
    acc[key.toLowerCase()] = value;
    return acc;
}, {} as Record<string, string>);

const getRoleVariant = (role: string) => {
    const lowerRole = role.toLowerCase();
    return (lowerCaseRoleVariantMap[lowerRole] || 'outline') as "default" | "secondary" | "destructive" | "outline";
};

const ManageMembersDialog: React.FC<ManageMembersDialogProps> = ({ isOpen, onClose, project, onMembersChanged }) => {
  const { user } = useAuthContext();
  const [detailedMembers, setDetailedMembers] = useState<DetailedProjectMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        onMembersChanged();
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        console.error("Failed to invite member:", errorMessage);
        setError(errorMessage);
    } finally {
        setIsInviting(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: ProjectRoleEnum) => {
    try {
        await inviteOrUpdateMember(project.id, { user_id: userId, role: newRole });
        onMembersChanged();
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

  const currentUserRole = project.members.find(m => m.uid === user?.uid)?.project_role?.toLowerCase();
  const currentUserIsAdmin = currentUserRole === 'admin' || currentUserRole === 'owner';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
            <div className="flex items-center justify-between">
                <DialogTitle>Manage Members for {project.name}</DialogTitle>
                <Button variant="ghost" size="icon" onClick={onMembersChanged}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>
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
            {detailedMembers.map((member) => {
              const memberRole = member.project_role?.toLowerCase();

              return (
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
                    {member.project_role && (
                      <Badge variant={getRoleVariant(member.project_role)}>
                        {member.project_role}
                      </Badge>
                    )}
                    {currentUserIsAdmin && memberRole !== 'owner' && (
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
                                          role.toLowerCase() !== memberRole && 
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
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageMembersDialog;
