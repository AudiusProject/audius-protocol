import React, { useEffect, RefObject, useCallback } from 'react'

import GoogleCast, { CastButton } from 'react-native-google-cast'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { MessageType } from 'app/message'
import { AppState } from 'app/store'
import * as audioActions from 'app/store/audio/actions'
import {
  getTrack,
  getPlaying,
  getSeek,
  getIndex,
  getQueueLength,
  getIsRepeatSingle
} from 'app/store/audio/selectors'
import * as googleCastActions from 'app/store/googleCast/actions'
import {
  getGoogleCastStatus,
  getCastStartPosition
} from 'app/store/googleCast/selectors'
import { MessagePostingWebView } from 'app/types/MessagePostingWebView'
import { postMessage } from 'app/utils/postMessage'

type OwnProps = {
  webRef: RefObject<MessagePostingWebView>
}

type CastProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

/**
 * A GoogleCast component that talks to the native layer and
 * lets the user broadcast and receive information.
 */
const Cast = ({
  track,
  googleCastStatus,
  webRef,
  updateCastStatus,
  seek,
  playing,
  play,
  pause,
  startPosition,
  setCastPlayPosition
}: CastProps) => {
  const isCasting = useCallback(
    (isActive: boolean) => {
      if (webRef.current) {
        postMessage(webRef.current, {
          type: MessageType.IS_CASTING,
          isCasting: isActive,
          isAction: true
        })
      }
    },
    [webRef]
  )

  useEffect(() => {
    // Establishing connection to Chromecast
    GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_STARTING, () => {
      updateCastStatus(googleCastActions.CastStatus.Connecting)
    })

    // Connection established
    GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_STARTED, () => {
      updateCastStatus(googleCastActions.CastStatus.Connected)
      isCasting(true)
    })

    // Connection failed
    GoogleCast.EventEmitter.addListener(
      GoogleCast.SESSION_START_FAILED,
      error => {
        updateCastStatus(googleCastActions.CastStatus.NotConnected)
        isCasting(false)
        console.error(error)
      }
    )

    // Attempting to reconnect
    GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_RESUMING, () => {
      updateCastStatus(googleCastActions.CastStatus.Connecting)
    })

    // Reconnected
    GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_RESUMED, () => {
      updateCastStatus(googleCastActions.CastStatus.Connected)
      isCasting(true)
    })

    // Disconnecting
    GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_ENDING, () => {
      isCasting(false)
    })

    // Disconnected (error provides explanation if ended forcefully)
    GoogleCast.EventEmitter.addListener(GoogleCast.SESSION_ENDED, error => {
      updateCastStatus(googleCastActions.CastStatus.NotConnected)
      isCasting(false)
      console.error(error)
    })

    // Status of the media has changed. The `mediaStatus` object contains the new status.
    GoogleCast.EventEmitter.addListener(
      GoogleCast.MEDIA_STATUS_UPDATED,
      ({ mediaStatus }) => {
        if (mediaStatus.playerState === 3 /* If paused */) {
          if (webRef.current) {
            postMessage(webRef.current, {
              type: MessageType.SYNC_PLAYER,
              isPlaying: false,
              incrementCounter: false,
              isAction: true
            })
          }
          pause()
        } else if (mediaStatus.playerState === 2 /* If Play */) {
          if (webRef.current) {
            postMessage(webRef.current, {
              type: MessageType.SYNC_PLAYER,
              isPlaying: true,
              incrementCounter: false,
              isAction: true
            })
          }
          play()
        }
      }
    )

    // TODO: Improve time sycn between cast and device by adding event
    // listeners on `GoogleCast.MEDIA_PLAYBACK_STARTED` & `GoogleCast.MEDIA_PROGRESS_UPDATED`
    return () => {
      GoogleCast.endSession()
    }
  }, [webRef, isCasting, pause, play, updateCastStatus])

  const isConnected =
    googleCastStatus === googleCastActions.CastStatus.Connected

  // Track Info handler
  const { uid: trackUid = undefined } = track || {}
  useEffect(() => {
    if (track && isConnected) {
      GoogleCast.castMedia({
        mediaUrl: track.uri,
        imageUrl: track.largeArtwork,
        title: track.title,
        subtitle: track.artist,
        contentType: 'application/vnd.apple.mpegurl',
        playPosition: startPosition // seconds
      })
      setCastPlayPosition(0)
    }
  }, [trackUid, isConnected, setCastPlayPosition, startPosition, track])

  useEffect(() => {
    if (trackUid && isConnected) {
      if (playing) {
        GoogleCast.play()
      } else {
        GoogleCast.pause()
      }
    }
  }, [trackUid, playing, isConnected])

  // Seek handler
  useEffect(() => {
    if (seek !== null && isConnected) {
      GoogleCast.seek(seek) // - jump to position in seconds from the beginning of the stream
    }
  }, [seek, isConnected])

  return (
    <CastButton
      style={{
        width: 0,
        height: 0,
        display: 'none',
        position: 'absolute',
        zIndex: -1,
        top: -200,
        left: -200
      }}
    />
  )
}

const mapStateToProps = (state: AppState) => ({
  track: getTrack(state),
  index: getIndex(state),
  queueLength: getQueueLength(state),
  playing: getPlaying(state),
  seek: getSeek(state),
  repeat: getIsRepeatSingle(state),
  googleCastStatus: getGoogleCastStatus(state),
  startPosition: getCastStartPosition(state)
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  play: () => dispatch(audioActions.play()),
  pause: () => dispatch(audioActions.pause()),
  updateCastStatus: (castStatus: googleCastActions.CastStatus) =>
    dispatch(googleCastActions.updateCastStatus(castStatus)),
  setCastPlayPosition: (position: number) =>
    dispatch(googleCastActions.setPlayPosition(position))
})

export default connect(mapStateToProps, mapDispatchToProps)(Cast)
