import React from 'react'
import { Modal } from '@audius/stems'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

import FollowButton from 'components/general/FollowButton'
import ArtistChip from 'components/artist/ArtistChip'
import { push as pushRoute } from 'connected-react-router'
import SimpleBar from 'simplebar-react'
import * as socialActions from 'store/social/users/actions'
import InfiniteScroll from 'react-infinite-scroller'
import Lottie from 'react-lottie'
import loadingSpinner from 'assets/animations/loadingSpinner.json'
import cn from 'classnames'

import styles from './UserListModal.module.css'
import { FollowSource } from 'services/analytics'

const SCROLL_THRESHOLD = 400

const getSimpleBarId = title => `userListModal${title.replace(/\s+/g, '')}`

export const UserListModal = props => {
  const simpleBarId = getSimpleBarId(props.id || props.title)
  const getScrollParent = () => {
    const simpleBarElement = window.document.getElementById(simpleBarId)
    return simpleBarElement || null
  }

  return (
    <Modal
      title={props.title}
      showTitleHeader
      bodyClassName={styles.modalBody}
      isOpen={props.visible}
      onClose={props.onClose}
      titleClassName={styles.modalTitle}
      headerContainerClassName={styles.modalHeader}
      showDismissButton
    >
      <SimpleBar
        scrollableNodeProps={{ id: simpleBarId }}
        className={styles.scrollable}
      >
        <InfiniteScroll
          pageStart={0}
          loadMore={props.loadMore}
          hasMore={props.hasMore}
          useWindow={false}
          initialLoad={props.initialLoad}
          threshold={SCROLL_THRESHOLD}
          getScrollParent={getScrollParent}
        >
          {props.users.map(user => (
            <div key={user.user_id} className={styles.user}>
              <ArtistChip
                name={user.name}
                handle={user.handle}
                profilePictureSizes={user._profile_picture_sizes}
                userId={user.user_id}
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
                  onFollow={() => props.onFollow(user.user_id)}
                  onUnfollow={() => props.onUnfollow(user.user_id)}
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
    </Modal>
  )
}

UserListModal.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string,
  userId: PropTypes.number,
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      follower_count: PropTypes.number,
      following: PropTypes.bool,
      verified: PropTypes.bool
    })
  ),
  initialLoad: PropTypes.bool,
  visible: PropTypes.bool,
  onClose: PropTypes.func,
  goToRoute: PropTypes.func,
  onFollow: PropTypes.func,
  onUnfollow: PropTypes.func
}

UserListModal.defaultProps = {
  initialLoad: false,
  title: 'users',
  users: [],
  visible: true
}

const mapDispatchToProps = dispatch => ({
  goToRoute: route => dispatch(pushRoute(route)),
  onFollow: userId =>
    dispatch(socialActions.followUser(userId, FollowSource.USER_LIST)),
  onUnfollow: userId =>
    dispatch(socialActions.unfollowUser(userId, FollowSource.USER_LIST))
})

export default connect(null, mapDispatchToProps)(UserListModal)
