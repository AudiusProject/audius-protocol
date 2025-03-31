import { useIsManagedAccount } from '@audius/common/hooks'
import { profilePageSelectors, tippingActions } from '@audius/common/store'
import { Button, IconTokenGold } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import { useRequiresAccountCallback } from 'hooks/useRequiresAccount'

const { beginTip } = tippingActions
const { getProfileUser } = profilePageSelectors

const messages = {
  tipAudio: 'Tip $AUDIO'
}

export const TipAudioButton = () => {
  const isManagedAccount = useIsManagedAccount()
  const dispatch = useDispatch()
  const profile = useSelector(getProfileUser)

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
