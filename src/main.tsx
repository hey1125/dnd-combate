import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Credits } from './ui/Credits'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Credits />
  </StrictMode>,
)
