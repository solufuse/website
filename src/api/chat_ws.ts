
import { getAuthToken } from '@/api/getAuthToken';

const WS_BASE_URL = 'wss://api.solufuse.com/ws/v1/chat';

export type WebSocketEvent = 
  | { type: 'message'; data: any }
  | { type: 'chunk'; data: string }
  | { type: 'status'; data: string }
  | { type: 'warning'; data: string }
  | { type: 'error'; data: string }
  | { type: 'event'; data: 'end_of_stream' }
  | { type: 'full_history'; data: any[] }
  // --- ADDED ---
  | { type: 'tool_code'; data: string }
  | { type: 'tool_output'; data: string };

export type WebSocketConnectionOptions = {
    project_id: string;
    chat_id: string;
    model?: string;
    onOpen?: () => void;
    onClose?: (code: number, reason: string) => void;
    onEvent: (event: WebSocketEvent) => void;
    onError?: (error: any) => void;
};

export class WebSocketConnection {
    private ws: WebSocket | null = null;
    private options: WebSocketConnectionOptions;
    private connectionUrl: string;

    constructor(options: WebSocketConnectionOptions) {
        this.options = options;
        this.connectionUrl = `${WS_BASE_URL}/${options.project_id}/${options.chat_id}`;
    }

    public connect = async () => {
        if (this.ws) {
            console.warn("WebSocket is already connected or connecting.");
            return;
        }

        try {
            const token = await getAuthToken();
            this.ws = new WebSocket(this.connectionUrl);

            this.ws.onopen = () => {
                console.log("WebSocket connection established.");
                this.ws?.send(JSON.stringify({ 
                    token: token,
                    model: this.options.model 
                }));
                this.options.onOpen?.();
            };

            this.ws.onmessage = (event) => {
                try {
                    const parsedEvent: WebSocketEvent = JSON.parse(event.data);
                    this.options.onEvent(parsedEvent);
                } catch (error) {
                    console.error("Failed to parse WebSocket message:", error);
                    this.options.onError?.(error);
                }
            };

            this.ws.onerror = (event) => {
                console.error("WebSocket error:", event);
                this.options.onError?.(event);
            };

            this.ws.onclose = (event) => {
                console.log(`WebSocket connection closed: ${event.reason} (Code: ${event.code})`);
                this.options.onClose?.(event.code, event.reason);
                this.ws = null;
            };

        } catch (error) {
            console.error("Failed to initialize WebSocket connection:", error);
            this.options.onError?.(error);
        }
    }

    public sendMessage = (content: string) => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ content }));
        } else {
            console.error("WebSocket is not connected. Cannot send message.");
            this.options.onError?.(new Error("WebSocket not connected."));
        }
    }

    public closeConnection = (code: number = 1000, reason: string = "Client closed connection") => {
        if (this.ws) {
            this.ws.close(code, reason);
        }
    }

    public isConnected = (): boolean => {
        return this.ws?.readyState === WebSocket.OPEN;
    }
    
    public getChatId = (): string => {
        return this.options.chat_id;
    }
}
