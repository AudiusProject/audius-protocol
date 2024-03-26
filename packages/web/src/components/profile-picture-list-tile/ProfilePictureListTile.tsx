import { Flex, IconArrowRight, PlainButton } from '@audius/harmony'

import {
  UserProfileListProps,
  UserProfilePictureList
} from 'components/notification/Notification/components/UserProfilePictureList'
import { USER_LENGTH_LIMIT } from 'components/notification/Notification/utils'

import styles from './ProfilePictureListTile.module.css'

const messages = {
  viewAll: 'View All'
}

type ProfilePictureListTileProps = UserProfileListProps & {
  onClick: () => void
}
export const ProfilePictureListTile = ({
  onClick,
  users,
  totalUserCount,
  limit = USER_LENGTH_LIMIT,
  disableProfileClick,
  disablePopover,
  stopPropagation,
  profilePictureClassname
}: ProfilePictureListTileProps) => {
  return (
    <Flex
      direction='column'
      gap='m'
      alignItems='flex-start'
      className={styles.tileContainer}
      onClick={onClick}
    >
      <UserProfilePictureList
        users={users}
        totalUserCount={totalUserCount}
        limit={limit}
        disableProfileClick={disableProfileClick}
        disablePopover={disablePopover}
        stopPropagation={stopPropagation}
        profilePictureClassname={profilePictureClassname}
      />
      <PlainButton iconRight={IconArrowRight}>{messages.viewAll}</PlainButton>
    </Flex>
  )
}
