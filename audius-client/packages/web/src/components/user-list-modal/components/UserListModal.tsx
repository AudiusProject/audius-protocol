import React, { ReactElement } from 'react'

import { Modal, IconTrophy, IconUser, IconFollowing } from '@audius/stems'
import SimpleBar from 'simplebar-react-legacy'

import { ReactComponent as IconTip } from 'assets/img/iconTip.svg'
import { useSelector } from 'common/hooks/useSelector'
import { getUserList as favoritesSelector } from 'common/store/user-list/favorites/selectors'
import { getUserList as followersSelector } from 'common/store/user-list/followers/selectors'
import { getUserList as followingSelector } from 'common/store/user-list/following/selectors'
import { getUserList as mutualsSelector } from 'common/store/user-list/mutuals/selectors'
import { USER_LIST_TAG as MUTUALS_TAG } from 'common/store/user-list/mutuals/types'
import {
  getPageTitle,
  getUserList as notificationSelector
} from 'common/store/user-list/notifications/selectors'
import { USER_LIST_TAG as NOTIFICATION_TAG } from 'common/store/user-list/notifications/types'
import { getUserList as repostsSelector } from 'common/store/user-list/reposts/selectors'
import { getUserList as supportingSelector } from 'common/store/user-list/supporting/selectors'
import { getUserList as topSupportersSelector } from 'common/store/user-list/top-supporters/selectors'
import { UserListStoreState } from 'common/store/user-list/types'
import UserList from 'components/user-list/UserList'
import { USER_LIST_TAG as FAVORITES_TAG } from 'pages/favorites-page/sagas'
import { USER_LIST_TAG as FOLLOWER_TAG } from 'pages/followers-page/sagas'
import { USER_LIST_TAG as FOLLOWING_TAG } from 'pages/following-page/sagas'
import { USER_LIST_TAG as REPOST_TAG } from 'pages/reposts-page/sagas'
import { USER_LIST_TAG as SUPPORTING_TAG } from 'pages/supporting-page/sagas'
import { USER_LIST_TAG as SUPPORTER_TAG } from 'pages/top-supporters-page/sagas'
import { UserListType } from 'store/application/ui/userListModal/types'
import { AppState } from 'store/types'

import styles from './UserListModal.module.css'

const SIMPLE_BAR_ID = 'USER_LIST_SIMPLE_BAR'

type UserListModalProps = {
  userListType: UserListType
  isOpen: boolean
  onClose: () => void
}

const messages = {
  reposts: 'Reposts',
  favorites: 'Favorites',
  followers: 'Followers',
  following: 'Following',
  topSupporters: 'Top Supporters',
  supporting: 'Supporting',
  mutuals: 'Mutuals'
}

const getScrollParent = () => {
  const simpleBarElement = window.document.getElementById(SIMPLE_BAR_ID)
  return simpleBarElement || null
}

const UserListModal = ({
  userListType,
  isOpen,
  onClose
}: UserListModalProps) => {
  let tag: string
  let selector: (state: AppState) => UserListStoreState
  let title: ReactElement | string
  const notificationTitle = useSelector(getPageTitle)

  switch (userListType) {
    case UserListType.FAVORITE:
      tag = FAVORITES_TAG
      selector = favoritesSelector
      title = messages.favorites
      break
    case UserListType.REPOST:
      tag = REPOST_TAG
      selector = repostsSelector
      title = messages.reposts
      break
    case UserListType.FOLLOWER:
      tag = FOLLOWER_TAG
      selector = followersSelector
      title = (
        <div className={styles.titleContainer}>
          <IconUser className={styles.icon} />
          <span>{messages.followers}</span>
        </div>
      )
      break
    case UserListType.FOLLOWING:
      tag = FOLLOWING_TAG
      selector = followingSelector
      title = (
        <div className={styles.titleContainer}>
          <IconUser className={styles.icon} />
          <span>{messages.following}</span>
        </div>
      )
      break
    case UserListType.NOTIFICATION:
      tag = NOTIFICATION_TAG
      selector = notificationSelector
      title = (
        <div className={styles.titleContainer}>
          <IconUser className={styles.icon} />
          <span>{notificationTitle}</span>
        </div>
      )
      break
    case UserListType.SUPPORTER:
      tag = SUPPORTER_TAG
      selector = topSupportersSelector
      title = (
        <div className={styles.titleContainer}>
          <IconTrophy className={styles.icon} />
          <span>{messages.topSupporters}</span>
        </div>
      )
      break
    case UserListType.SUPPORTING:
      tag = SUPPORTING_TAG
      selector = supportingSelector
      title = (
        <div className={styles.titleContainer}>
          <IconTip className={styles.icon} />
          <span>{messages.supporting}</span>
        </div>
      )
      break
    case UserListType.MUTUAL_FOLLOWER:
      tag = MUTUALS_TAG
      selector = mutualsSelector
      title = (
        <div className={styles.titleContainer}>
          <IconFollowing className={styles.icon} />
          <span>{messages.supporting}</span>
        </div>
      )
      break
    // Should not happen but typescript doesn't seem to be
    // smart enough to pass props to components below
    default:
      tag = FOLLOWER_TAG
      selector = followersSelector
      title = messages.followers
      break
  }

  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      showTitleHeader
      bodyClassName={styles.modalBody}
      titleClassName={styles.modalTitle}
      headerContainerClassName={styles.modalHeader}
      showDismissButton
    >
      {/* Typescript complains about no valid constructor, possibly
        due to the two simplebar packages we maintain.
      // @ts-ignore */}
      <SimpleBar
        scrollableNodeProps={{ id: SIMPLE_BAR_ID }}
        className={styles.scrollable}
      >
        <UserList
          stateSelector={selector!}
          tag={tag}
          getScrollParent={getScrollParent}
          beforeClickArtistName={onClose}
        />
      </SimpleBar>
    </Modal>
  )
}

export default UserListModal
