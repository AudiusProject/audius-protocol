import { useCallback } from 'react'

import { useGetPlaylistById } from '@audius/common/api'
import { FavoriteType, type ID } from '@audius/common/models'
import {
  repostsUserListActions,
  favoritesUserListActions,
  RepostType
} from '@audius/common/store'
import { formatCount } from '@audius/common/utils'
import { useDispatch } from 'react-redux'

import { IconHeart, IconRepost } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

import { VanityMetric } from './VanityMetrics'

const { setFavorite } = favoritesUserListActions
const { setRepost } = repostsUserListActions

type RepostsMetricProps = {
  collectionId: ID
}

export const RepostsMetric = (props: RepostsMetricProps) => {
  const { collectionId } = props

  const { data: playlist } = useGetPlaylistById(
    { playlistId: collectionId },
    { disabled: !collectionId }
  )
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    dispatch(setRepost(collectionId, RepostType.COLLECTION))
    navigation.push('Reposts', {
      id: collectionId,
      repostType: RepostType.COLLECTION
    })
  }, [collectionId, dispatch, navigation])

  if (!playlist) return null
  const { repost_count = 0 } = playlist

  if (repost_count === 0) return null

  return (
    <VanityMetric icon={IconRepost} onPress={handlePress}>
      {formatCount(repost_count)}
    </VanityMetric>
  )
}

type SavesMetricProps = {
  collectionId: ID
}

export const SavesMetric = (props: SavesMetricProps) => {
  const { collectionId } = props
  const { data: playlist } = useGetPlaylistById(
    { playlistId: collectionId },
    { disabled: !collectionId }
  )
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    dispatch(setFavorite(collectionId, FavoriteType.PLAYLIST))
    navigation.push('Favorites', {
      id: collectionId,
      favoriteType: FavoriteType.PLAYLIST
    })
  }, [collectionId, dispatch, navigation])

  if (!playlist) return null
  const { save_count = 0 } = playlist

  if (save_count === 0) return null

  return (
    <VanityMetric icon={IconHeart} onPress={handlePress}>
      {formatCount(save_count)}
    </VanityMetric>
  )
}
