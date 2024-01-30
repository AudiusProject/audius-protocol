import {
  SUPPORTING_USER_LIST_TAG,
  TOP_SUPPORTERS_USER_LIST_TAG
} from '@audius/common'
import { ID, User } from '@audius/common/models'
import cn from 'classnames'
import InfiniteScroll from 'react-infinite-scroller'
import Lottie from 'react-lottie'

import loadingSpinner from 'assets/animations/loadingSpinner.json'
import ArtistChip from 'components/artist/ArtistChip'
import { FollowButton } from 'components/follow-button/FollowButton'
import { MountPlacement } from 'components/types'

import styles from './UserList.module.css'

const SCROLL_THRESHOLD = 400

type UserListProps = {
  hasMore: boolean
  loading: boolean
  userId: ID | null
  users: User[]
  isMobile: boolean
  tag: string
  otherUserId?: ID
  loadMore: () => void
  onClickArtistName: (handle: string) => void
  onFollow: (userId: ID) => void
  onUnfollow: (userId: ID) => void
  getScrollParent?: () => HTMLElement | null
  onNavigateAway?: () => void
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
        {props.users.map((user, index) => (
          <div
            key={user.user_id}
            className={cn(styles.user, {
              [styles.notLastUser]: index !== props.users.length - 1
            })}
          >
            <ArtistChip
              user={user}
              onClickArtistName={() => {
                props.onClickArtistName(user.handle)
              }}
              onNavigateAway={props.onNavigateAway}
              showPopover={!props.isMobile}
              popoverMount={MountPlacement.BODY}
              showSupportFor={
                props.tag === TOP_SUPPORTERS_USER_LIST_TAG
                  ? props.otherUserId
                  : undefined
              }
              showSupportFrom={
                props.tag === SUPPORTING_USER_LIST_TAG
                  ? props.otherUserId
                  : undefined
              }
            />
            {user.user_id !== props.userId ? (
              <FollowButton
                size='small'
                following={user.does_current_user_follow}
                onFollow={() => props.onFollow(user.user_id)}
                onUnfollow={() => props.onUnfollow(user.user_id)}
                showIcon
                stopPropagation
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
