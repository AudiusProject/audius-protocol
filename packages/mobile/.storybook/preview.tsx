import { Story } from '@storybook/react-native'
import { ThemeProvider } from 'app/app/ThemeProvider'
import { persistor, store } from 'app/store'
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

export const decorators = [
  (Story: Story) => (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}></PersistGate>
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    </Provider>
  ),
  (Story: Story) => (
    <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      <Story />
    </View>
  )
]
