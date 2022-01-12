import React, { Component } from 'react'
import { push as pushRoute } from 'connected-react-router'
import { AppState } from 'store/types'
import { Dispatch } from 'redux'
import { ID } from 'common/models/Identifiers'
import { connect } from 'react-redux'
import cn from 'classnames'

import { makeGetCurrent } from 'store/queue/selectors'
import { getAudio, getPlaying } from 'store/player/selectors'
import Visualizer1 from 'utils/visualizer/visualizer-1.js'
import Toast from 'components/toast/Toast'

import styles from './VisualizerProvider.module.css'
import { MountPlacement, ComponentPlacement } from 'components/types'
import { getTheme } from 'store/application/ui/theme/selectors'
import { shouldShowDark } from 'utils/theme/theme'
import { profilePage } from 'utils/route'
import { make, TrackEvent } from 'store/analytics/actions'
import { Name } from 'common/models/Analytics'
import { useTrackCoverArt } from 'common/hooks/useImageSize'
import { Track } from 'common/models/Track'
import { SquareSizes } from 'common/models/ImageSizes'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import PlayingTrackInfo from 'containers/play-bar/desktop/components/PlayingTrackInfo'
import AudioStream from 'audio/AudioStream'
import { webglSupported } from './utils'
import { getDominantColorsByTrack } from 'store/application/ui/average-color/slice'
import { ReactComponent as IconRemove } from 'assets/img/iconRemove.svg'
import { ReactComponent as AudiusLogoHorizontal } from 'assets/img/audiusLogoHorizontal.svg'

type VisualizerProps = {
  visualizerVisible: boolean,
  onClose: () => void
} & ReturnType<typeof mapDispatchToProps> &
  ReturnType<ReturnType<typeof makeMapStateToProps>>

type VisualizerState = {
  trackId: ID | null
  trackSegment: any
  toastText: string
  fadeVisualizer: boolean // Used to fadeIn/Out the visualizer (opacity 0 -> 1) through a css class
  showVisualizer: boolean // Used to show/hide the visualizer (display: block/none) through a css class
}

const Artwork = ({ track }: { track?: Track | null }) => {
  const { track_id, _cover_art_sizes } = track || {}

  const image = useTrackCoverArt(
    track_id || -1,
    _cover_art_sizes || null,
    SquareSizes.SIZE_150_BY_150
  )
  return <DynamicImage wrapperClassName={styles.artwork} image={image} />
}

const webGLExists = webglSupported()

class Visualizer extends Component<VisualizerProps, VisualizerState> {
  state = {
    trackId: null,
    trackSegment: null,
    toastText: '',
    fadeVisualizer: false,
    showVisualizer: false,
  }

  messages = (browser: string) => ({
    text: `Heads Up! Visualizer is not fully supported in ${browser} 😢 Please switch to a different browser like Chrome to view!`
  })

  updateVisibility() {
    if (!webGLExists) return
    const { theme, recordOpen, recordClose, visualizerVisible } = this.props
    // Set visibility for the visualizer
    if (visualizerVisible) {
      if (!Visualizer1?.isShowing()) {
        const darkMode = shouldShowDark(theme)
        Visualizer1?.show(darkMode)
        recordOpen()
      }
      this.setState({ showVisualizer: true })
      setImmediate(() => {
        this.setState({ fadeVisualizer: true })
      })
    } else {
      if (Visualizer1?.isShowing()) {
        Visualizer1?.hide()
        recordClose()
      }
      this.setState({ fadeVisualizer: false })
      setTimeout(() => {
        this.setState({ showVisualizer: false })
      }, 300)
    }
  }

  updateAudioStream() {
    if (!webGLExists) return
    const { audio, playing } = this.props
    if ((audio as AudioStream).audioCtx && playing) Visualizer1?.bind(audio)
  }

