import { Component } from 'react'

import { useCurrentUserId, useTracks, useUser } from '@audius/common/api'
import { useCurrentTrack } from '@audius/common/hooks'
import { Name, RepostSource, PlaybackSource, Kind } from '@audius/common/models'
import {
  lineupSelectors,
  queueActions,
  RepeatMode,
  tracksSocialActions,
  themeSelectors,
  playerActions,
  playerSelectors,
  playbackRateValueMap
} from '@audius/common/store'
import { Genre, route } from '@audius/common/utils'
import { removeHotkeys, setupHotkeys, Scrubber } from '@audius/harmony'
import { connect } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import PlayButton from 'components/play-bar/PlayButton'
import VolumeBar from 'components/play-bar/VolumeBar'
import NextButtonProvider from 'components/play-bar/next-button/NextButtonProvider'
import PreviousButtonProvider from 'components/play-bar/previous-button/PreviousButtonProvider'
import RepeatButtonProvider from 'components/play-bar/repeat-button/RepeatButtonProvider'
import ShuffleButtonProvider from 'components/play-bar/shuffle-button/ShuffleButtonProvider'
import { audioPlayer } from 'services/audio-player'
import { getLineupSelectorForRoute } from 'store/lineup/lineupForRoute'
import { getLocation } from 'store/routing/selectors'
import { push } from 'utils/navigation'
import { collectibleDetailsPage } from 'utils/route'
import { isMatrix, shouldShowDark } from 'utils/theme/theme'

import { PlaybackRateButton } from '../playback-rate-button/PlaybackRateButton'

import styles from './PlayBar.module.css'
import PlayingTrackInfo from './components/PlayingTrackInfo'
import { SocialActions } from './components/SocialActions'
const { profilePage } = route
const {
  getCollectible,
  getSeek,
  getPlaying,
  getCounter,
  getUid,
  getBuffering,
  getPlaybackRate
} = playerSelectors

const { seek, reset } = playerActions
const { getTheme } = themeSelectors
const { repostTrack, undoRepostTrack } = tracksSocialActions
const { play, pause, next, previous, repeat, shuffle } = queueActions
const { getLineupEntries } = lineupSelectors

const VOLUME_GRANULARITY = 100.0
const SEEK_INTERVAL = 200
const RESTART_THRESHOLD_SEC = 3
const SKIP_DURATION_SEC = 15

const PlayBar = (props) => {
  const { trackIds } = props
  const { data: tracks } = useTracks(trackIds)
  const currentTrack = useCurrentTrack()
  const { data: currentUser } = useUser(currentTrack?.owner_id)

  const lineupHasAccessibleTracks = tracks?.some((track) => {
    const { access, is_stream_gated: isStreamGated } = track ?? {}
    return !isStreamGated || !!access?.stream
  })

  return (
    <PlayBarClassComponent
      {...props}
      track={currentTrack}
      user={currentUser}
      lineupHasAccessibleTracks={lineupHasAccessibleTracks}
    />
  )
}

class PlayBarClassComponent extends Component {
  constructor(props) {
    super(props)

    // State used to manage time on left of playbar.
    this.state = {
      seeking: false,
      trackPosition: 0,
      playCounter: null,
      trackId: null,
      // Capture intent to set initial volume before audio is playing
      initialVolume: null,
      mediaKey: 0
    }
    this.hotkeysHook = null
    this.seekInterval = null
  }

  componentDidMount() {
    this.hotkeysHook = setupHotkeys(
      {
        32 /* space */: this.togglePlay,
        37 /* left arrow */: this.onPrevious,
        39 /* right arrow */: this.props.next
      },
      /* throttle= */ 200
    )
  }

  componentDidUpdate(prevProps) {
    const { isPlaying, playCounter } = this.props
    if (!isPlaying) {
      clearInterval(this.seekInterval)
      this.seekInterval = null
    }

    if (isPlaying && !this.seekInterval) {
      this.seekInterval = setInterval(() => {
        const trackPosition = audioPlayer.getPosition()
        this.setState({ trackPosition })
      }, SEEK_INTERVAL)
    }

    if (playCounter !== this.state.playCounter) {
      this.setState({
        mediaKey: this.state.mediaKey + 1,
        playCounter,
        trackPosition: 0,
        listenRecorded: false
      })
    }

    // If there was an intent to set initial volume and audio is defined
    // set the initial volume
    if (this.state.initialVolume !== null && audioPlayer) {
      audioPlayer.setVolume(this.state.initialVolume)
      this.setState({
        initialVolume: null
      })
    }
  }

  componentWillUnmount() {
    clearInterval(this.seekInterval)
    removeHotkeys(this.hotkeysHook)
  }

  goToTrackPage = () => {
    const { track, user, collectible, goToRoute } = this.props

    if (track && user) {
      goToRoute(track.permalink)
    } else if (collectible && user) {
      goToRoute(collectibleDetailsPage(user.handle, collectible.id))
    }
  }

  goToArtistPage = () => {
    const { user, goToRoute } = this.props

    if (user) {
      goToRoute(profilePage(user.handle))
    }
  }

