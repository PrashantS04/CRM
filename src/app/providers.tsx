import GlobalStyles from '@mui/material/GlobalStyles'
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { ToastProvider } from '@/components/feedback/ToastProvider'
import { muiTheme } from '@/theme/muiTheme'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
  })
}

/** Everything the app needs around the router: data cache, theme, notifications. */
export function AppProviders({ children, client }: { children: ReactNode; client?: QueryClient }) {
  const [defaultClient] = useState(createQueryClient)
  return (
    <QueryClientProvider client={client ?? defaultClient}>
      {/* enableCssLayer puts MUI in the `mui` layer so Tailwind utilities can override it. */}
      <StyledEngineProvider enableCssLayer>
        <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
        <ThemeProvider theme={muiTheme}>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </QueryClientProvider>
  )
}
