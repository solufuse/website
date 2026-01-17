import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';

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
    </div>
  );
};

export default Sidebar;
