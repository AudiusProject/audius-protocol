import React from 'react'

import cn from 'classnames'
import InfiniteScroll from 'react-infinite-scroller'
import Lottie from 'react-lottie'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import { ID } from 'common/models/Identifiers'
import { User } from 'common/models/User'
import ArtistChip from 'components/artist/ArtistChip'
import FollowButton from 'components/general/FollowButton'

import styles from './UserList.module.css'

const SCROLL_THRESHOLD = 400

type UserListProps = {
  hasMore: boolean
  loading: boolean
  userId: ID | null
  users: User[]
  isMobile: boolean
  loadMore: () => void
  onClickArtistName: (handle: string) => void
  onFollow: (userId: ID) => void
  onUnfollow: (userId: ID) => void
  getScrollParent?: () => HTMLElement | null
}

const UserList = (props: UserListProps) => {
  return (
    <div className={styles.content}>
      <InfiniteScroll
        pageStart={0}
        loadMore={props.loadMore}
        hasMore={props.hasMore}
        useWindow={!props.getScrollParent}
        initialLoad={false}
        threshold={SCROLL_THRESHOLD}
        getScrollParent={props.getScrollParent}
      >
        {props.users.map(user => (
          <div key={user.user_id} className={styles.user}>
            <ArtistChip
              name={user.name}
              userId={user.user_id}
              profilePictureSizes={user._profile_picture_sizes}
              handle={user.handle}
              className={styles.artistChipContainer}
              followers={user.follower_count}
              onClickArtistName={() => {
                props.onClickArtistName(user.handle)
              }}
              showPopover={!props.isMobile}
            />
            {user.user_id !== props.userId ? (
              <FollowButton
                size='small'
                showIcon={false}
                className={styles.followButton}
                following={user.does_current_user_follow}
                onFollow={() => props.onFollow(user.user_id)}
                onUnfollow={() => props.onUnfollow(user.user_id)}
              />
            ) : null}
          </div>
        ))}
        {/* Only show the spacer if we're in fullscreen mode (no getScrollParent) */}
        {props.loading && !props.getScrollParent && (
          <div className={styles.spacer} />
        )}
        <div
          className={cn(styles.loadingAnimation, {
            [styles.show]: props.loading
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
    </div>
  )
}

export default UserList
