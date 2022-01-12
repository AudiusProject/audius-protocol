import { ViewStyle } from 'react-native'

export const flexCol = (): ViewStyle => ({
  display: 'flex'
})

export const flexColCentered = (): ViewStyle => ({
  display: 'flex',
  alignItems: 'center'
})

export const flexRow = (): ViewStyle => ({
  display: 'flex',
  flexDirection: 'row'
})

export const flexRowCentered = (): ViewStyle => ({
  ...flexRow(),
  alignItems: 'center'
})
