import { useCallback, useEffect, useRef } from 'react'

import { Name, User } from '@audius/common/models'
import {
  accountSelectors,
  cacheUsersSelectors,
  tippingSelectors,
  tippingActions
} from '@audius/common/store'
import {
  IconClose as IconRemove,
  IconTipping as IconTip
} from '@audius/harmony'
import { PillButton, IconButton } from '@audius/stems'
import { ResizeObserver } from '@juggle/resize-observer'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch, useSelector } from 'react-redux'
import useMeasure from 'react-use-measure'

import { useRecord, make } from 'common/store/analytics/actions'
import { storeDismissedTipInfo } from 'common/store/tipping/sagas'
import { ArtistPopover } from 'components/artist/ArtistPopover'
import { ProfilePicture } from 'components/notification/Notification/components/ProfilePicture'
import Skeleton from 'components/skeleton/Skeleton'
import UserBadges from 'components/user-badges/UserBadges'
import { localStorage } from 'services/local-storage'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListEntityType,
  UserListType
} from 'store/application/ui/userListModal/types'
import { AppState } from 'store/types'
import { NUM_FEED_TIPPERS_DISPLAYED } from 'utils/constants'

import styles from './FeedTipTile.module.css'
import { useEffectOnce } from 'react-use'
const { beginTip, fetchRecentTips, setShowTip } = tippingActions
const { getUsers } = cacheUsersSelectors
const { getShowTip, getTipToDisplay } = tippingSelectors
const getAccountUser = accountSelectors.getAccountUser

const messages = {
  wasTippedBy: 'Was Tipped By',
  andOthers: (num: number) => `& ${num} ${num > 1 ? 'others' : 'other'}`,
  sendTipToPrefix: 'SEND TIP TO ',
  sendTip: 'SEND TIP',
  dismissButton: 'Dismiss tip tile'
}

const SkeletonTile = () => (
  <div className={styles.container}>
    <div className={styles.skeletonContainer}>
      <Skeleton className={styles.skeleton} width='10%' />
      <Skeleton className={styles.skeleton} width='20%' />
      <Skeleton className={styles.skeleton} width='60%' />
    </div>
    <Skeleton className={styles.skeleton} width='30%' />
  </div>
)

const WasTippedBy = () => (
  <div className={styles.wasTippedByContainer}>
    <IconTip className={styles.wasTippedByIcon} />
    <span className={styles.wasTippedByText}>{messages.wasTippedBy}</span>
  </div>
)

type TippersProps = {
  tippers: User[]
  receiver: User
}

const Tippers = ({ tippers, receiver }: TippersProps) => {
  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    dispatch(
      setUsers({
        userListType: UserListType.SUPPORTER,
        entityType: UserListEntityType.USER,
        id: receiver.user_id
      })
    )
    dispatch(setVisibility(true))
  }, [dispatch, receiver])

  return (
    <div className={styles.tippers} onClick={handleClick}>
      {tippers.slice(0, NUM_FEED_TIPPERS_DISPLAYED).map((tipper, index) => (
        <div key={`tipper-${tipper.user_id}`} className={styles.tipperName}>
          <span>{tipper.name}</span>
          <UserBadges
            userId={tipper.user_id}
            className={styles.badge}
            badgeSize={14}
            inline
          />
          {index < tippers.length - 1 &&
          index < NUM_FEED_TIPPERS_DISPLAYED - 1 ? (
            <div className={styles.tipperSeparator}>,</div>
          ) : null}
        </div>
      ))}
      {receiver.supporter_count > NUM_FEED_TIPPERS_DISPLAYED ? (
        <div className={styles.andOthers}>
          {messages.andOthers(
            receiver.supporter_count -
              Math.min(tippers.length, NUM_FEED_TIPPERS_DISPLAYED)
          )}
        </div>
      ) : null}
    </div>
  )
}

type SendTipButtonProps = {
  user: User
  hideName?: boolean
}

const SendTipButton = ({ user, hideName = false }: SendTipButtonProps) => {
  const dispatch = useDispatch()

  const handleClick = useCallback(() => {
    dispatch(beginTip({ user, source: 'feed' }))
  }, [dispatch, user])

  const renderSendTipButtonTitle = () =>
    hideName ? (
      messages.sendTip
    ) : (
      <div className={styles.sendTipButtonTextContainer}>
        {messages.sendTipToPrefix}
        <span className={styles.sendTipName}>{user.name}</span>
        <UserBadges
          userId={user.user_id}
          className={styles.badge}
          badgeSize={12}
          inline
        />
      </div>
    )

  return (
    <PillButton
      className={styles.sendTipButton}
      textClassName={styles.sendTipButtonText}
      text={renderSendTipButtonTitle()}
      onClick={handleClick}
    />
  )
}

