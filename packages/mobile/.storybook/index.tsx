import { getStorybookUI } from '@storybook/react-native'
import * as BootSplash from 'react-native-bootsplash'

import './storybook.requires'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

const StorybookUIRoot = getStorybookUI({})

export const App = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <StorybookUIRoot />
  </GestureHandlerRootView>
)

BootSplash.hide()
