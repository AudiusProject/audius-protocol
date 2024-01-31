import { useCallback } from 'react'

import { audioRewardsPageActions, modalsActions } from '@audius/common'
import { Text, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useDispatch } from 'react-redux'

import { IconCrown } from '@audius/harmony-native'
import { Tile } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'
const { setVisibility } = modalsActions
const { setTrendingRewardsModalType } = audioRewardsPageActions

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
  const dispatch = useDispatch()
  const { pageHeaderGradientColor1, pageHeaderGradientColor2 } =
    useThemeColors()

  const handlePress = useCallback(() => {
    dispatch(setTrendingRewardsModalType({ modalType: type }))
    dispatch(
      setVisibility({ modal: 'TrendingRewardsExplainer', visible: true })
    )
  }, [dispatch, type])

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
      onPress={handlePress}
    >
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
