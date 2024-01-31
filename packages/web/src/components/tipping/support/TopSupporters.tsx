import {
  cacheUsersSelectors,
  profilePageSelectors,
  tippingSelectors
} from '@audius/common/store'

import { useCallback } from 'react'

import {} from '@audius/common'
import { ID, User } from '@audius/common/models'
import { MAX_PROFILE_TOP_SUPPORTERS } from '@audius/common/utils'
import { IconTrophy } from '@audius/stems'
import { useDispatch, useSelector } from 'react-redux'

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

import styles from './TopSupporters.module.css'
const { getOptimisticSupporters } = tippingSelectors
const { getUsers } = cacheUsersSelectors
const { getProfileUser } = profilePageSelectors

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
    <div>
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
