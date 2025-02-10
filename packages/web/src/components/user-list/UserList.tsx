import { useCallback, useRef } from 'react'

import {
  useCurrentUserId,
  useFollowUser,
  useUnfollowUser,
  useUser
} from '@audius/common/api'
import { ID, User, FollowSource } from '@audius/common/models'
import { route } from '@audius/common/utils'
import { FollowButton, Scrollbar } from '@audius/harmony'
import { css } from '@emotion/react'
import cn from 'classnames'
import { range } from 'lodash'
import InfiniteScroll from 'react-infinite-scroller'
import { useDispatch } from 'react-redux'

import ArtistChip from 'components/artist/ArtistChip'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { MountPlacement } from 'components/types'
import { useIsMobile } from 'hooks/useIsMobile'
import { setVisibility } from 'store/application/ui/userListModal/slice'
import { push } from 'utils/navigation'

import styles from './UserList.module.css'

const { profilePage } = route

const SCROLL_THRESHOLD = 400

type SkeletonItem = {
  _loading: true
  user_id: string
}

const skeletonData: SkeletonItem[] = range(6).map((index) => ({
  _loading: true,
  user_id: `skeleton ${index}`
}))

type UserListItemProps = {
  userId: ID
  isLastItem: boolean
  onClickArtistName: (handle: string) => void
  onClose: () => void
  showSupportFor?: ID
  showSupportFrom?: ID
}

const UserListItem = ({
  userId,
  isLastItem,
  onClickArtistName,
  onClose,
  showSupportFor,
  showSupportFrom
}: UserListItemProps) => {
  const isMobile = useIsMobile()
  const { data: currentUserId } = useCurrentUserId()
  const { mutate: followUser } = useFollowUser()
  const { mutate: unfollowUser } = useUnfollowUser()
  const { data: user } = useUser(userId)

  const handleClickArtistName = useCallback(() => {
    if (user) {
      onClickArtistName(user.handle)
    }
  }, [onClickArtistName, user])

  if (!user) {
    return null
  }

  return (
    <div
      className={cn(styles.userContainer, {
        [styles.notLastUser]: !isLastItem
      })}
    >
      <ArtistChip
        user={user}
        onClickArtistName={handleClickArtistName}
        onNavigateAway={onClose}
        showPopover={!isMobile}
        popoverMount={MountPlacement.BODY}
        showSupportFor={showSupportFor}
        showSupportFrom={showSupportFrom}
      />
      {user.user_id !== currentUserId && (
        <FollowButton
          size='small'
          isFollowing={user.does_current_user_follow}
          onFollow={() =>
            followUser({
              followeeUserId: user.user_id,
              source: FollowSource.USER_LIST
            })
          }
          onUnfollow={() =>
            unfollowUser({
              followeeUserId: user.user_id,
              source: FollowSource.USER_LIST
            })
          }
          fullWidth={false}
        />
      )}
    </div>
  )
}

type UserListProps = {
  data: User[] | undefined
  hasNextPage: boolean
  isLoading: boolean
  fetchNextPage: () => void
  showSupportFor?: ID
  showSupportFrom?: ID
}

export const UserList = ({
  data,
  hasNextPage,
  isLoading,
  fetchNextPage,
  showSupportFor,
  showSupportFrom
}: UserListProps) => {
  const dispatch = useDispatch()

  const handleClose = useCallback(
    () => dispatch(setVisibility(false)),
    [dispatch]
  )

  const handleClickArtistName = useCallback(
    (handle: string) => {
      dispatch(push(profilePage(handle)))
      handleClose()
    },
    [dispatch, handleClose]
  )

  const displayData = [...(data ?? []), ...(isLoading ? skeletonData : [])]

  const scrollParentRef = useRef<HTMLElement | null>(null)

  return (
    <Scrollbar
      css={css`
        min-height: 0;
        max-height: 690px;
        height: 100%;
        overflow-y: auto;
        overflow-x: hidden;
      `}
      containerRef={(containerRef) => {
        scrollParentRef.current = containerRef
      }}
    >
      <div className={styles.content}>
        <InfiniteScroll
          pageStart={0}
          loadMore={fetchNextPage}
          hasMore={hasNextPage}
          useWindow={false}
          initialLoad={false}
          threshold={SCROLL_THRESHOLD}
          getScrollParent={() => scrollParentRef.current}
        >
          {displayData.map((user, index) =>
            '_loading' in user ? (
              <div key={user.user_id} className={styles.userContainer}>
                Add loading skeleton
              </div>
            ) : (
              <UserListItem
                key={user.user_id}
                userId={user.user_id}
                isLastItem={data ? index === data.length - 1 : false}
                onClickArtistName={handleClickArtistName}
                onClose={handleClose}
                showSupportFor={showSupportFor}
                showSupportFrom={showSupportFrom}
              />
            )
          )}
          {isLoading && <div className={styles.spacer} />}
          <div
            className={cn(styles.loadingAnimation, {
              [styles.show]: isLoading
            })}
          >
            <LoadingSpinner className={styles.spinner} />
          </div>
        </InfiniteScroll>
      </div>
    </Scrollbar>
  )
}
