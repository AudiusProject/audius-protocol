import {
  Modal,
  IconTipping as IconTip,
  IconUser,
  IconUserGroup,
  IconTrophy,
  IconUserFollowing as IconFollowing,
  IconCart,
  IconRemix,
  ModalHeader,
  ModalTitle,
  ModalContent,
  IconRepost,
  IconHeart
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

import { FavoritesUserList } from '../../user-list/lists/FavoritesUserList'
import { FollowersUserList } from '../../user-list/lists/FollowersUserList'
import { FollowingUserList } from '../../user-list/lists/FollowingUserList'
import { MutualsUserList } from '../../user-list/lists/MutualsUserList'
import { NotificationUserList } from '../../user-list/lists/NotificationUserList'
import { PurchasersUserList } from '../../user-list/lists/PurchasersUserList'
import { RelatedArtistsUserList } from '../../user-list/lists/RelatedArtistsUserList'
import { RemixersUserList } from '../../user-list/lists/RemixersUserList'
import { RepostsUserList } from '../../user-list/lists/RepostsUserList'
import { SupportingUserList } from '../../user-list/lists/SupportingUserList'
import { TopSupportersUserList } from '../../user-list/lists/TopSupportersUserList'

import styles from './UserListModal.module.css'

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
          component: <FavoritesUserList />,
          icon: IconHeart,
          title: messages.favorites
        }
      case UserListType.REPOST:
        return {
          component: <RepostsUserList />,
          icon: IconRepost,
          title: messages.reposts
        }
      case UserListType.FOLLOWER:
        return {
          component: <FollowersUserList />,
          icon: IconUser,
          title: messages.followers
        }
      case UserListType.FOLLOWING:
        return {
          component: <FollowingUserList />,
          icon: IconUser,
          title: messages.following
        }
      // case UserListType.NOTIFICATION:
      //   return {
      //     component: <NotificationUserList />,
      //     title: (
      //       <div className={styles.titleContainer}>
      //         <IconUser className={styles.icon} />
      //         <span>Notifications</span>
      //       </div>
      //     )
      //   }
      case UserListType.SUPPORTER:
        return {
          component: <TopSupportersUserList />,
          icon: IconTrophy,
          title: messages.topSupporters
        }
      case UserListType.SUPPORTING:
        return {
          component: <SupportingUserList />,
          icon: IconTip,
          title: messages.supporting
        }
      // case UserListType.MUTUAL_FOLLOWER:
      //   return {
      //     component: <MutualsUserList />,
      //     title: (
      //       <div className={styles.titleContainer}>
      //         <IconFollowing className={styles.icon} />
      //         <span>{messages.mutuals}</span>
      //       </div>
      //     )
      //   }
      // case UserListType.RELATED_ARTISTS:
      //   return {
      //     component: <RelatedArtistsUserList />,
      //     title: (
      //       <div className={styles.titleContainer}>
      //         <IconUserGroup className={styles.icon} />
      //         <span>{messages.relatedArtists}</span>
      //       </div>
      //     )
      //   }
      // case UserListType.PURCHASER:
      //   return {
      //     component: <PurchasersUserList />,
      //     title: (
      //       <div className={styles.titleContainer}>
      //         <IconCart className={styles.icon} />
      //         <span>{messages.purchasers}</span>
      //       </div>
      //     )
      //   }
      // case UserListType.REMIXER:
      //   return {
      //     component: <RemixersUserList />,
      //     title: (
      //       <div className={styles.titleContainer}>
      //         <IconRemix className={styles.icon} />
      //         <span>{messages.remixers}</span>
      //       </div>
      //     )
      //   }
      default:
        return {
          component: null,
          title: ''
        }
    }
  }

  const { component, title, icon: Icon } = getUserList()

  return (
    <Modal
      isOpen={isOpen}
      bodyClassName={styles.modalBody}
      titleClassName={styles.modalTitle}
      headerContainerClassName={styles.modalHeader}
      showDismissButton
      onClose={onClose}
    >
      <ModalHeader>
        <ModalTitle icon={<Icon />} title={title} />
      </ModalHeader>
      <ModalContent>
        {component}
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
      </ModalContent>
    </Modal>
  )
}

export default UserListModalV2
