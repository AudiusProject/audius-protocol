import { AudiusSdk, full, Id, OptionalId } from '@audius/sdk'
import {
  FullPlaylistWithScoreResponse,
  GetBestNewReleasesWindowEnum,
  FullPlaylistWithScore
} from '@audius/sdk/src/sdk/api/generated/full'

import {
  trackActivityFromSDK,
  transformAndCleanList,
  userCollectionMetadataFromSDK,
  userFeedItemFromSDK,
  userTrackMetadataFromSDK
} from '~/adapters'

import {
  ID,
  UserCollectionMetadata,
  UserTrack,
  UserTrackMetadata
} from '../../models'
import { AudiusBackend } from '../audius-backend'

const scoreComparator = <T extends { score: number }>(a: T, b: T) =>
  b.score - a.score

type ExploreConfig = {
  audiusBackendInstance: AudiusBackend
  audiusSdk: () => Promise<AudiusSdk>
}

export class Explore {
  audiusBackendInstance: AudiusBackend
  audiusSdk: () => Promise<AudiusSdk>

  constructor(config: ExploreConfig) {
    this.audiusBackendInstance = config.audiusBackendInstance
    this.audiusSdk = config.audiusSdk
  }

  /** TRACKS ENDPOINTS */
  async getBestNewReleases({
    currentUserId,
    window = GetBestNewReleasesWindowEnum.Month,
    limit = 25
  }: {
    currentUserId: ID
    window?: GetBestNewReleasesWindowEnum
    limit?: number
  }): Promise<UserTrackMetadata[]> {
    try {
      const sdk = await this.audiusSdk()
      const { data = [] } = await sdk.full.tracks.getBestNewReleases({
        window,
        limit,
        userId: OptionalId.parse(currentUserId)
      })
      return transformAndCleanList(data, userTrackMetadataFromSDK)
    } catch (e) {
      console.error(e)
      return []
    }
  }

  async getFeedNotListenedTo(currentUserId: ID, limit = 25) {
    const sdk = await this.audiusSdk()
    try {
      const userId = Id.parse(currentUserId)
      const { data = [] } = await sdk.full.users.getUserFeed({
        offset: 0,
        limit,
        withUsers: true,
        filter: 'original',
        tracksOnly: true,
        id: userId,
        userId
      })
      const lineupItems = transformAndCleanList(data, userFeedItemFromSDK).map(
        ({ item }) => item
      )
      if (!lineupItems.length) return []

      const tracks = lineupItems.filter(
        (lineupItem): lineupItem is UserTrack => 'track_id' in lineupItem
      )
      const history = await sdk.full.users.getUsersTrackHistory({
        id: Id.parse(currentUserId),
        limit: 100
      })
      const listenedToTracks = transformAndCleanList(
        history.data,
        (activity: full.ActivityFull) => trackActivityFromSDK(activity)?.item
      )

      // Imperfect solution. Ideally we use an endpoint that gives us true/false
      // if a user has listened to a passed in array of tracks.
      const listenendToTrackIds = listenedToTracks.map(
        (track) => track.track_id
      )

      const notListenedToTracks = tracks.filter(
        (track) => !listenendToTrackIds[track.track_id]
      )
      return notListenedToTracks.slice(0, limit)
    } catch (e) {
      console.error(e)
      return []
    }
  }

  async getRemixables(currentUserId: ID, limit = 25) {
    try {
      const sdk = await this.audiusSdk()
      const { data = [] } = await sdk.full.tracks.getRemixableTracks({
        limit,
        withUsers: true,
        userId: OptionalId.parse(currentUserId)
      })

      const tracks = transformAndCleanList(data, userTrackMetadataFromSDK)

      return tracks
    } catch (e) {
      console.error(e)
      return []
    }
  }

  async getMostLovedTracks(userId: ID, limit = 25) {
    try {
      const sdk = await this.audiusSdk()
      const { data = [] } = await sdk.full.tracks.getMostLovedTracks({
        limit,
        withUsers: true,
        userId: OptionalId.parse(userId)
      })
      return transformAndCleanList(data, userTrackMetadataFromSDK)
    } catch (e) {
      console.error(e)
      return []
    }
  }

  async getFeelingLuckyTracks(userId: ID | null, limit = 25) {
    try {
      const sdk = await this.audiusSdk()
      const { data = [] } = await sdk.full.tracks.getFeelingLuckyTracks({
        limit,
        withUsers: true,
        userId: OptionalId.parse(userId)
      })
      return transformAndCleanList(data, userTrackMetadataFromSDK)
    } catch (e) {
      console.error(e)
      return []
    }
  }

  /** PLAYLIST ENDPOINTS */
  async getTopCollections({
    type,
    limit = 20,
    userId
  }: {
    type: 'playlist' | 'album'
    limit?: number
    userId?: ID
  }): Promise<UserCollectionMetadata[]> {
    try {
      const sdk = await this.audiusSdk()
      const { data = [] } = await sdk.full.playlists.getTopPlaylists({
        type,
        limit,
        userId: OptionalId.parse(userId)
      })
      return transformAndCleanList(data, userCollectionMetadataFromSDK)
    } catch (e) {
      console.error(e)
      return []
    }
  }

  async getTopPlaylistsForMood({
    moods,
    limit = 16,
    userId
  }: {
    moods: string[]
    limit?: number
    userId?: ID
  }): Promise<UserCollectionMetadata[]> {
    try {
      const sdk = await this.audiusSdk()
      const requests = moods.map((mood) => {
        return sdk.full.playlists.getTopPlaylists({
          type: 'playlist',
          limit,
          mood,
          userId: OptionalId.parse(userId)
        })
      })
      const playlistsByMood: FullPlaylistWithScoreResponse[] =
        await Promise.all(requests)
      let allPlaylists: FullPlaylistWithScore[] = []
      playlistsByMood.forEach(({ data = [] }) => {
        allPlaylists = allPlaylists.concat(data)
      })
      const playlists = allPlaylists.sort(scoreComparator).slice(0, 20)
      return transformAndCleanList(playlists, userCollectionMetadataFromSDK)
    } catch (e) {
      console.error(e)
      return []
    }
  }
}
