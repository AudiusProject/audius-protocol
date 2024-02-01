import { useCallback, useEffect } from 'react'

import { ID, User } from '@audius/common/models'
import {
  cacheUsersSelectors,
  tippingSelectors,
  tippingActions,
  userListActions,
  SUPPORTING_USER_LIST_TAG as SUPPORTING_TAG
} from '@audius/common/store'
import {
  stringWeiToBN,
  MAX_ARTIST_HOVER_TOP_SUPPORTING
} from '@audius/common/utils'
import { useDispatch } from 'react-redux'

import IconTip from 'assets/img/iconTip.svg'
import { useSelector } from 'common/hooks/useSelector'
import { UserProfilePictureList } from 'components/notification/Notification/components/UserProfilePictureList'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'

import styles from './ArtistSupporting.module.css'
const { loadMore, reset } = userListActions
const { getUsers } = cacheUsersSelectors
const { getOptimisticSupporting } = tippingSelectors
const { fetchSupportingForUser } = tippingActions

const messages = {
  supporting: 'Supporting'
}

type ArtistSupportingProps = {
  artist: User
  onNavigateAway?: () => void
}
export const ArtistSupporting = (props: ArtistSupportingProps) => {
  const { artist, onNavigateAway } = props
  const { user_id, supporting_count } = artist
  const dispatch = useDispatch()

  const supportingMap = useSelector(getOptimisticSupporting)
  const hasNotPreviouslyFetchedSupportingForArtist =
    supportingMap[user_id] === undefined
  const supportingForArtist = supportingMap[user_id] ?? {}
  const supportingForArtistIds = Object.keys(
    supportingForArtist
  ) as unknown as ID[]
  const rankedSupportingList = supportingForArtistIds
    .sort((k1, k2) => {
      const amount1BN = stringWeiToBN(supportingForArtist[k1].amount)
      const amount2BN = stringWeiToBN(supportingForArtist[k2].amount)
      return amount1BN.gte(amount2BN) ? -1 : 1
    })
    .map((k) => supportingForArtist[k])

  const rankedSupporting = useSelector((state) => {
    const usersMap = getUsers(state, {
      ids: rankedSupportingList.map((supporting) => supporting.receiver_id)
    })
    return rankedSupportingList
      .sort((s1, s2) => s1.rank - s2.rank)
      .map((s) => usersMap[s.receiver_id])
      .filter(Boolean)
  })

  /**
   * It's possible that we don't have the data for which artists
   * this artist is supporting. Thus, we fetch in this case.
   */
  useEffect(() => {
    if (hasNotPreviouslyFetchedSupportingForArtist) {
      dispatch(fetchSupportingForUser({ userId: user_id }))
    }
  }, [dispatch, hasNotPreviouslyFetchedSupportingForArtist, user_id])

  const handleClick = useCallback(() => {
    /**
     * It's possible that we are already in the supporting
     * user list modal, and that we are hovering over one
     * of the users.
     * Clicking on the supporting section is supposed to
     * load a new user list modal that shows the users who
     * are being supported by the user represented by the
     * artist card.
     */
    dispatch(reset(SUPPORTING_TAG))
    dispatch(
      setUsers({
        userListType: UserListType.SUPPORTING,
        entityType: UserListEntityType.USER,
        id: user_id
      })
    )
    dispatch(loadMore(SUPPORTING_TAG))
    // Wait until event bubbling finishes so that any modals are already dismissed
    // Without this, the user list won't be visible if the popover is from an existing user list
    setTimeout(() => {
      dispatch(setVisibility(true))
    }, 0)

    // Used to dismiss popovers etc
    if (onNavigateAway) {
      onNavigateAway()
    }
  }, [dispatch, user_id, onNavigateAway])

  return rankedSupportingList.length > 0 ? (
    <div className={styles.supportingContainer} onClick={handleClick}>
      <div className={styles.supportingTitleContainer}>
        <IconTip className={styles.supportingIcon} />
        <span className={styles.supportingTitle}>{messages.supporting}</span>
      </div>
      <div className={styles.line} />
      <UserProfilePictureList
        limit={MAX_ARTIST_HOVER_TOP_SUPPORTING}
        users={rankedSupporting}
        totalUserCount={supporting_count}
        disableProfileClick
        disablePopover
        profilePictureClassname={styles.profilePictureWrapper}
      />
    </div>
  ) : supporting_count > 0 ? (
    <div className={styles.emptyContainer} />
  ) : null
}
