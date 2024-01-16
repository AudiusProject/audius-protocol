import { Component } from 'react'

import {
  RepostSource,
  FavoriteSource,
  Name,
  PlaybackSource,
  Genre,
  accountSelectors,
  lineupSelectors,
  queueActions,
  RepeatMode,
  tracksSocialActions,
  themeSelectors,
  playerActions,
  playerSelectors,
  queueSelectors,
  FeatureFlags,
  playbackRateValueMap,
  cacheTracksSelectors,
  Kind
} from '@audius/common'
import { Scrubber } from '@audius/stems'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { ClientOnly } from 'components/client-only/ClientOnly'
import PlayButton from 'components/play-bar/PlayButton'
import VolumeBar from 'components/play-bar/VolumeBar'
import NextButtonProvider from 'components/play-bar/next-button/NextButtonProvider'
import PreviousButtonProvider from 'components/play-bar/previous-button/PreviousButtonProvider'
import RepeatButtonProvider from 'components/play-bar/repeat-button/RepeatButtonProvider'
import ShuffleButtonProvider from 'components/play-bar/shuffle-button/ShuffleButtonProvider'
import { audioPlayer } from 'services/audio-player'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'
import { getLineupSelectorForRoute } from 'store/lineup/lineupForRoute'
import { getLocationPathname } from 'store/routing/selectors'
import { setupHotkeys } from 'utils/hotkeyUtil'
import { collectibleDetailsPage, profilePage } from 'utils/route'
import { isMatrix, shouldShowDark } from 'utils/theme/theme'

import { PlaybackRateButton } from '../playback-rate-button/PlaybackRateButton'

import styles from './PlayBar.module.css'
import PlayingTrackInfo from './components/PlayingTrackInfo'
import { SocialActions } from './components/SocialActions'
const { makeGetCurrent } = queueSelectors
const {
  getCollectible,
  getPlaying,
  getCounter,
  getUid: getPlayingUid,
  getBuffering,
  getPlaybackRate
} = playerSelectors

const { seek, reset } = playerActions
const { getTheme } = themeSelectors
const { repostTrack, undoRepostTrack, saveTrack, unsaveTrack } =
  tracksSocialActions
const { play, pause, next, previous, repeat, shuffle } = queueActions
const { getLineupEntries } = lineupSelectors
const { getAccountUser, getUserId } = accountSelectors
const { getTrack } = cacheTracksSelectors

const VOLUME_GRANULARITY = 100.0
const SEEK_INTERVAL = 200
const RESTART_THRESHOLD_SEC = 3
const SKIP_DURATION_SEC = 15

class PlayBar extends Component {
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
    this.seekInterval = null
  }

  componentDidMount() {
    setupHotkeys(
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
  }

  goToTrackPage = () => {
    const {
      currentQueueItem: { track, user },
      collectible,
      goToRoute
    } = this.props

    if (track && user) {
      goToRoute(track.permalink)
    } else if (collectible && user) {
      goToRoute(collectibleDetailsPage(user.handle, collectible.id))
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

  togglePlay = () => {
    const {
      currentQueueItem: { track },
      isPlaying,
      play,
      pause,
      record
    } = this.props

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

  onToggleFavorite = (favorited, trackId) => {
    if (trackId) {
      favorited
        ? this.props.unsaveTrack(trackId)
        : this.props.saveTrack(trackId)
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
    const {
      seek,
      previous,
      reset,
      currentQueueItem: { track }
    } = this.props
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
    const {
      seek,
      next,
      currentQueueItem: { track }
    } = this.props
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
    !!this.props.currentQueueItem.uid ||
    this.props.lineupHasAccessibleTracks ||
    this.props.collectible

  render() {
    const {
      currentQueueItem: { uid, track, user },
      collectible,
      isPlaying,
      isBuffering,
      playbackRate,
      userId,
      theme
    } = this.props
    const { mediaKey } = this.state

    let trackTitle = ''
    let artistName = ''
    let artistHandle = ''
    let artistUserId = null
    let isVerified = false
    let profilePictureSizes = null
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
      profilePictureSizes = user._profile_picture_sizes
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
      profilePictureSizes = user._profile_picture_sizes
      isOwner = this.props.accountUser?.user_id === user.user_id
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
    const isNewPodcastControlsEnabled = getFeatureEnabled(
      FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED,
      FeatureFlags.PODCAST_CONTROL_UPDATES_ENABLED_FALLBACK
    )

    return (
      <div className={styles.playBar}>
        <div className={styles.playBarContentWrapper}>
          <ClientOnly>
            <div className={styles.playBarPlayingInfo}>
              <PlayingTrackInfo
                profilePictureSizes={profilePictureSizes}
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
                  {isLongFormContent && isNewPodcastControlsEnabled ? null : (
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
                  {isLongFormContent && isNewPodcastControlsEnabled ? (
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
                onToggleFavorite={this.onToggleFavorite}
              />
            </div>
          </ClientOnly>
        </div>
      </div>
    )
  }
}

const makeMapStateToProps = () => {
  const getCurrentQueueItem = makeGetCurrent()

  const mapStateToProps = (state) => {
    const location = getLocationPathname(state)
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
    const lineupHasAccessibleTracks = lineupEntries.some((entry) => {
      if (entry.kind !== Kind.TRACKS) return false

      const { id } = entry
      const { access } = getTrack(state, { id }) ?? {}

      return !!access?.stream
    })

    return {
      accountUser: getAccountUser(state),
      currentQueueItem: getCurrentQueueItem(state),
      playCounter: getCounter(state),
      collectible: getCollectible(state),
      isPlaying: getPlaying(state),
      isBuffering: getBuffering(state),
      playingUid: getPlayingUid(state),
      playbackRate: getPlaybackRate(state),
      lineupHasAccessibleTracks,
      userId: getUserId(state),
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
  saveTrack: (trackId) => dispatch(saveTrack(trackId, FavoriteSource.PLAYBAR)),
  unsaveTrack: (trackId) =>
    dispatch(unsaveTrack(trackId, FavoriteSource.PLAYBAR)),
  goToRoute: (route) => dispatch(pushRoute(route)),
  record: (event) => dispatch(event)
})

export default connect(makeMapStateToProps, mapDispatchToProps)(PlayBar)
