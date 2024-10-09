import { useCallback, useEffect, useMemo } from 'react'

import { useGetCurrentUserId, useGetMutedUsers } from '@audius/common/api'
import { useMuteUser } from '@audius/common/context'
import { ShareSource } from '@audius/common/models'
import {
  profilePageSelectors,
  chatActions,
  chatSelectors,
  shareModalUIActions
} from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'
import { useToggle } from 'react-use'

import ActionDrawer from 'app/components/action-drawer'
import type { AppState } from 'app/store'
import { setVisibility } from 'app/store/drawers/slice'

import { useDrawerState } from '../drawer'
const { requestOpen: requestOpenShareModal } = shareModalUIActions
const { getProfileUserId } = profilePageSelectors
const { getBlockees } = chatSelectors
const { fetchBlockees } = chatActions

const PROFILE_ACTIONS_MODAL_NAME = 'ProfileActions'

const messages = {
  shareProfile: 'Share Profile',
  blockMessages: 'Block Messages',
  unblockMessages: 'Unblock Messages',
  muteComments: 'Mute Comments',
  unmuteComments: 'Unmute Comments'
}

export const ProfileActionsDrawer = () => {
  const dispatch = useDispatch()
  const userId = useSelector((state: AppState) => getProfileUserId(state))
  const blockeeList = useSelector(getBlockees)
  const isBlockee = userId ? blockeeList.includes(userId) : false

  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: mutedUsers } = useGetMutedUsers(
    {
      userId: currentUserId!
    },
    { force: true }
  )
  const isMuted = mutedUsers?.some((user) => user.user_id === userId) ?? false
  useEffect(() => {
    dispatch(fetchBlockees())
  }, [dispatch])

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

  const handleMuteCommentPress = useCallback(() => {
    if (userId) {
      dispatch(
        setVisibility({
          drawer: 'ProfileActions',
          visible: false
        })
      )
      if (userId) {
        dispatch(
          setVisibility({
            drawer: 'MuteComments',
            visible: true,
            data: { userId, isMuted }
          })
        )
      }
    }
  }, [dispatch, isMuted, userId])

  const rows = useMemo(
    () => [
      { text: messages.shareProfile, callback: handleShareProfilePress },
      {
        text: isBlockee ? messages.unblockMessages : messages.blockMessages,
        callback: handleBlockMessagesPress
      },
      {
        text: isMuted ? messages.unmuteComments : messages.muteComments,
        callback: handleMuteCommentPress
      }
    ],
    [
      handleShareProfilePress,
      isBlockee,
      handleBlockMessagesPress,
      isMuted,
      handleMuteCommentPress
    ]
  )

  return <ActionDrawer modalName={PROFILE_ACTIONS_MODAL_NAME} rows={rows} />
}
