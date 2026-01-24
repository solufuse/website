import EventEmitter from 'eventemitter3';
import { getAuthToken } from '@/api/getAuthToken';
import { WS_BASE_URL } from '@/config/apiConfig';

class ChatWebSocket extends EventEmitter {
    private ws: WebSocket | null = null;
    private readonly url: string;
    private readonly model: string | null; // The model is now passed in and is immutable for this connection instance.
    private connectionPromise: Promise<void> | null = null;
    private connectionPromise_resolved = false;
    private isCancelled = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectInterval = 3000;

    constructor(projectId: string, chatId: string, model?: string) {
        super();
        this.url = `${WS_BASE_URL}/ws/v1/chat/${projectId}/${chatId}`;
        // The model for this session is determined at instantiation.
        this.model = model || null; 
        console.log(`ChatWebSocket initialized for ${this.url} with model: ${this.model || '[Not Specified]'}`);
    }

    private async performConnection() {
        if (this.ws) return;

        console.log(`Attempting to connect to: ${this.url}`);
        this.emit('status', 'connecting');

        const token = await getAuthToken();
        if (!token) {
            this.emit('error', new Error('Authentication token not available. User might be logged out.'));
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
                    // The payload now includes the model passed during construction.
                    const authPayload = { token: token, model: this.model };
                    this.ws!.send(JSON.stringify(authPayload));
                    this.emit('status', 'authenticating');
                };

                this.ws!.onmessage = (event: MessageEvent) => {
                    try {
                        const data = JSON.parse(event.data);

                        if (this.connectionPromise && !this.connectionPromise_resolved) {
                            if (data.status === 'authenticated') {
                                console.log('WebSocket authentication successful:', data.message);
                                this.emit('open', event);
                                this.emit('status', 'connected');
                                this.reconnectAttempts = 0;
                                resetPromiseState();
                                resolve();
                                return;
                            } else if (data.error) {
                                console.error(`Authentication failed: ${data.error}`);
                                const authError = new Error(`Authentication failed: ${data.error}`);
                                this.emit('error', authError);
                                resetPromiseState();
                                reject(authError);
                                this.close();
                                return;
                            }
                        }

                        if (data.chunk) {
                            this.emit('message', data.chunk);
                        } else if (data.event === 'end_of_stream') {
                            this.emit('end');
                        } else if (data.error) {
                            console.error(`Received error from WebSocket: ${data.error}`);
                            this.emit('error', new Error(data.error));
                        } else if (data.warning) {
                            console.warn(`Received warning from WebSocket: ${data.warning}`);
                            this.emit('warning', data.warning);
                        } else if (data.status === 'authenticated') {
                            // Already authenticated, ignore.
                        } else {
                           console.warn("Received unhandled WebSocket message structure:", data);
                           this.emit('unhandled_message', data);
                        }

                    } catch (e) {
                        console.error("Failed to parse WebSocket JSON message or unexpected format:", event.data, e);
                        this.emit('error', new Error(`Failed to parse message: ${event.data}`));
                    }
                };

                this.ws!.onerror = (event) => {
                    console.error('WebSocket error:', event);
                    const error = new Error('WebSocket connection error.');
                    this.emit('error', error);
                    if (!this.connectionPromise_resolved) {
                        resetPromiseState();
                        reject(error);
                    }
                };

                this.ws!.onclose = (event) => {
                    console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
                    this.ws = null;
                    this.connectionPromise = null;
                    this.connectionPromise_resolved = false;

                    const nonRetriableCodes = [1008]; 
                    if (this.isCancelled || nonRetriableCodes.includes(event.code)) {
                        this.emit('status', 'disconnected');
                        this.emit('close', event);
                    } else if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        this.emit('status', 'reconnecting');
                        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                        setTimeout(() => this.performConnection(), this.reconnectInterval);
                    } else {
                        console.log("Max reconnect attempts reached.");
                        this.emit('status', 'disconnected');
                        this.emit('close', event);
                    }
                };
            });

            await this.connectionPromise;

        } catch (error: any) {
            console.error('WebSocket connection setup failed:', error.message);
            this.emit('error', error);
            this.emit('status', 'disconnected');
        }
    }

    async connect(): Promise<void> {
        this.isCancelled = false;
        if (!this.connectionPromise) {
            this.connectionPromise_resolved = false;
            this.performConnection();
        }
        return this.connectionPromise || Promise.reject("Connection failed to initialize");
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
            this.ws.close(1000, "Client requested disconnection");
        }
    }
}

export default ChatWebSocket;
