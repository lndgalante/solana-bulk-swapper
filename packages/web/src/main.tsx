import React from 'react'
import ReactDOM from 'react-dom/client'
import { NextUIProvider } from '@nextui-org/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { Toaster } from 'sonner'

// styles
import './index.css'

// root component
import App from './App.tsx'

// providers
import { Wallet } from './providers/Wallet'

// constants
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <div>
    <QueryClientProvider client={queryClient}>
      <NextUIProvider>
        <Wallet>
          <App />
          <Toaster />
        </Wallet>
      </NextUIProvider>
    </QueryClientProvider>
  </div>,
)
