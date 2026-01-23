import { EventEmitter } from 'events';
import { getAuthToken } from '@/api/getAuthToken'; // Corrected Path
import { WS_BASE_URL } from '@/config/apiConfig'; // Assuming this will be created or is located elsewhere

class ChatWebSocket extends EventEmitter {
    private ws: WebSocket | null = null;
    private readonly url: string;
    private connectionPromise: Promise<void> | null = null;
    private connectionPromise_resolved = false; // Moved this to be a class member
    private isCancelled = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectInterval = 3000;

    constructor(projectId: string, chatId: string, private apiKey: string) {
        super();
        this.url = `${WS_BASE_URL}/ws/v1/chat/${projectId}/${chatId}`;
    }

    private async performConnection() {
        if (this.ws) return;

        console.log(`Attempting to connect to: ${this.url}`);
        this.emit('status', 'connecting');

        const token = await getAuthToken();
        if (!token) {
            this.emit('error', new Error('Authentication token not available.'));
            this.emit('status', 'disconnected');
            return;
        }

        try {
            this.ws = new WebSocket(this.url);

            this.connectionPromise = new Promise((resolve, reject) => {
                const resetPromiseState = () => {
                    this.connectionPromise_resolved = true;
                };

                this.ws!.onopen = () => {
                    console.log('WebSocket connection opened. Sending authentication...');
                    const authPayload = { token: token, api_key: this.apiKey };
                    this.ws!.send(JSON.stringify(authPayload));
                    this.emit('status', 'authenticating');
                };

                this.ws!.onmessage = (event) => {
                    if (this.connectionPromise && !this.connectionPromise_resolved) {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.status === 'authenticated') {
                                console.log('WebSocket authentication successful.');
                                this.emit('open', event);
                                this.emit('status', 'connected');
                                this.reconnectAttempts = 0;
                                resetPromiseState();
                                resolve();
                            } else if (data.error) {
                                console.error(`Authentication failed: ${data.error}`);
                                this.emit('error', new Error(`Authentication failed: ${data.error}`));
                                resetPromiseState();
                                reject(new Error(data.error));
                            }
                        } catch (e) {
                            console.error("Received non-JSON message before authentication was complete.");
                            this.emit('message', event.data);
                        }
                    } else {
                        if (event.data === '<<END_OF_STREAM>>') {
                            this.emit('end');
                        } else {
                            this.emit('message', event.data);
                        }
                    }
                };

                this.ws!.onerror = (event) => {
                    console.error('WebSocket error:', event);
                    this.emit('error', event);
                    if (!this.connectionPromise_resolved) {
                        resetPromiseState();
                        reject(new Error('WebSocket connection error.'));
                    }
                };

                this.ws!.onclose = (event) => {
                    console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
                    this.ws = null;
                    this.connectionPromise = null;
                    this.connectionPromise_resolved = false; // Reset for next connection

                    if (!this.isCancelled && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        this.emit('status', 'reconnecting');
                        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                        setTimeout(() => this.performConnection(), this.reconnectInterval);
                    } else {
                        this.emit('status', 'disconnected');
                        this.emit('close', event);
                    }
                };
            });

            await this.connectionPromise;

        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.emit('error', error);
            this.emit('status', 'disconnected');
        }
    }

    async connect() {
        this.isCancelled = false;
        if (!this.connectionPromise) {
            this.connectionPromise_resolved = false;
            this.performConnection();
        }
        return this.connectionPromise;
    }

    sendMessage(content: string) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const messagePayload = { content };
            this.ws.send(JSON.stringify(messagePayload));
        } else {
            console.error('WebSocket is not connected.');
            this.emit('error', new Error('Cannot send message, WebSocket is not connected.'));
        }
    }

    close() {
        this.isCancelled = true;
        if (this.ws) {
            this.ws.close();
        }
    }
}

export default ChatWebSocket;