  togglePlay = () => {
    const { track, isPlaying, play, pause, record } = this.props

    if (audioPlayer && isPlaying) {
      pause()
      record(
        make(Name.PLAYBACK_PAUSE, {
          id: track ? track.track_id : null,
          source: PlaybackSource.PLAYBAR
        })
      )
    } else if (this.playable()) {
      play()
      record(
        make(Name.PLAYBACK_PLAY, {
          id: track ? track.track_id : null,
          source: PlaybackSource.PLAYBAR
        })
      )
    }
  }

  onToggleRepost = (reposted, trackId) => {
    if (trackId) {
      reposted
        ? this.props.undoRepostTrack(trackId)
        : this.props.repostTrack(trackId)
    }
  }

  updateVolume = (volume) => {
    if (audioPlayer) {
      // If we already have an audio object set the volume immediately!
      audioPlayer.setVolume(volume / VOLUME_GRANULARITY)
    } else {
      // Store volume in the state so that when audio does mount we can set it
      this.setState({
        initialVolume: volume / VOLUME_GRANULARITY
      })
    }
  }

  repeatAll = () => {
    this.props.repeat(RepeatMode.ALL)
  }

  repeatSingle = () => {
    this.props.repeat(RepeatMode.SINGLE)
  }

  repeatOff = () => {
    this.props.repeat(RepeatMode.OFF)
  }

  shuffleOn = () => {
    this.props.shuffle(true)
  }

  shuffleOff = () => {
    this.props.shuffle(false)
  }

  onPrevious = () => {
    const { seek, previous, reset, track } = this.props
    const isLongFormContent =
      track?.genre === Genre.PODCASTS || track?.genre === Genre.AUDIOBOOKS
    if (isLongFormContent) {
      const position = audioPlayer.getPosition()
      const newPosition = position - SKIP_DURATION_SEC
      seek(Math.max(0, newPosition))
      this.setState({
        mediaKey: this.state.mediaKey + 1
      })
    } else {
      const shouldGoToPrevious =
        this.state.trackPosition < RESTART_THRESHOLD_SEC
      if (shouldGoToPrevious) {
        previous()
      } else {
        reset(true /* shouldAutoplay */)
      }
    }
  }

  onNext = () => {
    const { seek, next, track } = this.props
    const isLongFormContent =
      track?.genre === Genre.PODCASTS || track?.genre === Genre.AUDIOBOOKS
    if (isLongFormContent) {
      const duration = audioPlayer.getDuration()
      const position = audioPlayer.getPosition()
      const newPosition = position + SKIP_DURATION_SEC
      seek(Math.min(newPosition, duration))
      this.setState({
        mediaKey: this.state.mediaKey + 1
      })
    } else {
      next()
    }
  }

  playable = () =>
    !!this.props.uid ||
    this.props.lineupHasAccessibleTracks ||
    this.props.collectible

