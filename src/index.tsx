import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ChatPage from './pages/ChatPage.tsx';
import './style.css';
import { AuthProvider } from './context/authcontext.tsx';
import { ProjectProvider } from './context/ProjectContext.tsx';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <ProjectProvider>
          <Routes>
            <Route path="/chats/:chatId" element={<ChatPage />} />
            <Route path="/" element={<ChatPage />} />
          </Routes>
        </ProjectProvider>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
