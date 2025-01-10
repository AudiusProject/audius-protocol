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
import { useDispatch, useSelector } from 'react-redux'
import { useRouteMatch } from 'react-router-dom'

import { ChatBlastWithAudienceCTA } from 'pages/chat-page/components/ChatBlastWithAudienceCTA'
import {
  getUserListType,
  getIsOpen
} from 'store/application/ui/userListModal/selectors'
import { setVisibility } from 'store/application/ui/userListModal/slice'
import { UserListType } from 'store/application/ui/userListModal/types'

import styles from './UserListModal.module.css'
import { FavoritesUserList } from './lists/FavoritesUserList'
import { FollowersUserList } from './lists/FollowersUserList'
import { FollowingUserList } from './lists/FollowingUserList'
import { MutualsUserList } from './lists/MutualsUserList'
import { NotificationUserList } from './lists/NotificationUserList'
import { PurchasersUserList } from './lists/PurchasersUserList'
import { RelatedArtistsUserList } from './lists/RelatedArtistsUserList'
import { RemixersUserList } from './lists/RemixersUserList'
import { RepostsUserList } from './lists/RepostsUserList'
import { SupportingUserList } from './lists/SupportingUserList'
import { TopSupportersUserList } from './lists/TopSupportersUserList'

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

const UserListModalV2 = () => {
  const dispatch = useDispatch()
  const userListType = useSelector(getUserListType)
  const isOpen = useSelector(getIsOpen)
  const onClose = () => dispatch(setVisibility(false))

  const match = useRouteMatch<{ audience_type: string }>(
    '/messages/:audience_type'
  )
  const isChatBlastPath =
    match?.params.audience_type &&
    Object.values(ChatBlastAudience).includes(
      match.params.audience_type as ChatBlastAudience
    )

  const getUserList = () => {
    switch (userListType) {
      case UserListType.FAVORITE:
        return {
          component: <FavoritesUserList onClose={onClose} />,
          title: messages.favorites
        }
      case UserListType.REPOST:
        return {
          component: <RepostsUserList onClose={onClose} />,
          title: messages.reposts
        }
      case UserListType.FOLLOWER:
        return {
          component: <FollowersUserList onClose={onClose} />,
          title: (
            <div className={styles.titleContainer}>
              <IconUser className={styles.icon} />
              <span>{messages.followers}</span>
            </div>
          )
        }
      case UserListType.FOLLOWING:
        return {
          component: <FollowingUserList onClose={onClose} />,
          title: (
            <div className={styles.titleContainer}>
              <IconUser className={styles.icon} />
              <span>{messages.following}</span>
            </div>
          )
        }
      case UserListType.NOTIFICATION:
        return {
          component: <NotificationUserList onClose={onClose} />,
          title: (
            <div className={styles.titleContainer}>
              <IconUser className={styles.icon} />
              <span>Notifications</span>
            </div>
          )
        }
      case UserListType.SUPPORTER:
        return {
          component: <TopSupportersUserList onClose={onClose} />,
          title: (
            <div className={styles.titleContainer}>
              <IconTrophy className={styles.icon} />
              <span>{messages.topSupporters}</span>
            </div>
          )
        }
      case UserListType.SUPPORTING:
        return {
          component: <SupportingUserList onClose={onClose} />,
          title: (
            <div className={styles.titleContainer}>
              <IconTip className={styles.icon} />
              <span>{messages.supporting}</span>
            </div>
          )
        }
      case UserListType.MUTUAL_FOLLOWER:
        return {
          component: <MutualsUserList onClose={onClose} />,
          title: (
            <div className={styles.titleContainer}>
              <IconFollowing className={styles.icon} />
              <span>{messages.mutuals}</span>
            </div>
          )
        }
      case UserListType.RELATED_ARTISTS:
        return {
          component: <RelatedArtistsUserList onClose={onClose} />,
          title: (
            <div className={styles.titleContainer}>
              <IconUserGroup className={styles.icon} />
              <span>{messages.relatedArtists}</span>
            </div>
          )
        }
      case UserListType.PURCHASER:
        return {
          component: <PurchasersUserList onClose={onClose} />,
          title: (
            <div className={styles.titleContainer}>
              <IconCart className={styles.icon} />
              <span>{messages.purchasers}</span>
            </div>
          )
        }
      case UserListType.REMIXER:
        return {
          component: <RemixersUserList onClose={onClose} />,
          title: (
            <div className={styles.titleContainer}>
              <IconRemix className={styles.icon} />
              <span>{messages.remixers}</span>
            </div>
          )
        }
      default:
        return {
          component: null,
          title: ''
        }
    }
  }

  const { component, title } = getUserList()

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
      <Scrollbar className={styles.scrollable}>{component}</Scrollbar>
      {!isChatBlastPath &&
      (userListType === UserListType.FOLLOWER ||
        userListType === UserListType.SUPPORTER) ? (
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

export default UserListModalV2
