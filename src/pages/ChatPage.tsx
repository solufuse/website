
import React, { useState, useEffect, useRef, Suspense, lazy, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, Terminal, ChevronDown, FolderOpen, Upload, Plus, X, Clipboard, Link, ChevronsUpDown } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuthContext } from '@/context/authcontext';
import { useProjectContext } from '@/context/ProjectContext';
import { useChatContext } from '@/context/ChatContext';
import { useChatWSContext } from '@/context/ChatWSContext';
import { uploadFiles } from '@/api/files';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Message } from '@/types/types_chat';
import type { ProjectMember } from '@/types/types_projects';

const MarkdownRenderer = lazy(() => import('@/components/chat/MarkdownRenderer'));
const SettingsDialog = lazy(() => import('@/components/chat/SettingsDialog'));
const ProfileDialog = lazy(() => import('@/components/user/ProfileDialog'));
const FileExplorer = lazy(() => import('@/components/layout/FileExplorer'));

const StatusIndicator: React.FC<{ status: string; error: string | null; isLoading: boolean }> = ({ status, error, isLoading }) => {
    let bgColor = 'bg-gray-700';
    let text = `Status: ${status}`;
    if (error) { bgColor = 'bg-red-500'; text = `Error: ${error}`; }
    else if (isLoading) { bgColor = 'bg-yellow-500'; text = "Loading History..."; }
    else {
        switch (status) {
            case 'Connected': return null;
            case 'Connecting': bgColor = 'bg-yellow-500'; text = 'Connecting to live chat...'; break;
            case 'Disconnected': bgColor = 'bg-gray-500'; text = 'Disconnected'; break;
        }
    }
    return <div className={`w-full p-1 text-center text-white text-xs ${bgColor} transition-all duration-300`}>{text}</div>;
};

