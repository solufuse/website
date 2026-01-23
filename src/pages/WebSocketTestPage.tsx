import React, { useState, useRef, useCallback } from 'react';
import { ChatSocket } from '@/api/chat_ws';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const WebSocketTestPage: React.FC = () => {
    const [chatId, setChatId] = useState<string>('your-chat-id');
    const [apiKey, setApiKey] = useState<string>('');
    const [modelName, setModelName] = useState<string>('gemini-1.5-flash');
    const [message, setMessage] = useState<string>('');
    const [receivedMessages, setReceivedMessages] = useState<string[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<'Disconnected' | 'Connecting' | 'Connected' | 'Error'>('Disconnected');

    const chatSocketRef = useRef<ChatSocket | null>(null);

    const handleConnect = useCallback(async () => {
        if (chatSocketRef.current) {
            console.warn('Already connected.');
            return;
        }
        
        setConnectionStatus('Connecting');
        setReceivedMessages([]);

        const socket = new ChatSocket(chatId, modelName, apiKey || undefined);
        chatSocketRef.current = socket;

        socket.on('open', () => {
            setConnectionStatus('Connected');
            setReceivedMessages(prev => [...prev, '--- Connection Established ---']);
        });

        socket.on('message', (data) => {
            if (data === '[END_OF_TURN]') {
                 setReceivedMessages(prev => [...prev, '--- AI Turn Ended ---']);
            } else {
                setReceivedMessages(prev => [...prev, data]);
            }
        });

        socket.on('error', (error) => {
            console.error('WebSocket Error:', error);
            setConnectionStatus('Error');
            setReceivedMessages(prev => [...prev, `--- ERROR: ${JSON.stringify(error)} ---`]);
        });

        socket.on('close', (event) => {
            setConnectionStatus('Disconnected');
            setReceivedMessages(prev => [...prev, `--- Connection Closed (Code: ${event.code}) ---`]);
            chatSocketRef.current = null;
        });

        try {
            await socket.connect();
        } catch (error) {
            console.error("Failed to connect:", error);
            setConnectionStatus('Error');
        }

    }, [chatId, modelName, apiKey]);

    const handleDisconnect = () => {
        chatSocketRef.current?.close();
    };

    const handleSendMessage = () => {
        if (!message) return;
        if (chatSocketRef.current) {
            chatSocketRef.current.sendMessage(message);
            setReceivedMessages(prev => [...prev, `You: ${message}`]);
            setMessage('');
        } else {
            alert('Not connected. Please connect first.');
        }
    };

    return (
        <div className="p-4 container mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>WebSocket Chat Test Page</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="chatId">Chat ID</Label>
                        <Input id="chatId" value={chatId} onChange={(e) => setChatId(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key (Optional)</Label>
                        <Input id="apiKey" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Overrides chat's stored API key" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="modelName">Model Name</Label>
                        <Input id="modelName" value={modelName} onChange={(e) => setModelName(e.target.value)} />
                    </div>
                    <div>
                        <p>Connection Status: <span className={
                            connectionStatus === 'Connected' ? 'text-green-500' : 
                            connectionStatus === 'Disconnected' ? 'text-red-500' : 'text-yellow-500'
                        }>{connectionStatus}</span></p>
                    </div>
                    <div className="flex space-x-2">
                        <Button onClick={handleConnect} disabled={connectionStatus === 'Connected' || connectionStatus === 'Connecting'}>Connect</Button>
                        <Button onClick={handleDisconnect} variant="destructive" disabled={connectionStatus !== 'Connected'}>Disconnect</Button>
                    </div>

                    <div className="border rounded-md p-4 h-64 overflow-y-auto bg-muted">
                        {receivedMessages.map((msg, index) => (
                            <pre key={index} className="whitespace-pre-wrap">{msg}</pre>
                        ))}
                    </div>

                    <div className="flex space-x-2">
                        <Input 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)} 
                            placeholder="Type your message..."
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button onClick={handleSendMessage} disabled={connectionStatus !== 'Connected'}>Send</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default WebSocketTestPage;
