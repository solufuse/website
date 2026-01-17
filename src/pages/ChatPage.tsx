import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from 'lucide-react';
import { signInWithGoogle, signOutFromGoogle, onAuthStateChange } from '@/modules/auth';
import { User } from 'firebase/auth';
import Header from '@/components/layout/Header';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<{ sender: string, text: string }[]>([]);
    const [input, setInput] = useState('');
    const [model, setModel] = useState('gemini');

    useEffect(() => {
        const unsubscribe = onAuthStateChange(setUser);
        return () => unsubscribe();
    }, []);

    const handleSend = () => {
        if (input.trim()) {
            setMessages([...messages, { sender: 'You', text: input }]);
            // TODO: Add logic to send message to the selected model
            setInput('');
        }
    };

    const handleModelChange = (value: string) => {
      setModel(value);
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
                <h1 className="text-3xl font-bold mb-8">Solufuse</h1>
                <Button onClick={signInWithGoogle}>Sign in with Google</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <Header user={user} onSignOut={signOutFromGoogle} />
            <main className="flex-1 overflow-y-auto p-4">
                <Card className="w-full max-w-4xl mx-auto">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Chat</CardTitle>
                        <div className="flex items-center gap-2">
                            <span>Model:</span>
                            <Select onValueChange={handleModelChange} defaultValue={model}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select a model" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="gemini">Gemini</SelectItem>
                                    <SelectItem value="chatgpt">ChatGPT</SelectItem>
                                    <SelectItem value="claude">Claude</SelectItem>
                                </SelectContent>
                            </Select>
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
                            />
                            <Button type="submit" size="icon" onClick={handleSend} disabled={!input.trim()}>
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Send</span>
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
};

export default App;
