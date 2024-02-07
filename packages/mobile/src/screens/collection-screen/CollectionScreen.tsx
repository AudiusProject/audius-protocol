import { useCallback, useMemo } from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import {
  ShareSource,
  RepostSource,
  FavoriteSource,
  FavoriteType,
  SquareSizes
} from '@audius/common/models'
import type {
  Collection,
  SearchUser,
  SearchPlaylist,
  User
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  accountSelectors,
  collectionPageSelectors,
  collectionPageActions,
  collectionsSocialActions,
  mobileOverflowMenuUIActions,
  publishPlaylistConfirmationModalUIActions,
  shareModalUIActions,
  OverflowAction,
  OverflowSource,
  repostsUserListActions,
  favoritesUserListActions,
  RepostType
} from '@audius/common/store'
import { encodeUrlName, formatDate, removeNullable } from '@audius/common/utils'
import type { Nullable } from '@audius/common/utils'
import { useDispatch, useSelector } from 'react-redux'

import type { ImageProps } from '@audius/harmony-native'
import {
  ScreenContent,
  Screen,
  VirtualizedScrollView,
  Divider
} from 'app/components/core'
import { CollectionImage } from 'app/components/image/CollectionImage'
import { SuggestedCollectionTracks } from 'app/components/suggested-tracks'
import { useIsOfflineModeEnabled } from 'app/hooks/useIsOfflineModeEnabled'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { setVisibility } from 'app/store/drawers/slice'
import { getIsCollectionMarkedForDownload } from 'app/store/offline-downloads/selectors'
import { makeStyles } from 'app/styles'
import { useThemePalette } from 'app/utils/theme'

import { CollectionScreenDetailsTile } from './CollectionScreenDetailsTile'
import { CollectionScreenSkeleton } from './CollectionScreenSkeleton'
import { useFetchCollectionLineup } from './useFetchCollectionLineup'

const { setFavorite } = favoritesUserListActions
const { setRepost } = repostsUserListActions
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { open: openOverflowMenu } = mobileOverflowMenuUIActions
const {
  repostCollection,
  saveCollection,
  undoRepostCollection,
  unsaveCollection
} = collectionsSocialActions
const { resetCollection, fetchCollection } = collectionPageActions
const { getCollection, getUser } = collectionPageSelectors
const getUserId = accountSelectors.getUserId
const { requestOpen: openPublishConfirmation } =
  publishPlaylistConfirmationModalUIActions

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    padding: spacing(3)
  },
  divider: {
    marginTop: spacing(2),
    marginBottom: spacing(8)
  }
}))

/**
 * `CollectionScreen` displays the details of a collection
 */
export const CollectionScreen = () => {
  const { params } = useRoute<'Collection'>()
  const dispatch = useDispatch()

  // params is incorrectly typed and can sometimes be undefined
  const {
    id = null,
    searchCollection,
    slug,
    collectionType,
    handle
  } = params ?? {}

  const permalink = slug ? `/${handle}/${collectionType}/${slug}` : undefined

  const handleFetchCollection = useCallback(() => {
    dispatch(resetCollection())
    dispatch(fetchCollection(id, permalink, true))
  }, [dispatch, id, permalink])

  useFetchCollectionLineup(id, handleFetchCollection)

  const cachedCollection = useSelector((state) =>
    getCollection(state, { id })
  ) as Nullable<Collection>

  const cachedUser = useSelector((state) =>
    getUser(state, { id: cachedCollection?.playlist_owner_id })
  )

  const collection = cachedCollection ?? searchCollection
  const user = cachedUser ?? searchCollection?.user

  return !collection || !user ? (
    <CollectionScreenSkeleton collectionType={collectionType} />
  ) : (
    <CollectionScreenComponent collection={collection} user={user} />
  )
}

