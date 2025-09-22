import { useCallback } from 'react'

import {
  audioRewardsPageActions,
  TrendingRewardsModalType
} from '@audius/common/store'
import {
  IconCaretRight,
  IconCrown,
  Flex,
  Text,
  useTheme,
  PlainButton,
  Paper
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { useIsMobile } from 'hooks/useIsMobile'

const { setTrendingRewardsModalType } = audioRewardsPageActions

const messages = {
  learnMore: 'Learn More'
}

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
  bannerType: 'tracks' | 'playlists' | 'underground'
}

const useHandleBannerClick = () => {
  const [, setModal] = useModalState('TrendingRewardsExplainer')
  const dispatch = useDispatch()
  const onClickBanner = useCallback(
    (modalType: TrendingRewardsModalType) => {
      setModal(true)
      dispatch(setTrendingRewardsModalType({ modalType }))
    },
    [dispatch, setModal]
  )
  return onClickBanner
}

const RewardsBanner = ({ bannerType }: RewardsBannerProps) => {
  const isMobile = useIsMobile()
  const onClick = useHandleBannerClick()
  const { spacing, color } = useTheme()

  return (
    <Paper
      w='100%'
      direction={isMobile ? 'column' : 'row'}
      alignItems='center'
      onClick={() => onClick(bannerType)}
      pv='m'
      ph='2xl'
      css={{
        background: color.special.gradient
      }}
    >
      <Flex
        direction={isMobile ? 'column' : 'row'}
        w='100%'
        alignItems={isMobile ? 'flex-start' : 'center'}
        gap={isMobile ? undefined : 'l'}
        css={{
          '@media (max-width: 1300px)': {
            flexDirection: 'column',
            alignItems: isMobile ? 'center' : 'flex-start',
            gap: 'unset'
          }
        }}
      >
        <Flex mb={isMobile ? 'xs' : undefined} gap={isMobile ? 'xs' : 's'}>
          <IconCrown size={isMobile ? 's' : 'm'} color='staticWhite' />
          <Text variant='title' size={isMobile ? 's' : 'l'} color='staticWhite'>
            {messageMap[bannerType].title}
          </Text>
        </Flex>
        <Text
          variant='body'
          size={isMobile ? 's' : 'l'}
          strength='strong'
          color='staticWhite'
          css={{
            opacity: 0.8,
            marginTop: isMobile ? spacing.xs : 0,
            whiteSpace: 'nowrap'
          }}
        >
          {messageMap[bannerType].description}
        </Text>
      </Flex>
      {!isMobile && (
        <PlainButton
          css={{
            pointerEvents: 'none'
          }}
          variant='inverted'
          size='large'
          iconRight={IconCaretRight}
        >
          {messages.learnMore}
        </PlainButton>
      )}
    </Paper>
  )
}

export default RewardsBanner
