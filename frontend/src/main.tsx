import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
<<<<<<< HEAD
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
=======
import './index.css'
import App from './App.tsx'
>>>>>>> 02a484f3a9351a716c76a8ba6c629cd591e14948

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
<<<<<<< HEAD
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <App />
      </AuthProvider>
=======
      <App />
>>>>>>> 02a484f3a9351a716c76a8ba6c629cd591e14948
    </BrowserRouter>
  </StrictMode>,
)