  render() {
    const {
      uid,
      user,
      track,
      collectible,
      isPlaying,
      isBuffering,
      playbackRate,
      userId,
      theme,
      toggleSaveTrack
    } = this.props
    const { mediaKey } = this.state

    let trackTitle = ''
    let artistName = ''
    let artistHandle = ''
    let artistUserId = null
    let isVerified = false
    let trackId = null
    let duration = null
    let isOwner = false
    let isTrackUnlisted = false
    let isStreamGated = false
    let trackPermalink = ''

    if (uid && track && user) {
      trackTitle = track.title
      artistName = user.name
      artistHandle = user.handle
      artistUserId = user.user_id
      isVerified = user.is_verified
      isOwner = track.owner_id === userId
      trackPermalink = track.permalink

      duration = audioPlayer.getDuration()
      trackId = track.track_id
      isTrackUnlisted = track.is_unlisted
      isStreamGated = track.is_stream_gated
    } else if (collectible && user) {
      // Special case for audio nft playlist
      trackTitle = collectible.name
      artistName = user.name
      artistHandle = user.handle
      artistUserId = user.user_id
      isVerified = user.is_verified
      isOwner = this.props.accountUserId === user.user_id
      duration = audioPlayer.getDuration()
    }

    let playButtonStatus
    if (isBuffering) {
      playButtonStatus = 'load'
    } else if (isPlaying) {
      playButtonStatus = 'pause'
    } else {
      playButtonStatus = 'play'
    }

    const matrix = isMatrix()
    const isLongFormContent =
      track?.genre === Genre.PODCASTS || track?.genre === Genre.AUDIOBOOKS

    return (
      <div className={styles.playBar}>
        <div className={styles.playBarContentWrapper}>
          <div className={styles.playBarPlayingInfo}>
            <PlayingTrackInfo
              trackId={trackId}
              isOwner={isOwner}
              trackTitle={trackTitle}
              trackPermalink={trackPermalink}
              artistName={artistName}
              artistHandle={artistHandle}
              artistUserId={artistUserId}
              isVerified={isVerified}
              isTrackUnlisted={isTrackUnlisted}
              isStreamGated={isStreamGated}
              onClickTrackTitle={this.goToTrackPage}
              onClickArtistName={this.goToArtistPage}
              hasShadow={false}
            />
          </div>

          <div className={styles.playBarControls}>
            <div className={styles.timeControls}>
              <Scrubber
                mediaKey={`${uid}${mediaKey}`}
                isPlaying={isPlaying && !isBuffering}
                isDisabled={!uid && !collectible}
                includeTimestamps
                getAudioPosition={audioPlayer?.getPosition}
                getTotalTime={audioPlayer?.getDuration}
                playbackRate={
                  isLongFormContent ? playbackRateValueMap[playbackRate] : 1
                }
                elapsedSeconds={audioPlayer?.getPosition()}
                totalSeconds={duration}
                style={{
                  railListenedColor: 'var(--track-slider-rail)',
                  handleColor: 'var(--track-slider-handle)'
                }}
                onScrubRelease={this.props.seek}
              />
            </div>

            <div className={styles.buttonControls}>
              <div className={styles.shuffleButton}>
                {isLongFormContent ? null : (
                  <ShuffleButtonProvider
                    isMatrix={matrix}
                    darkMode={shouldShowDark(theme)}
                    onShuffleOn={this.shuffleOn}
                    onShuffleOff={this.shuffleOff}
                  />
                )}
              </div>
              <div className={styles.previousButton}>
                <PreviousButtonProvider onClick={this.onPrevious} />
              </div>
              <div className={styles.playButton}>
                <PlayButton
                  playable={this.playable()}
                  status={playButtonStatus}
                  onClick={this.togglePlay}
                />
              </div>
              <div className={styles.nextButton}>
                <NextButtonProvider onClick={this.onNext} />
              </div>
              <div className={styles.repeatButton}>
                {isLongFormContent ? (
                  <PlaybackRateButton />
                ) : (
                  <RepeatButtonProvider
                    isMatrix={matrix}
                    darkMode={shouldShowDark(theme)}
                    onRepeatOff={this.repeatOff}
                    onRepeatAll={this.repeatAll}
                    onRepeatSingle={this.repeatSingle}
                  />
                )}
              </div>
            </div>
          </div>

          <div className={styles.optionsRight}>
            <VolumeBar
              defaultValue={100}
              granularity={VOLUME_GRANULARITY}
              onChange={this.updateVolume}
            />
            <SocialActions
              trackId={trackId}
              uid={uid}
              isOwner={isOwner}
              onToggleRepost={this.onToggleRepost}
              onToggleFavorite={toggleSaveTrack}
            />
          </div>
        </div>
      </div>
    )
  }
}

const makeMapStateToProps = () => {
  const mapStateToProps = (state) => {
    const location = getLocation(state)
    const lineupEntries =
      getLineupEntries(getLineupSelectorForRoute(location), state) ?? []

    // The lineup has accessible tracks when there is at least one track
    // the user has access to i.e. a non-gated track or an unlocked gated track.
    // This helps us determine whether there is a playable track.
    // For example, in the case of a gated track that the user does not have
    // access to, the track card / tile will not be playable because the
    // play button is disabled; however, a user can still attempt to play
    // the track by pressing spacebar. This will prevent the track
    // from attempting to play in that case, and consequently avoiding the
    // infinite loading loop on the playbar.
    return {
      seek: getSeek(state),
      playCounter: getCounter(state),
      collectible: getCollectible(state),
      isPlaying: getPlaying(state),
      isBuffering: getBuffering(state),
      uid: getUid(state),
      playbackRate: getPlaybackRate(state),
      trackIds: lineupEntries
        .filter((entry) => entry.kind === Kind.TRACKS)
        .map((entry) => entry.id),
      theme: getTheme(state)
    }
  }
  return mapStateToProps
}

const mapDispatchToProps = (dispatch) => ({
  play: () => {
    dispatch(play({}))
  },
  pause: () => {
    dispatch(pause({}))
  },
  next: () => {
    dispatch(next({ skip: true }))
  },
  previous: () => {
    dispatch(previous({}))
  },
  reset: (shouldAutoplay) => {
    dispatch(reset({ shouldAutoplay }))
  },
  seek: (position) => {
    dispatch(seek({ seconds: position }))
  },
  repeat: (mode) => {
    dispatch(repeat({ mode }))
  },
  shuffle: (enable) => {
    dispatch(shuffle({ enable }))
  },
  repostTrack: (trackId) =>
    dispatch(repostTrack(trackId, RepostSource.PLAYBAR)),
  undoRepostTrack: (trackId) =>
    dispatch(undoRepostTrack(trackId, RepostSource.PLAYBAR)),
  goToRoute: (route) => dispatch(push(route)),
  record: (event) => dispatch(event)
})

const withHooks = (WrappedComponent) => {
  return (props) => {
    const { data: accountUserId } = useCurrentUserId()
    return (
      <WrappedComponent
        {...props}
        accountUserId={accountUserId}
        userId={accountUserId}
      />
    )
  }
}

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(withHooks(PlayBar))
