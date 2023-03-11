import { useCallback, useMemo } from 'react'

import {
  ShareSource,
  shareModalUIActions,
  profilePageSelectors
} from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import ActionDrawer from 'app/components/action-drawer'
import type { AppState } from 'app/store'
import { setVisibility } from 'app/store/drawers/slice'
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { getProfileUserId } = profilePageSelectors

const PROFILE_ACTIONS_MODAL_NAME = 'ProfileActions'

const messages = {
  shareProfile: 'Share Profile',
  blockMessages: 'Block Messages'
}

export const ProfileActionsDrawer = () => {
  const dispatch = useDispatch()
  const userId = useSelector((state: AppState) => getProfileUserId(state))

  const handleShareProfilePress = useCallback(() => {
    dispatch(
      setVisibility({
        drawer: 'ProfileActions',
        visible: false
      })
    )
    if (userId) {
      dispatch(
        requestOpenShareModal({
          type: 'profile',
          profileId: userId,
          source: ShareSource.PAGE
        })
      )
    }
  }, [userId, dispatch])

  const handleBlockMessagesPress = useCallback(() => {
    dispatch(
      setVisibility({
        drawer: 'ProfileActions',
        visible: false
      })
    )
    if (userId) {
      dispatch(
        setVisibility({
          drawer: 'BlockMessages',
          visible: true,
          data: { userId }
        })
      )
    }
  }, [dispatch, userId])

  const rows = useMemo(
    () => [
      { text: messages.shareProfile, callback: handleShareProfilePress },
      { text: messages.blockMessages, callback: handleBlockMessagesPress }
    ],
    [handleShareProfilePress, handleBlockMessagesPress]
  )

  return <ActionDrawer modalName={PROFILE_ACTIONS_MODAL_NAME} rows={rows} />
}
