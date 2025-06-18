import { useProfileUser } from '@audius/common/api'
import { useIsManagedAccount } from '@audius/common/hooks'
import { tippingActions } from '@audius/common/store'
import { Button, IconTokenGold } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { useRequiresAccountCallback } from 'hooks/useRequiresAccount'

const { beginTip } = tippingActions

const messages = {
  tipAudio: 'Tip $AUDIO'
}

export const TipAudioButton = () => {
  const isManagedAccount = useIsManagedAccount()
  const dispatch = useDispatch()
  const { user: profile } = useProfileUser()

  const handleClick = useRequiresAccountCallback(() => {
    dispatch(beginTip({ user: profile, source: 'profile' }))
  }, [dispatch, profile])

  if (isManagedAccount) {
    return null
  }

  return (
    <Button
      variant='primary'
      css={{ width: '100%' }}
      iconLeft={IconTokenGold}
      isStaticIcon
      onClick={handleClick}
    >
      {messages.tipAudio}
    </Button>
  )
}
