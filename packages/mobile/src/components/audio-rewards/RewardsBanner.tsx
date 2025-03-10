import { useCallback } from 'react'

import { audioRewardsPageActions, modalsActions } from '@audius/common/store'
import LinearGradient from 'react-native-linear-gradient'
import { useDispatch } from 'react-redux'

import { IconCrown, Flex, Text } from '@audius/harmony-native'
import { Tile } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'
const { setVisibility } = modalsActions
const { setTrendingRewardsModalType } = audioRewardsPageActions

const messageMap = {
  tracks: {
    title: 'Global Trending: Weekly Top 5',
    description: 'Artists trending Fridays at 12PM PT win tokens!'
  },
  playlists: {
    title: 'Trending Playlists: Weekly Top 5',
    description: 'Playlists trending Fridays at 12PM PT win tokens!'
  },
  underground: {
    title: 'Underground Trending: Weekly Top 5',
    description: 'Artists trending Fridays at 12PM PT win tokens!'
  }
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
    paddingHorizontal: spacing(4),
    alignItems: 'center'
  }
}))

type RewardsBannerProps = {
  bannerType?: 'tracks' | 'playlists' | 'underground'
}

export const RewardsBanner = (props: RewardsBannerProps) => {
  const { bannerType = 'tracks' } = props
  const styles = useStyles()
  const dispatch = useDispatch()
  const { pageHeaderGradientColor1, pageHeaderGradientColor2 } =
    useThemeColors()

  const handlePress = useCallback(() => {
    dispatch(setTrendingRewardsModalType({ modalType: bannerType }))
    dispatch(
      setVisibility({ modal: 'TrendingRewardsExplainer', visible: true })
    )
  }, [dispatch, bannerType])

  // Get message content safely
  const messageContent = messageMap[bannerType] || messageMap.tracks

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
      <Flex direction='column' alignItems='center' w='100%'>
        <Flex direction='row' alignItems='center' mb='xs'>
          <IconCrown size='s' color='staticWhite' style={{ marginRight: 8 }} />
          <Text variant='title' size='s' color='staticWhite'>
            {messageContent.title}
          </Text>
        </Flex>
        <Text
          variant='body'
          size='s'
          strength='strong'
          color='staticWhite'
          style={{ opacity: 0.8, textAlign: 'center' }}
        >
          {messageContent.description}
        </Text>
      </Flex>
    </Tile>
  )
}
