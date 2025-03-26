import { useCallback } from 'react'

import {
  useCollection,
  useUser,
  useFollowUser,
  useUnfollowUser
} from '@audius/common/api'
import { FollowSource } from '@audius/common/models'
import { IconButton, IconKebabHorizontal } from '@audius/harmony'
import { pick } from 'lodash'

import { CollectionMenuProps } from 'components/menu/CollectionMenu'
import Menu from 'components/menu/Menu'

const messages = {
  follow: 'Follow User',
  unfollow: 'Unfollow User',
  moreOptions: 'More Options'
}

type OverflowMenuButtonProps = {
  collectionId: number
  isOwner?: boolean
}

export const OverflowMenuButton = (props: OverflowMenuButtonProps) => {
  const { collectionId, isOwner } = props
  const { mutate: followUser } = useFollowUser()
  const { mutate: unfollowUser } = useUnfollowUser()
  const { data: partialCollection } = useCollection(collectionId, {
    select: (collection) =>
      pick(
        collection,
        'is_album',
        'playlist_name',
        'is_private',
        'is_stream_gated',
        'playlist_owner_id',
        'has_current_user_saved',
        'permalink',
        'access'
      )
  })
  const {
    is_album,
    playlist_name,
    is_private,
    is_stream_gated,
    playlist_owner_id,
    has_current_user_saved,
    permalink,
    access
  } = partialCollection ?? {}

  const { data: owner } = useUser(playlist_owner_id)
  const isFollowing = owner?.does_current_user_follow
  const hasStreamAccess = access?.stream

  const handleFollow = useCallback(() => {
    if (isFollowing) {
      unfollowUser({
        followeeUserId: playlist_owner_id,
        source: FollowSource.COLLECTION_PAGE
      })
    } else {
      followUser({
        followeeUserId: playlist_owner_id,
        source: FollowSource.COLLECTION_PAGE
      })
    }
  }, [isFollowing, playlist_owner_id, followUser, unfollowUser])

  const extraMenuItems = !isOwner
    ? [
        {
          text: isFollowing ? messages.unfollow : messages.follow,
          onClick: handleFollow
        }
      ]
    : []

  const overflowMenu = {
    type: is_album ? ('album' as const) : ('playlist' as const),
    playlistId: collectionId,
    playlistName: playlist_name,
    handle: owner?.handle,
    isFavorited: has_current_user_saved,
    mount: 'page',
    isOwner,
    includeEmbed: !is_private && !is_stream_gated,
    includeFavorite: hasStreamAccess,
    includeRepost: hasStreamAccess,
    includeShare: true,
    includeVisitPage: false,
    isPublic: !is_private,
    extraMenuItems,
    permalink
  } as unknown as CollectionMenuProps

  return (
    <Menu menu={overflowMenu}>
      {(ref, triggerPopup) => (
        <IconButton
          ref={ref}
          aria-label={messages.moreOptions}
          size='2xl'
          icon={IconKebabHorizontal}
          onClick={() => triggerPopup()}
          color='subdued'
        />
      )}
    </Menu>
  )
}
