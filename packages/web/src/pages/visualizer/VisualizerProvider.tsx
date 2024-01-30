import { Name, SquareSizes, Track } from '@audius/common/models'
     import { useEffect, useState, useCallback } from 'react'
import { push as pushRoute } from 'connected-react-router'
import { AppState } from 'store/types'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import cn from 'classnames'

import Visualizer1 from 'utils/visualizer/visualizer-1.js'
import Toast from 'components/toast/Toast'

import styles from './VisualizerProvider.module.css'
import { MountPlacement, ComponentPlacement } from 'components/types'
import {
  Nullable,
  playerSelectors,
  queueSelectors,
  themeSelectors
} from '@audius/common'

import { shouldShowDark } from 'utils/theme/theme'
import { profilePage } from 'utils/route'
import { make, TrackEvent } from 'common/store/analytics/actions'
import { } from '@audius/common'
import { } from '@audius/common'
import { } from '@audius/common'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import PlayingTrackInfo from 'components/play-bar/desktop/components/PlayingTrackInfo'
import { webglSupported } from './utils'
import { averageColorSelectors } from '@audius/common'
import IconRemove from 'assets/img/iconRemove.svg'
import AudiusLogoHorizontal from 'assets/img/audiusLogoHorizontal.svg'
import { useTrackCoverArt } from 'hooks/useTrackCoverArt'
import { audioPlayer } from 'services/audio-player'

const { makeGetCurrent } = queueSelectors
const { getPlaying } = playerSelectors
const { getTheme } = themeSelectors
const getDominantColorsByTrack = averageColorSelectors.getDominantColorsByTrack

const Artwork = ({ track }: { track?: Track | null }) => {
  const { track_id, _cover_art_sizes } = track || {}

  const image = useTrackCoverArt(
    track_id || -1,
    _cover_art_sizes || null,
    SquareSizes.SIZE_480_BY_480
  )
  return <DynamicImage wrapperClassName={styles.artwork} image={image} />
}

type VisualizerProps = {
  isVisible: boolean
  onClose: () => void
} & ReturnType<typeof mapDispatchToProps> &
  ReturnType<ReturnType<typeof makeMapStateToProps>>

const webGLExists = webglSupported()
const messages = (browser: string) => ({
  notSupported: `Heads Up! Visualizer is not fully supported in ${browser} 😢 Please switch to a different browser like Chrome to view!`
})

