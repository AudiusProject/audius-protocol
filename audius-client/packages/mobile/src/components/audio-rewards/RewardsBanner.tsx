import { useCallback } from 'react'

import { setTrendingRewardsModalType } from 'audius-client/src/common/store/pages/audio-rewards/slice'
import { setVisibility } from 'audius-client/src/common/store/ui/modals/slice'
import { Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import IconCrown from 'app/assets/images/iconCrown.svg'
import { Tile } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  rewards: '$audio rewards',
  tracks: 'top 5 tracks each week win $audio',
  playlists: 'top 5 playlists each week win $audio',
  underground: 'top 5 tracks each week win $audio',
  learnMore: 'learn more'
}

const useStyles = makeStyles(({ typography, palette, spacing }) => ({
  root: {
    marginTop: spacing(3),
    marginHorizontal: spacing(3)
  },
  tile: {
    borderWidth: 0
  },
  tileContent: {
    marginVertical: spacing(2),
    alignItems: 'center'
  },
  iconCrown: {
    fill: palette.staticWhite,
    height: 22,
    width: 22,
    marginRight: spacing(1)
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(1)
  },
  titleText: {
    fontSize: 20,
    fontFamily: typography.fontByWeight.heavy,
    color: palette.staticWhite,
    textTransform: 'uppercase'
  },
  descriptionText: {
    ...typography.h2,
    marginBottom: 0,
    color: palette.staticWhite,
    textTransform: 'uppercase'
  }
}))

type RewardsBannerProps = {
  type: 'tracks' | 'playlists' | 'underground'
}

export const RewardsBanner = (props: RewardsBannerProps) => {
  const { type } = props
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()
  const { pageHeaderGradientColor1, pageHeaderGradientColor2 } =
    useThemeColors()

  const handlePress = useCallback(() => {
    dispatchWeb(setTrendingRewardsModalType({ modalType: type }))
    dispatchWeb(
      setVisibility({ modal: 'TrendingRewardsExplainer', visible: true })
    )
  }, [dispatchWeb, type])

  return (
    <Tile
      as={LinearGradient}
      colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]}
      start={{ x: 1, y: 1 }}
      end={{ x: 0, y: 0 }}
      styles={{
        root: styles.root,
        tile: styles.tile,
        content: styles.tileContent
      }}
      onPress={handlePress}>
      <View style={styles.title}>
        <IconCrown
          style={styles.iconCrown}
          fill={styles.iconCrown.fill}
          height={styles.iconCrown.height}
          width={styles.iconCrown.width}
        />
        <Text style={styles.titleText}>{messages.rewards}</Text>
      </View>
      <Text style={styles.descriptionText}>{messages[type]}</Text>
    </Tile>
  )
}
