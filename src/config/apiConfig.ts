const IS_PROD = import.meta.env.PROD;

// In production, all requests are proxied by Nginx.
// The frontend and the backend are served on the same domain.
const API_BASE_URL = IS_PROD ? '/api' : 'https://api.solufuse.com';

// For WebSockets, the protocol and host are different.
const WS_HOST = IS_PROD ? window.location.host : 'api.solufuse.com';
const WS_PROTOCOL = window.location.protocol === 'https' ? 'wss' : 'ws';

// In production, the path will be /api/chats/ws/, which Nginx will proxy.
// In development, it will be wss://api.solufuse.com/ws/chats/
const WS_BASE_URL = IS_PROD 
    ? `${WS_PROTOCOL}://${WS_HOST}/api/chats/ws` 
    : `wss://api.solufuse.com/ws/chats`;

export { API_BASE_URL, WS_BASE_URL };
