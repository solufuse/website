
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatPage from '@/pages/ChatPage';
import '@/style.css';
import { AuthProvider } from '@/context/authcontext';
import { ProjectProvider } from '@/context/ProjectContext';
import { ThemeProvider } from "@/components/theme-provider";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <ProjectProvider>
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
              <Routes>
                <Route path="/chats/:projectId/:chatId" element={<ChatPage />} />
                <Route path="/chats/:projectId" element={<ChatPage />} />
                <Route path="/" element={<ChatPage />} />
              </Routes>
            </ThemeProvider>
        </ProjectProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
