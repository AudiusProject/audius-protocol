import { useCallback } from 'react'

import { useSupporters } from '@audius/common/api'
import { profilePageSelectors } from '@audius/common/store'
import { MAX_PROFILE_TOP_SUPPORTERS } from '@audius/common/utils'
import { IconTrophy } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'

import { ProfilePageNavSectionTitle } from './ProfilePageNavSectionTitle'
import { ProfilePictureListTile } from './ProfilePictureListTile'
import styles from './TopSupporters.module.css'
const { getProfileUser } = profilePageSelectors

const messages = {
  topSupporters: 'Top Supporters'
}

export const TopSupporters = () => {
  const dispatch = useDispatch()
  const profile = useSelector(getProfileUser)
  const { data: supporters = [] } = useSupporters({
    userId: profile?.user_id,
    pageSize: MAX_PROFILE_TOP_SUPPORTERS
  })

  const handleClick = useCallback(() => {
    if (profile) {
      dispatch(
        setUsers({
          userListType: UserListType.SUPPORTER,
          entityType: UserListEntityType.USER,
          id: profile.user_id
        })
      )
      dispatch(setVisibility(true))
    }
  }, [profile, dispatch])

  if (!profile || supporters.length === 0) {
    return null
  }

  return (
    <div>
      <ProfilePageNavSectionTitle
        title={messages.topSupporters}
        titleIcon={<IconTrophy className={styles.trophyIcon} />}
      />
      <ProfilePictureListTile
        onClick={handleClick}
        users={supporters.map((supporter) => supporter.sender)}
        totalUserCount={profile.supporter_count}
        limit={MAX_PROFILE_TOP_SUPPORTERS}
        disableProfileClick
      />
    </div>
  )
}
