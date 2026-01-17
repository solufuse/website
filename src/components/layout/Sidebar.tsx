import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import { User } from 'firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Conversation {
  id: string;
  name: string;
}

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onNewConversation: () => void;
  onConversationSelect: (id: string) => void;
  user: User;
  onSignOut: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onNewConversation,
  onConversationSelect,
  user,
  onSignOut
}) => {
  return (
    <div className="flex flex-col h-full w-64 bg-background border-r">
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Solufuse</h1>
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
      <div className="p-4 border-t">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                    <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || undefined} />
                        <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
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
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Sidebar;
