import { StyleProp } from 'react-native'

export type StylesProp<T> = { [K in keyof T]?: StyleProp<T[K]> }
