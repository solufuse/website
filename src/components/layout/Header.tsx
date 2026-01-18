import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AuthenticatedUser } from '@/context/authcontext'; // Import the new user type
import ModelSelector from '@/components/chat/ModelSelector';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getAuthToken } from '@/api/getAuthToken';
import { useProjectContext } from '@/context/ProjectContext';

interface HeaderProps {
    user: AuthenticatedUser | null;
    model: string;
    onModelChange: (model: string) => void;
    onToggleSettings: () => void;
    onLogin: () => void; // Add a prop for the login action
    onLogout: () => void; // Add a prop for the logout action
}

const Header: React.FC<HeaderProps> = ({ user, model, onModelChange, onToggleSettings, onLogin, onLogout }) => {
    const { currentProject } = useProjectContext();

    const handleGetToken = async () => {
        try {
            const token = await getAuthToken();
            await navigator.clipboard.writeText(token);
            alert("JWT Token copied to clipboard!");
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
            console.log("No project selected.");
            alert("No project selected.");
        }
    };

    return (
        <header className="flex items-center justify-between p-4 border-b">
            <ModelSelector model={model} onModelChange={onModelChange} />
            {user ? (
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
                        <DropdownMenuItem onClick={onToggleSettings}>Settings</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleGetToken}>Get JWT Token</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleGetCurrentProjectId}>Get Project ID</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {/* Use the onLogout prop for the sign out action */}
                        <DropdownMenuItem onClick={onLogout}>Sign out</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                // Use the onLogin prop for the sign in action
                <Button onClick={onLogin}>
                    Sign in with Google
                </Button>
            )}
        </header>
    );
}

export default Header;
