import { StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import IconHidden from 'app/assets/images/iconHidden.svg'
import IconStar from 'app/assets/images/iconStar.svg'
import { useThemeColors } from 'app/utils/theme'

const styles = StyleSheet.create({
  bannerIcon: {
    position: 'absolute',
    zIndex: 10,
    width: 80,
    height: 80,
    overflow: 'hidden',
    borderRadius: 8,

    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3
  },

  container: {
    position: 'absolute',
    transform: [{ rotate: '45deg' }, { translateX: -68 }],
    width: 80,
    height: 80
  },
  icon: {
    marginTop: 4,
    marginLeft: 4
  }
})

export enum LineupTileBannerIconType {
  STAR = 'star',
  HIDDEN = 'hidden'
}

export const LineupTileBannerIcon = ({
  type
}: {
  type: LineupTileBannerIconType
}) => {
  const {
    neutral,
    neutralLight3,
    pageHeaderGradientColor2,
    secondary,
    staticWhite
  } = useThemeColors()

  const { icon: Icon, colors } = {
    [LineupTileBannerIconType.STAR]: {
      icon: IconStar,
      colors: [secondary, pageHeaderGradientColor2]
    },
    [LineupTileBannerIconType.HIDDEN]: {
      icon: IconHidden,
      colors: [neutral, neutralLight3]
    }
  }[type]

  return (
    <View style={styles.bannerIcon}>
      <LinearGradient
        colors={colors}
        style={[styles.container]}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
      />
      <Icon fill={staticWhite} height={16} width={16} style={styles.icon} />
    </View>
  )
}
