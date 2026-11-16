import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers'
import { router } from '@/app/router'
import { initAuth } from '@/services/auth'
import { applyCssVariables } from '@/theme/cssVars'
import '@/styles/index.css'

// Design tokens must exist before the first paint.
applyCssVariables()

// Wire the Cognito session into the API client before the first request.
initAuth()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
