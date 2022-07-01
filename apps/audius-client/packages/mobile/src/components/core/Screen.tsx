import { ReactElement, ReactNode, useLayoutEffect } from 'react'

import { useNavigation } from '@react-navigation/native'
import { Nullable } from 'audius-client/src/common/utils/typeUtils'
import { pickBy, negate, isUndefined } from 'lodash'
import { Animated, StyleProp, View, ViewStyle } from 'react-native'

import { makeStyles } from 'app/styles'

const removeUndefined = (object: Record<string, unknown>) =>
  pickBy(object, negate(isUndefined))

const useStyles = makeStyles(({ palette }, { variant }) => ({
  root: {
    flex: 1,
    backgroundColor:
      variant === 'primary'
        ? palette.background
        : variant === 'secondary'
        ? palette.backgroundSecondary
        : palette.white
  }
}))

export type ScreenProps = {
  children: ReactNode
  topbarLeft?: Nullable<ReactElement>
  topbarLeftStyle?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>
  topbarRight?: Nullable<ReactElement>
  topbarRightStyle?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>
  title?: Nullable<ReactNode>
  headerTitle?: ReactNode
  style?: StyleProp<ViewStyle>
  variant?: 'primary' | 'secondary' | 'white'
}

export const Screen = (props: ScreenProps) => {
  const {
    children,
    topbarLeft,
    topbarRight,
    title = null,
    headerTitle,
    topbarRightStyle,
    topbarLeftStyle,
    variant = 'primary',
    style
  } = props
  const styles = useStyles({ variant })
  const navigation = useNavigation()

  useLayoutEffect(() => {
    navigation.setOptions(
      removeUndefined({
        headerLeft: topbarLeft === undefined ? undefined : () => topbarLeft,
        headerRight:
          topbarRight === undefined
            ? undefined
            : topbarRight === null
            ? null
            : () => topbarRight,
        title,
        headerTitle
      })
    )
  }, [
    navigation,
    topbarLeftStyle,
    topbarLeft,
    topbarRight,
    topbarRightStyle,
    title,
    headerTitle
  ])

  return <View style={[styles.root, style]}>{children}</View>
}
