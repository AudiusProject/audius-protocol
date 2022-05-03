import { Dimensions, StatusBar } from 'react-native'

// Not using 'window' because it isn't accurate on android
const { height } = Dimensions.get('screen')

export const FULL_DRAWER_HEIGHT = height - (StatusBar.currentHeight ?? 0)
