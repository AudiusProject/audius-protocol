import {
  accountSelectors,
  useGetUserById,
  statusIsNotFinalized
} from '@audius/common'
import { useSelector } from 'react-redux'

import { Text } from 'components/typography'
import UserBadges from 'components/user-badges/UserBadges'

import styles from './UserNameWithBadges.module.css'

const { getUserId } = accountSelectors

export const UserNameWithBadges = ({ userId }: { userId: number }) => {
  const currentUserId: number = useSelector(getUserId)!
  const { status, data: user } = useGetUserById({ id: userId, currentUserId })
  const loading = statusIsNotFinalized(status) || !user
  return loading ? null : (
    <div className={styles.container}>
      <Text variant='body' size='small' strength='strong'>
        {user.name}
      </Text>
      <UserBadges userId={userId} badgeSize={12} useSVGTiers />
    </div>
  )
}
