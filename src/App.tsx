
import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Eagerly load core components for a better user experience
import ChatPage from "@/pages/ChatPage";


// Lazy load secondary pages
const ChatPageOld = lazy(() => import('@/pages/ChatPageOld'));
// const HomePage = lazy(() => import('@/pages/HomePage'));
// const AdminPage = lazy(() => import('@/pages/AdminPage'));
// const DocsPage = lazy(() => import('@/pages/DocsPage'));
const WebSocketTestPage = lazy(() => import('@/pages/WebSocketTestPage'));

const App = () => {
  const loading = (
    <div className="flex h-screen w-full items-center justify-center">
      <p>Loading...</p>
    </div>
  );

  return (
      <Suspense fallback={loading}>
        <Routes>
          {/* Default route to chat page */}
          <Route path="/" element={<Navigate to="/chats" replace />} />
          
          {/* New WebSocket-based Chat Route */}
          <Route path="/chats/:projectId?/:chatId?/:messageId?" element={<ChatPage />} />

          {/* Legacy REST-based Chat Route */}
          <Route path="/chats-old/:projectId?/:chatId?/:messageId?" element={<ChatPageOld />} />

          {/* Other application routes */}
          <Route path="/ws-test" element={<WebSocketTestPage />} />
          {/* <Route path="/admin" element={<AdminPage />} /> */}
          {/* <Route path="/docs" element={<DocsPage />} /> */}

          {/* Redirects for legacy /chat URLs to /chats */}
          <Route path="/chat" element={<Navigate to="/chats" replace />} />
          <Route path="/chat/:projectId" element={<Navigate to="/chats/:projectId" replace />} />
          <Route path="/chat/:projectId/:chatId" element={<Navigate to="/chats/:projectId/:chatId" replace />} />
          <Route path="/chat/:projectId/:chatId/:messageId" element={<Navigate to="/chats/:projectId/:chatId/:messageId" replace />} />
        </Routes>
      </Suspense>
  );
};

export default App;
