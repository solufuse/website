import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from 'firebase/auth';
import ModelSelector from '@/components/chat/ModelSelector';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { signInWithGoogle, signOutFromGoogle } from '@/modules/auth';

interface HeaderProps {
    user: User | null;
    model: string;
    onModelChange: (model: string) => void;
    onToggleSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, model, onModelChange, onToggleSettings }) => {
    return (
        <header className="flex items-center justify-between p-4 border-b">
            <ModelSelector model={model} onModelChange={onModelChange} />
            {user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start">
                            <Avatar className="h-8 w-8 mr-2">
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={signOutFromGoogle}>Sign out</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                    <Button onClick={signInWithGoogle} className="w-full">
                    Sign in with Google
                </Button>
            )}
        </header>
    );
}

export default Header;
