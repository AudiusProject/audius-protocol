import type { ComponentType, ReactElement, ReactNode } from 'react'
import { useMemo, useEffect, useLayoutEffect } from 'react'

import type { Nullable } from '@audius/common'
import { useNavigation } from '@react-navigation/native'
import { pickBy, negate, isUndefined } from 'lodash'
import type { Animated, StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'
import type { SvgProps } from 'react-native-svg'

import { screen } from 'app/services/analytics'
import { makeStyles } from 'app/styles'

import { SecondaryScreenTitle } from './SecondaryScreenTitle'

const removeUndefined = (object: Record<string, unknown>) =>
  pickBy(object, negate(isUndefined))

const useStyles = makeStyles(({ palette }, { variant }) => ({
  root: {
    flex: 1,
    backgroundColor:
      variant === 'primary'
        ? palette.background
        : variant === 'secondary'
        ? palette.background
        : variant === 'secondaryAlt'
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
  icon?: ComponentType<SvgProps>
  IconProps?: SvgProps
  headerTitle?: ReactNode
  style?: StyleProp<ViewStyle>
  // url used for screen view analytics
  url?: string
  variant?: 'primary' | 'secondary' | 'secondaryAlt' | 'white'
}

export const Screen = (props: ScreenProps) => {
  const {
    children,
    topbarLeft,
    topbarRight,
    title: titleProp = null,
    icon,
    IconProps,
    headerTitle: headerTitleProp,
    topbarRightStyle,
    topbarLeftStyle,
    url,
    variant = 'primary',
    style
  } = props
  const stylesConfig = useMemo(() => ({ variant }), [variant])
  const styles = useStyles(stylesConfig)
  const navigation = useNavigation()
  const isSecondary = variant === 'secondary' || variant === 'white'

  // Record screen view
  useEffect(() => {
    if (url) {
      screen({ route: url })
    }
  }, [url])

  useLayoutEffect(() => {
    navigation.setOptions(
      removeUndefined({
        headerLeft: topbarLeft === undefined ? undefined : () => topbarLeft,
        headerRight: topbarRight
          ? () => topbarRight
          : isSecondary
          ? null
          : topbarRight,
        title: isSecondary ? undefined : titleProp,
        headerTitle: isSecondary
          ? () => (
              <SecondaryScreenTitle
                icon={icon!}
                title={titleProp}
                IconProps={IconProps}
              />
            )
          : headerTitleProp
      })
    )
  }, [
    navigation,
    topbarLeftStyle,
    topbarLeft,
    topbarRight,
    topbarRightStyle,
    titleProp,
    isSecondary,
    headerTitleProp,
    icon,
    IconProps
  ])

  return <View style={[styles.root, style]}>{children}</View>
}
