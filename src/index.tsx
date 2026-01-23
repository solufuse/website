
import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import '@/style.css';
import { AuthProvider } from '@/context/authcontext';
import { ProjectProvider } from '@/context/ProjectContext';
import { ChatProvider } from '@/context/ChatContext';
import { ThemeProvider } from "@/components/theme-provider";

// Lazy load pages
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const WebSocketTestPage = lazy(() => import('@/pages/WebSocketTestPage'));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <Router>
        <AuthProvider>
          <ProjectProvider>
            <ChatProvider>
              <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><p>Loading...</p></div>}>
                  <Routes>
                    <Route path="/ws-test" Component={WebSocketTestPage} />
                    <Route path="/chats/:projectId/:chatId/:messageId" Component={ChatPage} />
                    <Route path="/chats/:projectId/:chatId" Component={ChatPage} />
                    <Route path="/chats/:projectId" Component={ChatPage} />
                    <Route path="/" Component={ChatPage} />
                  </Routes>
                </Suspense>
              </ThemeProvider>
            </ChatProvider>
          </ProjectProvider>
        </AuthProvider>
      </Router>
  </React.StrictMode>
);
