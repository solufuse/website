
import React, { useState, useEffect, useRef, Suspense, lazy, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, XCircle, AlertTriangle } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useAuthContext } from '@/context/authcontext';
import { useProjectContext } from '@/context/ProjectContext';
import { useChatContext } from '@/context/ChatContext';
import { useChatWSContext } from '@/context/ChatWSContext';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Message } from '@/types/types_chat';
import type { ProjectMember } from '@/types/types_projects';

// Lazy load components
const MarkdownRenderer = lazy(() => import('@/components/chat/MarkdownRenderer'));
const SettingsDialog = lazy(() => import('@/components/chat/SettingsDialog'));
const ProfileDialog = lazy(() => import('@/components/user/ProfileDialog'));

const ChatPageWS: React.FC = () => {
    // --- CONTEXTS & HOOKS ---
    const { user, loading: authLoading, loginWithGoogle, logout, updateUsername } = useAuthContext();
    const { currentProject, setCurrentProjectById } = useProjectContext();
    const { chats, isCreatingChat, createChat, deleteChat, loadChats: loadChatsForSidebar, setActiveChatId: setActiveChatId_classic } = useChatContext();
    const { messages, isStreaming, isLoading: isWsLoading, connectionStatus, error: wsError, connect, disconnect, sendMessage: sendWsMessage } = useChatWSContext();
    const { projectId, chatId } = useParams<{ projectId?: string; chatId?: string; }>();
    const navigate = useNavigate();
    
    // --- MEMOIZATION (Must be before any conditional returns) ---
    const conversationsWithOwners = useMemo(() => {
        return chats.map(chat => ({
            id: chat.short_id,
            name: chat.title,
            owner: currentProject?.members.find(member => member.uid === chat.user_id)?.username || 'Unknown'
        }));
    }, [chats, currentProject]);

    // --- LOCAL STATE ---
    const [input, setInput] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // --- REFS ---
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    // --- EFFECTS ---
    // Connect WebSocket when chat ID changes
    useEffect(() => {
        if (chatId && currentProject) {
            connect(currentProject.id, chatId);
        }
        return () => {
            if (chatId && currentProject) {
                disconnect();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chatId, currentProject]);

    // Set project from URL
    useEffect(() => {
        if (projectId) {
            setCurrentProjectById(projectId);
        } else {
            const lastProjectId = localStorage.getItem('lastProjectId');
            if(lastProjectId) setCurrentProjectById(lastProjectId);
        }
    }, [projectId, setCurrentProjectById]);

    // Load sidebar chats when project changes
    useEffect(() => {
        if (currentProject) {
            loadChatsForSidebar(currentProject.id);
        }
    }, [currentProject, loadChatsForSidebar]);
    
    // Set active chat from URL
    useEffect(() => {
        setActiveChatId_classic(chatId ?? null);
    }, [chatId, setActiveChatId_classic]);

    // Scroll to bottom on new message or stream chunk
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStreaming]);

    // Adjust textarea height
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [input]);
    
    // --- HANDLERS ---
    const handleSend = async () => {
        if (!input.trim()) return;
        sendWsMessage(input);
        setInput('');
    };

    const handleNewConversation = async () => {
        const newChat = await createChat();
        if (newChat && currentProject) {
            navigate(`/chats-ws/${currentProject.id}/${newChat.short_id}`);
        }
    };

    const handleConversationSelect = (id: string) => {
        if (currentProject) {
            navigate(`/chats-ws/${currentProject.id}/${id}`);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    const getMessageAuthor = (message: Message): ProjectMember | null => {
        if (message.role !== 'user' || !message.user_id) return null;
        return currentProject?.members.find(m => m.uid === message.user_id) || null;
    }

    // --- RENDER LOGIC ---
    if (authLoading) {
        return <div className="flex h-screen w-full items-center justify-center"><p>Loading...</p></div>;
    }
    
    const loadingComponent = <div className="loading-overlay">Loading...</div>;

    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                conversations={conversationsWithOwners}
                activeConversationId={chatId ?? null}
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
                        <ScrollArea className="flex-1">
                            <main className="p-4">
                            <TooltipProvider>
                                <div className="max-w-4xl mx-auto">
                                    {wsError && (
                                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
                                            <p className="font-bold flex items-center"><AlertTriangle className="h-5 w-5 mr-2"/>Error</p>
                                            <p>{wsError}</p>
                                        </div>
                                    )}
                                    {!currentProject ? (
                                         <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]"><Bot size={72} /><p className="text-2xl mt-4">Welcome to Solufuse (WS)</p><p className='mt-2'>Please select or create a project.</p></div>
                                    ) : !chatId ? (
                                        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]"><Bot size={72} /><p className="text-2xl mt-4">How can I help you today?</p><p className='mt-2'>Select a chat or start a new one.</p></div>
                                    ) : (
                                        <div className="space-y-6">
                                            {messages.map((message) => {
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
                                                    <div key={message.id}>
                                                        <div className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                                          {message.role === 'assistant' && <Avatar><AvatarImage src={avatarUrl} alt={displayName} /><AvatarFallback>{avatarFallback}</AvatarFallback></Avatar>}
                                                            <div className={`max-w-[85%] ${message.role === 'user' ? 'p-3 rounded-lg bg-primary text-primary-foreground dark:bg-slate-700 dark:text-slate-50' : 'p-4 rounded-md bg-muted/50 dark:bg-slate-900/50 border border-border/70'}`}>
                                                                <p className="font-bold mb-2">{displayName}</p>
                                                                <Suspense fallback={loadingComponent}>
                                                                    <MarkdownRenderer content={message.content} />
                                                                </Suspense>
                                                            </div>
                                                          {message.role === 'user' && <Avatar><AvatarImage src={avatarUrl ?? undefined} alt={displayName ?? undefined} /><AvatarFallback>{avatarFallback}</AvatarFallback></Avatar>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {(isWsLoading || isStreaming) && (
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
                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={disconnect}>
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
                                <div className="relative flex w-full items-end space-x-2 p-2 rounded-lg bg-muted">
                                    <Textarea
                                        ref={textareaRef}
                                        id="message"
                                        placeholder={!currentProject ? "Please select a project to start." : !chatId ? "Type a message to start a new chat..." : "Type your message..."}
                                        className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none resize-none overflow-y-auto max-h-48 text-base leading-6 pr-12"
                                        autoComplete="off"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        disabled={!currentProject || isWsLoading || isStreaming || connectionStatus !== 'Connected'}
                                        rows={1}
                                    />
                                    <Button type="submit" size="icon" onClick={handleSend} disabled={!input.trim() || isWsLoading || isStreaming || connectionStatus !== 'Connected'} className="rounded-full absolute bottom-4 right-4">
                                        <Send className={isSidebarOpen ? "h-4 w-4" : "h-5 w-5"} /><span className="sr-only">Send</span>
                                    </Button>
                                </div>
                            </div>
                        </footer>
                    </div>
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

export default ChatPageWS;
