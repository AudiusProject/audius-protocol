import React, { forwardRef } from 'react'

import { Modal } from '@audius/stems'
import cn from 'classnames'
import InfiniteScroll from 'react-infinite-scroller'
import Lottie from 'react-lottie'
import { useDispatch } from 'react-redux'
import SimpleBar from 'simplebar-react'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import { FollowSource } from 'common/models/Analytics'
import { ID } from 'common/models/Identifiers'
import { User } from 'common/models/User'
import * as socialActions from 'common/store/social/users/actions'
import ArtistChip from 'components/artist/ArtistChip'
import FollowButton from 'components/general/FollowButton'

import styles from './UserListModal.module.css'

const SCROLL_THRESHOLD = 400

const getSimpleBarId = (title: string) =>
  `userListModal${title.replace(/\s+/g, '')}`

type UserListModalProps = {
  hasMore: boolean
  id: string
  initialLoad: boolean
  loading: boolean
  loadMore: () => void
  onClickArtistName: (handle: string) => void
  onClose: () => void
  title?: string
  userId?: ID
  users?: User[]
  visible?: boolean
}

export const UserListModal = forwardRef<HTMLDivElement, UserListModalProps>(
  (
    {
      hasMore,
      id,
      initialLoad,
      loading,
      loadMore,
      onClickArtistName,
      onClose,
      title = 'users',
      userId,
      visible = true,
      users = []
    },
    ref
  ) => {
    const dispatch = useDispatch()

    const onFollow = (userId: ID) =>
      dispatch(socialActions.followUser(userId, FollowSource.USER_LIST))

    const onUnfollow = (userId: ID) =>
      dispatch(socialActions.unfollowUser(userId, FollowSource.USER_LIST))

    const simpleBarId = getSimpleBarId(id || title)
    const getScrollParent = () => {
      const simpleBarElement = window.document.getElementById(simpleBarId)
      return simpleBarElement || null
    }

    return (
      <Modal
        bodyClassName={styles.modalBody}
        headerContainerClassName={styles.modalHeader}
        isOpen={visible}
        onClose={onClose}
        ref={ref}
        showDismissButton
        showTitleHeader
        title={title}
        titleClassName={styles.modalTitle}
      >
        <SimpleBar
          scrollableNodeProps={{ id: simpleBarId }}
          className={styles.scrollable}
        >
          <InfiniteScroll
            pageStart={0}
            loadMore={loadMore}
            hasMore={hasMore}
            useWindow={false}
            initialLoad={initialLoad}
            threshold={SCROLL_THRESHOLD}
            getScrollParent={getScrollParent}
          >
            {users
              .filter(user => !user.is_deactivated)
              .map(user => (
                <div key={user.user_id} className={styles.user}>
                  <ArtistChip
                    name={user.name}
                    handle={user.handle}
                    profilePictureSizes={user._profile_picture_sizes}
                    userId={user.user_id}
                    followers={user.follower_count}
                    onClickArtistName={() => {
                      onClose()
                      onClickArtistName(user.handle)
                    }}
                  />
                  {user.user_id !== userId ? (
                    <FollowButton
                      size='small'
                      showIcon={false}
                      className={styles.followButton}
                      following={user.does_current_user_follow}
                      onFollow={() => onFollow(user.user_id)}
                      onUnfollow={() => onUnfollow(user.user_id)}
                    />
                  ) : null}
                </div>
              ))}
            <div
              className={cn(styles.loadingAnimation, {
                [styles.show]: loading
              })}
            >
              <Lottie
                options={{
                  loop: true,
                  autoplay: true,
                  animationData: loadingSpinner
                }}
              />
            </div>
          </InfiniteScroll>
        </SimpleBar>
      </Modal>
    )
  }
)

export default UserListModal
