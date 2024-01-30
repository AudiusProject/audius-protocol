import { useCallback } from 'react'

import { profilePageSelectors } from '@audius/common'
import { useRankedSupportingForUser } from '@audius/common/hooks'
import { User } from '@audius/common/models'
import { formatCount, MAX_PROFILE_SUPPORTING_TILES } from '@audius/common/utils'
import { IconArrow } from '@audius/stems'
import { useDispatch } from 'react-redux'

import IconTip from 'assets/img/iconTip.svg'
import { useSelector } from 'common/hooks/useSelector'
import { ProfilePageNavSectionTitle } from 'components/profile-page-nav-section-title/ProfilePageNavSectionTitle'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'

import styles from './SupportingList.module.css'
import { SupportingTile } from './SupportingTile'
const { getProfileUser } = profilePageSelectors

const messages = {
  supporting: 'Supporting',
  viewAll: 'View All'
}

const formatViewAllMessage = (count: number) => {
  return `${messages.viewAll} ${formatCount(count)}`
}

const SupportingListForProfile = ({ profile }: { profile: User }) => {
  const dispatch = useDispatch()
  const rankedSupportingList = useRankedSupportingForUser(profile.user_id)

  const handleClick = useCallback(() => {
    if (profile) {
      dispatch(
        setUsers({
          userListType: UserListType.SUPPORTING,
          entityType: UserListEntityType.USER,
          id: profile.user_id
        })
      )
      dispatch(setVisibility(true))
    }
  }, [profile, dispatch])

  return profile && rankedSupportingList.length > 0 ? (
    <div className={styles.container}>
      <ProfilePageNavSectionTitle
        title={messages.supporting}
        titleIcon={<IconTip className={styles.tipIcon} />}
      />
      {rankedSupportingList
        .slice(0, MAX_PROFILE_SUPPORTING_TILES)
        .map((supporting, index) => (
          <div key={`supporting-${index}`} className={styles.tile}>
            <SupportingTile supporting={supporting} />
          </div>
        ))}
      {profile.supporting_count > MAX_PROFILE_SUPPORTING_TILES && (
        <div className={styles.seeMore} onClick={handleClick}>
          <span>{formatViewAllMessage(profile.supporting_count)}</span>
          <IconArrow className={styles.arrowIcon} />
        </div>
      )}
    </div>
  ) : null
}

export const SupportingList = () => {
  const profile = useSelector(getProfileUser)
  return profile ? <SupportingListForProfile profile={profile} /> : null
}
