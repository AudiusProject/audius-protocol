import { useCallback, useState } from 'react'

import { User } from 'common/models/User'
import { Nullable } from 'common/utils/typeUtils'

type ShareStatus = 'idle' | 'loading' | 'success'

export const useTwitterButtonStatus = (user: Nullable<User>) => {
  const [shareTwitterStatus, setShareTwitterStatus] =
    useState<ShareStatus>('idle')

  const userName = user?.name
  const twitterHandle = user ? user.twitter_handle : null

  // Initially twitter handle is undefined; after fetch it's
  // set to either null or a value in `fetchUserSocials` sagas
  const twitterHandleFetched = twitterHandle !== undefined

  if (shareTwitterStatus === 'loading' && twitterHandleFetched) {
    setShareTwitterStatus('success')
  }

  const setLoading = useCallback(() => setShareTwitterStatus('loading'), [])
  const setIdle = useCallback(() => setShareTwitterStatus('idle'), [])
  return { userName, shareTwitterStatus, twitterHandle, setLoading, setIdle }
}
