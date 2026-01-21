
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, FolderOpen, Upload, Clipboard, Link, XCircle } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import SettingsDialog from '@/components/chat/SettingsDialog';
import FileExplorer from '@/components/layout/FileExplorer';
import { useAuthContext } from '@/context/authcontext';
import { useProjectContext } from '@/context/ProjectContext'; // <-- IMPORT PROJECT CONTEXT
import { createChat, getChats, postMessage, deleteChat, cancelGeneration } from '@/api/chat';
import { uploadFiles } from '@/api/files';
import { getApiKey } from '@/utils/apiKeyManager';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Chat, Message } from '@/types/types_chat';
import type { ProjectMember } from '@/types/types_projects';

const ChatPage: React.FC = () => {
    const { user, loading: authLoading, loginWithGoogle, logout } = useAuthContext();
    const { 
        currentProject, 
        setCurrentProjectById 
    } = useProjectContext(); // <-- USE PROJECT CONTEXT

    const { projectId, chatId } = useParams<{ projectId?: string, chatId?: string }>();
    const navigate = useNavigate();

    const [input, setInput] = useState('');
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFileExplorerOpen, setFileExplorerOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [fileExplorerKey, setFileExplorerKey] = useState(Date.now());

    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [input]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }

    useEffect(() => {
        if (projectId) {
            setCurrentProjectById(projectId);
        } else {
            const lastProjectId = localStorage.getItem('lastProjectId');
            if(lastProjectId) setCurrentProjectById(lastProjectId);
        }
    }, [projectId, setCurrentProjectById]);

    useEffect(() => {
        setActiveChatId(chatId ?? null);
    }, [chatId]);

    useLayoutEffect(() => {
        setTimeout(() => {
            scrollToBottom();
        }, 0);
    }, [chats, activeChatId]);

    useEffect(() => {
        if (currentProject) {
            getChats(currentProject.id).then(setChats);
        } else {
            setChats([]);
        }
    }, [currentProject]);

    const handleNewConversation = async () => {
        if (!user) { loginWithGoogle(); return; }
        if (!currentProject) { alert("Please select a project first."); return; }
        const apiKey = getApiKey();
        if (!apiKey) { alert('Please add your API key in settings.'); setIsSettingsOpen(true); return; }

        setIsCreatingChat(true);
        try {
            const newChat = await createChat(currentProject.id, { title: "New Chat", api_key: apiKey });
            setChats(prev => [...prev, newChat]);
            navigate(`/chats/${currentProject.id}/${newChat.short_id}`);
        } catch (error) {
            console.error("Failed to create chat:", error);
            alert("Sorry, we couldn't create a new chat.");
        } finally {
            setIsCreatingChat(false);
        }
    };

    const handleConversationSelect = (id: string) => {
        if (currentProject) {
            navigate(`/chats/${currentProject.id}/${id}`);
        }
    };

    const handleDeleteConversation = async (id: string) => {
        const apiKey = getApiKey();
        if (!apiKey) { alert('Please add your API key in settings.'); setIsSettingsOpen(true); return; }
        
        try {
            await deleteChat(id);
            setChats(prev => prev.filter(chat => chat.short_id !== id));
            if (activeChatId === id) {
                navigate(currentProject ? `/chats/${currentProject.id}` : '/');
            }
        } catch (error) {
            console.error("Failed to delete chat:", error);
            alert("Sorry, we couldn't delete this chat.");
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !currentProject) return;
        const apiKey = getApiKey();
        if (!apiKey) { alert('Please add your API key in settings.'); setIsSettingsOpen(true); return; }

        let currentChatId = activeChatId;
        if (!currentChatId) {
            setIsLoading(true);
            try {
                const newChat = await createChat(currentProject.id, { title: input.substring(0, 20) || "New Chat", api_key: apiKey });
                setChats(prev => [...prev, newChat]);
                navigate(`/chats/${currentProject.id}/${newChat.short_id}`, { replace: true });
                currentChatId = newChat.short_id;
            } catch (error) {
                console.error("Failed to create chat:", error);
                alert("Sorry, we couldn't create a new chat.");
                setIsLoading(false);
                return;
            }
        }

        if (!currentChatId) return;

        const userInput = input;
        const tempMessageId = `temp-${Date.now()}`;
        const newMessage: Message = { 
            id: tempMessageId, 
            content: userInput, 
            role: 'user', 
            timestamp: new Date().toISOString(),
            user_id: user?.uid
        };
        setChats(prev => prev.map(chat => chat.short_id === currentChatId ? { ...chat, messages: [...chat.messages, newMessage] } : chat));
        setInput('');
        setIsLoading(true);

        try {
            await postMessage(currentChatId, { content: userInput, api_key: apiKey });
            const updatedChats = await getChats(currentProject.id);
            setChats(updatedChats);
        } catch (error) {
            console.error("Failed to send message:", error);
            const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred.';
            const errorId = `error-${Date.now()}`;
            const errorMessage: Message = { id: errorId, content: `Error: ${errorMsg}`, role: 'assistant', timestamp: new Date().toISOString() };
            setChats(prev => prev.map(chat => chat.short_id === currentChatId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat));
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelGeneration = async () => {
        if (activeChatId) {
            try {
                await cancelGeneration(activeChatId);
                alert('Cancellation requested. The AI will stop generating a response shortly.');
            } catch (error) {
                console.error("Failed to cancel generation:", error);
                alert("Sorry, we couldn't cancel the generation.");
            }
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
        const isFormula = content.startsWith('$') && content.endsWith('$');
        const textToCopy = isFormula ? `**${content}**` : content;
        navigator.clipboard.writeText(textToCopy);
    };
    
    const handleShare = () => {
        if (currentProject && activeChatId) {
            const link = `${window.location.origin}/chats/${currentProject.id}/${activeChatId}`;
            navigator.clipboard.writeText(link);
            alert('Chat link copied to clipboard!');
        }
    };

    if (authLoading) {
        return <div className="flex h-screen w-full items-center justify-center"><p>Loading...</p></div>;
    }

    const activeChat = chats.find(c => c.short_id === activeChatId);
    const messages = activeChat ? activeChat.messages : [];

    const getMessageAuthor = (message: Message): ProjectMember | null => {
        if (message.role !== 'user' || !message.user_id) return null;
        return currentProject?.members.find(m => m.uid === message.user_id) || null;
    }

    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                conversations={chats.map(c => ({ id: c.short_id, name: c.title }))}
                activeConversationId={activeChatId}
                isCreatingChat={isCreatingChat}
                onNewConversation={handleNewConversation}
                onConversationSelect={handleConversationSelect}
                onDeleteConversation={handleDeleteConversation}
            />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Header
                    user={user}
                    onToggleSettings={() => setIsSettingsOpen(true)}
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
                                    {!currentProject ? (
                                        <div className="flex flex-col items-center justify-center">
                                            <Bot size={72} /><p className="text-2xl mt-4">Welcome to Solufuse</p><p className='mt-2'>Please select a project to start.</p>
                                        </div>
                                    ) : !activeChatId ? (
                                        <div className="flex flex-col items-center justify-center">
                                            <Bot size={72} /><p className="text-2xl mt-4">How can I help you today?</p><p className='mt-2'>Type your message below to start a new chat.</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col">
                                            <div className="space-y-6">
                                                {messages.map((message) => {
                                                    const author = getMessageAuthor(message);
                                                    const displayName = author?.username || (message.role === 'user' ? 'You' : 'Solufuse');
                                                    const avatarUrl = author?.avatar_url || (message.role === 'user' && user ? user.photoURL : undefined);
                                                    const avatarFallback = displayName?.charAt(0).toUpperCase() || 'U';

                                                    return (
                                                        <div key={message.id}>
                                                            <div className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                                                {message.role === 'assistant' && <Avatar><AvatarImage src="/logo.svg" alt="Solufuse" /><AvatarFallback>AI</AvatarFallback></Avatar>}
                                                                <div className={`max-w-[85%] ${message.role === 'user' ? 'p-3 rounded-lg bg-primary text-primary-foreground dark:bg-slate-700 dark:text-slate-50' : 'p-4 rounded-md bg-muted/50 dark:bg-slate-900/50 border border-border/70'}`}>
                                                                    <p className="font-bold mb-2">{displayName}</p>
                                                                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{message.content}</ReactMarkdown>
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
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleShare}>
                                                                            <Link className="h-4 w-4" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>Copy chat link</p></TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                                                    <div className="flex items-center justify-start gap-3 mt-4 ml-12">
                                                        <div className="flex items-start gap-3">
                                                            <Avatar><AvatarImage src="/logo.svg" alt="Solufuse" /><AvatarFallback>Solufuse</AvatarFallback></Avatar>
                                                            <div className="p-3 rounded-lg bg-muted/50 dark:bg-slate-900/50 border border-border/70">
                                                                <p className="font-bold">Solufuse</p>
                                                                <div className="bouncing-dots"><span></span><span></span><span></span></div>
                                                            </div>
                                                        </div>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancelGeneration}>
                                                                    <XCircle className="h-5 w-5 text-red-500" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Cancel generation</p></TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                )}
                                                <div ref={messagesEndRef} />
                                            </div>
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
                                    <Button onClick={() => setFileExplorerOpen(!isFileExplorerOpen)} disabled={!currentProject} variant="outline"><FolderOpen className="h-4 w-4 mr-2" />Browse Files</Button>
                                </div>
                                <div className="relative flex w-full items-end space-x-2 p-2 rounded-lg bg-muted">
                                    <Textarea
                                        ref={textareaRef}
                                        id="message"
                                        placeholder={currentProject ? "Type your message... (Shift+Enter for new line)" : "Please select a project first"}
                                        className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none resize-none overflow-y-auto max-h-48 text-base leading-6 pr-12"
                                        autoComplete="off"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        disabled={!currentProject || isLoading}
                                        rows={1}
                                    />
                                    <Button type="submit" size="icon" onClick={handleSend} disabled={!input.trim() || !currentProject || isLoading} className="rounded-full absolute bottom-4 right-4">
                                        <Send className={isSidebarOpen ? "h-4 w-4" : "h-5 w-5"} /><span className="sr-only">Send</span>
                                    </Button>
                                </div>
                            </div>
                        </footer>
                    </div>
                    {currentProject && 
                        <FileExplorer 
                            refreshTrigger={fileExplorerKey}
                            isOpen={isFileExplorerOpen} 
                            onClose={() => setFileExplorerOpen(false)} 
                            projectId={currentProject.id} 
                            currentProject={currentProject}
                        />
                    }
                </div>
            </div>
            <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
};

export default ChatPage;
