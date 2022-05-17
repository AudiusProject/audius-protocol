import React, { useState, useCallback } from 'react'

import { IconFollowing, IconArrow } from '@audius/stems'
import cn from 'classnames'

import { User } from 'common/models/User'
import UserListModal from 'components/artist/UserListModal'
import { UserProfilePictureList } from 'components/notification/Notification/components/UserProfilePictureList'
import { profilePage } from 'utils/route'

import styles from './ProfileMutuals.module.css'

const messages = {
  mutuals: 'Mutuals',
  viewAll: 'View All',
  topTags: 'Top Tags'
}

const MAX_MUTUALS = 5

type MutualsProps = {
  followers: User[]
  setShowMutualConnectionsModal: (value: boolean) => void
}
const Mutuals = ({
  followers,
  setShowMutualConnectionsModal
}: MutualsProps) => {
  const handleMutualsClick = useCallback(() => {
    setShowMutualConnectionsModal(true)
  }, [setShowMutualConnectionsModal])

  return (
    <div className={styles.mutualsContainer}>
      <div className={styles.titleContainer}>
        <IconFollowing className={styles.followingIcon} />
        <span className={styles.titleText}>{messages.mutuals}</span>
        <span className={cn(styles.line, styles.line)} />
      </div>
      <div className={styles.contentContainer} onClick={handleMutualsClick}>
        <UserProfilePictureList
          users={followers}
          totalUserCount={followers.length}
          limit={MAX_MUTUALS}
        />
        <div className={styles.viewAll}>
          <span>{messages.viewAll}</span>
          <IconArrow className={styles.arrowIcon} />
        </div>
      </div>
    </div>
  )
}

type ProfileMutualsProps = {
  users: User[]
  usersLoading: boolean
  usersCount: number
  loadMoreUsers: () => void
  goToRoute: (route: string) => void
}
export const ProfileMutuals = ({
  users,
  usersLoading,
  usersCount,
  loadMoreUsers,
  goToRoute
}: ProfileMutualsProps) => {
  const [showMutualConnectionsModal, setShowMutualConnectionsModal] = useState(
    false
  )

  return (
    <>
      <Mutuals
        followers={users}
        setShowMutualConnectionsModal={setShowMutualConnectionsModal}
      />
      <UserListModal
        id={messages.mutuals}
        title={messages.mutuals}
        visible={showMutualConnectionsModal}
        onClose={() => setShowMutualConnectionsModal(false)}
        users={users}
        loading={usersLoading}
        hasMore={users.length < usersCount}
        loadMore={loadMoreUsers}
        onClickArtistName={handle => goToRoute(profilePage(handle))}
        initialLoad={false}
      />
    </>
  )
}
