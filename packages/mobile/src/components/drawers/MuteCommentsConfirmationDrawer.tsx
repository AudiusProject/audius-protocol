import { useCallback } from 'react'

import { useGetUserById } from '@audius/common/api'
import { useMuteUser } from '@audius/common/context'
import { commentsMessages } from '@audius/common/messages'

import { Hint } from '@audius/harmony-native'
import { useDrawer } from 'app/hooks/useDrawer'

import { ConfirmationDrawer } from './ConfirmationDrawer'

const messages = {
  header: 'Are you sure?'
}

const drawerName = 'MuteComments'
export const MuteCommentsConfirmationDrawer = () => {
  const { data } = useDrawer(drawerName)
  const { userId, isMuted } = data
  const [muteUser] = useMuteUser()
  const { data: user } = useGetUserById({ id: userId })

  const handleConfirm = useCallback(() => {
    muteUser({
      mutedUserId: userId,
      isMuted
    })
  }, [isMuted, muteUser, userId])

  return (
    <ConfirmationDrawer
      variant={'affirmative'}
      drawerName={drawerName}
      messages={{
        header: messages.header,
        description: isMuted
          ? commentsMessages.popups.unmuteUser.body(user?.name)
          : commentsMessages.popups.muteUser.body(user?.name),
        confirm: isMuted
          ? commentsMessages.popups.unmuteUser.confirm
          : commentsMessages.popups.muteUser.confirm
      }}
      onConfirm={handleConfirm}
    >
      <Hint>
        {isMuted
          ? commentsMessages.popups.unmuteUser.hint
          : commentsMessages.popups.muteUser.hint}
      </Hint>
    </ConfirmationDrawer>
  )
}
