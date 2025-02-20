import { useCallback, useEffect, useState } from 'react'

import { Theme } from '@audius/common/models'
import { StringKeys } from '@audius/common/services'
import {
  audioRewardsPageSelectors,
  audioRewardsPageActions,
  TrendingRewardsModalType
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import {
  SegmentedControl,
  IconArrowRight as IconArrow,
  Button,
  IconTrending,
  Text,
  Paper,
  LoadingSpinner,
  Box,
  Flex
} from '@audius/harmony'
import { useDispatch } from 'react-redux'
import { TwitterTweetEmbed } from 'react-twitter-embed'

import { useModalState } from 'common/hooks/useModalState'
import { TextLink } from 'components/link'
import ModalDrawer from 'components/modal-drawer/ModalDrawer'
import { useIsMobile } from 'hooks/useIsMobile'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useRemoteVar } from 'hooks/useRemoteConfig'
import { useSelector } from 'utils/reducer'
import { getTheme, isDarkMode } from 'utils/theme/theme'

const { TRENDING_PAGE, TRENDING_PLAYLISTS_PAGE, TRENDING_UNDERGROUND_PAGE } =
  route
const { getTrendingRewardsModalType } = audioRewardsPageSelectors
const { setTrendingRewardsModalType } = audioRewardsPageActions

const messages = {
  tracksTitle: 'Top 5 Tracks Each Week Receive 100 $AUDIO',
  playlistTitle: 'Top 5 Playlists Each Week Receive 100 $AUDIO',
  undergroundTitle: 'Top 5 Tracks Each Week Receive 100 $AUDIO',
  winners: 'Winners are selected every Friday at Noon PT!',
  lastWeek: "LAST WEEK'S WINNERS",
  tracks: 'Tracks',
  topTracks: 'Top Tracks',
  playlists: 'Playlists',
  topPlaylists: 'Top Playlists',
  underground: 'Underground',
  terms: 'Terms and Conditions Apply',
  tracksModalTitle: 'Top 5 Trending Tracks',
  playlistsModalTitle: 'Top 5 Trending Playlists',
  undergroundModalTitle: 'Top 5 Underground Trending Tracks',
  buttonTextTracks: 'Current Trending Tracks',
  buttonTextPlaylists: 'Current Trending Playlists',
  buttonTextUnderground: 'Current Underground Trending Tracks',
  mobileButtonTextTracks: 'Trending Tracks',
  mobileButtonTextPlaylists: 'Trending Playlists',
  mobileButtonTextUnderground: 'Underground Trending Tracks',
  arrowCurveUp: 'arrow-curve-up',
  chartBar: 'chart-bar',
  chartIncreasing: 'chart-increasing'
}

const TRENDING_PAGES = {
  tracks: TRENDING_PAGE,
  playlists: TRENDING_PLAYLISTS_PAGE,
  underground: TRENDING_UNDERGROUND_PAGE
}

const textMap = {
  playlists: {
    modalTitle: messages.playlistsModalTitle,
    title: messages.playlistTitle,
    button: messages.buttonTextPlaylists,
    buttonMobile: messages.mobileButtonTextPlaylists,
    icon: messages.arrowCurveUp
  },
  tracks: {
    modalTitle: messages.tracksModalTitle,
    title: messages.tracksTitle,
    button: messages.buttonTextTracks,
    buttonMobile: messages.mobileButtonTextTracks,
    icon: messages.chartIncreasing
  },
  underground: {
    modalTitle: messages.undergroundModalTitle,
    title: messages.undergroundTitle,
    button: messages.buttonTextUnderground,
    buttonMobile: messages.mobileButtonTextUnderground,
    icon: messages.chartBar
  }
}

const TOS_URL = 'https://blog.audius.co/posts/audio-rewards'

// Getters and setters for whether we're looking at
// trending playlists or trending tracks
const useRewardsType = (): [
  TrendingRewardsModalType,
  (type: TrendingRewardsModalType) => void
] => {
  const dispatch = useDispatch()
  const rewardsType = useSelector(getTrendingRewardsModalType)
  const setTrendingRewardsType = useCallback(
    (type: TrendingRewardsModalType) => {
      dispatch(setTrendingRewardsModalType({ modalType: type }))
    },
    [dispatch]
  )
  return [rewardsType, setTrendingRewardsType]
}

