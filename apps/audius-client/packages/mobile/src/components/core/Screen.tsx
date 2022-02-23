import { ReactElement, ReactNode, useEffect } from 'react'

import { useNavigation } from '@react-navigation/native'
import { Nullable } from 'audius-client/src/common/utils/typeUtils'
import { StyleProp, View, ViewStyle } from 'react-native'

import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ palette }, { variant }) => ({
  root: {
    height: '100%',
    backgroundColor:
      variant === 'primary' ? palette.background : palette.backgroundSecondary,
    // TODO: figure out why screens need this. Likel related to the BottomTabNavigator
    paddingBottom: 80
  }
}))

type ScreenProps = {
  children: ReactNode
  topbarLeft?: Nullable<ReactElement>
  topbarRight?: Nullable<ReactElement>
  title?: string
  style?: StyleProp<ViewStyle>
  variant?: 'primary' | 'secondary'
}
export const Screen = (props: ScreenProps) => {
  const {
    children,
    topbarLeft,
    topbarRight,
    title,
    variant = 'primary'
  } = props
  const styles = useStyles({ variant })
  const navigation = useNavigation()

  useEffect(() => {
    navigation.setOptions({
      headerLeft: topbarLeft === undefined ? undefined : () => topbarLeft,
      headerRight: topbarRight === undefined ? undefined : () => topbarRight,
      title
    })
  }, [navigation, topbarLeft, topbarRight, title])

  return <View style={styles.root}>{children}</View>
}
