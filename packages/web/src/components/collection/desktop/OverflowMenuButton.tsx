import { useCallback } from 'react'

import { FollowSource, Collection, User } from '@audius/common/models'
import {
  collectionPageSelectors,
  usersSocialActions,
  CommonState
} from '@audius/common/store'
import { Button, IconKebabHorizontal } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import { CollectionMenuProps } from 'components/menu/CollectionMenu'
import Menu from 'components/menu/Menu'

const { getCollection, getUser } = collectionPageSelectors
const { followUser, unfollowUser } = usersSocialActions

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
  const dispatch = useDispatch()
  const {
    is_album,
    playlist_name,
    is_private,
    playlist_owner_id,
    has_current_user_saved,
    permalink
  } =
    (useSelector((state: CommonState) =>
      getCollection(state, { id: collectionId })
    ) as Collection) ?? {}

  const owner = useSelector(getUser) as User
  const isFollowing = owner?.does_current_user_follow

  const handleFollow = useCallback(() => {
    if (isFollowing) {
      dispatch(unfollowUser(playlist_owner_id, FollowSource.COLLECTION_PAGE))
    } else {
      dispatch(followUser(playlist_owner_id, FollowSource.COLLECTION_PAGE))
    }
  }, [isFollowing, dispatch, playlist_owner_id])

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
    includeEmbed: true,
    includeSave: false,
    includeVisitPage: false,
    isPublic: !is_private,
    extraMenuItems,
    permalink
  } as unknown as CollectionMenuProps

  return (
    <Menu menu={overflowMenu}>
      {(ref, triggerPopup) => (
        <Button
          variant='secondary'
          ref={ref}
          aria-label={messages.moreOptions}
          iconLeft={IconKebabHorizontal}
          onClick={() => triggerPopup()}
        />
      )}
    </Menu>
  )
}
