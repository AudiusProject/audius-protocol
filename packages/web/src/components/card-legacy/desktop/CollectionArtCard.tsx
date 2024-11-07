import { useCallback, useEffect, useState } from 'react'

import { imageBlank as placeholderArt } from '@audius/common/assets'
import { SquareSizes, ID } from '@audius/common/models'
import {
  accountSelectors,
  cacheCollectionsSelectors,
  cacheUsersSelectors
} from '@audius/common/store'
import { route } from '@audius/common/utils'
import { IconKebabHorizontal } from '@audius/harmony'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import { CollectionMenuProps } from 'components/menu/CollectionMenu'
import Menu from 'components/menu/Menu'
import PerspectiveCard from 'components/perspective-card/PerspectiveCard'
import RepostFavoritesStats, {
  Size
} from 'components/repost-favorites-stats/RepostFavoritesStats'
import { useCollectionCoverArt3 } from 'hooks/useCollectionCoverArt'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListType,
  UserListEntityType
} from 'store/application/ui/userListModal/types'
import { AppState } from 'store/types'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './CollectionArtCard.module.css'

const { profilePage, collectionPage } = route
const { getUserFromCollection } = cacheUsersSelectors
const { getCollection } = cacheCollectionsSelectors
const getUserId = accountSelectors.getUserId

type OwnProps = {
  className?: string
  id: ID
  index: number
  isLoading?: boolean
  setDidLoad?: (index: number) => void
}

type CollectionArtCardProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const g = withNullGuard((props: CollectionArtCardProps) => {
  const { collection, user } = props
  if (collection && user) {
    return {
      ...props,
      collection,
      user
    }
  }
})

const CollectionArtCard = g(
  ({
    className,
    index,
    isLoading,
    setDidLoad,
    collection,
    user,
    currentUserId,
    setRepostUsers,
    setFavoriteUsers,
    setModalVisibility,
    goToRoute
  }) => {
    const {
      playlist_id,
      playlist_name,
      is_album,
      _cover_art_sizes,
      has_current_user_reposted,
      has_current_user_saved,
      is_stream_gated,
      is_private,
      repost_count,
      save_count,
      permalink,
      access
    } = collection
    const { user_id, name, handle } = user
    const hasStreamAccess = access?.stream

    const [isPerspectiveDisabled, setIsPerspectiveDisabled] = useState(false)

    const goToCollection = useCallback(() => {
      if (isPerspectiveDisabled) return
      const link = collectionPage(
        handle,
        playlist_name,
        playlist_id,
        permalink,
        is_album
      )
      goToRoute(link)
    }, [
      is_album,
      handle,
      playlist_name,
      playlist_id,
      goToRoute,
      isPerspectiveDisabled,
      permalink
    ])

    const goToProfile = useCallback(() => {
      const link = profilePage(handle)
      goToRoute(link)
    }, [handle, goToRoute])

    const onClickReposts = useCallback(() => {
      setRepostUsers(playlist_id)
      setModalVisibility()
    }, [setRepostUsers, setModalVisibility, playlist_id])

    const onClickFavorites = useCallback(() => {
      setFavoriteUsers(playlist_id)
      setModalVisibility()
    }, [setFavoriteUsers, setModalVisibility, playlist_id])

    const image = useCollectionCoverArt3({
      collectionId: playlist_id,
      size: SquareSizes.SIZE_480_BY_480,
      defaultImage: placeholderArt
    })

    useEffect(() => {
      if (image && setDidLoad) setDidLoad(index)
    }, [image, setDidLoad, index])

    const menu = {
      type: is_album ? ('album' as const) : ('playlist' as const),
      handle,
      playlistId: playlist_id,
      playlistName: playlist_name,
      isOwner: currentUserId === user_id,
      includeShare: true,
      includeRepost: hasStreamAccess,
      includeFavorite: hasStreamAccess,
      includeVisitPage: true,
      includeEmbed: !is_private && !is_stream_gated,
      isFavorited: has_current_user_saved,
      isReposted: has_current_user_reposted,
      metadata: collection,
      name: playlist_name,
      permalink: permalink || null
    } as unknown as CollectionMenuProps

    return (
      <div className={cn(styles.card, className)}>
        <PerspectiveCard
          onClick={goToCollection}
          isDisabled={isPerspectiveDisabled}
          className={styles.perspectiveCard}
        >
          <DynamicImage
            wrapperClassName={styles.coverArt}
            image={isLoading ? '' : image}
          >
            <Menu menu={menu} onClose={() => setIsPerspectiveDisabled(false)}>
              {(ref, triggerPopup) => (
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsPerspectiveDisabled(true)
                    triggerPopup()
                  }}
                  className={styles.iconKebabHorizontalWrapper}
                >
                  <div ref={ref}>
                    <IconKebabHorizontal
                      className={styles.iconKebabHorizontal}
                    />
                  </div>
                </div>
              )}
            </Menu>
          </DynamicImage>
        </PerspectiveCard>
        <div className={styles.playlistName} onClick={goToCollection}>
          {playlist_name}
        </div>
        <div className={styles.nameWrapper}>
          <ArtistPopover handle={handle}>
            <span className={styles.userName} onClick={goToProfile}>
              {name}
            </span>
          </ArtistPopover>
        </div>
        <RepostFavoritesStats
          isUnlisted={false}
          size={Size.SMALL}
          repostCount={repost_count}
          saveCount={save_count}
          onClickReposts={onClickReposts}
          onClickFavorites={onClickFavorites}
          className={styles.statsWrapper}
        />
      </div>
    )
  }
)

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  return {
    collection: getCollection(state, { id: ownProps.id }),
    user: getUserFromCollection(state, { id: ownProps.id }),
    currentUserId: getUserId(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    setRepostUsers: (trackID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.REPOST,
          entityType: UserListEntityType.COLLECTION,
          id: trackID
        })
      ),
    setFavoriteUsers: (trackID: ID) =>
      dispatch(
        setUsers({
          userListType: UserListType.FAVORITE,
          entityType: UserListEntityType.COLLECTION,
          id: trackID
        })
      ),
    setModalVisibility: () => dispatch(setVisibility(true)),
    goToRoute: (route: string) => dispatch(pushRoute(route))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(CollectionArtCard)
