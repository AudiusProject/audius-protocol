import React from 'react'

import { useSelector } from 'react-redux'

import { ReactComponent as IconTip } from 'assets/img/iconTip.svg'
import { Supporting } from 'common/models/Tipping'
import { User } from 'common/models/User'
import { getUsers } from 'common/store/cache/users/selectors'
import { UserProfilePictureList } from 'components/notification/Notification/components/UserProfilePictureList'
import { AppState } from 'store/types'

import styles from './ArtistCard.module.css'

const messages = {
  supporting: 'Supporting'
}

const MAX_TOP_SUPPORTING = 7

type ArtistSupportingProps = {
  supportingList: Supporting[]
  supportingCount: number
  handleClick: () => void
}
export const ArtistSupporting = ({
  supportingList,
  supportingCount,
  handleClick
}: ArtistSupportingProps) => {
  const rankedSupporting = useSelector<AppState, User[]>(state => {
    const usersMap = getUsers(state, {
      ids: supportingList.map(supporting => supporting.receiver_id)
    })
    return supportingList
      .sort((s1, s2) => s1.rank - s2.rank)
      .map(s => usersMap[s.receiver_id])
  })

  return supportingList.length > 0 ? (
    <div className={styles.supportingContainer} onClick={handleClick}>
      <div className={styles.supportingTitleContainer}>
        <IconTip className={styles.supportingIcon} />
        <span className={styles.supportingTitle}>{messages.supporting}</span>
      </div>
      <div className={styles.line} />
      <UserProfilePictureList
        limit={MAX_TOP_SUPPORTING}
        users={rankedSupporting}
        totalUserCount={supportingCount}
        disableProfileClick
        disablePopover
      />
    </div>
  ) : null
}
