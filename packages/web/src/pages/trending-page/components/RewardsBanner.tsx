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
  useTheme
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { useIsMobile } from 'hooks/useIsMobile'

const { setTrendingRewardsModalType } = audioRewardsPageActions

const messages = {
  learnMore: 'LEARN MORE'
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
      css={{
        padding: '9px 34px',
        background: color.special.gradient,
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
        css={{
          marginRight: isMobile ? 'unset' : 'auto',
          marginBottom: isMobile ? spacing.s : 0,
          width: isMobile ? '100%' : 'auto'
        }}
        alignItems={isMobile ? 'flex-start' : 'center'}
        gap={isMobile ? undefined : 'l'}
      >
        <Flex
          alignItems='center'
          css={{
            marginBottom: isMobile ? spacing.xs : 0
          }}
          gap='s'
        >
          <IconCrown size='l' />
          <Text variant='title' color='staticWhite'>
            {messageMap[bannerType].title}
          </Text>
        </Flex>
        <Text
          variant='body'
          size='l'
          strength={isMobile ? 'strong' : 'weak'}
          css={{
            marginLeft: isMobile ? 0 : spacing.s,
            marginTop: isMobile ? spacing.xs : 0,
            whiteSpace: isMobile ? 'normal' : 'nowrap'
          }}
        >
          {messageMap[bannerType].description}
        </Text>
      </Flex>
      {!isMobile && (
        <Flex
          css={{
            marginLeft: 'auto'
          }}
          alignItems='center'
        >
          <Text variant='label' size='l' strength='strong'>
            {messages.learnMore}
          </Text>
          <IconCaretRight size='s' css={{ marginLeft: spacing.xs }} />
        </Flex>
      )}
    </Flex>
  )
}

export default RewardsBanner
