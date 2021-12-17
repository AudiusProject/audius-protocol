import React, { useCallback } from 'react'

import { StringKeys } from 'audius-client/src/common/services/remote-config'
import { getTrendingRewardsModalType } from 'audius-client/src/common/store/pages/audio-rewards/selectors'
import {
  setTrendingRewardsModalType,
  TrendingRewardsModalType
} from 'audius-client/src/common/store/pages/audio-rewards/slice'
import {
  getModalVisibility,
  setVisibility
} from 'audius-client/src/common/store/ui/modals/slice'
import {
  TRENDING_PAGE,
  TRENDING_PLAYLISTS_PAGE,
  TRENDING_UNDERGROUND_PAGE
} from 'audius-client/src/utils/route'
import { push } from 'connected-react-router'
import {
  Image,
  ImageStyle,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View
} from 'react-native'

import ChartIncreasing from 'app/assets/images/emojis/chart-increasing.png'
import ButtonWithArrow from 'app/components/button-with-arrow'
import Drawer from 'app/components/drawer'
import GradientText from 'app/components/gradient-text'
import TabSlider from 'app/components/tab-slider'
import Text from 'app/components/text'
import TweetEmbed from 'app/components/tweet-embed'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useRemoteVar } from 'app/hooks/useRemoteConfig'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import Theme from 'app/models/Theme'
import { ThemeColors, useThemeVariant } from 'app/utils/theme'

const TRENDING_REWARDS_DRAWER_NAME = 'TrendingRewardsExplainer'
const TOS_URL = 'https://blog.audius.co/posts/audio-rewards'

const messages = {
  tracksTitle: 'Top 5 Tracks Each Week Receive 100 $AUDIO',
  playlistTitle: 'Top 5 Playlists Each Week Receive 100 $AUDIO',
  undergroundTitle: 'Top 5 Tracks Each Week Receive 100 $AUDIO',
  winners: 'Winners are selected every Friday at Noon PT!',
  lastWeek: "LAST WEEK'S WINNERS",
  tracks: 'TRACKS',
  playlists: 'PLAYLISTS',
  underground: 'UNDERGROUND',
  terms: 'Terms and Conditions Apply',
  tracksModalTitle: 'Top 5 Trending Tracks',
  playlistsModalTitle: 'Top 5 Trending Playlists',
  undergroundModalTitle: 'Top 5 Underground Trending Tracks',
  buttonTextTracks: 'Trending Tracks',
  buttonTextPlaylists: 'Trending Playlists',
  buttonTextUnderground: 'Underground Trending Tracks'
}

// TODO: Update these when RN pages are built
const TRENDING_PAGES = {
  tracks: TRENDING_PAGE,
  playlists: TRENDING_PLAYLISTS_PAGE,
  underground: TRENDING_UNDERGROUND_PAGE
}

const textMap = {
  playlists: {
    modalTitle: messages.playlistsModalTitle,
    title: messages.playlistTitle,
    button: messages.buttonTextPlaylists
  },
  tracks: {
    modalTitle: messages.tracksModalTitle,
    title: messages.tracksTitle,
    button: messages.buttonTextTracks
  },
  underground: {
    modalTitle: messages.undergroundModalTitle,
    title: messages.undergroundTitle,
    button: messages.buttonTextUnderground
  }
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    content: {
      height: '100%',
      width: '100%',
      paddingBottom: 32
    },
    modalTitleContainer: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingHorizontal: 32,
      marginTop: 8,
      marginBottom: 16
    },
    modalTitle: {
      textAlign: 'center',
      fontSize: 24
    },
    chartEmoji: {
      height: 24,
      width: 24,
      marginTop: 4,
      marginRight: 12
    },
    titles: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: 32,
      marginTop: 32
    },
    title: {
      color: themeColors.secondary,
      fontSize: 14,
      marginBottom: 8
    },
    subtitle: {
      color: themeColors.neutralLight4,
      fontSize: 13
    },
    lastWeek: {
      textAlign: 'center',
      marginBottom: 16,
      fontSize: 24
    },
    button: { marginTop: 16, marginHorizontal: 16, marginBottom: 8 },
    terms: {
      marginBottom: 16,
      fontSize: 12,
      textAlign: 'center',
      width: '100%',
      textDecorationLine: 'underline'
    }
  })

