import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot } from 'lucide-react';
import { onAuthStateChange, signInWithGoogle } from '@/modules/auth';
import { User } from 'firebase/auth';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { sendMessage } from '@/services/chatService';
import SettingsDialog from '@/components/chat/SettingsDialog';

interface Conversation {
  id: string;
  name: string;
  messages: { sender: string; text: string }[];
}

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [input, setInput] = useState('');
    const [model, setModel] = useState('gemini');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom()
    }, [conversations, activeConversationId]);

    useEffect(() => {
        const unsubscribe = onAuthStateChange(setUser);
        return () => unsubscribe();
    }, []);

    const handleNewConversation = () => {
        if(user){
            const newConversation: Conversation = {
                id: `conv-${Date.now()}`,
                name: `Chat ${conversations.length + 1}`,
                messages: [],
            };
            setConversations([...conversations, newConversation]);
            setActiveConversationId(newConversation.id);
        }else{
            signInWithGoogle();
        }
    };

    const handleConversationSelect = (id: string) => {
        setActiveConversationId(id);
    };

    const handleSend = async () => {
        if (input.trim() && activeConversationId) {
            const userInput = input;
            const newMessage = { sender: 'You', text: userInput };
            
            const updatedConversationsWithUserMessage = conversations.map(conv => {
                if (conv.id === activeConversationId) {
                    return { ...conv, messages: [...conv.messages, newMessage] };
                }
                return conv;
            });

            setConversations(updatedConversationsWithUserMessage);
            setInput('');
            setIsLoading(true);

            try {
                const response = await sendMessage(model, userInput);
                const aiMessage = { sender: 'AI', text: response.text };

                const updatedConversationsWithAiMessage = updatedConversationsWithUserMessage.map(conv => {
                    if (conv.id === activeConversationId) {
                        return { ...conv, messages: [...conv.messages, aiMessage] };
                    }
                    return conv;
                });
                setConversations(updatedConversationsWithAiMessage);

            } catch (error) {
                console.error("Failed to send message:", error);
                 const errorMessageText = error instanceof Error ? error.message : 'Sorry, I encountered an error.';
                const errorMessage = { sender: 'AI', text: errorMessageText };
                 const updatedConversationsWithError = updatedConversationsWithUserMessage.map(conv => {
                    if (conv.id === activeConversationId) {
                        return { ...conv, messages: [...conv.messages, errorMessage] };
                    }
                    return conv;
                });
                setConversations(updatedConversationsWithError);
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    const activeConversation = conversations.find(c => c.id === activeConversationId);
    const messages = activeConversation ? activeConversation.messages : [];

    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar
                conversations={conversations.map(c => ({ id: c.id, name: c.name }))}
                activeConversationId={activeConversationId}
                onNewConversation={handleNewConversation}
                onConversationSelect={handleConversationSelect}
            />
            <div className="flex flex-col flex-1">
                <Header user={user} model={model} onModelChange={setModel} onToggleSettings={() => setIsSettingsOpen(true)} />
                <main className="flex-1 overflow-y-auto p-4">
                    <div className="max-w-4xl mx-auto h-full">
                        {!activeConversationId ? (
                             <div className="flex flex-col items-center justify-center h-full">
                                <Bot size={72} />
                                <p className="text-2xl mt-4">How can I help you today?</p>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex-1 space-y-4">
                                    {messages.map((message, index) => (
                                        <div key={index} className={`flex items-start gap-3 ${message.sender === 'You' ? 'justify-end' : ''}`}>
                                            {message.sender !== 'You' && (
                                                <Avatar>
                                                    <AvatarImage src="/logo.svg" alt="Solufuse" />
                                                    <AvatarFallback>AI</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className={`p-3 rounded-lg max-w-[70%] ${message.sender === 'You' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                                <p className="font-bold">{message.sender}</p>
                                                <p>{message.text}</p>
                                            </div>
                                            {message.sender === 'You' && (
                                                <Avatar>
                                                    <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
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
                                                <p>...</p>
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
                        <div className="flex w-full items-center space-x-2 p-2 rounded-full bg-muted">
                            <Input
                                id="message"
                                placeholder="Type your message..."
                                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none"
                                autoComplete="off"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                disabled={!activeConversationId || isLoading}
                            />
                             <Button type="submit" size="icon" onClick={handleSend} disabled={!input.trim() || !activeConversationId || isLoading} className="rounded-full">
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Send</span>
                            </Button>
                        </div>
                    </div>
                </footer>
            </div>
            <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
};

export default App;
