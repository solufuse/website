
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import ChatPage from './pages/ChatPage.tsx';
import './style.css';
import { AuthProvider } from './context/authcontext.tsx';
import { ProjectProvider } from './context/ProjectContext.tsx';
import { ThemeProvider } from "./components/theme-provider";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <ProjectProvider>
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
              <Routes>
                <Route path="/chats/:chatId" element={<ChatPage />} />
                <Route path="/" element={<ChatPage />} />
              </Routes>
            </ThemeProvider>
        </ProjectProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
