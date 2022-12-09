import { ApolloProvider } from '@apollo/client'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { MantineProvider } from '@mantine/core'
import { apolloClient } from './clients'

const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <ApolloProvider client={apolloClient}>
    <MantineProvider
      theme={{
        colorScheme: 'dark',
        primaryColor: 'violet',
      }}
      withGlobalStyles
      withNormalizeCSS
    >
      <App />
    </MantineProvider>
  </ApolloProvider>
)