// Getters and setters for whether we're looking at
// trending playlists or trending tracks
const useRewardsType = (): [
  TrendingRewardsModalType,
  (type: TrendingRewardsModalType) => void
] => {
  const dispatch = useDispatchWeb()
  const rewardsType = useSelectorWeb(getTrendingRewardsModalType)
  const setTrendingRewardsType = useCallback(
    (type: TrendingRewardsModalType) => {
      dispatch(setTrendingRewardsModalType({ modalType: type }))
    },
    [dispatch]
  )
  return [rewardsType ?? 'tracks', setTrendingRewardsType]
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

const useIsDark = () => {
  const themeVariant = useThemeVariant()
  return themeVariant === Theme.DARK
}

const TrendingRewardsDrawer = () => {
  const dispatchWeb = useDispatchWeb()
  const styles = useThemedStyles(createStyles)
  const [modalType, setModalType] = useRewardsType()
  const isDark = useIsDark()

  const isOpen = useSelectorWeb(state =>
    getModalVisibility(state, TRENDING_REWARDS_DRAWER_NAME)
  )

  const tweetId = useTweetId(modalType)

  const handleClose = useCallback(() => {
    dispatchWeb(
      setVisibility({ modal: TRENDING_REWARDS_DRAWER_NAME, visible: false })
    )
  }, [dispatchWeb])

  const tabOptions = [
    {
      key: 'tracks',
      text: messages.tracks
    },
    {
      key: 'playlists',
      text: messages.playlists
    },
    {
      key: 'underground',
      text: messages.underground
    }
  ]

  const onButtonPress = useCallback(() => {
    const page = TRENDING_PAGES[modalType]
    dispatchWeb(push(page))
    handleClose()
  }, [dispatchWeb, modalType, handleClose])

  const onPressToS = useCallback(() => {
    Linking.openURL(TOS_URL)
  }, [])

  return (
    <Drawer
      isFullscreen
      isOpen={isOpen}
      onClose={handleClose}
      isGestureSupported={false}
    >
      <View style={styles.content}>
        <View style={styles.modalTitleContainer}>
          <Image
            style={styles.chartEmoji as ImageStyle}
            source={ChartIncreasing}
          />
          <GradientText
            text={textMap[modalType].modalTitle}
            style={styles.modalTitle}
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <TabSlider
            options={tabOptions}
            selected={modalType}
            onSelectOption={option =>
              setModalType(option as TrendingRewardsModalType)
            }
            key={`rewards-slider-${tabOptions.length}`}
          />
          <View style={styles.titles}>
            <Text style={styles.title} weight='bold'>
              {textMap[modalType].title}
            </Text>
            <Text style={styles.subtitle} weight='bold'>
              {messages.winners}
            </Text>
          </View>

          <GradientText text={messages.lastWeek} style={styles.lastWeek} />
          <TweetEmbed
            // Refresh it when we toggle
            key={`twitter-${tweetId}`}
            tweetId={tweetId}
            options={{
              theme: isDark ? 'dark' : 'light',
              cards: 'none',
              conversation: 'none',
              hide_thread: true
            }}
          />

          <View style={styles.button}>
            <ButtonWithArrow
              title={textMap[modalType].button}
              onPress={onButtonPress}
            />
          </View>
          <TouchableWithoutFeedback onPress={onPressToS}>
            <Text style={styles.terms}>{messages.terms}</Text>
          </TouchableWithoutFeedback>
        </ScrollView>
      </View>
    </Drawer>
  )
}

export default TrendingRewardsDrawer
