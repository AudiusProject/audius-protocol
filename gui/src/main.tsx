import { ApolloProvider } from '@apollo/client'
import { MantineProvider, MantineThemeOverride } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { apolloClient } from './clients'

const root = ReactDOM.createRoot(document.getElementById('root')!)

const darkTheme: MantineThemeOverride = {
  colorScheme: 'dark',
  primaryColor: 'violet',
}

const lightTheme: MantineThemeOverride = {
  colorScheme: 'light',
  primaryColor: 'violet',
  defaultRadius: 10,
}

// Create a client
const queryClient = new QueryClient()

root.render(
  <QueryClientProvider client={queryClient}>
    <ApolloProvider client={apolloClient}>
      <MantineProvider theme={lightTheme} withGlobalStyles withNormalizeCSS>
        <App />
      </MantineProvider>
    </ApolloProvider>
  </QueryClientProvider>
)
