import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { DemoProvider } from './demo/store'
import { ToastProvider } from './components/ui/overlay'
import { applyBrandTheme } from './lib/theme'
import './index.css'

applyBrandTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DemoProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </DemoProvider>
    </BrowserRouter>
  </StrictMode>,
)
