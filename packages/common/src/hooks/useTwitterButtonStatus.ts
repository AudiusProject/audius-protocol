import { useCallback, useEffect, useState } from 'react'

import { User } from '~/models/User'

type ShareStatus = 'idle' | 'loading' | 'success'

// Note: if we ever expand this fn to more than 2 users, it should just be made to work with an array
export const useTwitterButtonStatus = (
  user: User | undefined,
  additionalUser?: User | undefined
) => {
  const [shareTwitterStatus, setShareTwitterStatus] =
    useState<ShareStatus>('idle')

  const userName = user?.name
  const twitterHandle = user?.twitter_handle

  const additionalUserName = additionalUser?.name
  const additionalTwitterHandle = additionalUser?.twitter_handle

  const twitterHandleFetched =
    twitterHandle !== undefined &&
    (additionalUser ? additionalTwitterHandle !== undefined : true)

  useEffect(() => {
    if (shareTwitterStatus === 'loading' && twitterHandleFetched) {
      setShareTwitterStatus('success')
    }
  }, [setShareTwitterStatus, shareTwitterStatus, twitterHandleFetched])

  const setLoading = useCallback(() => setShareTwitterStatus('loading'), [])
  const setIdle = useCallback(() => setShareTwitterStatus('idle'), [])
  return {
    userName,
    additionalUserName,
    shareTwitterStatus,
    twitterHandle,
    additionalTwitterHandle,
    setLoading,
    setIdle
  }
}
