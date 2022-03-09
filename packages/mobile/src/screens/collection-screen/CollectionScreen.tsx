import { useCallback, useMemo } from 'react'

import {
  FavoriteSource,
  RepostSource,
  ShareSource
} from 'audius-client/src/common/models/Analytics'
import { Collection } from 'audius-client/src/common/models/Collection'
import { FavoriteType } from 'audius-client/src/common/models/Favorite'
import { SquareSizes } from 'audius-client/src/common/models/ImageSizes'
import { User } from 'audius-client/src/common/models/User'
import { getUserId } from 'audius-client/src/common/store/account/selectors'
import {
  repostCollection,
  saveCollection,
  undoRepostCollection,
  unsaveCollection
} from 'audius-client/src/common/store/social/collections/actions'
import {
  OverflowAction,
  OverflowSource
} from 'audius-client/src/common/store/ui/mobile-overflow-menu/types'
import { requestOpen as requestOpenShareModal } from 'audius-client/src/common/store/ui/share-modal/slice'
import { setFavorite } from 'audius-client/src/common/store/user-list/favorites/actions'
import { setRepost } from 'audius-client/src/common/store/user-list/reposts/actions'
import { RepostType } from 'audius-client/src/common/store/user-list/reposts/types'
import { formatDate } from 'audius-client/src/common/utils/timeUtil'
import {
  FAVORITING_USERS_ROUTE,
  REPOSTING_USERS_ROUTE
} from 'audius-client/src/utils/route'
import { getCollection, getUser } from 'common/store/pages/collection/selectors'
import { open as openOverflowMenu } from 'common/store/ui/mobile-overflow-menu/slice'
import { View } from 'react-native'

import { Screen, VirtualizedScrollView } from 'app/components/core'
import { useCollectionCoverArt } from 'app/hooks/useCollectionCoverArt'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { CollectionScreenDetailsTile } from './CollectionScreenDetailsTile'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    padding: spacing(3)
  },
  headerContainer: {
    marginBottom: 240
  }
}))

/**
 * `CollectionScreen` displays the details of a collection
 */
export const CollectionScreen = () => {
  const { params } = useRoute<'Collection'>()

  const collection = useSelectorWeb(state =>
    getCollection(state, params)
  ) as Collection

  const user = useSelectorWeb(state =>
    getUser(state, { id: collection?.playlist_owner_id })
  )

  if (!collection || !user) {
    console.warn(
      'Collection or user missing for CollectionScreen, preventing render'
    )
    return null
  }

  return <CollectionScreenComponent collection={collection} user={user} />
}

type CollectionScreenComponentProps = {
  collection: Collection
  user: User
}

const CollectionScreenComponent = ({
  collection,
  user
}: CollectionScreenComponentProps) => {
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()
  const navigation = useNavigation()
  const {
    _cover_art_sizes,
    description,
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

  const imageUrl = useCollectionCoverArt(
    playlist_id,
    _cover_art_sizes,
    SquareSizes.SIZE_480_BY_480
  )

  const currentUserId = useSelectorWeb(getUserId)
  const isOwner = currentUserId === playlist_owner_id

  const extraDetails = useMemo(
    () => [
      {
        label: 'Modified',
        value: formatDate(updated_at)
      }
    ],
    [updated_at]
  )

  const handlePressOverflow = useCallback(() => {
    const overflowActions = [
      isOwner || is_private
        ? null
        : has_current_user_reposted
        ? OverflowAction.UNREPOST
        : OverflowAction.REPOST,
      isOwner || is_private
        ? null
        : has_current_user_saved
        ? OverflowAction.UNFAVORITE
        : OverflowAction.FAVORITE,
      !is_album && isOwner ? OverflowAction.EDIT_PLAYLIST : null,
      isOwner && !is_album && is_private
        ? OverflowAction.PUBLISH_PLAYLIST
        : null,
      isOwner && !is_album ? OverflowAction.DELETE_PLAYLIST : null,
      OverflowAction.VIEW_ARTIST_PAGE
    ].filter(Boolean) as OverflowAction[]

    dispatchWeb(
      openOverflowMenu({
        source: OverflowSource.COLLECTIONS,
        id: playlist_id,
        overflowActions
      })
    )
  }, [
    dispatchWeb,
    playlist_id,
    isOwner,
    is_album,
    is_private,
    has_current_user_reposted,
    has_current_user_saved
  ])

  const handlePressSave = useCallback(() => {
    if (has_current_user_saved) {
      dispatchWeb(unsaveCollection(playlist_id, FavoriteSource.COLLECTION_PAGE))
    } else {
      dispatchWeb(saveCollection(playlist_id, FavoriteSource.COLLECTION_PAGE))
    }
  }, [dispatchWeb, playlist_id, has_current_user_saved])

  const handlePressShare = useCallback(() => {
    dispatchWeb(
      requestOpenShareModal({
        type: 'collection',
        collectionId: playlist_id,
        source: ShareSource.PAGE
      })
    )
  }, [dispatchWeb, playlist_id])

  const handlePressRepost = useCallback(() => {
    if (has_current_user_reposted) {
      dispatchWeb(
        undoRepostCollection(playlist_id, RepostSource.COLLECTION_PAGE)
      )
    } else {
      dispatchWeb(repostCollection(playlist_id, RepostSource.COLLECTION_PAGE))
    }
  }, [dispatchWeb, playlist_id, has_current_user_reposted])

  const handlePressFavorites = useCallback(() => {
    dispatchWeb(setFavorite(playlist_id, FavoriteType.PLAYLIST))
    navigation.push({
      native: {
        screen: 'Favorited',
        params: { id: playlist_id, favoriteType: FavoriteType.PLAYLIST }
      },
      web: { route: FAVORITING_USERS_ROUTE }
    })
  }, [dispatchWeb, playlist_id, navigation])

  const handlePressReposts = useCallback(() => {
    dispatchWeb(setRepost(playlist_id, RepostType.COLLECTION))
    navigation.push({
      native: {
        screen: 'Reposts',
        params: { id: playlist_id, repostType: RepostType.COLLECTION }
      },
      web: { route: REPOSTING_USERS_ROUTE }
    })
  }, [dispatchWeb, playlist_id, navigation])

  return (
    <Screen>
      <VirtualizedScrollView
        listKey={`playlist-${collection.playlist_id}`}
        style={styles.root}
      >
        <View style={styles.headerContainer}>
          <CollectionScreenDetailsTile
            description={description ?? ''}
            extraDetails={extraDetails}
            hasReposted={has_current_user_reposted}
            hasSaved={has_current_user_saved}
            imageUrl={imageUrl}
            isAlbum={is_album}
            isPrivate={is_private}
            onPressFavorites={handlePressFavorites}
            onPressOverflow={handlePressOverflow}
            onPressRepost={handlePressRepost}
            onPressReposts={handlePressReposts}
            onPressSave={handlePressSave}
            onPressShare={handlePressShare}
            repostCount={repost_count}
            saveCount={save_count}
            title={playlist_name}
            user={user}
          />
        </View>
      </VirtualizedScrollView>
    </Screen>
  )
}
