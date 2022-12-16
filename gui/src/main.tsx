import { ApolloProvider } from '@apollo/client'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { MantineProvider, MantineThemeOverride } from '@mantine/core'
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

root.render(
  <ApolloProvider client={apolloClient}>
    <MantineProvider theme={lightTheme} withGlobalStyles withNormalizeCSS>
      <App />
    </MantineProvider>
  </ApolloProvider>
)
