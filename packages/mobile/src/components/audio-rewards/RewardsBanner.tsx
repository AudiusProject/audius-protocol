import { useCallback } from 'react'

import { audioRewardsPageActions, modalsActions } from '@audius/common/store'
import LinearGradient from 'react-native-linear-gradient'
import { useDispatch } from 'react-redux'

import { IconCrown, Flex, Text, Paper } from '@audius/harmony-native'
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

type RewardsBannerProps = {
  bannerType?: 'tracks' | 'playlists' | 'underground'
}

export const RewardsBanner = (props: RewardsBannerProps) => {
  const { bannerType = 'tracks' } = props
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
    <Paper m='l' mb={0} onPress={handlePress}>
      <LinearGradient
        colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={{ width: '100%', borderRadius: 8 }}
      >
        <Flex direction='column' alignItems='center' style={{ padding: 16 }}>
          <Flex direction='row' alignItems='center' gap='xs'>
            <IconCrown size='s' color='staticWhite' />
            <Text variant='title' size='s' color='staticWhite'>
              {messageContent.title}
            </Text>
          </Flex>
          <Text
            variant='body'
            size='s'
            strength='strong'
            color='staticWhite'
            textAlign='center'
            style={{ opacity: 0.8 }}
          >
            {messageContent.description}
          </Text>
        </Flex>
      </LinearGradient>
    </Paper>
  )
}
