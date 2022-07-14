import { useCallback, useEffect } from 'react'

import { User } from 'audius-client/src/common/models/User'
import { FeatureFlags } from 'audius-client/src/common/services/remote-config'
import { getAccountUser } from 'audius-client/src/common/store/account/selectors'
import { getUsers } from 'audius-client/src/common/store/cache/users/selectors'
import {
  getShowTip,
  getTipToDisplay
} from 'audius-client/src/common/store/tipping/selectors'
import { hideTip } from 'audius-client/src/common/store/tipping/slice'
import { View } from 'react-native'

import IconRemove from 'app/assets/images/iconRemove.svg'
import { Tile } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useFeatureFlag } from 'app/hooks/useRemoteConfig'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { MessageType } from 'app/message/types'
import {
  dismissRecentTip,
  getRecentTipsStorage
} from 'app/store/tipping/storageUtils'
import { makeStyles } from 'app/styles'
import { EventNames } from 'app/types/analytics'
import { make, track } from 'app/utils/analytics'

import { LineupTileSkeleton } from '../lineup-tile'

import { ReceiverDetails } from './ReceiverDetails'
import { SendTipButton } from './SendTipButton'
import { SenderDetails } from './SenderDetails'

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
    padding: 12,
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
  const dispatchWeb = useDispatchWeb()
  const account = useSelectorWeb(getAccountUser)
  const showTip = useSelectorWeb(getShowTip)
  const tipToDisplay = useSelectorWeb(getTipToDisplay)
  const tipperIds = tipToDisplay
    ? [
        tipToDisplay.sender_id,
        tipToDisplay.receiver_id,
        ...tipToDisplay.followee_supporter_ids
      ]
    : []
  const usersMap = useSelectorWeb((state) =>
    getUsers(state, { ids: tipToDisplay ? tipperIds : [] })
  )
  const { isEnabled: isTippingEnabled } = useFeatureFlag(
    FeatureFlags.TIPPING_ENABLED
  )

  useEffect(() => {
    const fetchRecentTipsAsync = async () => {
      const storage = await getRecentTipsStorage()
      dispatchWeb({
        type: MessageType.FETCH_RECENT_TIPS,
        storage
      })
    }
    fetchRecentTipsAsync()
  }, [dispatchWeb])

  const handlePressClose = useCallback(() => {
    dismissRecentTip()
    dispatchWeb(hideTip())
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
  }, [dispatchWeb, account, tipToDisplay])

  if (!isTippingEnabled || !showTip) {
    return null
  }

  return !tipToDisplay || Object.keys(usersMap).length !== tipperIds.length ? (
    <View style={styles.skeleton}>
      <LineupTileSkeleton />
    </View>
  ) : (
    <Tile styles={{ tile: styles.tile }}>
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
    </Tile>
  )
}
