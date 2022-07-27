import { useCallback } from 'react'

import { ID, User } from '@audius/common'
import { IconTrophy } from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'

import { getUsers } from 'common/store/cache/users/selectors'
import { getProfileUser } from 'common/store/pages/profile/selectors'
import { getOptimisticSupporters } from 'common/store/tipping/selectors'
import { ProfilePageNavSectionTitle } from 'components/profile-page-nav-section-title/ProfilePageNavSectionTitle'
import { ProfilePictureListTile } from 'components/profile-picture-list-tile/ProfilePictureListTile'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'
import { AppState } from 'store/types'
import { MAX_PROFILE_TOP_SUPPORTERS } from 'utils/constants'

import styles from './TopSupporters.module.css'

const messages = {
  topSupporters: 'Top Supporters'
}

export const TopSupporters = () => {
  const dispatch = useDispatch()
  const profile = useSelector(getProfileUser)
  const supportersMap = useSelector(getOptimisticSupporters)
  const supportersForProfile = profile?.user_id
    ? supportersMap[profile.user_id] ?? {}
    : {}
  const rankedSupporters = useSelector<AppState, User[]>((state) => {
    const usersMap = getUsers(state, {
      ids: Object.keys(supportersForProfile) as unknown as ID[]
    })
    return Object.keys(supportersForProfile)
      .sort((k1, k2) => {
        return (
          supportersForProfile[k1 as unknown as ID].rank -
          supportersForProfile[k2 as unknown as ID].rank
        )
      })
      .map((k) => usersMap[k as unknown as ID])
      .filter(Boolean)
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

  if (!profile || rankedSupporters.length === 0) {
    return null
  }

  return (
    <div className={styles.container}>
      <ProfilePageNavSectionTitle
        title={messages.topSupporters}
        titleIcon={<IconTrophy className={styles.trophyIcon} />}
      />
      <ProfilePictureListTile
        onClick={handleClick}
        users={rankedSupporters}
        totalUserCount={profile.supporter_count}
        limit={MAX_PROFILE_TOP_SUPPORTERS}
        disableProfileClick
      />
    </div>
  )
}
