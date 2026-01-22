
import React, { useState } from 'react';
import { ResizableBox, ResizableBoxProps } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { useChatContext } from '@/context/ChatContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface MessageNavigatorProps {
    isOpen: boolean;
    onClose: () => void;
    className?: string;
}

const MessageNavigator: React.FC<MessageNavigatorProps> = ({ isOpen, onClose, className }) => {
    const { activeChat } = useChatContext();
    const [width, setWidth] = useState(() => {
        if (typeof window === 'undefined') return 250;
        const savedWidth = localStorage.getItem('messageNavigatorWidth');
        return savedWidth ? parseInt(savedWidth, 10) : 250;
    });

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
            minConstraints={[200, Infinity]}
            maxConstraints={[800, Infinity]}
            onResizeStop={onResizeStop}
            handle={<div className="absolute top-0 -left-1 w-2 h-full cursor-col-resize group z-10"><div className="w-full h-full bg-transparent group-hover:bg-primary/20 transition-colors duration-200"></div></div>}
            className={`relative flex flex-col h-full bg-background border-l ${className}`}
        >
            <div className="flex justify-between items-center p-2 border-b">
                <h3 className="font-semibold">Messages</h3>
                <Button variant="ghost" size="icon" onClick={onClose} title="Close Panel">
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2">
                    {activeChat?.messages?.map((msg) => (
                        <div key={msg.id} className="p-2 my-1 rounded-md hover:bg-muted cursor-pointer">
                            <p className="text-sm font-medium truncate">{msg.role === 'user' ? 'You' : 'AI'}</p>
                            <p className="text-xs text-muted-foreground truncate">{msg.content}</p>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </ResizableBox>
    );
};

export default MessageNavigator;
