import { Flex } from '@audius/harmony-native'
import { Story } from '@storybook/react-native'
import { ThemeProvider } from 'app/app/ThemeProvider'
import { persistor, store } from 'app/store'
import { useThemePalette } from 'app/utils/theme'
import { ReactNode } from 'react'
import { ScrollView, View } from 'react-native'
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

export const decorators = [
  (Story: Story) => (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <ScrollView>
            <Flex backgroundColor='white' p='l'>
              <Story />
            </Flex>
          </ScrollView>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  )
]