type CollectionScreenComponentProps = {
  collection: Collection | SearchPlaylist
  user: User | SearchUser
}
const CollectionScreenComponent = (props: CollectionScreenComponentProps) => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const { collection, user } = props
  const {
    _is_publishing,
    description,
    playlist_contents: { track_ids },
    has_current_user_reposted,
    has_current_user_saved,
    is_album,
    is_private,
    playlist_id,
    playlist_name,
    playlist_owner_id,
    repost_count,
    save_count,
    updated_at
  } = collection
  const isOfflineModeEnabled = useIsOfflineModeEnabled()
  const { isEnabled: isEditAlbumsEnabled } = useFeatureFlag(
    FeatureFlags.EDIT_ALBUMS
  )

  const { neutralLight5 } = useThemePalette()

  const url = useMemo(() => {
    return `/${encodeUrlName(user.handle)}/${
      is_album ? 'album' : 'playlist'
    }/${encodeUrlName(playlist_name)}-${playlist_id}`
  }, [user.handle, is_album, playlist_name, playlist_id])

  const renderImage = useCallback(
    (props: ImageProps) => (
      <CollectionImage
        collection={collection}
        size={SquareSizes.SIZE_480_BY_480}
        {...props}
      />
    ),
    [collection]
  )

  const currentUserId = useSelector(getUserId)
  const isOwner = currentUserId === playlist_owner_id
  const extraDetails = useMemo(
    () => [
      {
        label: 'Modified',
        value: formatDate(updated_at || Date.now().toString())
      }
    ],
    [updated_at]
  )

  const isCollectionMarkedForDownload = useSelector(
    getIsCollectionMarkedForDownload(playlist_id.toString())
  )

  const handlePressOverflow = useCallback(() => {
    const overflowActions = [
      (!is_album || isEditAlbumsEnabled) && isOwner
        ? is_album
          ? OverflowAction.EDIT_ALBUM
          : OverflowAction.EDIT_PLAYLIST
        : null,
      isOwner && (!is_album || isEditAlbumsEnabled) && is_private
        ? OverflowAction.PUBLISH_PLAYLIST
        : null,
      isOwner && (!is_album || isEditAlbumsEnabled)
        ? is_album
          ? OverflowAction.DELETE_ALBUM
          : OverflowAction.DELETE_PLAYLIST
        : null,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(removeNullable)

    dispatch(
      openOverflowMenu({
        source: OverflowSource.COLLECTIONS,
        id: playlist_id,
        overflowActions
      })
    )
  }, [
    is_album,
    isEditAlbumsEnabled,
    isOwner,
    is_private,
    dispatch,
    playlist_id
  ])

  const handlePressEdit = useCallback(() => {
    navigation?.push('EditPlaylist', { id: playlist_id })
  }, [navigation, playlist_id])

  const handlePressPublish = useCallback(() => {
    dispatch(openPublishConfirmation({ playlistId: playlist_id }))
  }, [dispatch, playlist_id])

  const handlePressSave = useCallback(() => {
    if (has_current_user_saved) {
      if (isCollectionMarkedForDownload) {
        dispatch(
          setVisibility({
            drawer: 'UnfavoriteDownloadedCollection',
            visible: true,
            data: { collectionId: playlist_id }
          })
        )
      } else {
        dispatch(unsaveCollection(playlist_id, FavoriteSource.COLLECTION_PAGE))
      }
    } else {
      dispatch(saveCollection(playlist_id, FavoriteSource.COLLECTION_PAGE))
    }
  }, [
    dispatch,
    playlist_id,
    has_current_user_saved,
    isCollectionMarkedForDownload
  ])

  const handlePressShare = useCallback(() => {
    dispatch(
      requestOpenShareModal({
        type: 'collection',
        collectionId: playlist_id,
        source: ShareSource.PAGE
      })
    )
  }, [dispatch, playlist_id])

  const handlePressRepost = useCallback(() => {
    if (has_current_user_reposted) {
      dispatch(undoRepostCollection(playlist_id, RepostSource.COLLECTION_PAGE))
    } else {
      dispatch(repostCollection(playlist_id, RepostSource.COLLECTION_PAGE))
    }
  }, [dispatch, playlist_id, has_current_user_reposted])

  const handlePressFavorites = useCallback(() => {
    dispatch(setFavorite(playlist_id, FavoriteType.PLAYLIST))
    navigation.push('Favorited', {
      id: playlist_id,
      favoriteType: FavoriteType.PLAYLIST
    })
  }, [dispatch, playlist_id, navigation])

  const handlePressReposts = useCallback(() => {
    dispatch(setRepost(playlist_id, RepostType.COLLECTION))
    navigation.push('Reposts', {
      id: playlist_id,
      repostType: RepostType.COLLECTION
    })
  }, [dispatch, playlist_id, navigation])

  return (
    <Screen url={url}>
      <ScreenContent isOfflineCapable={isOfflineModeEnabled}>
        <VirtualizedScrollView style={styles.root}>
          <>
            <CollectionScreenDetailsTile
              description={description ?? ''}
              extraDetails={extraDetails}
              hasReposted={has_current_user_reposted}
              hasSaved={has_current_user_saved}
              isAlbum={is_album}
              collectionId={playlist_id}
              isPrivate={is_private}
              isPublishing={_is_publishing ?? false}
              onPressEdit={handlePressEdit}
              onPressFavorites={handlePressFavorites}
              onPressOverflow={handlePressOverflow}
              onPressPublish={handlePressPublish}
              onPressRepost={handlePressRepost}
              onPressReposts={handlePressReposts}
              onPressSave={handlePressSave}
              onPressShare={handlePressShare}
              renderImage={renderImage}
              repostCount={repost_count}
              saveCount={save_count}
              trackCount={track_ids.length}
              title={playlist_name}
              user={user}
              isOwner={isOwner}
            />
            {isOwner && (!is_album || isEditAlbumsEnabled) ? (
              <>
                <Divider style={styles.divider} color={neutralLight5} />
                <SuggestedCollectionTracks collectionId={playlist_id} />
              </>
            ) : null}
          </>
        </VirtualizedScrollView>
      </ScreenContent>
    </Screen>
  )
}
