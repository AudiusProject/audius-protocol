import { useCallback, useEffect } from 'react'

import type { User } from '@audius/common'
import {
  accountSelectors,
  cacheUsersSelectors,
  tippingSelectors,
  tippingActions
} from '@audius/common'
import { useProxySelector } from '@audius/common/hooks'
import { storeDismissedTipInfo } from 'common/store/tipping/sagas'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconRemove from 'app/assets/images/iconRemove.svg'
import { FadeInView, Tile } from 'app/components/core'
import { make, track } from 'app/services/analytics'
import { localStorage } from 'app/services/local-storage'
import { makeStyles } from 'app/styles'
import { EventNames } from 'app/types/analytics'

import { FeedTipTileSkeleton } from './FeedTipTileSkeleton'
import { ReceiverDetails } from './ReceiverDetails'
import { SendTipButton } from './SendTipButton'
import { SenderDetails } from './SenderDetails'

const { setShowTip, fetchRecentTips } = tippingActions
const { getShowTip, getTipToDisplay } = tippingSelectors
const { getUsers } = cacheUsersSelectors
const { getAccountUser } = accountSelectors

const useStyles = makeStyles(({ spacing, palette }) => ({
  tile: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing(3),
    marginTop: spacing(3),
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(4)
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  skeleton: {
    paddingBottom: 0
  },
  iconRemove: {
    height: spacing(6),
    width: spacing(6),
    fill: palette.neutralLight4
  }
}))

export const FeedTipTile = () => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const account = useSelector(getAccountUser)

  const showTip = useSelector(getShowTip)

  const { tipToDisplay, usersMap, tipperIds } = useProxySelector((state) => {
    const tipToDisplay = getTipToDisplay(state)
    if (!tipToDisplay) {
      return { tipToDisplay: null, usersMap: {}, tipperIds: [] }
    }
    const { sender_id, receiver_id, followee_supporter_ids } = tipToDisplay
    const tipperIds = [sender_id, receiver_id, ...followee_supporter_ids]
    const usersMap = getUsers(state, { ids: tipperIds })
    return { tipToDisplay, usersMap, tipperIds }
  }, [])

  useEffect(() => {
    dispatch(fetchRecentTips())
  }, [dispatch])

  const handlePressClose = useCallback(async () => {
    await storeDismissedTipInfo(localStorage, tipToDisplay?.receiver_id || -1)
    dispatch(setShowTip({ show: false }))
    if (account && tipToDisplay) {
      track(
        make({
          eventName: EventNames.TIP_FEED_TILE_DISMISS,
          accountId: `${account.user_id}`,
          receiverId: `${tipToDisplay.receiver_id}`,
          device: 'native'
        })
      )
    }
  }, [dispatch, account, tipToDisplay])

  if (!showTip) {
    return null
  }

  const tipsLoading =
    !tipToDisplay || Object.keys(usersMap).length !== tipperIds.length

  if (tipsLoading) return <FeedTipTileSkeleton />

  return (
    <Tile styles={{ tile: styles.tile }}>
      <FadeInView>
        <View style={styles.header}>
          <ReceiverDetails receiver={usersMap[tipToDisplay.receiver_id]} />
          <IconRemove {...styles.iconRemove} onPress={handlePressClose} />
        </View>
        <SenderDetails
          senders={[
            tipToDisplay.sender_id,
            ...tipToDisplay.followee_supporter_ids
          ]
            .map((id) => usersMap[id])
            .filter((user): user is User => !!user)}
          receiver={usersMap[tipToDisplay.receiver_id]}
        />
        <SendTipButton receiver={usersMap[tipToDisplay.receiver_id]} />
      </FadeInView>
    </Tile>
  )
}
