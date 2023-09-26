import { Story } from '@storybook/react-native'
import { ThemeProvider } from 'app/app/ThemeProvider'
import { persistor, store } from 'app/store'
import { useThemePalette } from 'app/utils/theme'
import { ReactNode } from 'react'
import { View } from 'react-native'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'

export const parameters = {
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/
    }
  }
}

type BackgroundProps = {
  children: ReactNode
}

const Background = (props: BackgroundProps) => {
  const { white } = useThemePalette()

  return <View style={{ backgroundColor: white }} {...props} />
}

export const decorators = [
  (Story: Story) => (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}></PersistGate>
      <ThemeProvider>
        <Background>
          <Story />
        </Background>
      </ThemeProvider>
    </Provider>
  )
]