const DismissTipButton = () => {
  const dispatch = useDispatch()
  const record = useRecord()
  const account = useSelector(getAccountUser)
  const tipToDisplay = useSelector(getTipToDisplay)

  const handleClick = useCallback(async () => {
    dispatch(setShowTip({ show: false }))
    if (tipToDisplay) {
      storeDismissedTipInfo(localStorage, tipToDisplay?.receiver_id)
      if (account) {
        record(
          make(Name.TIP_FEED_TILE_DISMISS, {
            accountId: `${account.user_id}`,
            receiverId: `${tipToDisplay.receiver_id}`,
            device: 'web'
          })
        )
      }
    }
  }, [dispatch, account, tipToDisplay, record])

  return (
    <IconButton
      aria-label={messages.dismissButton}
      className={styles.dismissButton}
      onClick={handleClick}
      icon={<IconRemove className={styles.dismissIcon} />}
    />
  )
}

export const FeedTipTile = () => {
  const dispatch = useDispatch()
  const showTip = useSelector(getShowTip)
  const tipToDisplay = useSelector(getTipToDisplay)
  const tipperIds = tipToDisplay
    ? [
        tipToDisplay.sender_id,
        tipToDisplay.receiver_id,
        ...tipToDisplay.followee_supporter_ids
      ]
    : []
  const usersMap = useSelector<AppState, { [id: number]: User }>((state) =>
    getUsers(state, { ids: tipToDisplay ? tipperIds : [] })
  )

  const [tileRef, { width: tileWidth }] = useMeasure({
    polyfill: ResizeObserver
  })
  const [tileLeftContentsRef, { width: tileLeftContentsWidth }] = useMeasure({
    polyfill: ResizeObserver
  })
  const [sendTipButtonRef, { width: sendTipButtonWidth }] = useMeasure({
    polyfill: ResizeObserver
  })
  const maxTipButtonWidth = useRef(0)
  const useShortButtonFormat = useRef(false)

  // Kickoff process to display new tips
  useEffect(() => {
    dispatch(fetchRecentTips())
  }, [dispatch])

  const handleClick = useCallback(() => {
    if (tipToDisplay) {
      dispatch(pushRoute(`/${usersMap[tipToDisplay.receiver_id].handle}`))
    }
  }, [dispatch, usersMap, tipToDisplay])

  if (sendTipButtonWidth > maxTipButtonWidth.current) {
    maxTipButtonWidth.current = sendTipButtonWidth
  }
  useShortButtonFormat.current =
    tileLeftContentsWidth + maxTipButtonWidth.current >= tileWidth

  if (!showTip) {
    return null
  }

  return !tipToDisplay || Object.keys(usersMap).length !== tipperIds.length ? (
    <SkeletonTile />
  ) : (
    <div className={styles.container} ref={tileRef}>
      <div className={styles.usersContainer} ref={tileLeftContentsRef}>
        <div className={styles.recipientContainer}>
          <ProfilePicture
            key={tipToDisplay.receiver_id}
            className={styles.profilePictureWrapper}
            innerClassName={styles.profilePicture}
            user={usersMap[tipToDisplay.receiver_id]}
          />
          <ArtistPopover
            handle={usersMap[tipToDisplay.receiver_id].handle}
            component='div'
          >
            <div className={styles.name} onClick={handleClick}>
              <span>{usersMap[tipToDisplay.receiver_id].name}</span>
              <UserBadges
                userId={tipToDisplay.receiver_id}
                className={styles.badge}
                badgeSize={14}
                inline
              />
            </div>
          </ArtistPopover>
        </div>
        <div className={styles.senderContainer}>
          <WasTippedBy />
          <Tippers
            tippers={[
              tipToDisplay.sender_id,
              ...tipToDisplay.followee_supporter_ids
            ]
              .map((id) => usersMap[id])
              .filter((user): user is User => !!user)}
            receiver={usersMap[tipToDisplay.receiver_id]}
          />
        </div>
      </div>
      <div className={styles.buttons} ref={sendTipButtonRef}>
        <SendTipButton
          user={usersMap[tipToDisplay.receiver_id]}
          hideName={useShortButtonFormat.current}
        />
        <DismissTipButton />
      </div>
    </div>
  )
}
