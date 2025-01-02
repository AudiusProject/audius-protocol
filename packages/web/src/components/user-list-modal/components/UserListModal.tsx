import { ReactElement, useRef } from 'react'

import { useCurrentUserId } from '@audius/common/api'
import { ID } from '@audius/common/models'
import {
  cacheUsersSelectors,
  profilePageSelectors,
  topSupportersUserListSelectors,
  supportingUserListSelectors,
  repostsUserListSelectors,
  notificationsUserListSelectors,
  mutualsUserListSelectors,
  followingUserListSelectors,
  followersUserListSelectors,
  favoritesUserListSelectors,
  relatedArtistsUserListSelectors,
  TOP_SUPPORTERS_USER_LIST_TAG as SUPPORTER_TAG,
  SUPPORTING_USER_LIST_TAG as SUPPORTING_TAG,
  REPOSTS_USER_LIST_TAG as REPOST_TAG,
  NOTIFICATIONS_USER_LIST_TAG as NOTIFICATION_TAG,
  MUTUALS_USER_LIST_TAG as MUTUALS_TAG,
  FOLLOWING_USER_LIST_TAG as FOLLOWING_TAG,
  FOLLOWERS_USER_LIST_TAG as FOLLOWER_TAG,
  FAVORITES_USER_LIST_TAG as FAVORITES_TAG,
  RELATED_ARTISTS_USER_LIST_TAG as RELATED_ARTISTS_TAG,
  PURCHASERS_USER_LIST_TAG as PURCHASERS_TAG,
  REMIXERS_USER_LIST_TAG as REMIXERS_TAG,
  UserListStoreState,
  CommonState,
  purchasersUserListSelectors,
  remixersUserListSelectors
} from '@audius/common/store'
import {
  Modal,
  Scrollbar,
  IconTipping as IconTip,
  IconUser,
  IconUserGroup,
  IconTrophy,
  IconUserFollowing as IconFollowing,
  IconCart,
  IconRemix
} from '@audius/harmony'
import { ChatBlastAudience } from '@audius/sdk'
import { useRouteMatch } from 'react-router-dom'

import { useSelector } from 'common/hooks/useSelector'
import { UserList } from 'components/user-list/UserList'
import { ChatBlastWithAudienceCTA } from 'pages/chat-page/components/ChatBlastWithAudienceCTA'
import { UserListType } from 'store/application/ui/userListModal/types'
import { AppState } from 'store/types'

import styles from './UserListModal.module.css'
const { getUserList: favoritesSelector } = favoritesUserListSelectors
const { getUserList: followersSelector, getId: getFollowerId } =
  followersUserListSelectors
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
const { getUserList: purchasersSelector, getId: getPurchasersId } =
  purchasersUserListSelectors
const { getUserList: remixersSelector, getId: getRemixersId } =
  remixersUserListSelectors
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
  mutuals: 'Mutuals',
  purchasers: 'Purchasers',
  remixers: 'Remixers'
}

const UserListModal = ({
  userListType,
  isOpen,
  onClose
}: UserListModalProps) => {
  let tag: string
  let selector: (state: AppState) => UserListStoreState
  let userIdSelector: ((state: CommonState) => ID | null) | undefined
  let title: ReactElement | string
  const notificationTitle = useSelector(getPageTitle)
  const scrollParentRef = useRef<HTMLElement>()
  const profile = useSelector(getProfileUser)
  const supportersId = useSelector(getSupportersId)
  const supportersUser = useSelector((state) =>
    getUser(state, { id: supportersId })
  )
  const { data: currentUserId } = useCurrentUserId()

  const match = useRouteMatch<{ audience_type: string }>(
    '/messages/:audience_type'
  )
  const isChatBlastPath =
    match?.params.audience_type &&
    Object.values(ChatBlastAudience).includes(
      match.params.audience_type as ChatBlastAudience
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
      userIdSelector = getFollowerId
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
    case UserListType.PURCHASER:
      tag = PURCHASERS_TAG
      selector = purchasersSelector
      userIdSelector = getPurchasersId
      title = (
        <div className={styles.titleContainer}>
          <IconCart className={styles.icon} />
          <span>{messages.purchasers}</span>
        </div>
      )
      break
    case UserListType.REMIXER:
      tag = REMIXERS_TAG
      selector = remixersSelector
      userIdSelector = getRemixersId
      title = (
        <div className={styles.titleContainer}>
          <IconRemix className={styles.icon} />
          <span>{messages.remixers}</span>
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

  const userId = useSelector((state) => userIdSelector?.(state))

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
      {!isChatBlastPath &&
      (userListType === UserListType.FOLLOWER ||
        userListType === UserListType.SUPPORTER) &&
      userId === currentUserId ? (
        <ChatBlastWithAudienceCTA
          audience={
            userListType === UserListType.FOLLOWER
              ? ChatBlastAudience.FOLLOWERS
              : ChatBlastAudience.TIPPERS
          }
          onClick={onClose}
        />
      ) : null}
    </Modal>
  )
}

export default UserListModal
