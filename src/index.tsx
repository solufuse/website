import React from 'react'
import ReactDOM from 'react-dom/client'
import ChatPage from './pages/ChatPage.tsx'
import './style.css'
import { AuthProvider } from './context/authcontext.tsx'
import { ProjectProvider } from './context/ProjectContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ProjectProvider>
        <ChatPage />
      </ProjectProvider>
    </AuthProvider>
  </React.StrictMode>,
)