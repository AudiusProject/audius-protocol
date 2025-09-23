import { useCallback } from 'react'

import { skipButtonMessages } from '@audius/common/messages'
import { route } from '@audius/common/utils'
import { PlainButton } from '@audius/harmony'

import { useNavigateToPage } from 'hooks/useNavigateToPage'

const { SIGN_UP_APP_CTA_PAGE } = route

export const SkipButton = () => {
  const navigate = useNavigateToPage()

  const handleSkip = useCallback(() => {
    navigate(SIGN_UP_APP_CTA_PAGE)
  }, [navigate])

  return (
    <PlainButton onClick={handleSkip}>
      {skipButtonMessages.skipThisStep}
    </PlainButton>
  )
}
