import { useCallback, useEffect } from 'react'

import {
  ID,
  User,
  stringWeiToBN,
  cacheUsersSelectors,
  tippingSelectors,
  tippingActions,
  userListActions,
  SUPPORTING_USER_LIST_TAG as SUPPORTING_TAG,
  MAX_ARTIST_HOVER_TOP_SUPPORTING,
  StringWei
} from '@audius/common'
import { useDispatch } from 'react-redux'

import { ReactComponent as IconTip } from 'assets/img/iconTip.svg'
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
import { trpc } from 'services/trpc'
const { loadMore, reset } = userListActions
const { getUsers } = cacheUsersSelectors
const { getOptimisticSupporting } = tippingSelectors
const { fetchSupportingForUser } = tippingActions

const messages = {
  supporting: 'Supporting'
}

type ArtistSupportingProps = {
  userId: number
  onNavigateAway?: () => void
}

type supportingTipMap = {
  [key: string]: {
    amount: string
    receiverUserId: number
    senderUserId: number
  }
}

export const ArtistSupporting = (props: ArtistSupportingProps) => {
  const { onNavigateAway, userId } = props
  const dispatch = useDispatch()
  const { data } = trpc.users.tipsSent.useQuery(userId)

  const supportingMap = useSelector(getOptimisticSupporting)
  const supportingTipMap: supportingTipMap =
    data?.reduce((accumulatedTipMap, tip) => {
      accumulatedTipMap[tip.receiverUserId] = tip
      return accumulatedTipMap
    }, {} as supportingTipMap) || {}
  const hasNotPreviouslyFetchedSupportingForArtist =
    supportingTipMap === undefined
  const supportingForArtist = supportingTipMap ?? {}
  const supportingForArtistIds = Object.keys(
    supportingForArtist
  ) as unknown as ID[]
  const rankedSupportingList = supportingForArtistIds
    .sort((k1, k2) => {
      const amount1BN = stringWeiToBN(
        supportingForArtist[k1].amount as StringWei
      )
      const amount2BN = stringWeiToBN(
        supportingForArtist[k2].amount as StringWei
      )
      return amount1BN.gte(amount2BN) ? -1 : 1
    })
    .map((k) => supportingForArtist[k])

  const rankedSupporting = useSelector((state) => {
    const usersMap = getUsers(state, {
      ids: rankedSupportingList.map((supporting) => supporting.receiverUserId)
    })
    return rankedSupportingList
      .sort((s1, s2) => parseInt(s2.amount) - parseInt(s1.amount))
      .map((s) => usersMap[s.receiverUserId])
      .filter(Boolean)
  })

  /**
   * It's possible that we don't have the data for which artists
   * this artist is supporting. Thus, we fetch in this case.
   */
  useEffect(() => {
    if (hasNotPreviouslyFetchedSupportingForArtist) {
      dispatch(fetchSupportingForUser({ userId: userId }))
    }
  }, [dispatch, hasNotPreviouslyFetchedSupportingForArtist, userId])

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
        id: userId
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
  }, [dispatch, userId, onNavigateAway])

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
        totalUserCount={data?.length || 0}
        disableProfileClick
        disablePopover
        profilePictureClassname={styles.profilePictureWrapper}
      />
    </div>
  ) : (data?.length || 0) > 0 ? (
    <div className={styles.emptyContainer} />
  ) : null
}