const useTweetId = (type: TrendingRewardsModalType) => {
  const tracksId = useRemoteVar(StringKeys.REWARDS_TWEET_ID_TRACKS)
  const playlistsId = useRemoteVar(StringKeys.REWARDS_TWEET_ID_PLAYLISTS)
  const undergroundId = useRemoteVar(StringKeys.REWARDS_TWEET_ID_UNDERGROUND)
  return {
    tracks: tracksId,
    playlists: playlistsId,
    underground: undergroundId
  }[type]
}

const shouldUseDarkTwitter = () => {
  const theme = getTheme()
  return theme === Theme.MATRIX || isDarkMode()
}

const TrendingRewardsModal = () => {
  const [isOpen, setOpen] = useModalState('TrendingRewardsExplainer')
  const [modalType, setModalType] = useRewardsType()

  const isMobile = useIsMobile()
  const tabOptions = [
    {
      key: 'tracks',
      text: isMobile ? messages.tracks : messages.topTracks
    },
    {
      key: 'playlists',
      text: isMobile ? messages.playlists : messages.topPlaylists
    },
    {
      key: 'underground',
      text: messages.underground
    }
  ]

  const navigate = useNavigateToPage()

  const onButtonClick = useCallback(() => {
    const page = TRENDING_PAGES[modalType]
    navigate(page)
    setOpen(false)
  }, [navigate, modalType, setOpen])

  // If we change type, show the spinner again
  const [showSpinner, setShowSpinner] = useState(true)
  useEffect(() => {
    setShowSpinner(true)
  }, [modalType])

  const tweetId = useTweetId(modalType)

  return (
    <ModalDrawer
      newModal
      size='medium'
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      title={textMap[modalType].modalTitle}
      icon={<IconTrending />}
    >
      <Flex column gap='2xl' alignItems='center' w='100%'>
        <SegmentedControl
          options={tabOptions}
          selected={modalType}
          onSelectOption={(option) =>
            setModalType(option as TrendingRewardsModalType)
          }
        />
        <Flex column gap='s' alignItems='center'>
          <Text variant='heading' color='accent'>
            {textMap[modalType].title}
          </Text>
          <Text variant='body' size='l'>
            {messages.winners}
          </Text>
        </Flex>
        <Paper
          column
          css={{ backgroundColor: '#F3F0F7' }}
          shadow='inset'
          w='100%'
          p='xl'
          gap='l'
          alignItems='center'
        >
          <Text
            variant='heading'
            strength='strong'
            color='heading'
            textAlign='center'
          >
            {messages.lastWeek}
          </Text>
          <Box w={isMobile ? 300 : 500} h={isMobile ? 330 : 360}>
            {showSpinner && (
              <Box
                css={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <LoadingSpinner />
              </Box>
            )}
            <TwitterTweetEmbed
              // Refresh it when we toggle
              key={`twitter-${modalType}`}
              tweetId={tweetId}
              onLoad={() => setShowSpinner(false)}
              options={{
                theme: shouldUseDarkTwitter() ? 'dark' : 'light',
                cards: 'none',
                conversation: 'none',
                hide_thread: true,
                width: isMobile ? 300 : 500,
                height: isMobile ? 330 : 360
              }}
            />
          </Box>
        </Paper>
        <Flex column w='100%' gap='l'>
          <Button
            variant='primary'
            onClick={onButtonClick}
            iconRight={IconArrow}
            fullWidth
          >
            {textMap[modalType][isMobile ? 'buttonMobile' : 'button']}
          </Button>
          <Box alignSelf='center'>
            <TextLink isExternal to={TOS_URL}>
              {messages.terms}
            </TextLink>
          </Box>
        </Flex>
      </Flex>
    </ModalDrawer>
  )
}

export default TrendingRewardsModal
