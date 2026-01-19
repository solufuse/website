
import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthenticatedUser } from '@/context/authcontext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getAuthToken } from '@/api/getAuthToken';
import { Settings } from 'lucide-react';
import type { ProjectDetail } from '@/types/types_projects';

interface HeaderProps {
    user: AuthenticatedUser | null;
    onToggleSettings: () => void;
    onLogin: () => void;
    onLogout: () => void;
    currentProject: ProjectDetail | null;
}

const Header: React.FC<HeaderProps> = ({ user, onToggleSettings, onLogin, onLogout, currentProject }) => {

    const handleGetToken = async () => {
        try {
            const token = await getAuthToken();
            if (token) {
                await navigator.clipboard.writeText(token);
                alert("JWT Token copied to clipboard!");
            } else {
                alert("Could not retrieve JWT token.");
            }
        } catch (error) {
            console.error("Error getting JWT token:", error);
            alert("Error getting JWT token. See console for details.");
        }
    };

    const handleGetCurrentProjectId = () => {
        if (currentProject) {
            navigator.clipboard.writeText(currentProject.id);
            alert("Project ID copied to clipboard!");
        } else {
            alert("No project selected.");
        }
    };

    return (
        <header className="flex items-center justify-between p-4 border-b">
            <div></div>
            <div className="flex items-center gap-4">
                {user ? (
                    <>
                        <Button variant="ghost" size="icon" onClick={onToggleSettings}>
                            <Settings className="h-5 w-5" />
                            <span className="sr-only">Settings</span>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || undefined} />
                                        <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Profile</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleGetToken}>Get JWT Token</DropdownMenuItem>
                                <DropdownMenuItem onClick={handleGetCurrentProjectId}>Get Project ID</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={onLogout}>Sign out</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                ) : (
                    <Button onClick={onLogin}>
                        Sign in with Google
                    </Button>
                )}
            </div>
        </header>
    );
}

export default Header;
