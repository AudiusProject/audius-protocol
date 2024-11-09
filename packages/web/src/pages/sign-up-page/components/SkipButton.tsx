import { useCallback } from 'react'

import { route } from '@audius/common/utils'
import { PlainButton } from '@audius/harmony'

import { useNavigateToPage } from 'hooks/useNavigateToPage'

const { SIGN_UP_LOADING_PAGE } = route

export const SkipButton = () => {
  const navigate = useNavigateToPage()
  const handleSkip = useCallback(() => {
    navigate(SIGN_UP_LOADING_PAGE)
  }, [navigate])

  return <PlainButton onClick={handleSkip}>Skip this step</PlainButton>
}