const ChatPage: React.FC = () => {
    const { user, loading: authLoading, loginWithGoogle, logout, updateUsername } = useAuthContext();
    const { currentProject, setCurrentProjectById } = useProjectContext();
    const { chats, isCreatingChat, createChat, deleteChat, loadChats: loadChatsForSidebar, setActiveChatId: setActiveChatId_classic } = useChatContext();
    const { messages, isStreaming, isLoading: isWsLoading, isLoadingMore, hasMoreHistory, connectionStatus, error: wsError, connect, disconnect, sendMessage: sendWsMessage, loadMoreHistory } = useChatWSContext();
    const { projectId, chatId, messageId } = useParams<{ projectId?: string; chatId?: string; messageId?: string; }>();
    const navigate = useNavigate();
    
    const [input, setInput] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [userScrolledUp, setUserScrolledUp] = useState(false);
    const [isFileExplorerOpen, setFileExplorerOpen] = useState(false);
    const [fileExplorerKey, setFileExplorerKey] = useState(Date.now());
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const scrollAreaRef = useRef<null | HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    
    const conversationsWithOwners = useMemo(() => {
        return chats.map(chat => ({
            id: chat.short_id,
            name: chat.title,
            owner: currentProject?.members.find(member => member.uid === chat.user_id)?.username || 'Unknown'
        }));
    }, [chats, currentProject]);

    const sortedMessages = useMemo(() => {
        return [...messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [messages]);

    const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    const handleScrollToMessage = (messageId: string) => {
        const messageElement = messageRefs.current.get(messageId);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('highlight');
            setTimeout(() => {
                messageElement.classList.remove('highlight');
            }, 2000);
        }
    };

    useEffect(() => {
        if (chatId && currentProject) {
            connect(currentProject.id, chatId);
        }
        return () => { if (chatId && currentProject) disconnect(); };
    }, [chatId, currentProject, connect, disconnect]);

    useEffect(() => {
        if (projectId) {
            setCurrentProjectById(projectId);
        } else {
            const lastProjectId = localStorage.getItem('lastProjectId');
            if(lastProjectId) setCurrentProjectById(lastProjectId);
        }
    }, [projectId, setCurrentProjectById]);

    useEffect(() => { if (currentProject) { loadChatsForSidebar(currentProject.id); } }, [currentProject, loadChatsForSidebar]);
    useEffect(() => { setActiveChatId_classic(chatId ?? null); }, [chatId, setActiveChatId_classic]);
    
    useEffect(() => {
        if (isStreaming || !userScrolledUp) {
            scrollToBottom('auto');
        }
    }, [sortedMessages, isStreaming, userScrolledUp]);
    
    useEffect(() => {
        const scrollViewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
        const handleScroll = () => {
            if (scrollViewport && !isStreaming) {
                const { scrollTop, scrollHeight, clientHeight } = scrollViewport;
                const isAtBottom = scrollHeight - scrollTop <= clientHeight + 1;
                setUserScrolledUp(!isAtBottom);
            }
        };
        scrollViewport?.addEventListener('scroll', handleScroll);
        return () => scrollViewport?.removeEventListener('scroll', handleScroll);
    }, [isStreaming]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    useEffect(() => {
        setTimeout(() => {
            if (messageId && messages.length > 0) {
                handleScrollToMessage(messageId);
            }
        }, 100);
    }, [messageId, sortedMessages]);
    
    const handleSend = async () => {
        if (!input.trim()) return;
        sendWsMessage(input);
        setInput('');
        setUserScrolledUp(false);
    };

    const handleNewConversation = async () => {
        const newChat = await createChat();
        if (newChat && currentProject) navigate(`/chats/${currentProject.id}/${newChat.short_id}`);
    };

    const handleConversationSelect = (id: string) => { if (currentProject) navigate(`/chats/${currentProject.id}/${id}`); };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
    const getMessageAuthor = (message: Message): ProjectMember | null => currentProject?.members.find(m => m.uid === message.user_id) || null;

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
        alert('Message copied to clipboard!');
    };

    const handleShare = (messageId?: string) => {
        if (currentProject && chatId) {
            let link = `${window.location.origin}/chats/${currentProject.id}/${chatId}`;
            if (messageId) {
                link += `/${messageId}`;
            }
            navigator.clipboard.writeText(link);
            alert('Link copied to clipboard!');
        }
    };

    const handlePaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file && currentProject) {
                    try {
                        await uploadFiles([file], { projectId: currentProject.id });
                        setFileExplorerKey(Date.now());
                        alert('Image uploaded successfully!');
                    } catch (error) {
                        console.error("Failed to upload image:", error);
                        alert("Sorry, we couldn't upload the image.");
                    }
                }
            }
        }
    };

    if (authLoading) return <div className="flex h-screen w-full items-center justify-center"><p>Loading...</p></div>;
    
    const loadingComponent = <div className="loading-overlay">Loading...</div>;

    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} conversations={conversationsWithOwners} activeConversationId={chatId ?? null} isCreatingChat={isCreatingChat} onNewConversation={handleNewConversation} onConversationSelect={handleConversationSelect} onDeleteConversation={deleteChat} />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header user={user} onToggleSettings={() => setIsSettingsOpen(true)} onOpenProfile={() => setIsProfileOpen(true)} onLogin={loginWithGoogle} onLogout={logout} currentProject={currentProject} />
                <StatusIndicator status={connectionStatus} error={wsError} isLoading={isWsLoading} />
                <div className="flex flex-1 overflow-hidden">
                    <div className="flex flex-1 flex-col min-w-0 relative">
                        <ScrollArea className="flex-1" ref={scrollAreaRef}>
                            <main className="p-4">
                                <TooltipProvider>
                                    <div className="max-w-4xl mx-auto">
                                        {!currentProject || !chatId ? (
                                            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]"><Bot size={72} /><p className="text-2xl mt-4">How can I help you today?</p><p className='mt-2'>Select a chat or start a new one.</p></div>
                                        ) : (
                                            <div className="space-y-6">
                                                {hasMoreHistory && (
                                                    <div className="text-center">
                                                        <Button onClick={loadMoreHistory} disabled={isLoadingMore} variant="outline" size="sm">
                                                            {isLoadingMore ? 'Loading...' : 'Load More Messages'}
                                                        </Button>
                                                    </div>
                                                )}
                                                {sortedMessages.map((message) => {
                                                    const isOwnMessage = message.role === 'user' && user?.uid === message.user_id;
                                                    const shareId = message.commit_hash || message.id;
                                                    const toolCode = message.tool_code ? `\`\`\`python\n${message.tool_code}\n\`\`\`` : '';
                                                    const toolOutput = message.tool_output ? `\`\`\`json\n${message.tool_output}\n\`\`\`` : '';

                                                    return (
                                                        <div key={message.id} ref={el => { if (el) messageRefs.current.set(shareId, el); else messageRefs.current.delete(shareId); }}>
                                                            {message.role === 'assistant' ? (
                                                                <div className="flex items-start gap-3">
                                                                    <Avatar><AvatarImage src="/logo.svg" alt="Solufuse" /><AvatarFallback>AI</AvatarFallback></Avatar>
                                                                    <div className="max-w-[85%] p-4 rounded-md bg-muted/50 dark:bg-slate-900/50 border border-border/70 flex-1">
                                                                        <p className="font-bold mb-2">Solufuse</p>
                                                                        {(message.id.startsWith('assistant-streaming') && !message.content && !message.tool_code && !message.tool_output) ? (
                                                                            <div className="bouncing-dots"><span></span><span></span><span></span></div>
                                                                        ) : (
                                                                            <Suspense fallback={loadingComponent}>
                                                                                <MarkdownRenderer content={message.content || ''} />
                                                                            </Suspense>
                                                                        )}
                                                                        {message.tool_code && (
                                                                            <Collapsible className="mt-4 bg-slate-950 rounded-lg">
                                                                                <CollapsibleTrigger asChild>
                                                                                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 cursor-pointer">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Terminal className="h-4 w-4" />
                                                                                            <span className="text-xs font-semibold">Tool Code</span>
                                                                                        </div>
                                                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                                                            <ChevronsUpDown className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </CollapsibleTrigger>
                                                                                <CollapsibleContent>
                                                                                    <Suspense fallback={loadingComponent}>
                                                                                        <div className="code-block p-4">
                                                                                            <MarkdownRenderer content={toolCode} />
                                                                                        </div>
                                                                                    </Suspense>
                                                                                </CollapsibleContent>
                                                                            </Collapsible>
                                                                        )}
                                                                        {message.tool_output && (
                                                                            <Collapsible className="mt-4 bg-slate-950 rounded-lg">
                                                                                <CollapsibleTrigger asChild>
                                                                                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 cursor-pointer">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Bot className="h-4 w-4" />
                                                                                            <span className="text-xs font-semibold">Tool Output</span>
                                                                                        </div>
                                                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                                                            <ChevronsUpDown className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </CollapsibleTrigger>
                                                                                <CollapsibleContent>
                                                                                    <Suspense fallback={loadingComponent}>
                                                                                        <div className="code-block p-4">
                                                                                            <MarkdownRenderer content={toolOutput} />
                                                                                        </div>
                                                                                    </Suspense>
                                                                                </CollapsibleContent>
                                                                            </Collapsible>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-start gap-3 justify-end">
                                                                    <div className={'max-w-[85%] p-3 rounded-lg bg-primary text-primary-foreground dark:bg-slate-700 dark:text-slate-50'}>
                                                                        <p className="font-bold mb-2">{isOwnMessage ? (user?.username || 'You') : (getMessageAuthor(message)?.username || getMessageAuthor(message)?.email || 'Unknown User')}</p>
                                                                        <Suspense fallback={loadingComponent}><MarkdownRenderer content={message.content} /></Suspense>
                                                                    </div>
                                                                    <Avatar>
                                                                        <AvatarImage src={isOwnMessage ? user?.photoURL ?? undefined : getMessageAuthor(message)?.avatar_url} alt={isOwnMessage ? user?.username ?? undefined : getMessageAuthor(message)?.username ?? undefined} />
                                                                        <AvatarFallback>{(isOwnMessage ? (user?.username?.charAt(0) || user?.displayName?.charAt(0)) : (getMessageAuthor(message)?.username?.charAt(0) || getMessageAuthor(message)?.email?.charAt(0))) || 'U'}</AvatarFallback>
                                                                    </Avatar>
                                                                </div>
                                                            )}
                                                            <div className={`flex items-center gap-1 mt-2 ${message.role === 'user' ? 'justify-end mr-12' : 'justify-start ml-12'}`}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(message.content)}>
                                                                            <Clipboard className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>Copy message</p></TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleShare(shareId)}>
                                                                            <Link className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>Copy message link</p></TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        )}
                                    </div>
                                </TooltipProvider>
                            </main>
                        </ScrollArea>
                        {userScrolledUp && (
                            <Button
                                size="icon"
                                className="absolute bottom-24 right-10 rounded-full"
                                onClick={() => {
                                    setUserScrolledUp(false);
                                    scrollToBottom('smooth');
                                }}
                            >
                                <ChevronDown className="h-5 w-5" />
                            </Button>
                        )}
                        <footer className="p-4">
                            <div className="max-w-4xl mx-auto">
                               <div className="relative mb-2">
                                    <div className="flex justify-center">
                                        <TooltipProvider>
                                            <div className="relative">
                                                {isMenuOpen && (
                                                    <div className="absolute bottom-full mb-2 w-48 bg-background border rounded-lg shadow-lg z-10">
                                                        <Button onClick={() => { fileInputRef.current?.click(); setIsMenuOpen(false); }} disabled={!currentProject} variant="ghost" className="w-full justify-start"><Upload className="h-4 w-4 mr-2" />Upload File</Button>
                                                        <Button onClick={() => { setFileExplorerOpen(true); setIsMenuOpen(false); }} disabled={!currentProject} variant="ghost" className="w-full justify-start"><FolderOpen className="h-4 w-4 mr-2" />Browse Files</Button>
                                                    </div>
                                                )}
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button onClick={() => setIsMenuOpen(!isMenuOpen)} variant="outline" size="icon" className="rounded-full">
                                                            {isMenuOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>{isMenuOpen ? 'Close Menu' : 'Open Menu'}</p></TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TooltipProvider>
                                    </div>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={async (event: React.ChangeEvent<HTMLInputElement>) => {
                                    const files = event.target.files;
                                    if (files && files.length > 0 && currentProject) {
                                        try {
                                            await uploadFiles(Array.from(files), { projectId: currentProject.id });
                                            setFileExplorerKey(Date.now());
                                            alert('Files uploaded successfully!');
                                        } catch (error) {
                                            console.error("Failed to upload files:", error);
                                            alert("Sorry, we couldn't upload the files.");
                                        }
                                    }
                                }} multiple className="hidden" />
                                <div className="relative flex w-full items-end space-x-2 p-2 rounded-lg bg-muted">
                                    <Textarea ref={textareaRef} id="message" placeholder="Type your message..." className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none resize-none overflow-y-auto max-h-48 text-base leading-6 pr-12" autoComplete="off" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} onPaste={handlePaste} disabled={!currentProject || isWsLoading || connectionStatus !== 'Connected'} rows={1} />
                                    <Button type="submit" size="icon" onClick={handleSend} disabled={!input.trim() || isWsLoading || connectionStatus !== 'Connected'} className="rounded-full absolute bottom-4 right-4">
                                        <Send className={isSidebarOpen ? "h-4 w-4" : "h-5 w-5"} /><span className="sr-only">Send</span>
                                    </Button>
                                </div>
                            </div>
                        </footer>
                    </div>
                     <Suspense fallback={loadingComponent}>
                        {currentProject && isFileExplorerOpen &&
                            <FileExplorer
                                refreshTrigger={fileExplorerKey}
                                isOpen={isFileExplorerOpen}
                                onClose={() => setFileExplorerOpen(false)}
                                projectId={currentProject.id}
                                currentProject={currentProject}
                            />
                        }
                    </Suspense>
                </div>
            </div>
            <Suspense fallback={loadingComponent}>
                {isSettingsOpen && <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
                 {user && isProfileOpen && <ProfileDialog isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onSave={updateUsername} currentUsername={user.username} />}
            </Suspense>
        </div>
    );
};

export default ChatPage;
