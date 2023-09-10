import type { ComponentType, ReactNode } from 'react'

import type { ImageSourcePropType } from 'react-native'
import { View, Image } from 'react-native'
import type { SvgProps } from 'react-native-svg'

import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

const useStyles = makeStyles(({ palette }) => ({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: palette.neutralLight8,
    borderBottomWidth: 1,
    paddingBottom: spacing(4),
    marginBottom: spacing(4)
  },
  iconColor: {
    color: palette.secondary
  },
  icon: {
    marginRight: spacing(2)
  },
  image: {
    height: spacing(7),
    width: spacing(7),
    marginBottom: spacing(1)
  }
}))

type SVGProps = {
  icon: ComponentType<SvgProps>
}

type ImageProps = {
  imageSource: ImageSourcePropType
}

type NotificationHeaderProps = {
  children: ReactNode
} & (SVGProps | ImageProps)

export const NotificationHeader = (props: NotificationHeaderProps) => {
  const styles = useStyles()
  const { children } = props

  const iconElement =
    'icon' in props ? (
      <props.icon
        fill={styles.iconColor.color}
        height={30}
        width={30}
        style={styles.icon}
      />
    ) : (
      <Image source={props.imageSource} style={[styles.image, styles.icon]} />
    )

  return (
    <View style={styles.root}>
      {iconElement}
      {children}
    </View>
  )
}
