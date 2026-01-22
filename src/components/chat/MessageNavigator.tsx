
import React, { useState } from 'react';
import { ResizableBox, ResizableBoxProps } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { useChatContext } from '@/context/ChatContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, RefreshCw } from 'lucide-react';
import type { Message } from '@/types/types_chat';

interface MessageNavigatorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectMessage: (messageId: string) => void;
    onRefresh: () => void;
    className?: string;
}

const MessageNavigator: React.FC<MessageNavigatorProps> = ({ isOpen, onClose, onSelectMessage, onRefresh, className }) => {
    const { activeChat } = useChatContext();
    const [width, setWidth] = useState(() => {
        if (typeof window === 'undefined') return 250;
        const savedWidth = localStorage.getItem('messageNavigatorWidth');
        return savedWidth ? parseInt(savedWidth, 10) : 250;
    });

    const handleMessageClick = (message: Message) => {
        onSelectMessage(message.id);
        onClose();
    };

    const onResizeStop: ResizableBoxProps['onResizeStop'] = (_e, data) => {
        localStorage.setItem('messageNavigatorWidth', String(data.size.width));
        setWidth(data.size.width);
    };

    if (!isOpen) return null;

    return (
        <ResizableBox
            width={width}
            height={Infinity}
            axis="x"
            resizeHandles={['w']}
            minConstraints={[150, Infinity]} // Set a min width to avoid breaking the layout
            maxConstraints={[800, Infinity]}
            onResizeStop={onResizeStop}
            handle={<div className="absolute top-0 -left-1 w-2 h-full cursor-col-resize group z-10"><div className="w-full h-full bg-transparent group-hover:bg-primary/20 transition-colors duration-200"></div></div>}
            className={`relative flex flex-col h-full bg-background border-l ${className}`}
        >
            <div className="flex justify-between items-center p-2 border-b flex-nowrap overflow-hidden">
                <h3 className="font-semibold truncate pr-2">Messages</h3>
                <div className="flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={onRefresh} title="Refresh Messages">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onClose} title="Close Panel">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2">
                    {activeChat?.messages?.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer border-l-4 ${msg.role === 'user' ? 'border-blue-500' : 'border-green-500'}`}
                            onClick={() => handleMessageClick(msg)}
                        >
                            <p className={`text-sm font-medium truncate ${msg.role === 'user' ? 'text-blue-500' : 'text-green-500'}`}>{msg.role === 'user' ? 'You' : 'AI'}</p>
                            <p className="text-xs text-muted-foreground">
                                {msg.content.length > 30 ? `${msg.content.substring(0, 30)}...` : msg.content}
                            </p>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </ResizableBox>
    );
};

export default MessageNavigator;
