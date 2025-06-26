import { useCallback, useMemo, useEffect } from 'react'

import {
  useCollection,
  useCollectionByPermalink,
  useTracks,
  useUsers
} from '@audius/common/api'
import { usePlayTrack, usePauseTrack } from '@audius/common/hooks'
import { Name, Kind, Status, ID, ModalSource } from '@audius/common/models'
import { QueueSource, ChatMessageTileProps } from '@audius/common/store'
import { getPathFromPlaylistUrl, makeUid } from '@audius/common/utils'
import { useDispatch } from 'react-redux'

import { make } from 'common/store/analytics/actions'
import { CollectionTile } from 'components/track/mobile/CollectionTile'
import { TrackTileSize } from 'components/track/types'

export const ChatMessagePlaylist = ({
  link,
  onEmpty,
  onSuccess,
  className
}: ChatMessageTileProps) => {
  const dispatch = useDispatch()

  const permalink = getPathFromPlaylistUrl(link) ?? ''
  const { data: playlist } = useCollectionByPermalink(permalink)

  const collectionId = playlist?.playlist_id
  const { data: collection } = useCollection(collectionId)

  const uid = useMemo(() => {
    return collectionId ? makeUid(Kind.COLLECTIONS, collectionId) : null
  }, [collectionId])

  const trackIds =
    playlist?.playlist_contents?.track_ids?.map((t) => t.track) ?? []
  const { data: tracks } = useTracks(trackIds)
  const { byId: usersById } = useUsers(tracks?.map((t) => t.owner_id))

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
      user: usersById[track.owner_id],
      id: track.track_id,
      uid: uidMap[track.track_id]
    }))
  }, [tracks, uidMap, usersById])

  const entries = useMemo(() => {
    return (tracks || []).map((track) => ({
      id: track.track_id,
      uid: uidMap[track.track_id],
      source: QueueSource.CHAT_PLAYLIST_TRACKS
    }))
  }, [tracks, uidMap])

  const play = usePlayTrack()
  const playTrack = useCallback(
    (uid: string) => {
      play({ uid, entries })
    },
    [play, entries]
  )

  const pauseTrack = usePauseTrack()

  const collectionExists = !!collection && !collection.is_delete
  useEffect(() => {
    if (collectionExists && uid) {
      dispatch(make(Name.MESSAGE_UNFURL_PLAYLIST, {}))
      onSuccess?.()
    } else {
      onEmpty?.()
    }
  }, [collectionExists, uid, onSuccess, onEmpty, dispatch])

  return collectionId && uid ? (
    // You may wonder why we use the mobile web playlist tile here.
    // It's simply because the chat playlist tile uses the same design as mobile web.
    <CollectionTile
      containerClassName={className}
      index={0}
      uid={uid}
      id={collectionId}
      size={TrackTileSize.SMALL}
      ordered={false}
      trackTileStyles={{}}
      togglePlay={() => {}}
      playTrack={playTrack}
      pauseTrack={pauseTrack}
      hasLoaded={() => {}}
      isLoading={status === Status.LOADING || status === Status.IDLE}
      isTrending={false}
      numLoadingSkeletonRows={tracksWithUids.length}
      variant='readonly'
      source={ModalSource.DirectMessageCollectionTile}
      tracks={tracksWithUids}
    />
  ) : null
}
