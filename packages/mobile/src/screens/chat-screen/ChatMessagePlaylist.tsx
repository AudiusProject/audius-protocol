import { useCallback, useMemo, useEffect } from 'react'

import type { ChatMessageTileProps } from '@audius/common'
import {
  QueueSource,
  accountSelectors,
  getPathFromPlaylistUrl,
  makeUid,
  playerSelectors
} from '@audius/common'
import {
  useGetTracksByIds,
  useGetPlaylistByPermalink
} from '@audius/common/api'
import { usePlayTrack, usePauseTrack } from '@audius/common/hooks'
import type { TrackPlayback } from '@audius/common/hooks'
import { Name, PlaybackSource, Kind } from '@audius/common/models'
import type { ID } from '@audius/common/models'
import { useSelector } from 'react-redux'

import { CollectionTile } from 'app/components/lineup-tile'
import { make, track as trackEvent } from 'app/services/analytics'

const { getUserId } = accountSelectors
const { getUid, getPlaying, getTrackId } = playerSelectors

export const ChatMessagePlaylist = ({
  link,
  onEmpty,
  onSuccess,
  styles
}: ChatMessageTileProps) => {
  const currentUserId = useSelector(getUserId)
  const isPlaying = useSelector(getPlaying)
  const playingTrackId = useSelector(getTrackId)
  const playingUid = useSelector(getUid)

  const permalink = getPathFromPlaylistUrl(link) ?? ''
  const { data: playlist } = useGetPlaylistByPermalink(
    {
      permalink,
      currentUserId: currentUserId!
    },
    { disabled: !permalink || !currentUserId }
  )

  const collection = useMemo(() => {
    return playlist
      ? {
          ...playlist,
          // Include this field to conform with the component prop type.
          _cover_art_sizes: {}
        }
      : null
  }, [playlist])

  const trackIds =
    playlist?.playlist_contents?.track_ids?.map((t) => t.track) ?? []
  const { data: tracks } = useGetTracksByIds(
    {
      ids: trackIds,
      currentUserId
    },
    { disabled: !trackIds.length }
  )

  const collectionId = playlist?.playlist_id

  const uid = useMemo(() => {
    return collectionId ? makeUid(Kind.COLLECTIONS, collectionId) : null
  }, [collectionId])

  const uidMap = useMemo(() => {
    return trackIds.reduce((result: { [id: ID]: string }, id) => {
      result[id] = makeUid(Kind.TRACKS, id)
      return result
    }, {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId])

  /**
   * Include uids for the tracks as those are used to play the tracks,
   * and also to determine which track is currently playing.
   * Also include the other properties to conform with the component.
   */
  const tracksWithUids = useMemo(() => {
    return (tracks || []).map((track) => ({
      ...track,
      _cover_art_sizes: {},
      user: {
        ...track.user,
        _profile_picture_sizes: {},
        _cover_photo_sizes: {}
      },
      id: track.track_id,
      uid: uidMap[track.track_id]
    }))
  }, [tracks, uidMap])

  const entries = useMemo(() => {
    return (tracks || []).map((track) => ({
      id: track.track_id,
      uid: uidMap[track.track_id],
      source: QueueSource.CHAT_PLAYLIST_TRACKS
    }))
  }, [tracks, uidMap])

  const isActive = tracksWithUids.find((track) => track.uid === playingUid)

  const recordAnalytics = useCallback(
    ({ name, id }: { name: TrackPlayback; id: ID }) => {
      trackEvent(
        make({
          eventName: name,
          id: `${id}`,
          source: PlaybackSource.CHAT_PLAYLIST_TRACK
        })
      )
    },
    []
  )

  const playTrack = usePlayTrack(recordAnalytics)
  const pauseTrack = usePauseTrack(recordAnalytics)

  const togglePlay = useCallback(() => {
    if (!isPlaying || !isActive) {
      if (isActive) {
        playTrack({ id: playingTrackId!, uid: playingUid!, entries })
      } else {
        const trackUid = tracksWithUids[0] ? tracksWithUids[0].uid : null
        const trackId = tracksWithUids[0] ? tracksWithUids[0].track_id : null
        if (!trackUid || !trackId) return
        playTrack({ id: trackId, uid: trackUid, entries })
      }
    } else {
      pauseTrack(playingTrackId!)
    }
  }, [
    isPlaying,
    isActive,
    playingUid,
    playingTrackId,
    entries,
    tracksWithUids,
    playTrack,
    pauseTrack
  ])

  useEffect(() => {
    if (collection && uid) {
      trackEvent(
        make({
          eventName: Name.MESSAGE_UNFURL_PLAYLIST
        })
      )
      onSuccess?.()
    } else {
      onEmpty?.()
    }
  }, [collection, uid, onSuccess, onEmpty])

  return collection && uid ? (
    <CollectionTile
      index={0}
      togglePlay={togglePlay}
      uid={uid}
      collection={collection}
      tracks={tracksWithUids}
      isTrending={false}
      showArtistPick={false}
      showRankIcon={false}
      styles={styles}
      variant='readonly'
    />
  ) : null
}
