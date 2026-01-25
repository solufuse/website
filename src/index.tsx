
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';
import { AuthProvider } from './context/authcontext';
import { ProjectProvider } from './context/ProjectContext';
import { ChatProvider } from './context/ChatContext';
import { ChatWSProvider } from './context/ChatWSContext';
import { ThemeProvider } from "./components/theme-provider";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <ProjectProvider>
          <ChatProvider>
            <ChatWSProvider>
              <App />
            </ChatWSProvider>
          </ChatProvider>
        </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