const Visualizer = ({
  isVisible,
  currentQueueItem,
  playing,
  theme,
  dominantColors,
  onClose,
  recordOpen,
  recordClose,
  goToRoute
}: VisualizerProps) => {
  const [toastText, setToastText] = useState('')
  // Used to fadeIn/Out the visualizer (opacity 0 -> 1) through a css class
  const [fadeVisualizer, setFadeVisualizer] = useState<Nullable<Boolean>>(null)
  // Used to show/hide the visualizer (display: block/none) through a css class
  const [showVisualizer, setShowVisualizer] = useState(false)

  useEffect(() => {
    if (showVisualizer) {
      let browser
      if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
        browser = 'Safari'
      } else if (/MSIE/i.test(navigator.userAgent)) {
        browser = 'Internet Explorer'
      } else if (!window?.AudioContext) {
        browser = 'your browser'
      }
      if (browser) {
        setToastText(messages(browser).notSupported)
      }
    }
  }, [showVisualizer])

  // if (!webGLExists) {
  //   return null
  // }

  // Update Colors
  useEffect(() => {
    if (dominantColors !== null) {
      Visualizer1?.setDominantColors(dominantColors)
    }
  }, [isVisible, dominantColors, playing, currentQueueItem])

  // Rebind audio
  useEffect(() => {
    if (!audioPlayer) {
      return
    }
    if (playing) {
      if (audioPlayer.audioCtx) {
        Visualizer1?.bind(audioPlayer)
      } else {
        audioPlayer.audio.addEventListener('canplay', () => {
          Visualizer1?.bind(audioPlayer)
        })
      }
    }
  }, [isVisible, playing, currentQueueItem])

  useEffect(() => {
    if (isVisible) {
      const darkMode = shouldShowDark(theme)
      Visualizer1?.show(darkMode)
      recordOpen()
      setShowVisualizer(true)
      // Fade in after a 50ms delay because setting showVisualizer() and fadeVisualizer() at the
      // same time leads to a race condition resulting in the animation not fading in sometimes
      setTimeout(() => {
        setFadeVisualizer(true)
      }, 50)
    } else {
      setFadeVisualizer(false)
    }
  }, [isVisible, theme])

  // On Closing of visualizer -> fadeOut
  // Wait some time before removing the wrapper DOM element to allow time for fading out animation.
  useEffect(() => {
    if (fadeVisualizer === false) {
      setTimeout(() => {
        setShowVisualizer(false)
        Visualizer1?.hide()
        recordClose()
      }, 400)
    }
  }, [fadeVisualizer])

  const goToTrackPage = useCallback(() => {
    const { track, user } = currentQueueItem
    if (track && user) {
      goToRoute(track.permalink)
    }
  }, [currentQueueItem])

  const goToArtistPage = useCallback(() => {
    const { user } = currentQueueItem
    if (user) {
      goToRoute(profilePage(user.handle))
    }
  }, [currentQueueItem])

  const renderTrackInfo = () => {
    const { uid, track, user } = currentQueueItem
    const dominantColor = dominantColors
      ? dominantColors[0]
      : { r: 0, g: 0, b: 0 }
    return track && user && uid ? (
      <div className={styles.trackInfoWrapper}>
        <PlayingTrackInfo
          profilePictureSizes={user._profile_picture_sizes}
          trackId={track.track_id}
          isOwner={track.owner_id === user.user_id}
          trackTitle={track.title}
          trackPermalink={track.permalink}
          artistName={user.name}
          artistHandle={user.handle}
          artistUserId={user.user_id}
          isVerified={user.is_verified}
          isTrackUnlisted={track.is_unlisted}
          isStreamGated={track.is_stream_gated}
          onClickTrackTitle={() => {
            goToTrackPage()
            onClose()
          }}
          onClickArtistName={() => {
            goToArtistPage()
            onClose()
          }}
          hasShadow={true}
          dominantColor={dominantColor}
        />
      </div>
    ) : (
      <div className={styles.emptyTrackInfoWrapper}></div>
    )
  }

  const { track } = currentQueueItem
  return (
    <div
      className={cn(styles.visualizer, {
        [styles.fade]: fadeVisualizer,
        [styles.show]: showVisualizer
      })}
    >
      <div className='visualizer' />
      <div className={styles.logoWrapper}>
        <AudiusLogoHorizontal className={styles.logo} />
      </div>
      <IconRemove className={styles.closeButtonIcon} onClick={onClose} />
      <div className={styles.infoOverlayTileShadow}></div>
      <div className={styles.infoOverlayTile}>
        <div
          className={cn(styles.artworkWrapper, {
            [styles.playing]: track
          })}
          onClick={() => {
            goToTrackPage()
            onClose()
          }}
        >
          <Artwork track={track} />
        </div>
        {renderTrackInfo()}
      </div>
      <Toast
        useCaret={false}
        mount={MountPlacement.BODY}
        placement={ComponentPlacement.BOTTOM}
        overlayClassName={styles.visualizerDisabled}
        open={isVisible && !!toastText}
        text={toastText || ''}
      />
    </div>
  )
}

const makeMapStateToProps = () => {
  const getCurrentQueueItem = makeGetCurrent()
  const mapStateToProps = (state: AppState) => {
    const currentQueueItem = getCurrentQueueItem(state)
    return {
      currentQueueItem,
      playing: getPlaying(state),
      theme: getTheme(state),
      dominantColors: getDominantColorsByTrack(state, {
        track: currentQueueItem.track
      })
    }
  }
  return mapStateToProps
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  recordOpen: () => {
    const trackEvent: TrackEvent = make(Name.VISUALIZER_OPEN, {})
    dispatch(trackEvent)
  },
  recordClose: () => {
    const trackEvent: TrackEvent = make(Name.VISUALIZER_CLOSE, {})
    dispatch(trackEvent)
  },
  goToRoute: (route: string) => dispatch(pushRoute(route))
})

export default connect(makeMapStateToProps, mapDispatchToProps)(Visualizer)
