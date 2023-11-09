import { getStorybookUI } from '@storybook/react-native'
import * as BootSplash from 'react-native-bootsplash'

import './storybook.requires'

const StorybookUIRoot = getStorybookUI({})

BootSplash.hide()

export default StorybookUIRoot
