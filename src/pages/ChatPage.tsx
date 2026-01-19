
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, FolderOpen } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import SettingsDialog from '@/components/chat/SettingsDialog';
import FileExplorerDialog from '@/components/layout/FileExplorerDialog';
import { useAuthContext } from '@/context/authcontext';
import { createChat, getChats, postMessage } from '@/api/chat';
import { listProjects, getProjectDetails } from '@/api/projects';
import { getApiKey } from '@/utils/apiKeyManager';
import type { Chat, Message } from '@/types/types_chat';
import type { ProjectListDetail, ProjectDetail } from '@/types/types_projects';

const ChatPage: React.FC = () => {
    const { user, loading: authLoading, loginWithGoogle, logout } = useAuthContext();

    const [input, setInput] = useState('');
    const [model, setModel] = useState('gemini');
    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFileExplorerOpen, setFileExplorerOpen] = useState(false);
    
    const [projects, setProjects] = useState<ProjectListDetail[]>([]);
    const [currentProject, setCurrentProject] = useState<ProjectDetail | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

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
        if (!user) {
            loginWithGoogle();
            return;
        }
        if (!selectedProjectId) {
            alert("Please select a project before starting a new chat.");
            return;
        }

        const apiKey = getApiKey();
        if (!apiKey) {
            alert('Please add your API key in the settings.');
            setIsSettingsOpen(true);
            return;
        }

        setIsCreatingChat(true);
        try {
            const newChatNumber = chats.reduce((max, chat) => {
                if (chat.title.startsWith('New Chat ')) {
                    const num = parseInt(chat.title.replace('New Chat ', ''), 10);
                    return isNaN(num) ? max : Math.max(max, num);
                }
                return max;
            }, 0) + 1;
            const newChatTitle = `New Chat ${newChatNumber}`;

            const newChat = await createChat(selectedProjectId, { title: newChatTitle, api_key: apiKey });
            setChats([...chats, newChat]);
            setActiveChatId(newChat.short_id);
        } catch (error) {
            console.error("Failed to create chat:", error);
            alert("Sorry, we couldn't create a new chat. Please try again later.");
        } finally {
            setIsCreatingChat(false);
        }
    };

    const handleConversationSelect = (id: string) => {
        setActiveChatId(id);
    };

    const handleProjectSelect = (projectId: string) => {
        setSelectedProjectId(projectId);
    }

    const handleSend = async () => {
        if (input.trim() && activeChatId) {
            const userInput = input;
            const newMessage: Message = { content: userInput, role: 'user' };

            const updatedChatsWithUserMessage = chats.map(chat => {
                if (chat.short_id === activeChatId) {
                    return { ...chat, messages: [...chat.messages, newMessage] };
                }
                return chat;
            });

            setChats(updatedChatsWithUserMessage);
            setInput('');
            setIsLoading(true);

            try {
                const aiResponse = await postMessage(activeChatId, { content: userInput, role: 'user' });
                const aiMessage: Message = { content: aiResponse.content, role: 'assistant' };

                const updatedChatsWithAiMessage = updatedChatsWithUserMessage.map(chat => {
                    if (chat.short_id === activeChatId) {
                        return { ...chat, messages: [...chat.messages, aiMessage] };
                    }
                    return chat;
                });
                setChats(updatedChatsWithAiMessage);

            } catch (error) {
                console.error("Failed to send message:", error);
                const errorMessageText = error instanceof Error ? error.message : 'Sorry, I encountered an error.';
                const errorMessage: Message = { content: errorMessageText, role: 'assistant' };
                const updatedChatsWithError = updatedChatsWithUserMessage.map(chat => {
                    if (chat.short_id === activeChatId) {
                        return { ...chat, messages: [...chat.messages, errorMessage] };
                    }
                    return chat;
                });
                setChats(updatedChatsWithError);
            } finally {
                setIsLoading(false);
            }
        }
    };

    if (authLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    const activeChat = chats.find(c => c.short_id === activeChatId);
    const messages = activeChat ? activeChat.messages : [];

    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar
                conversations={chats.map(c => ({ id: c.short_id, name: c.title }))}
                activeConversationId={activeChatId}
                isCreatingChat={isCreatingChat}
                onNewConversation={handleNewConversation}
                onConversationSelect={handleConversationSelect}
                projects={projects}
                currentProject={currentProject}
                onProjectSelect={handleProjectSelect}
            />
            <div className="flex flex-col flex-1">
                <Header
                    user={user}
                    model={model}
                    onModelChange={setModel}
                    onToggleSettings={() => setIsSettingsOpen(true)}
                    onLogin={loginWithGoogle}
                    onLogout={logout}
                    currentProject={currentProject}
                />
                <main className="flex-1 overflow-y-auto p-4">
                    <div className="max-w-4xl mx-auto h-full">
                        {!currentProject ? (
                             <div className="flex flex-col items-center justify-center h-full">
                                <Bot size={72} />
                                <p className="text-2xl mt-4">Welcome to Solufuse</p>
                                <p className='mt-2'>Please select a project from the sidebar to start chatting.</p>
                            </div>
                        ) : !activeChatId ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <Bot size={72} />
                                <p className="text-2xl mt-4">How can I help you today?</p>
                                <p className='mt-2'>Select a conversation or start a new one.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex-1 space-y-4">
                                    {messages.map((message, index) => (
                                        <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                            {message.role !== 'user' && (
                                                <Avatar>
                                                    <AvatarImage src="/logo.svg" alt="Solufuse" />
                                                    <AvatarFallback>AI</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className={`p-3 rounded-lg max-w-[70%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                <p className="font-bold">{message.role === 'user' ? 'You' : 'AI'}</p>
                                                <ReactMarkdown>{message.content}</ReactMarkdown>
                                            </div>
                                            {message.role === 'user' && user && (
                                                <Avatar>
                                                    <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex items-start gap-3">
                                            <Avatar>
                                                <AvatarImage src="/logo.svg" alt="Solufuse" />
                                                <AvatarFallback>AI</AvatarFallback>
                                            </Avatar>
                                            <div className="p-3 rounded-lg max-w-[70%] bg-muted">
                                                <p className="font-bold">AI</p>
                                                <div className="bouncing-dots">
                                                    <span></span>
                                                    <span></span>
                                                    <span></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>
                        )}
                    </div>
                </main>
                <footer className="p-4">
                    <div className="max-w-4xl mx-auto">
                         <div className="flex justify-center mb-2">
                            <Button onClick={() => setFileExplorerOpen(true)} disabled={!currentProject} variant="outline">
                                <FolderOpen className="h-4 w-4 mr-2" />
                                Browse Files
                            </Button>
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
                                disabled={!activeChatId || isLoading || !currentProject}
                            />
                            <Button type="submit" size="icon" onClick={handleSend} disabled={!input.trim() || !activeChatId || isLoading || !currentProject} className="rounded-full">
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Send</span>
                            </Button>
                        </div>
                    </div>
                </footer>
            </div>
            <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            {selectedProjectId && 
                <FileExplorerDialog 
                    isOpen={isFileExplorerOpen} 
                    onClose={() => setFileExplorerOpen(false)} 
                    projectId={selectedProjectId} 
                    currentProject={currentProject}
                />}
        </div>
    );
};

export default ChatPage;
