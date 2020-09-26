import React from 'react'
import { connect } from 'react-redux'
import Lottie from 'react-lottie'

import Modal from 'components/general/AudiusModal'
import FollowButton from 'components/general/FollowButton'
import ArtistChip from 'components/artist/ArtistChip'
import SimpleBar from 'simplebar-react'
import * as socialActions from 'store/social/users/actions'
import * as unfollowConfirmationActions from 'containers/unfollow-confirmation-modal/store/actions'
import InfiniteScroll from 'react-infinite-scroller'
import loadingSpinner from 'assets/animations/loadingSpinner.json'
import cn from 'classnames'
import { Dispatch } from 'redux'
import { AppState } from 'store/types'
import { ID } from 'models/common/Identifiers'
import User from 'models/User'
import { ReactComponent as IconRemove } from 'assets/img/iconRemove.svg'

import styles from './UserListModal.module.css'
import { getUserId } from 'store/account/selectors'
import { FollowSource } from 'services/analytics'

const SCROLL_THRESHOLD = 400
const MODAL_VERTICAL_OFFSET_PIXELS = -110

const getSimpleBarId = (title: string) =>
  `userListModal${title.replace(/\s+/g, '')}`

type OwnProps = {
  title: string
  visible: boolean
  userId: ID
  users: User[]
  loading: boolean
  hasMore: boolean
  loadMore: () => void
  onClose: () => void
  onClickArtistName: (handle: string) => void
}

type UserListModalProps = OwnProps &
  ReturnType<typeof mapDispatchToProps> &
  ReturnType<typeof mapStateToProps>

export const UserListModal = (props: UserListModalProps) => {
  const simpleBarId = getSimpleBarId(props.title)
  const getScrollParent = () => {
    const simpleBarElement = window.document.getElementById(simpleBarId)
    return simpleBarElement || null
  }

  const onFollow = (userId: ID) => {
    props.onFollow(userId)
    if (!props.loggedIn) props.onClose()
  }

  const onUnfollow = (userId: ID) => {
    props.onUnfollow(userId)
    if (!props.loggedIn) props.onClose()
  }

  return (
    <Modal
      isOpen={props.visible}
      onClose={props.onClose}
      verticalAnchorOffset={MODAL_VERTICAL_OFFSET_PIXELS}
      bodyClassName={styles.modalBody}
      allowScroll
    >
      <>
        <div className={cn(styles.header)}>
          <IconRemove className={styles.iconRemove} onClick={props.onClose} />
          <div className={styles.title}>{props.title}</div>
        </div>
        <SimpleBar
          scrollableNodeProps={{ id: simpleBarId }}
          className={styles.scrollable}
        >
          <InfiniteScroll
            pageStart={0}
            loadMore={props.loadMore}
            hasMore={props.hasMore}
            useWindow={false}
            initialLoad={false}
            threshold={SCROLL_THRESHOLD}
            getScrollParent={getScrollParent}
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
                  verified={user.is_verified}
                  onClickArtistName={() => {
                    props.onClose()
                    props.onClickArtistName(user.handle)
                  }}
                />
                {user.user_id !== props.userId ? (
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
        </SimpleBar>
      </>
    </Modal>
  )
}

UserListModal.defaultProps = {
  title: 'users',
  users: [],
  visible: true
}

function mapStateToProps(state: AppState) {
  return { loggedIn: !!getUserId(state) }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onFollow: (userId: ID) =>
      dispatch(socialActions.followUser(userId, FollowSource.USER_LIST)),
    onUnfollow: (userId: ID) =>
      dispatch(unfollowConfirmationActions.setOpen(userId))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserListModal)
