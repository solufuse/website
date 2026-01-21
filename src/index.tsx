
import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import '@/style.css';
import { AuthProvider } from '@/context/authcontext';
import { ProjectProvider } from '@/context/ProjectContext';
import { ChatProvider } from '@/context/ChatContext';
import { ThemeProvider } from "@/components/theme-provider";

// Lazy load the main chat page
const ChatPage = lazy(() => import('@/pages/ChatPage'));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <ProjectProvider>
          <ChatProvider>
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
              <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><p>Loading...</p></div>}>
                <Routes>
                  <Route path="/chats/:projectId/:chatId/:messageId" element={<ChatPage />} />
                  <Route path="/chats/:projectId/:chatId" element={<ChatPage />} />
                  <Route path="/chats/:projectId" element={<ChatPage />} />
                  <Route path="/" element={<ChatPage />} />
                </Routes>
              </Suspense>
            </ThemeProvider>
          </ChatProvider>
        </ProjectProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
