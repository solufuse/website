import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Settings } from 'lucide-react';
import { signInWithGoogle, signOutFromGoogle, onAuthStateChange } from '@/modules/auth';
import { User } from 'firebase/auth';
import Header from '@/components/layout/Header';
import ModelSelector from '@/components/chat/ModelSelector';
import Sidebar from '@/components/layout/Sidebar';

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

    useEffect(() => {
        const unsubscribe = onAuthStateChange(setUser);
        return () => unsubscribe();
    }, []);

    const handleNewConversation = () => {
        const newConversation: Conversation = {
            id: `conv-${Date.now()}`,
            name: `Chat ${conversations.length + 1}`,
            messages: [],
        };
        setConversations([...conversations, newConversation]);
        setActiveConversationId(newConversation.id);
    };

    const handleConversationSelect = (id: string) => {
        setActiveConversationId(id);
    };

    const handleSend = () => {
        if (input.trim() && activeConversationId) {
            const newMessage = { sender: 'You', text: input };
            
            const updatedConversations = conversations.map(conv => {
                if (conv.id === activeConversationId) {
                    return { ...conv, messages: [...conv.messages, newMessage] };
                }
                return conv;
            });

            setConversations(updatedConversations);
            // TODO: Add logic to send message to the selected model
            setInput('');
        }
    };
    
    const activeConversation = conversations.find(c => c.id === activeConversationId);
    const messages = activeConversation ? activeConversation.messages : [];

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
                <h1 className="text-3xl font-bold mb-8">Solufuse</h1>
                <Button onClick={signInWithGoogle}>Sign in with Google</Button>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar
                conversations={conversations.map(c => ({ id: c.id, name: c.name }))}
                activeConversationId={activeConversationId}
                onNewConversation={handleNewConversation}
                onConversationSelect={handleConversationSelect}
            />
            <div className="flex flex-col flex-1">
                <Header user={user} onSignOut={signOutFromGoogle} />
                <main className="flex-1 overflow-y-auto p-4">
                    <Card className="w-full max-w-4xl mx-auto">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>{activeConversation ? activeConversation.name : "Chat"}</CardTitle>
                            <div className="flex items-center gap-2">
                                <ModelSelector model={model} onModelChange={setModel} />
                                <Button variant="outline" size="icon">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[60vh] overflow-y-auto p-4 space-y-4">
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
                                            <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter>
                            <div className="flex w-full items-center space-x-2">
                                <Input
                                    id="message"
                                    placeholder="Type your message..."
                                    className="flex-1"
                                    autoComplete="off"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    disabled={!activeConversationId}
                                />
                                <Button type="submit" size="icon" onClick={handleSend} disabled={!input.trim() || !activeConversationId}>
                                    <Send className="h-4 w-4" />
                                    <span className="sr-only">Send</span>
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </main>
            </div>
        </div>
    );
};

export default App;
