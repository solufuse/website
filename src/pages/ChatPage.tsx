
import React, { useState, useEffect, useLayoutEffect, useRef, Suspense, lazy, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, FolderOpen, Upload, Clipboard, Link, XCircle, AlertTriangle } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuthContext } from '@/context/authcontext';
import { useProjectContext } from '@/context/ProjectContext';
import { useChatContext } from '@/context/ChatContext';
import { uploadFiles } from '@/api/files';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Message } from '@/types/types_chat';
import type { ProjectMember } from '@/types/types_projects';

const SettingsDialog = lazy(() => import('@/components/chat/SettingsDialog'));
const ProfileDialog = lazy(() => import('@/components/user/ProfileDialog'));
const FileExplorer = lazy(() => import('@/components/layout/FileExplorer'));
const MarkdownRenderer = lazy(() => import('@/components/chat/MarkdownRenderer'));

const ChatPage: React.FC = () => {
    const { user, loading: authLoading, loginWithGoogle, logout, updateUsername } = useAuthContext();
    const { currentProject, setCurrentProjectById } = useProjectContext();
    const {
        chats,
        activeChat,
        activeChatId,
        isLoading,
        isCreatingChat,
        error,
        loadChats,
        createChat,
        deleteChat,
        sendMessage,
        cancelGeneration,
        setActiveChatId
    } = useChatContext();

    const { projectId, chatId, messageId } = useParams<{ projectId?: string; chatId?: string; messageId?: string }>();
    const navigate = useNavigate();

    const [input, setInput] = useState('');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isFileExplorerOpen, setFileExplorerOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [fileExplorerKey, setFileExplorerKey] = useState(Date.now());

    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());


    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [input]);

    useEffect(() => {
        if (projectId) {
            setCurrentProjectById(projectId);
        } else {
            const lastProjectId = localStorage.getItem('lastProjectId');
            if(lastProjectId) setCurrentProjectById(lastProjectId);
        }
    }, [projectId, setCurrentProjectById]);

    useEffect(() => {
        if (currentProject) {
            loadChats(currentProject.id);
        }
    }, [currentProject, loadChats]);

    useEffect(() => {
        setActiveChatId(chatId ?? null);
    }, [chatId, setActiveChatId]);

    useEffect(() => {
        if (messageId && messageRefs.current.has(messageId)) {
            const messageElement = messageRefs.current.get(messageId);
            if (messageElement) {
                setTimeout(() => {
                    messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    messageElement.classList.add('highlight');
                    setTimeout(() => {
                        messageElement.classList.remove('highlight');
                    }, 2000); // Highlight for 2 seconds
                }, 100);
            }
        }
    }, [messageId, activeChat]);


    const scrollToBottom = (behavior: "smooth" | "auto" = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    }

    useLayoutEffect(() => {
        if (messageId) return; 

        const scrollContainer = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
        if (!scrollContainer) return;

        const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 1;

        if (isAtBottom) {
            setTimeout(() => scrollToBottom('smooth'), 100);
        }
    }, [activeChat, isLoading, messageId]);

    const handleSend = async () => {
        if (!input.trim()) return;
        await sendMessage(input);
        setInput('');
    };

    const handleNewConversation = async () => {
        const newChat = await createChat();
        if (newChat && currentProject) {
            navigate(`/chats/${currentProject.id}/${newChat.short_id}`);
        }
    };

    const handleConversationSelect = (id: string) => {
        if (currentProject) {
            navigate(`/chats/${currentProject.id}/${id}`);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
    };

    const handleShare = (messageId?: string) => {
        if (currentProject && activeChatId) {
            let link = `${window.location.origin}/chats/${currentProject.id}/${activeChatId}`;
            if (messageId) {
                link += `/${messageId}`;
            }
            navigator.clipboard.writeText(link);
            alert('Link copied to clipboard!');
        }
    };

    const conversationsWithOwners = useMemo(() => {
        return chats.map(chat => {
            const owner = currentProject?.members.find(member => member.uid === chat.user_id);
            return {
                id: chat.short_id,
                name: chat.title,
                owner: owner?.username || (chat.user_id === user?.uid ? 'You' : 'Unknown')
            };
        });
    }, [chats, currentProject, user]);


    if (authLoading) {
        return <div className="flex h-screen w-full items-center justify-center"><p>Loading...</p></div>;
    }

    const messages = activeChat ? activeChat.messages : [];

    const getMessageAuthor = (message: Message): ProjectMember | null => {
        if (message.role !== 'user' || !message.user_id) return null;
        return currentProject?.members.find(m => m.uid === message.user_id) || null;
    }
    
    const loadingComponent = <div className="loading-overlay">Loading...</div>;

    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                conversations={conversationsWithOwners}
                activeConversationId={activeChatId}
                isCreatingChat={isCreatingChat}
                onNewConversation={handleNewConversation}
                onConversationSelect={handleConversationSelect}
                onDeleteConversation={deleteChat}
            />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header
                    user={user}
                    onToggleSettings={() => setIsSettingsOpen(true)}
                    onOpenProfile={() => setIsProfileOpen(true)} 
                    onLogin={loginWithGoogle}
                    onLogout={logout}
                    currentProject={currentProject}
                />
                <div className="flex flex-1 overflow-hidden">
                    <div className="flex flex-1 flex-col min-w-0">
                        <ScrollArea className="flex-1" ref={scrollAreaRef}>
                            <main className="p-4">
                            <TooltipProvider>
                                <div className="max-w-4xl mx-auto">
                                    {error && (
                                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                                            <p className="font-bold flex items-center"><AlertTriangle className="h-5 w-5 mr-2"/>Error</p>
                                            <p>{error}</p>
                                        </div>
                                    )}
                                    {!currentProject ? (
                                         <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                                            <Bot size={72} /><p className="text-2xl mt-4">Welcome to Solufuse</p><p className='mt-2'>Please select or create a project to begin.</p>
                                        </div>
                                    ) : !activeChatId ? (
                                        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                                            <Bot size={72} /><p className="text-2xl mt-4">How can I help you today?</p><p className='mt-2'>Select a chat or start a new one.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {messages.map((message) => {
                                                const shareId = message.commit_hash || message.id;

                                                let displayName: string;
                                                let avatarUrl: string | undefined;
                                                let avatarFallback: string;
                                                const isOwnMessage = message.role === 'user' && user?.uid === message.user_id;

                                                if (message.role === 'assistant') {
                                                    displayName = 'Solufuse';
                                                    avatarUrl = '/logo.svg';
                                                    avatarFallback = 'AI';
                                                } else if (isOwnMessage) {
                                                    displayName = user?.username || 'You';
                                                    avatarUrl = user?.photoURL ?? undefined;
                                                    avatarFallback = user?.username?.charAt(0).toUpperCase() || user?.displayName?.charAt(0).toUpperCase() || 'U';
                                                } else {
                                                    const author = getMessageAuthor(message);
                                                    displayName = author?.username || author?.email || 'Unknown User';
                                                    avatarUrl = author?.avatar_url;
                                                    avatarFallback = author?.username?.charAt(0).toUpperCase() || author?.email?.charAt(0).toUpperCase() || 'U';
                                                }

                                                return (
                                                    <div key={message.id} ref={el => {
                                                        if (el) {
                                                            messageRefs.current.set(message.id, el);
                                                        } else {
                                                            messageRefs.current.delete(message.id);
                                                        }
                                                    }}>
                                                        <div className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                                            {message.role === 'assistant' && <Avatar><AvatarImage src={avatarUrl} alt={displayName} /><AvatarFallback>{avatarFallback}</AvatarFallback></Avatar>}
                                                            <div className={`max-w-[85%] ${message.role === 'user' ? 'p-3 rounded-lg bg-primary text-primary-foreground dark:bg-slate-700 dark:text-slate-50' : 'p-4 rounded-md bg-muted/50 dark:bg-slate-900/50 border border-border/70'}`}>
                                                                <p className="font-bold mb-2">{displayName}</p>
                                                                <Suspense fallback={loadingComponent}>
                                                                    <MarkdownRenderer content={message.content} />
                                                                </Suspense>
                                                            </div>
                                                            {message.role === 'user' && (
                                                                <Avatar>
                                                                    <AvatarImage src={avatarUrl ?? undefined} alt={displayName ?? undefined} />
                                                                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                                                                </Avatar>
                                                            )}
                                                        </div>
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
                                            {isLoading && (
                                                <div className="flex items-center justify-start gap-3 mt-4 ml-12">
                                                    <div className="flex items-start gap-3">
                                                        <Avatar><AvatarImage src="/logo.svg" alt="Solufuse" /><AvatarFallback>AI</AvatarFallback></Avatar>
                                                        <div className="p-3 rounded-lg bg-muted/50 dark:bg-slate-900/50 border border-border/70">
                                                            <p className="font-bold">Solufuse</p>
                                                            <div className="bouncing-dots"><span></span><span></span><span></span></div>
                                                        </div>
                                                    </div>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelGeneration}>
                                                                <XCircle className="h-5 w-5 text-red-500" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent><p>Cancel generation</p></TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    )}
                                </div>
                                </TooltipProvider>
                            </main>
                        </ScrollArea>
                        <footer className="p-4">
                            <div className="max-w-4xl mx-auto">
                                <div className="flex justify-center mb-2 space-x-2">
                                    <Button onClick={() => fileInputRef.current?.click()} disabled={!currentProject} variant="outline"><Upload className="h-4 w-4 mr-2" />Upload File</Button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
                                    <Button onClick={() => setFileExplorerOpen(true)} disabled={!currentProject} variant="outline"><FolderOpen className="h-4 w-4 mr-2" />Browse Files</Button>
                                </div>
                                <div className="relative flex w-full items-end space-x-2 p-2 rounded-lg bg-muted">
                                    <Textarea
                                        ref={textareaRef}
                                        id="message"
                                        placeholder={!currentProject ? "Please select a project to start." : !activeChatId ? "Type a message to start a new chat..." : "Type your message..."}
                                        className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none resize-none overflow-y-auto max-h-48 text-base leading-6 pr-12"
                                        autoComplete="off"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        disabled={!currentProject || isLoading}
                                        rows={1}
                                    />
                                    <Button type="submit" size="icon" onClick={handleSend} disabled={!input.trim() || isLoading} className="rounded-full absolute bottom-4 right-4">
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
                 {user && isProfileOpen && (
                    <ProfileDialog
                        isOpen={isProfileOpen}
                        onClose={() => setIsProfileOpen(false)}
                        onSave={updateUsername}
                        currentUsername={user.username}
                    />
                )}
            </Suspense>
        </div>
    );
};

export default ChatPage;
