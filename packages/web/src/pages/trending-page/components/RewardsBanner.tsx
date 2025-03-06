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
  PlainButton
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
    description:
      'Artists Trending on Friday at 12 PM PT Automatically Earn Tokens!'
  },
  playlists: {
    title: 'Trending Playlists: Weekly Top 5',
    description: 'Playlists Trending on Friday at 12 PM PT Earn Tokens!'
  },
  underground: {
    title: 'Underground Trending: Weekly Top 5',
    description: 'Artists Trending on Friday at 12 PM PT Earn Tokens!'
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
  const { spacing, motion, color } = useTheme()

  return (
    <Flex
      borderRadius='m'
      w='100%'
      direction={isMobile ? 'column' : 'row'}
      alignItems='center'
      onClick={() => onClick(bannerType)}
      pv='m'
      ph='2xl'
      css={{
        background: 'linear-gradient(315deg, #5B23E1 0%, #A22FEB 100%)',
        color: color.text.staticWhite,
        transition: motion.expressive,
        cursor: 'pointer',
        transform: 'scale3d(1, 1, 1)',
        '&:hover': {
          transform: 'scale3d(1.01, 1.01, 1.01)'
        },
        '&:active': {
          transform: 'scale3d(0.99, 0.99, 0.99)'
        },
        '& path': {
          fill: color.text.staticWhite
        }
      }}
    >
      <Flex
        direction={isMobile ? 'column' : 'row'}
        w='100%'
        alignItems={isMobile ? 'flex-start' : 'center'}
        gap={isMobile ? undefined : 'l'}
      >
        <Flex alignItems='center' mb={isMobile ? 'xs' : undefined} gap='s'>
          <IconCrown size='l' />
          <Text variant='title' size='l' color='staticWhite'>
            {messageMap[bannerType].title}
          </Text>
        </Flex>
        <Text
          variant='body'
          size='l'
          strength='strong'
          css={{
            opacity: 0.8,
            marginTop: isMobile ? spacing.xs : 0,
            whiteSpace: isMobile ? 'normal' : 'nowrap'
          }}
        >
          {messageMap[bannerType].description}
        </Text>
      </Flex>
      {!isMobile && (
        <PlainButton variant='inverted' size='large' iconRight={IconCaretRight}>
          {messages.learnMore}
        </PlainButton>
      )}
    </Flex>
  )
}

export default RewardsBanner
