import React, { Component } from 'react'
import { AppState } from 'store/types'
import { Dispatch } from 'redux'
import { ID } from 'common/models/Identifiers'
import { connect } from 'react-redux'
import cn from 'classnames'

import { makeGetCurrent } from 'store/queue/selectors'
import { getAudio, getPlaying } from 'store/player/selectors'
import Visualizer1 from 'utils/visualizer/visualizer-1.js'
import Toast from 'components/toast/Toast'

import TrackInfo from 'components/track/TrackInfo'

import styles from './VisualizerProvider.module.css'
import { MountPlacement, ComponentPlacement } from 'components/types'
import { getTheme } from 'store/application/ui/theme/selectors'
import { shouldShowDark } from 'utils/theme/theme'
import { make, TrackEvent } from 'store/analytics/actions'
import { Name } from 'common/models/Analytics'
import { useTrackCoverArt } from 'hooks/useImageSize'
import { Track } from 'common/models/Track'
import { SquareSizes } from 'common/models/ImageSizes'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import AudioStream from 'audio/AudioStream'
import { webglSupported } from './utils'

type VisualizerProps = {
  visualizerVisible: boolean
} & ReturnType<typeof mapDispatchToProps> &
  ReturnType<ReturnType<typeof makeMapStateToProps>>

type VisualizerState = {
  trackId: ID | null
  trackSegment: any
  toastText: string
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
    toastText: ''
  }

  messages = (browser: string) => ({
    text: `Heads Up! Visualizer is not fully supported in ${browser} 😢 Please switch to a different browser like Chrome to view!`
  })

  updateVisibility() {
    if (!webGLExists) return
    const { audio, playing, theme, recordOpen, recordClose } = this.props

    // Set visibility for the visualizer
    if (this.props.visualizerVisible) {
      if (!Visualizer1?.isShowing()) {
        const darkMode = shouldShowDark(theme)
        Visualizer1?.show(darkMode)
        recordOpen()
      }
    } else {
      if (Visualizer1?.isShowing()) {
        Visualizer1?.hide()
        recordClose()
      }
    }
    // Rebind audio
    if ((audio as AudioStream).audioCtx && playing) Visualizer1?.bind(audio)
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
  }

  componentWillUnmount() {
    Visualizer1?.stop()
  }

  componentDidUpdate() {
    this.updateVisibility()
  }

  render() {
    const {
      currentQueueItem: { track, user },
      visualizerVisible
    } = this.props
    const { toastText } = this.state

    if (!webGLExists) return null

    return (
      <div
        className={cn(
          { [styles.hideWrapper]: !visualizerVisible },
          styles.visualizer
        )}
      >
        <div className='visualizer' />
        <div className={styles.infoOverlayTile}>
          <div className={styles.artworkWrapper}>
            <Artwork track={track} />
          </div>
          <div className={styles.trackInfo}>
            <TrackInfo
              trackTitle={track?.title ?? ''}
              artistName={user?.name ?? ''}
              userId={user?.user_id ?? 0}
              size={'extraLarge'}
              popover={false}
              shadow
            />
          </div>
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
  const mapStateToProps = (state: AppState) => ({
    currentQueueItem: getCurrentQueueItem(state),
    audio: getAudio(state),
    playing: getPlaying(state),
    theme: getTheme(state)
  })
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
  }
})

export default connect(makeMapStateToProps, mapDispatchToProps)(Visualizer)
