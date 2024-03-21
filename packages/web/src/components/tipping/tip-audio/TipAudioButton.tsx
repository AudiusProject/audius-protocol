import { profilePageSelectors, tippingActions } from '@audius/common/store'
import { Button, IconTokenGold } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { useSelector } from 'common/hooks/useSelector'
import { useAuthenticatedCallback } from 'hooks/useAuthenticatedCallback'

const { beginTip } = tippingActions
const { getProfileUser } = profilePageSelectors

const messages = {
  tipAudio: 'Tip $AUDIO'
}

export const TipAudioButton = () => {
  const dispatch = useDispatch()
  const profile = useSelector(getProfileUser)

  const handleClick = useAuthenticatedCallback(() => {
    dispatch(beginTip({ user: profile, source: 'profile' }))
  }, [dispatch, profile])

  return (
    <Button
      variant='primary'
      fullWidth
      iconLeft={IconTokenGold}
      onClick={handleClick}
    >
      {messages.tipAudio}
    </Button>
  )
}
