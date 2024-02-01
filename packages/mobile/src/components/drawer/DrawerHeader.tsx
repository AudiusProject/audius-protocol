import type { ComponentType, ReactNode } from 'react'

import type { ImageSourcePropType } from 'react-native'
import { TouchableOpacity, View, Image } from 'react-native'

import { IconClose } from '@audius/harmony-native'
import { Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import type { SvgProps } from 'app/types/svg'
import { useColor } from 'app/utils/theme'

type DrawerHeaderProps = {
  onClose: () => void
  title?: ReactNode
  titleIcon?: ComponentType<SvgProps>
  titleImage?: ImageSourcePropType
  isFullscreen?: boolean
}

export const useStyles = makeStyles(({ spacing }) => ({
  titleBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(8)
  },

  dismissContainer: {
    position: 'absolute',
    top: spacing(6),
    left: spacing(6)
  },

  titleContainer: {
    flexDirection: 'row',
    columnGap: spacing(2)
  },
  titleImage: {
    height: spacing(6),
    width: spacing(6)
  }
}))

export const DrawerHeader = (props: DrawerHeaderProps) => {
  const {
    onClose,
    title,
    titleIcon: TitleIcon,
    titleImage,
    isFullscreen
  } = props
  const styles = useStyles()
  const iconRemoveColor = useColor('neutralLight4')
  const titleIconColor = useColor('neutral')

  return title || isFullscreen ? (
    <View style={styles.titleBarContainer}>
      {isFullscreen ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onClose}
          style={styles.dismissContainer}
        >
          <IconClose width={30} height={30} fill={iconRemoveColor} />
        </TouchableOpacity>
      ) : null}
      {title ? (
        <View style={styles.titleContainer}>
          {TitleIcon ? (
            <TitleIcon height={22} width={22} fill={titleIconColor} />
          ) : null}
          {titleImage ? (
            <Image style={styles.titleImage} source={titleImage} />
          ) : null}
          <Text fontSize='xl' weight='heavy' textTransform='uppercase'>
            {title}
          </Text>
        </View>
      ) : null}
    </View>
  ) : (
    <View />
  )
}
