
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, FolderOpen, Upload } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import SettingsDialog from '@/components/chat/SettingsDialog';
import FileExplorer from '@/components/layout/FileExplorer';
import { useAuthContext } from '@/context/authcontext';
import { createChat, getChats, postMessage, deleteChat } from '@/api/chat';
import { listProjects, getProjectDetails } from '@/api/projects';
import { uploadFiles } from '@/api/files';
import { getApiKey } from '@/utils/apiKeyManager';
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Chat, Message } from '@/types/types_chat';
import type { ProjectListDetail, ProjectDetail } from '@/types/types_projects';

const ChatPage: React.FC = () => {
    const { user, loading: authLoading, loginWithGoogle, logout } = useAuthContext();
    const { chatId } = useParams<{ chatId?: string }>();
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
    
    const [projects, setProjects] = useState<ProjectListDetail[]>([]);
    const [currentProject, setCurrentProject] = useState<ProjectDetail | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        setActiveChatId(chatId ?? null);
    }, [chatId]);

    useEffect(() => {
        scrollToBottom()
    }, [chats, activeChatId]);

    useEffect(() => {
        if (user) {
            listProjects().then(response => setProjects(response.projects));
        }
    }, [user]);

    useEffect(() => {
        if (user && selectedProjectId) {
            getProjectDetails(selectedProjectId).then(setCurrentProject);
            getChats(selectedProjectId).then(setChats);
        } else {
            setCurrentProject(null);
            setChats([]);
        }
    }, [user, selectedProjectId]);

    const handleNewConversation = async () => {
        if (!user) { loginWithGoogle(); return; }
        if (!selectedProjectId) { alert("Please select a project first."); return; }
        const apiKey = getApiKey();
        if (!apiKey) { alert('Please add your API key in settings.'); setIsSettingsOpen(true); return; }

        setIsCreatingChat(true);
        try {
            const newChat = await createChat(selectedProjectId, { title: "New Chat", api_key: apiKey });
            setChats(prev => [...prev, newChat]);
            navigate(`/chats/${newChat.short_id}`);
        } catch (error) {
            console.error("Failed to create chat:", error);
            alert("Sorry, we couldn't create a new chat.");
        } finally {
            setIsCreatingChat(false);
        }
    };

    const handleConversationSelect = (id: string) => {
        navigate(`/chats/${id}`);
    };

    const handleDeleteConversation = async (id: string) => {
        const apiKey = getApiKey();
        if (!apiKey) { alert('Please add your API key in settings.'); setIsSettingsOpen(true); return; }
        
        try {
            await deleteChat(id);
            setChats(prev => prev.filter(chat => chat.short_id !== id));
            if (activeChatId === id) {
                navigate('/');
            }
        } catch (error) {
            console.error("Failed to delete chat:", error);
            alert("Sorry, we couldn't delete this chat.");
        }
    };

    const handleProjectSelect = (projectId: string) => {
        setSelectedProjectId(projectId);
        navigate('/');
    }

    const handleSend = async () => {
        if (!input.trim() || !selectedProjectId) return;

        let currentChatId = activeChatId;

        // If there's no active chat, create one first.
        if (!currentChatId) {
            const apiKey = getApiKey();
            if (!apiKey) { alert('Please add your API key in settings.'); setIsSettingsOpen(true); return; }
            
            setIsLoading(true);
            try {
                const newChat = await createChat(selectedProjectId, { title: "New Chat", api_key: apiKey });
                setChats(prev => [...prev, newChat]);
                navigate(`/chats/${newChat.short_id}`, { replace: true });
                currentChatId = newChat.short_id;
            } catch (error) {
                console.error("Failed to create chat:", error);
                alert("Sorry, we couldn't create a new chat.");
                setIsLoading(false);
                return;
            }
        }

        if (!currentChatId) return; // Safeguard

        const userInput = input;
        const newMessage: Message = { content: userInput, role: 'user' };

        // Optimistic UI update with user message
        setChats(prev => prev.map(chat => 
            chat.short_id === currentChatId ? { ...chat, messages: [...chat.messages, newMessage] } : chat
        ));
        setInput('');
        setIsLoading(true);

        try {
            // Post the message and then refetch all chats for consistency
            await postMessage(currentChatId, { content: userInput, role: 'user' });
            const updatedChats = await getChats(selectedProjectId);
            setChats(updatedChats);
        } catch (error) {
            console.error("Failed to send message:", error);
            const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred.';
            const errorMessage: Message = { content: `Error: ${errorMsg}`, role: 'assistant' };
            setChats(prev => prev.map(chat => 
                chat.short_id === currentChatId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat
            ));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0 && selectedProjectId) {
            try {
                await uploadFiles(Array.from(files), { projectId: selectedProjectId });
                setFileExplorerKey(Date.now()); // Force re-render
                alert('Files uploaded successfully!');
            } catch (error) {
                console.error("Failed to upload files:", error);
                alert("Sorry, we couldn't upload the files.");
            }
        }
    };


    if (authLoading) {
        return <div className="flex h-screen w-full items-center justify-center"><p>Loading...</p></div>;
    }

    const activeChat = chats.find(c => c.short_id === activeChatId);
    const messages = activeChat ? activeChat.messages : [];

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
                projects={projects}
                currentProject={currentProject}
                onProjectSelect={handleProjectSelect}
            />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header
                    user={user}
                    onToggleSettings={() => setIsSettingsOpen(true)}
                    onLogin={loginWithGoogle}
                    onLogout={logout}
                    currentProject={currentProject}
                />
                <div className="flex flex-1 overflow-hidden">
                    <div className="flex flex-col flex-1">
                        <ScrollArea className="flex-1">
                            <main className="p-4">
                                <div className="max-w-4xl mx-auto h-full">
                                    {!currentProject ? (
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <Bot size={72} /><p className="text-2xl mt-4">Welcome to Solufuse</p><p className='mt-2'>Please select a project to start.</p>
                                        </div>
                                    ) : !activeChatId ? (
                                        <div className="flex flex-col items-center justify-center h-full">
                                            <Bot size={72} /><p className="text-2xl mt-4">How can I help you today?</p><p className='mt-2'>Type your message below to start a new chat.</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col h-full">
                                            <div className="flex-1 space-y-4">
                                                {messages.map((message, index) => (
                                                    <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                                        {message.role !== 'user' && <Avatar><AvatarImage src="/logo.svg" alt="Solufuse" /><AvatarFallback>AI</AvatarFallback></Avatar>}
                                                        <div className={`p-3 rounded-lg max-w-[70%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                            <p className="font-bold">{message.role === 'user' ? 'You' : 'AI'}</p>
                                                            <ReactMarkdown>{message.content}</ReactMarkdown>
                                                        </div>
                                                        {message.role === 'user' && user && <Avatar><AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback></Avatar>}
                                                    </div>
                                                ))}
                                                {isLoading && !activeChat?.messages.some(m => m.role === 'assistant') && (
                                                    <div className="flex items-start gap-3">
                                                        <Avatar><AvatarImage src="/logo.svg" alt="Solufuse" /><AvatarFallback>AI</AvatarFallback></Avatar>
                                                        <div className="p-3 rounded-lg max-w-[70%] bg-muted"><p className="font-bold">AI</p><div className="bouncing-dots"><span></span><span></span><span></span></div></div>
                                                    </div>
                                                )}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </main>
                        </ScrollArea>
                        <footer className="p-4">
                            <div className="max-w-4xl mx-auto">
                                <div className="flex justify-center mb-2 space-x-2">
                                    <Button onClick={() => fileInputRef.current?.click()} disabled={!currentProject} variant="outline"><Upload className="h-4 w-4 mr-2" />Upload File</Button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
                                    <Button onClick={() => setFileExplorerOpen(!isFileExplorerOpen)} disabled={!currentProject} variant="outline"><FolderOpen className="h-4 w-4 mr-2" />Browse Files</Button>
                                </div>
                                <div className="flex w-full items-center space-x-2 p-2 rounded-full bg-muted">
                                    <Input
                                        id="message"
                                        placeholder={currentProject ? "Type your message..." : "Please select a project first"}
                                        className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none"
                                        autoComplete="off"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        disabled={!currentProject || isLoading}
                                    />
                                    <Button type="submit" size="icon" onClick={handleSend} disabled={!input.trim() || !currentProject || isLoading} className="rounded-full">
                                        <Send className={isSidebarOpen ? "h-4 w-4" : "h-5 w-5"} /><span className="sr-only">Send</span>
                                    </Button>
                                </div>
                            </div>
                        </footer>
                    </div>
                    {selectedProjectId && isFileExplorerOpen &&
                        <FileExplorer 
                            refreshTrigger={fileExplorerKey}
                            isOpen={isFileExplorerOpen} 
                            onClose={() => setFileExplorerOpen(false)} 
                            projectId={selectedProjectId} 
                            currentProject={currentProject}
                            className="w-80 border-l"
                        />
                    }
                </div>
            </div>
            <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
};

export default ChatPage;
