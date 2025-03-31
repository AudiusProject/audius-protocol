import { useMemo, type ComponentType, type ReactNode } from 'react'

import type { ImageSourcePropType } from 'react-native'
import { Image } from 'react-native'
import type { SvgProps } from 'react-native-svg'

import { Flex } from '@audius/harmony-native'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

const useStyles = makeStyles(({ palette }) => ({
  iconColor: {
    color: palette.secondary
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
  emoji?: ReactNode
} & (SVGProps | ImageProps)

export const NotificationHeader = (props: NotificationHeaderProps) => {
  const styles = useStyles()
  const { children } = props

  const iconElement = useMemo(() => {
    if (props.emoji) {
      return props.emoji
    } else if ('icon' in props) {
      return <props.icon fill={styles.iconColor.color} height={30} width={30} />
    }
    return <Image source={props.imageSource} style={styles.image} />
  }, [props, styles.iconColor.color, styles.image])

  return (
    <Flex row alignItems='center' borderBottom='default' pb='l' mb='l' gap='m'>
      {iconElement}
      {children}
    </Flex>
  )
}