  updateDominantColors() {
    if (!webGLExists) return
    const { dominantColors } = this.props
    if (Visualizer1) {
      Visualizer1.setDominantColors(dominantColors)
    }
  }

  componentDidMount() {
    if (!(window as any).AudioContext) {
      let browser
      if ((window as any).webkitAudioContext) {
        browser = 'Safari'
      } else if (window.navigator.userAgent.indexOf('MSIE ') > 0) {
        browser = 'Internet Explorer'
      } else {
        browser = 'your browser'
      }
      this.setState({ toastText: this.messages(browser).text })
    }

    this.updateVisibility()
    this.updateAudioStream()
    this.updateDominantColors()
  }

  componentWillUnmount() {
    Visualizer1?.stop()
  }

  componentDidUpdate(prevProps: VisualizerProps, prevState: VisualizerState) {
    if (this.props.theme !== prevProps.theme
      || this.props.visualizerVisible !== prevProps.visualizerVisible
      ) {
      this.updateVisibility()
      this.updateAudioStream()
      this.updateDominantColors()
      return
    } 
     
    if (this.props.audio !== prevProps.audio
      || this.props.playing !== prevProps.playing
    ) {
      this.updateAudioStream()
    } else if (this.props.dominantColors !== prevProps.dominantColors) {
      this.updateDominantColors()
    }
  }

  goToTrackPage = () => {
    const {
      currentQueueItem: { track, user },
      goToRoute
    } = this.props

    if (track && user) {
      goToRoute(track.permalink)
    }
  }

  goToArtistPage = () => {
    const {
      currentQueueItem: { user },
      goToRoute
    } = this.props

    if (user) {
      goToRoute(profilePage(user.handle))
    }
  }

  renderTrackInfo = () => {
    const {
      currentQueueItem: { uid, track, user },
      onClose,
      dominantColors,
    } = this.props
    const dominantColor = dominantColors ? dominantColors[0] : { r: 0, g: 0, b: 0 }

    return track && user && uid ?
      (
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
            onClickTrackTitle={() => {
              this.goToTrackPage()
              onClose()
            }}
            onClickArtistName={() => {
              this.goToArtistPage()
              onClose()
            }}
            hasShadow={true}
            dominantColor={dominantColor}
          />
        </div>
      )
      : null
  }

  render() {
    const {
      currentQueueItem: { track },
      visualizerVisible,
      onClose,
    } = this.props
    const { toastText, fadeVisualizer, showVisualizer } = this.state

    if (!webGLExists) return null

    return (
      <div
        className={cn(
          styles.visualizer,
          {
            [styles.fade]: fadeVisualizer,
            [styles.show]: showVisualizer,
          },
        )}
      >
        <div className='visualizer' />
        <div className={styles.logoWrapper}>
          <AudiusLogoHorizontal className={styles.logo} />
        </div>
        <IconRemove
          className={styles.closeButtonIcon}
          onClick={onClose} />
        <div className={styles.infoOverlayTileShadow}></div>
        <div className={styles.infoOverlayTile}>
          <div className={styles.artworkWrapper}
            onClick={() => {
              this.goToTrackPage()
              onClose()
            }}>
            <Artwork track={track} />
          </div>
          {this.renderTrackInfo()}
        </div>
        <Toast
          useCaret={false}
          mount={MountPlacement.BODY}
          placement={ComponentPlacement.BOTTOM}
          overlayClassName={styles.visualizerDisabled}
          open={visualizerVisible && !!toastText}
          text={toastText || ''}
        />
      </div>
    )
  }
}

const makeMapStateToProps = () => {
  const getCurrentQueueItem = makeGetCurrent()
  const mapStateToProps = (state: AppState) => {
    const currentQueueItem = getCurrentQueueItem(state)
    return {
      currentQueueItem,
      audio: getAudio(state),
      playing: getPlaying(state),
      theme: getTheme(state),
      dominantColors: getDominantColorsByTrack(state, { track: currentQueueItem.track })
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
