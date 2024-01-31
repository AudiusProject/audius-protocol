import { ReactElement, useRef } from 'react'

import {
  cacheUsersSelectors,
  profilePageSelectors,
  topSupportersUserListSelectors,
  UserListStoreState,
  supportingUserListSelectors,
  repostsUserListSelectors,
  notificationsUserListSelectors,
  relatedArtistsUserListSelectors,
  NOTIFICATIONS_USER_LIST_TAG as NOTIFICATION_TAG,
  mutualsUserListSelectors,
  MUTUALS_USER_LIST_TAG as MUTUALS_TAG,
  followingUserListSelectors,
  followersUserListSelectors,
  favoritesUserListSelectors,
  FAVORITES_USER_LIST_TAG as FAVORITES_TAG,
  FOLLOWERS_USER_LIST_TAG as FOLLOWER_TAG,
  FOLLOWING_USER_LIST_TAG as FOLLOWING_TAG,
  REPOSTS_USER_LIST_TAG as REPOST_TAG,
  SUPPORTING_USER_LIST_TAG as SUPPORTING_TAG,
  TOP_SUPPORTERS_USER_LIST_TAG as SUPPORTER_TAG,
  RELATED_ARTISTS_USER_LIST_TAG as RELATED_ARTISTS_TAG,
  ID
} from '@audius/common'
import { IconTipping as IconTip } from '@audius/harmony'
import {
  Modal,
  IconTrophy,
  IconFollowing,
  Scrollbar,
  IconUser,
  IconUserGroup
} from '@audius/stems'

import { useSelector } from 'common/hooks/useSelector'
import UserList from 'components/user-list/UserList'
import { UserListType } from 'store/application/ui/userListModal/types'
import { AppState } from 'store/types'

import styles from './UserListModal.module.css'
const { getUserList: favoritesSelector } = favoritesUserListSelectors
const { getUserList: followersSelector } = followersUserListSelectors
const { getUserList: followingSelector } = followingUserListSelectors
const { getUserList: mutualsSelector } = mutualsUserListSelectors
const { getUserList: relatedArtistsSelector, getId: getRelatedArtistsId } =
  relatedArtistsUserListSelectors
const { getPageTitle, getUserList: notificationSelector } =
  notificationsUserListSelectors
const { getUserList: repostsSelector } = repostsUserListSelectors
const { getUserList: supportingSelector, getId: getSupportingId } =
  supportingUserListSelectors
const { getUserList: topSupportersSelector, getId: getSupportersId } =
  topSupportersUserListSelectors
const { getUser } = cacheUsersSelectors
const { getProfileUser } = profilePageSelectors

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
  relatedArtists: 'Related Artists',
  mutuals: 'Mutuals'
}

const UserListModal = ({
  userListType,
  isOpen,
  onClose
}: UserListModalProps) => {
  let tag: string
  let selector: (state: AppState) => UserListStoreState
  let userIdSelector: ((state: AppState) => ID | null) | undefined
  let title: ReactElement | string
  const notificationTitle = useSelector(getPageTitle)
  const scrollParentRef = useRef<HTMLElement>()
  const profile = useSelector(getProfileUser)
  const supportersId = useSelector(getSupportersId)
  const supportersUser = useSelector((state) =>
    getUser(state, { id: supportersId })
  )

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
      userIdSelector = getSupportersId
      title = (
        <div className={styles.titleContainer}>
          <IconTrophy className={styles.icon} />
          {!profile && supportersUser && supportersId ? (
            <div className={styles.titleNameContainer}>
              <div className={styles.titleName}>{supportersUser.name}</div>
              <span>&apos;s&nbsp;</span>
            </div>
          ) : null}
          <span>{messages.topSupporters}</span>
        </div>
      )
      break
    case UserListType.SUPPORTING:
      tag = SUPPORTING_TAG
      selector = supportingSelector
      userIdSelector = getSupportingId
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
          <span>{messages.mutuals}</span>
        </div>
      )
      break
    case UserListType.RELATED_ARTISTS:
      tag = RELATED_ARTISTS_TAG
      selector = relatedArtistsSelector
      userIdSelector = getRelatedArtistsId
      title = (
        <div className={styles.titleContainer}>
          <IconUserGroup className={styles.icon} />
          <span>{messages.relatedArtists}</span>
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
      <Scrollbar
        className={styles.scrollable}
        containerRef={(containerRef) => {
          scrollParentRef.current = containerRef
        }}
      >
        <UserList
          userIdSelector={userIdSelector}
          stateSelector={selector!}
          tag={tag}
          getScrollParent={() => scrollParentRef.current || null}
          beforeClickArtistName={onClose}
          onNavigateAway={onClose}
          afterFollow={onClose}
          afterUnfollow={onClose}
        />
      </Scrollbar>
    </Modal>
  )
}

export default UserListModal
