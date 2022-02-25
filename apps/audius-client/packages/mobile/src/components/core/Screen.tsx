import { ReactElement, ReactNode, useEffect } from 'react'

import { useNavigation } from '@react-navigation/native'
import { Nullable } from 'audius-client/src/common/utils/typeUtils'
import { Animated, StyleProp, View, ViewStyle } from 'react-native'

import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ palette }, { variant }) => ({
  root: {
    height: '100%',
    backgroundColor:
      variant === 'primary'
        ? palette.background
        : variant === 'secondary'
        ? palette.backgroundSecondary
        : palette.white,
    // TODO: figure out why screens need this. Likel related to the BottomTabNavigator
    paddingBottom: 80
  }
}))

type ScreenProps = {
  children: ReactNode
  topbarLeft?: Nullable<ReactElement>
  topbarRight?: Nullable<ReactElement>
  topbarRightStyle?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>
  title?: Nullable<string>
  style?: StyleProp<ViewStyle>
  variant?: 'primary' | 'secondary' | 'white'
  noPadding?: boolean
}
export const Screen = (props: ScreenProps) => {
  const {
    children,
    topbarLeft,
    topbarRight,
    title,
    topbarRightStyle,
    variant = 'primary',
    noPadding
  } = props
  const styles = useStyles({ variant })
  const navigation = useNavigation()

  useEffect(() => {
    navigation.setOptions({
      headerLeft: topbarLeft === undefined ? undefined : () => topbarLeft,
      headerRight: topbarRight === undefined ? undefined : () => topbarRight,
      headerRightContainerStyle: topbarRightStyle,
      title
    })
  }, [navigation, topbarLeft, topbarRight, topbarRightStyle, title])

  return (
    <View style={[styles.root, noPadding && { paddingBottom: 0 }]}>
      {children}
    </View>
  )
}
